"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Read ─────────────────────────────────────────────────────

export async function getCalibrationAssets() {
  const rows = await prisma.asset.findMany({
    where: { category: "INSTRUMENT", isDeleted: false },
    include: {
      instrumentType: { select: { code: true, nameTh: true } },
      calLab: { select: { code: true, nameTh: true } },
      department: { select: { nameTh: true } },
      calibrations: {
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

  return rows.map((r) => ({
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

export async function recordCalibration(input: z.infer<typeof CalibrationSchema>) {
  const data = CalibrationSchema.parse(input);
  const calDate = new Date(data.calDate);
  const nextCalDate = new Date(data.nextCalDate);

  await prisma.$transaction([
    prisma.calibration.create({
      data: {
        assetId: data.assetId,
        calDate,
        nextCalDate,
        certNumber: data.certNumber,
        labId: data.labId,
        result: data.result,
        notes: data.notes,
      },
    }),
    prisma.asset.update({
      where: { id: data.assetId },
      data: {
        lastCalDate: calDate,
        nextCalDate,
        calStatus: "NORMAL",
      },
    }),
  ]);

  revalidatePath("/calibration");
  return { success: true };
}
