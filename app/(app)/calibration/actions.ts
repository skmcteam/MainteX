"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, writeAuditLog } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotificationEvent } from "@/lib/notifications";

// ─── Read ─────────────────────────────────────────────────────

export async function getCalibrationAssets() {
  const rows = await prisma.asset.findMany({
    where: { category: "INSTRUMENT", isDeleted: false },
    include: {
      instrumentType: { select: { code: true, nameTh: true } },
      calLab: { select: { code: true, nameTh: true } },
      department: { select: { nameTh: true } },
      calibrations: {
        where: { isDeleted: false },
        orderBy: { calDate: "desc" },
        take: 1,
        select: {
          id: true,
          calDate: true,
          nextCalDate: true,
          certNumber: true,
          result: true,
          lab: { select: { nameTh: true } },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  function computeCalStatus(nextCalDate: Date | null): "OVERDUE" | "DUE_SOON" | "NORMAL" | null {
    if (!nextCalDate) return null;
    if (nextCalDate < now) return "OVERDUE";
    if (nextCalDate < soon) return "DUE_SOON";
    return "NORMAL";
  }

  const result = rows.map((r) => ({
    id: r.id,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    status: r.status,
    calStatus: computeCalStatus(r.nextCalDate),
    calPeriodMonths: r.calPeriodMonths,
    lastCalDate: r.lastCalDate?.toISOString() ?? null,
    nextCalDate: r.nextCalDate?.toISOString() ?? null,
    instrumentType: r.instrumentType,
    calLab: r.calLab,
    department: r.department,
    lastCalibration: r.calibrations[0]
      ? {
          id: r.calibrations[0].id,
          calDate: r.calibrations[0].calDate.toISOString(),
          nextCalDate: r.calibrations[0].nextCalDate.toISOString(),
          certNumber: r.calibrations[0].certNumber,
          result: r.calibrations[0].result,
          labName: r.calibrations[0].lab?.nameTh ?? null,
        }
      : null,
  }));

  // Fire deduped DUE_SOON notifications (one per asset per 24 h)
  const dueSoonRows = rows.filter((r) => computeCalStatus(r.nextCalDate) === "DUE_SOON");
  if (dueSoonRows.length > 0) {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentNotifs = await prisma.notification.findMany({
        where: { type: "CAL_DUE", createdAt: { gte: cutoff } },
        select: { bodyTh: true },
      });
      const recentCodes = new Set(recentNotifs.map((n) => n.bodyTh?.split(" ")[0] ?? ""));

      for (const r of dueSoonRows) {
        if (!recentCodes.has(r.code)) {
          const dueDateTh = r.nextCalDate?.toLocaleDateString("th-TH") ?? "";
          const dueDateEn = r.nextCalDate?.toLocaleDateString("en-US") ?? "";
          await createNotificationEvent({
            event: "calibration_due_soon",
            type: "CAL_DUE",
            titleTh: "อุปกรณ์ใกล้ครบกำหนดสอบเทียบ",
            titleEn: "Calibration due soon",
            bodyTh: `${r.code} ${r.nameTh} ครบกำหนด ${dueDateTh}`,
            bodyEn: `${r.code} ${r.nameEn ?? r.nameTh} due on ${dueDateEn}`,
            link: "/calibration",
          });
        }
      }
    } catch {}
  }

  return result;
}

export type CalRow = Awaited<ReturnType<typeof getCalibrationAssets>>[number];

export async function getCalLabs() {
  return prisma.calibrationLab.findMany({ orderBy: { code: "asc" } });
}

// ─── Write ────────────────────────────────────────────────────

const CalibrationSchema = z.object({
  assetId: z.string().min(1, "กรุณาเลือกอุปกรณ์"),
  calDate: z.string().min(1, "กรุณาระบุวันที่สอบเทียบ"),
  nextCalDate: z.string().min(1, "กรุณาระบุวันที่สอบเทียบครั้งถัดไป"),
  certNumber: z.string().optional().nullable(),
  labId: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function updateCalibration(id: string, input: z.infer<typeof CalibrationSchema>) {
  const session = await requireAuth();
  const data = CalibrationSchema.parse(input);
  const calDate = new Date(data.calDate);
  const nextCalDate = new Date(data.nextCalDate);

  await prisma.$transaction([
    prisma.calibration.update({
      where: { id },
      data: { calDate, nextCalDate, certNumber: data.certNumber, labId: data.labId, result: data.result, notes: data.notes },
    }),
    // Refresh asset's cal dates based on updated record
    prisma.asset.update({
      where: { id: data.assetId },
      data: { lastCalDate: calDate, nextCalDate, calStatus: "NORMAL", updatedBy: session.user.id },
    }),
  ]);

  await writeAuditLog({
    userId: session.user.id,
    entity: "Calibration",
    entityId: id,
    action: "UPDATE",
    after: { calDate: data.calDate, nextCalDate: data.nextCalDate },
  });

  revalidatePath("/calibration");
  return { success: true };
}

export async function recordCalibration(input: z.infer<typeof CalibrationSchema>) {
  const session = await requireAuth();
  const data = CalibrationSchema.parse(input);
  const calDate = new Date(data.calDate);
  const nextCalDate = new Date(data.nextCalDate);

  const [cal] = await prisma.$transaction([
    prisma.calibration.create({
      data: {
        assetId: data.assetId,
        calDate,
        nextCalDate,
        certNumber: data.certNumber,
        labId: data.labId,
        result: data.result,
        notes: data.notes,
        createdBy: session.user.id,
      },
    }),
    prisma.asset.update({
      where: { id: data.assetId },
      data: {
        lastCalDate: calDate,
        nextCalDate,
        calStatus: "NORMAL",
        updatedBy: session.user.id,
      },
    }),
  ]);

  await writeAuditLog({
    userId: session.user.id,
    entity: "Calibration",
    entityId: cal.id,
    action: "CREATE",
    after: { assetId: data.assetId, calDate: data.calDate, nextCalDate: data.nextCalDate },
  });

  revalidatePath("/calibration");
  return { success: true };
}
