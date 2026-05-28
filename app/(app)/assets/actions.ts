"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AssetCategory, AssetStatus } from "@prisma/client";

// ─── Read ─────────────────────────────────────────────────────

export async function getAssets(category: AssetCategory) {
  const rows = await prisma.asset.findMany({
    where: { category, isDeleted: false },
    include: {
      assetClass: { select: { code: true, nameTh: true, color: true } },
      department: { select: { code: true, nameTh: true } },
      section: { select: { code: true, nameTh: true } },
      area: { select: { code: true, nameTh: true } },
      instrumentType: { select: { code: true, nameTh: true } },
      calLab: { select: { code: true, nameTh: true } },
      _count: { select: { workOrders: true, pmPlans: true } },
    },
    orderBy: { code: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    status: r.status,
    category: r.category,
    manufacturer: r.manufacturer,
    model: r.model,
    serialNumber: r.serialNumber,
    calStatus: r.calStatus,
    nextCalDate: r.nextCalDate?.toISOString() ?? null,
    lastCalDate: r.lastCalDate?.toISOString() ?? null,
    calPeriodMonths: r.calPeriodMonths,
    shotCount: r.shotCount,
    moldLifeShots: r.moldLifeShots,
    machineHours: r.machineHours ? Number(r.machineHours) : null,
    assetClass: r.assetClass,
    department: r.department,
    section: r.section,
    area: r.area,
    instrumentType: r.instrumentType,
    calLab: r.calLab,
    _count: r._count,
  }));
}

export type AssetRow = Awaited<ReturnType<typeof getAssets>>[number];

export async function getAsset(id: string) {
  const r = await prisma.asset.findUnique({
    where: { id },
    include: {
      assetClass: true,
      department: true,
      section: true,
      area: true,
      instrumentType: true,
      calLab: true,
      workOrders: {
        where: { isDeleted: false },
        include: { priority: true, type: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      pmPlans: {
        include: { frequency: true, checklistTemplate: true },
        orderBy: { nextDueDate: "asc" },
      },
      calibrations: {
        include: { lab: true },
        orderBy: { calDate: "desc" },
        take: 10,
      },
      spareParts: {
        include: { sparePart: { include: { unit: true } } },
      },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    status: r.status,
    category: r.category,
    manufacturer: r.manufacturer,
    model: r.model,
    serialNumber: r.serialNumber,
    purchaseDate: r.purchaseDate?.toISOString() ?? null,
    installDate: r.installDate?.toISOString() ?? null,
    warrantyExpiry: r.warrantyExpiry?.toISOString() ?? null,
    purchaseCost: r.purchaseCost ? Number(r.purchaseCost) : null,
    description: r.description,
    qrCode: r.qrCode,
    calStatus: r.calStatus,
    nextCalDate: r.nextCalDate?.toISOString() ?? null,
    lastCalDate: r.lastCalDate?.toISOString() ?? null,
    calPeriodMonths: r.calPeriodMonths,
    machineHours: r.machineHours ? Number(r.machineHours) : null,
    powerKw: r.powerKw ? Number(r.powerKw) : null,
    voltage: r.voltage,
    shotCount: r.shotCount,
    cavityCount: r.cavityCount,
    moldLifeShots: r.moldLifeShots,
    ipAddress: r.ipAddress,
    macAddress: r.macAddress,
    osVersion: r.osVersion,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    assetClass: r.assetClass,
    department: r.department,
    section: r.section,
    area: r.area,
    instrumentType: r.instrumentType,
    calLab: r.calLab,
    workOrders: r.workOrders.map((wo) => ({
      id: wo.id,
      woNumber: wo.woNumber,
      title: wo.title,
      status: wo.status,
      priority: wo.priority,
      type: wo.type,
      createdAt: wo.createdAt.toISOString(),
    })),
    pmPlans: r.pmPlans.map((pm) => ({
      id: pm.id,
      isActive: pm.isActive,
      nextDueDate: pm.nextDueDate?.toISOString() ?? null,
      lastDoneDate: pm.lastDoneDate?.toISOString() ?? null,
      leadTimeDays: pm.leadTimeDays,
      frequency: pm.frequency,
      checklistTemplate: pm.checklistTemplate,
    })),
    calibrations: r.calibrations.map((c) => ({
      id: c.id,
      calDate: c.calDate.toISOString(),
      nextCalDate: c.nextCalDate.toISOString(),
      certNumber: c.certNumber,
      result: c.result,
      notes: c.notes,
      lab: c.lab,
    })),
    spareParts: r.spareParts.map((sp) => ({
      id: sp.id,
      minQty: sp.minQty ? Number(sp.minQty) : null,
      sparePart: {
        id: sp.sparePart.id,
        code: sp.sparePart.code,
        nameTh: sp.sparePart.nameTh,
        stockOnHand: Number(sp.sparePart.stockOnHand),
        unit: sp.sparePart.unit,
      },
    })),
  };
}

export type AssetDetail = NonNullable<Awaited<ReturnType<typeof getAsset>>>;

export async function getAssetFormData(category: AssetCategory) {
  const [assetClasses, departments, areas, instrumentTypes, calLabs] =
    await Promise.all([
      prisma.assetClass.findMany({
        where: { category },
        orderBy: { code: "asc" },
      }),
      prisma.department.findMany({
        orderBy: { code: "asc" },
        include: { sections: { orderBy: { code: "asc" } } },
      }),
      prisma.area.findMany({ orderBy: { code: "asc" } }),
      category === "INSTRUMENT"
        ? prisma.instrumentType.findMany({ orderBy: { code: "asc" } })
        : Promise.resolve([]),
      category === "INSTRUMENT"
        ? prisma.calibrationLab.findMany({ orderBy: { code: "asc" } })
        : Promise.resolve([]),
    ]);

  return { assetClasses, departments, areas, instrumentTypes, calLabs };
}

export type AssetFormData = Awaited<ReturnType<typeof getAssetFormData>>;

// ─── Write ────────────────────────────────────────────────────

const AssetSchema = z.object({
  code: z.string().min(1).max(30),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.nativeEnum(AssetCategory),
  status: z.nativeEnum(AssetStatus).default("ACTIVE"),
  assetClassId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  // MACHINE
  powerKw: z.coerce.number().optional().nullable(),
  voltage: z.coerce.number().int().optional().nullable(),
  // MOLD
  cavityCount: z.coerce.number().int().optional().nullable(),
  moldLifeShots: z.coerce.number().int().optional().nullable(),
  // IT
  ipAddress: z.string().optional().nullable(),
  macAddress: z.string().optional().nullable(),
  osVersion: z.string().optional().nullable(),
  // INSTRUMENT
  instrumentTypeId: z.string().optional().nullable(),
  calPeriodMonths: z.coerce.number().int().optional().nullable(),
  calLabId: z.string().optional().nullable(),
});

export type AssetCreateInput = z.infer<typeof AssetSchema>;

export async function createAsset(input: AssetCreateInput) {
  const data = AssetSchema.parse(input);
  const asset = await prisma.asset.create({ data });
  revalidatePath("/assets");
  return { success: true, id: asset.id };
}

export async function updateAsset(id: string, input: Partial<AssetCreateInput>) {
  const data = AssetSchema.partial().parse(input);
  await prisma.asset.update({ where: { id }, data });
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  return { success: true };
}

export async function updateAssetStatus(id: string, status: AssetStatus) {
  await prisma.asset.update({ where: { id }, data: { status } });
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  return { success: true };
}
