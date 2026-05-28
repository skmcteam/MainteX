"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
