"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { WOStatus } from "@prisma/client";
import { generateWONumber } from "@/lib/utils";

// ─── Read ─────────────────────────────────────────────────────

export async function getWorkOrders(status?: WOStatus | "all") {
  const rows = await prisma.workOrder.findMany({
    where: {
      isDeleted: false,
      ...(status && status !== "all" ? { status } : {}),
    },
    include: {
      asset: { select: { code: true, nameTh: true, category: true } },
      priority: { select: { code: true, nameTh: true, color: true } },
      type: { select: { code: true, nameTh: true, color: true } },
      assignee: { select: { nameTh: true } },
      department: { select: { nameTh: true } },
      _count: { select: { checklistItems: true, parts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    woNumber: r.woNumber,
    title: r.title,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    startTime: r.startTime?.toISOString() ?? null,
    endTime: r.endTime?.toISOString() ?? null,
    asset: r.asset,
    priority: r.priority,
    type: r.type,
    assignee: r.assignee,
    department: r.department,
    _count: r._count,
  }));
}

export type WORow = Awaited<ReturnType<typeof getWorkOrders>>[number];

export async function getWorkOrder(id: string) {
  const r = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      asset: { select: { id: true, code: true, nameTh: true, category: true, status: true } },
      priority: true,
      type: true,
      creator: { select: { id: true, nameTh: true, nameEn: true, email: true } },
      assignee: { select: { id: true, nameTh: true, nameEn: true, email: true } },
      department: { select: { nameTh: true } },
      failureCode: true,
      causeCode: true,
      actionCode: true,
      parts: {
        include: {
          sparePart: {
            select: {
              code: true,
              nameTh: true,
              unit: { select: { code: true } },
            },
          },
        },
      },
      checklistItems: { orderBy: { createdAt: "asc" } },
      approvals: {
        include: { user: { select: { nameTh: true } } },
        orderBy: { stepNumber: "asc" },
      },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    woNumber: r.woNumber,
    title: r.title,
    description: r.description,
    status: r.status,
    notes: r.notes,
    laborHours: r.laborHours ? Number(r.laborHours) : null,
    laborCost: r.laborCost ? Number(r.laborCost) : null,
    totalPartsCost: r.totalPartsCost ? Number(r.totalPartsCost) : null,
    holdDuration: r.holdDuration,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    startTime: r.startTime?.toISOString() ?? null,
    endTime: r.endTime?.toISOString() ?? null,
    asset: r.asset,
    priority: r.priority,
    type: r.type,
    creator: r.creator,
    assignee: r.assignee,
    department: r.department,
    failureCode: r.failureCode,
    causeCode: r.causeCode,
    actionCode: r.actionCode,
    parts: r.parts.map((p) => ({
      id: p.id,
      quantity: Number(p.quantity),
      unitCost: p.unitCost ? Number(p.unitCost) : null,
      sparePart: p.sparePart,
    })),
    checklistItems: r.checklistItems,
    approvals: r.approvals,
    attachments: r.attachments,
  };
}

export type WODetail = NonNullable<Awaited<ReturnType<typeof getWorkOrder>>>;

export async function getWOFormData() {
  const [priorities, types, assets, users, departments] = await Promise.all([
    prisma.priority.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.wOType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.asset.findMany({
      where: { status: "ACTIVE", isDeleted: false },
      select: { id: true, code: true, nameTh: true, category: true },
      orderBy: { code: "asc" },
      take: 500,
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameTh: true,
        nameEn: true,
        role: { select: { code: true, nameTh: true } },
      },
      orderBy: { nameTh: "asc" },
    }),
    prisma.department.findMany({ orderBy: { code: "asc" } }),
  ]);
  return { priorities, types, assets, users, departments };
}

export type WOFormData = Awaited<ReturnType<typeof getWOFormData>>;

// ─── Write ────────────────────────────────────────────────────

