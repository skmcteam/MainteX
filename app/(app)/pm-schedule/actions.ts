"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, writeAuditLog } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotificationEvent } from "@/lib/notifications";

// ─── Read ─────────────────────────────────────────────────────

export async function getPMPlans() {
  const rows = await prisma.pMPlan.findMany({
    where: { isActive: true, isDeleted: false },
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
  const session = await requireAuth();
  const data = PMPlanSchema.parse(input);
  const plan = await prisma.pMPlan.create({
    data: {
      assetId: data.assetId,
      frequencyId: data.frequencyId,
      checklistTemplateId: data.checklistTemplateId,
      assigneeId: data.assigneeId,
      leadTimeDays: data.leadTimeDays,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      isActive: true,
      createdBy: session.user.id,
    },
  });
  await writeAuditLog({ userId: session.user.id, entity: "PMPlan", entityId: plan.id, action: "CREATE", after: { assetId: data.assetId } });
  revalidatePath("/pm-schedule");
  return { success: true };
}

export async function togglePMPlan(id: string, isActive: boolean) {
  const session = await requireAuth();
  await prisma.pMPlan.update({ where: { id }, data: { isActive } });
  await writeAuditLog({ userId: session.user.id, entity: "PMPlan", entityId: id, action: "UPDATE", after: { isActive } });
  revalidatePath("/pm-schedule");
  return { success: true };
}

// ─── PM generation helpers ────────────────────────────────────

async function findDuePlans(now: Date) {
  const plans = await prisma.pMPlan.findMany({
    where: { isActive: true, isDeleted: false, nextDueDate: { not: null } },
    include: {
      asset: { select: { id: true, code: true, nameTh: true, departmentId: true } },
      frequency: { select: { intervalDays: true } },
      checklistTemplate: { include: { items: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  // Filter by lead time in-memory (avoids a computed-column query)
  return plans.filter((p) => {
    if (!p.nextDueDate) return false;
    const trigger = new Date(p.nextDueDate.getTime() - p.leadTimeDays * 24 * 60 * 60 * 1000);
    return now >= trigger;
  });
}

// Atomically reserves `count` WO numbers in one DB round-trip.
// Returns the first index (0-based) to pass to generateWONumber.
async function buildWONumbers(count: number): Promise<{ firstIndex: number; pattern: string }> {
  const [series] = await prisma.$queryRaw<{ lastNumber: number; pattern: string }[]>`
    UPDATE "WONumberSeries"
    SET "lastNumber" = "lastNumber" + ${count}, "updatedAt" = NOW()
    WHERE id = (SELECT id FROM "WONumberSeries" LIMIT 1)
    RETURNING "lastNumber", pattern
  `;
  // lastNumber is now the post-increment value; the batch starts at lastNumber - count
  return { firstIndex: series.lastNumber - count, pattern: series.pattern };
}

async function copyChecklistItems(
  workOrderId: string,
  items: { id: string; descriptionTh: string; descriptionEn: string | null }[],
) {
  if (!items.length) return;
  await prisma.wOChecklistItem.createMany({
    data: items.map((item) => ({
      workOrderId,
      checklistItemId: item.id,
      descriptionTh: item.descriptionTh,
      descriptionEn: item.descriptionEn ?? "",
      status: "PENDING",
    })),
  });
}

// Generate WOs for PM plans that are due (nextDueDate <= today + leadTimeDays)
export async function generatePMWorkOrders(): Promise<{ created: number; skipped: number }> {
  const session = await requireRole(["SYSTEM_ADMIN", "MAINTENANCE_SUPERVISOR"]);
  const now = new Date();

  const [candidates, pmType, medPriority, adminUser] = await Promise.all([
    findDuePlans(now),
    prisma.wOType.findFirst({ where: { code: "PM" } }),
    prisma.priority.findFirst({ where: { code: "MEDIUM" } }),
    prisma.user.findFirst({ where: { role: { code: "SYSTEM_ADMIN" } } }),
  ]);

  if (!pmType || !medPriority || !adminUser) throw new Error("ข้อมูลพื้นฐานไม่ครบ");
  const creatorId = session.user.id ?? adminUser.id;

  // Batch lookup: one query instead of N findFirst calls
  const activeWOs = await prisma.workOrder.findMany({
    where: {
      pmPlanId: { in: candidates.map((p) => p.id) },
      status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
      isDeleted: false,
    },
    select: { pmPlanId: true },
  });
  const blockedPlanIds = new Set(activeWOs.map((w) => w.pmPlanId!));

  const plansToCreate = candidates.filter((p) => !blockedPlanIds.has(p.id));
  const skipped = candidates.length - plansToCreate.length;

  if (plansToCreate.length === 0) return { created: 0, skipped };

  // Reserve all WO numbers in one atomic UPDATE
  const { generateWONumber } = await import("@/lib/utils");
  const { firstIndex, pattern } = await buildWONumbers(plansToCreate.length);

  let created = 0;

  for (let i = 0; i < plansToCreate.length; i++) {
    const plan = plansToCreate[i];
    const dueDate = new Date(plan.nextDueDate!);
    const woNumber = generateWONumber(pattern, firstIndex + i);

    const wo = await prisma.workOrder.create({
      data: {
        woNumber,
        title: `PM ${plan.frequency?.intervalDays ? `(${plan.frequency.intervalDays} วัน)` : ""} — ${plan.asset.nameTh}`,
        typeId: pmType.id,
        priorityId: medPriority.id,
        assetId: plan.asset.id,
        departmentId: plan.asset.departmentId,
        pmPlanId: plan.id,
        creatorId,
        createdBy: creatorId,
        assigneeId: plan.assigneeId,
        status: "OPEN",
      },
    });

    await Promise.all([
      writeAuditLog({
        userId: creatorId,
        entity: "WorkOrder",
        entityId: wo.id,
        action: "CREATE",
        after: { woNumber, pmPlanId: plan.id, source: "generatePMWorkOrders" },
      }),
      copyChecklistItems(wo.id, plan.checklistTemplate?.items ?? []),
      plan.frequency?.intervalDays
        ? prisma.pMPlan.update({
            where: { id: plan.id },
            data: {
              lastDoneDate: now,
              nextDueDate: new Date(dueDate.getTime() + plan.frequency.intervalDays * 24 * 60 * 60 * 1000),
            },
          })
        : Promise.resolve(),
    ]);

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
