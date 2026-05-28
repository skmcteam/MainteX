"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotificationEvent } from "@/lib/notifications";

// ─── Read ─────────────────────────────────────────────────────

export async function getPMPlans() {
  const rows = await prisma.pMPlan.findMany({
    where: { isActive: true },
    include: {
      asset: {
        select: {
          code: true,
          nameTh: true,
          category: true,
          status: true,
          department: { select: { nameTh: true } },
        },
      },
      frequency: { select: { code: true, nameTh: true, intervalDays: true } },
      checklistTemplate: { select: { code: true, nameTh: true } },
    },
    orderBy: [{ nextDueDate: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    isActive: r.isActive,
    leadTimeDays: r.leadTimeDays,
    lastDoneDate: r.lastDoneDate?.toISOString() ?? null,
    nextDueDate: r.nextDueDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    asset: r.asset,
    frequency: r.frequency,
    checklistTemplate: r.checklistTemplate,
  }));
}

export type PMRow = Awaited<ReturnType<typeof getPMPlans>>[number];

export async function getPMFormData() {
  const [assets, frequencies, templates, users] = await Promise.all([
    prisma.asset.findMany({
      where: { status: "ACTIVE", isDeleted: false },
      select: { id: true, code: true, nameTh: true, category: true },
      orderBy: { code: "asc" },
      take: 500,
    }),
    prisma.pMFrequency.findMany({ orderBy: { code: "asc" } }),
    prisma.checklistTemplate.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameTh: true },
      orderBy: { code: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, nameTh: true },
      orderBy: { nameTh: "asc" },
    }),
  ]);
  return { assets, frequencies, templates, users };
}

export type PMFormData = Awaited<ReturnType<typeof getPMFormData>>;

// ─── Write ────────────────────────────────────────────────────

const PMPlanSchema = z.object({
  assetId: z.string().min(1, "กรุณาเลือกอุปกรณ์"),
  frequencyId: z.string().min(1, "กรุณาเลือกความถี่"),
  checklistTemplateId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  leadTimeDays: z.coerce.number().int().min(0).default(7),
  nextDueDate: z.string().optional().nullable(),
});

export async function createPMPlan(input: z.infer<typeof PMPlanSchema>) {
  const data = PMPlanSchema.parse(input);
  await prisma.pMPlan.create({
    data: {
      assetId: data.assetId,
      frequencyId: data.frequencyId,
      checklistTemplateId: data.checklistTemplateId,
      assigneeId: data.assigneeId,
      leadTimeDays: data.leadTimeDays,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      isActive: true,
    },
  });
  revalidatePath("/pm-schedule");
  return { success: true };
}

export async function togglePMPlan(id: string, isActive: boolean) {
  await prisma.pMPlan.update({ where: { id }, data: { isActive } });
  revalidatePath("/pm-schedule");
  return { success: true };
}

// Generate WOs for PM plans that are due (nextDueDate <= today + leadTimeDays)
export async function generatePMWorkOrders(): Promise<{ created: number; skipped: number }> {
  const now = new Date();

  const duePlans = await prisma.pMPlan.findMany({
    where: {
      isActive: true,
      nextDueDate: { not: null },
    },
    include: {
      asset: { select: { id: true, code: true, nameTh: true, departmentId: true } },
      frequency: { select: { intervalDays: true } },
      checklistTemplate: { include: { items: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  // Get default WO type for PM and a priority
  const [pmType, medPriority, series, adminUser] = await Promise.all([
    prisma.wOType.findFirst({ where: { code: "PM" } }),
    prisma.priority.findFirst({ where: { code: "MEDIUM" } }),
    prisma.wONumberSeries.findFirst(),
    prisma.user.findFirst({ where: { role: { code: "SYSTEM_ADMIN" } } }),
  ]);

  if (!pmType || !medPriority || !adminUser) throw new Error("ข้อมูลพื้นฐานไม่ครบ");

  let created = 0;
  let skipped = 0;

  for (const plan of duePlans) {
    if (!plan.nextDueDate) { skipped++; continue; }
    const dueDate = new Date(plan.nextDueDate);
    const triggerDate = new Date(dueDate.getTime() - plan.leadTimeDays * 24 * 60 * 60 * 1000);
    if (now < triggerDate) { skipped++; continue; }

    // Check no open WO already exists for this PM plan
    const existing = await prisma.workOrder.findFirst({
      where: { pmPlanId: plan.id, status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] } },
    });
    if (existing) { skipped++; continue; }

    // Atomic WO number
    const updated = await prisma.$queryRaw<{ lastNumber: number; pattern: string }[]>`
      UPDATE "WONumberSeries"
      SET "lastNumber" = "lastNumber" + 1, "updatedAt" = NOW()
      WHERE id = (SELECT id FROM "WONumberSeries" LIMIT 1)
      RETURNING "lastNumber", pattern
    `;
    const { generateWONumber } = await import("@/lib/utils");
    const woNumber = generateWONumber(updated[0].pattern, updated[0].lastNumber - 1);

    const wo = await prisma.workOrder.create({
      data: {
        woNumber,
        title: `PM ${plan.frequency?.intervalDays ? `(${plan.frequency.intervalDays} วัน)` : ""} — ${plan.asset.nameTh}`,
        typeId: pmType.id,
        priorityId: medPriority.id,
        assetId: plan.asset.id,
        departmentId: plan.asset.departmentId,
        pmPlanId: plan.id,
        creatorId: adminUser.id,
        assigneeId: plan.assigneeId,
        status: "OPEN",
      },
    });

    // Copy checklist items if template exists
    if (plan.checklistTemplate?.items.length) {
      await prisma.wOChecklistItem.createMany({
        data: plan.checklistTemplate.items.map((item) => ({
          workOrderId: wo.id,
          checklistItemId: item.id,
          descriptionTh: item.descriptionTh,
          descriptionEn: item.descriptionEn,
          status: "PENDING",
        })),
      });
    }

    // Advance nextDueDate by frequency interval
    if (plan.frequency?.intervalDays) {
      const newNextDue = new Date(dueDate.getTime() + plan.frequency.intervalDays * 24 * 60 * 60 * 1000);
      await prisma.pMPlan.update({
        where: { id: plan.id },
        data: { lastDoneDate: now, nextDueDate: newNextDue },
      });
    }

    created++;
  }

  revalidatePath("/pm-schedule");
  revalidatePath("/work-orders");

  if (created > 0) {
    await createNotificationEvent({
      event: "PM_due_soon",
      type: "PM_DUE",
      titleTh: `สร้างใบสั่งงาน PM จำนวน ${created} ใบ`,
      titleEn: `${created} PM work order${created > 1 ? "s" : ""} generated`,
      link: "/work-orders",
    });
  }

  return { created, skipped };
}