const WOCreateSchema = z.object({
  title: z.string().min(1, "กรุณาระบุหัวข้อ"),
  description: z.string().optional().nullable(),
  typeId: z.string().min(1, "กรุณาเลือกประเภท"),
  priorityId: z.string().min(1, "กรุณาเลือกความเร่งด่วน"),
  assetId: z.string().min(1, "กรุณาเลือกเครื่องจักร/อุปกรณ์"),
  departmentId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export async function createWorkOrder(input: z.infer<typeof WOCreateSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = WOCreateSchema.parse(input);

  // Atomic WO number: increment and return in one query
  const seriesCheck = await prisma.wONumberSeries.findFirst();
  if (!seriesCheck) {
    await prisma.wONumberSeries.create({ data: { pattern: "WO-{YY}{MM}-{####}", lastNumber: 0 } });
  }
  const updated = await prisma.$queryRaw<{ lastNumber: number; pattern: string }[]>`
    UPDATE "WONumberSeries"
    SET "lastNumber" = "lastNumber" + 1, "updatedAt" = NOW()
    WHERE id = (SELECT id FROM "WONumberSeries" LIMIT 1)
    RETURNING "lastNumber", pattern
  `;
  const woNumber = generateWONumber(updated[0].pattern, updated[0].lastNumber - 1);

  const asset = await prisma.asset.findUnique({
    where: { id: data.assetId },
    select: { departmentId: true },
  });

  const wo = await prisma.workOrder.create({
    data: {
      woNumber,
      title: data.title,
      description: data.description,
      typeId: data.typeId,
      priorityId: data.priorityId,
      assetId: data.assetId,
      departmentId: data.departmentId ?? asset?.departmentId,
      assigneeId: data.assigneeId,
      creatorId: session.user.id,
      status: "OPEN",
    },
  });

  revalidatePath("/work-orders");
  return { success: true, id: wo.id };
}

export async function updateWOStatus(
  id: string,
  status: WOStatus,
  extras?: {
    notes?: string;
    laborHours?: number;
    failureCodeId?: string;
    causeCodeId?: string;
    actionCodeId?: string;
  }
) {
  const update: Record<string, unknown> = { status };
  if (status === "IN_PROGRESS") update.startTime = new Date();
  if (status === "DONE") {
    update.endTime = new Date();
    if (extras?.laborHours) update.laborHours = extras.laborHours;
  }
  if (extras?.notes) update.notes = extras.notes;
  if (extras?.failureCodeId) update.failureCodeId = extras.failureCodeId;
  if (extras?.causeCodeId) update.causeCodeId = extras.causeCodeId;
  if (extras?.actionCodeId) update.actionCodeId = extras.actionCodeId;

  await prisma.workOrder.update({ where: { id }, data: update });
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${id}`);
  return { success: true };
}

export async function getClosureFormData() {
  const [failureCodes, causeCodes, actionCodes] = await Promise.all([
    prisma.failureCode.findMany({ orderBy: { code: "asc" } }),
    prisma.causeCode.findMany({ orderBy: { code: "asc" } }),
    prisma.actionCode.findMany({ orderBy: { code: "asc" } }),
  ]);
  return { failureCodes, causeCodes, actionCodes };
}

export async function updateChecklistItem(id: string, status: "PENDING" | "PASS" | "FAIL" | "NA", notes?: string) {
  await prisma.wOChecklistItem.update({
    where: { id },
    data: { status, ...(notes !== undefined ? { notes } : {}) },
  });
  return { success: true };
}

export async function getAvailableParts() {
  const parts = await prisma.sparePart.findMany({
    where: { isDeleted: false },
    select: { id: true, code: true, nameTh: true, stockOnHand: true, unitCost: true, unit: { select: { code: true } } },
    orderBy: { code: "asc" },
    take: 500,
  });
  return parts.map((p) => ({
    id: p.id,
    code: p.code,
    nameTh: p.nameTh,
    stockOnHand: Number(p.stockOnHand),
    unitCost: p.unitCost ? Number(p.unitCost) : null,
    unit: p.unit,
  }));
}

const WOPartSchema = z.object({
  workOrderId: z.string().min(1),
  sparePartId: z.string().min(1),
  quantity: z.coerce.number().positive("จำนวนต้องมากกว่า 0"),
});

export async function addPartToWO(input: z.infer<typeof WOPartSchema>) {
  const data = WOPartSchema.parse(input);
  const part = await prisma.sparePart.findUnique({ where: { id: data.sparePartId }, select: { stockOnHand: true, unitCost: true } });
  if (!part) throw new Error("ไม่พบอะไหล่");
  if (Number(part.stockOnHand) < data.quantity) throw new Error(`สต็อกไม่เพียงพอ (มี ${Number(part.stockOnHand)})`);

  await prisma.$transaction([
    prisma.wOSparePart.create({
      data: {
        workOrderId: data.workOrderId,
        sparePartId: data.sparePartId,
        quantity: data.quantity,
        unitCost: part.unitCost,
      },
    }),
    prisma.sparePart.update({
      where: { id: data.sparePartId },
      data: { stockOnHand: { decrement: data.quantity } },
    }),
  ]);

  // Recalculate totalPartsCost
  const partsTotal = await prisma.wOSparePart.aggregate({
    where: { workOrderId: data.workOrderId },
    _sum: { quantity: true },
  });
  const allParts = await prisma.wOSparePart.findMany({ where: { workOrderId: data.workOrderId }, select: { quantity: true, unitCost: true } });
  const totalPartsCost = allParts.reduce((s, p) => s + Number(p.quantity) * Number(p.unitCost ?? 0), 0);
  await prisma.workOrder.update({ where: { id: data.workOrderId }, data: { totalPartsCost } });

  revalidatePath(`/work-orders/${data.workOrderId}`);
  revalidatePath("/spare-parts");
  return { success: true };
}

export async function removePartFromWO(woPartId: string) {
  const woPart = await prisma.wOSparePart.findUnique({ where: { id: woPartId }, select: { workOrderId: true, sparePartId: true, quantity: true } });
  if (!woPart) throw new Error("ไม่พบรายการ");

  await prisma.$transaction([
    prisma.wOSparePart.delete({ where: { id: woPartId } }),
    prisma.sparePart.update({ where: { id: woPart.sparePartId }, data: { stockOnHand: { increment: Number(woPart.quantity) } } }),
  ]);

  const allParts = await prisma.wOSparePart.findMany({ where: { workOrderId: woPart.workOrderId }, select: { quantity: true, unitCost: true } });
  const totalPartsCost = allParts.reduce((s, p) => s + Number(p.quantity) * Number(p.unitCost ?? 0), 0);
  await prisma.workOrder.update({ where: { id: woPart.workOrderId }, data: { totalPartsCost } });

  revalidatePath(`/work-orders/${woPart.workOrderId}`);
  revalidatePath("/spare-parts");
  return { success: true };
}
