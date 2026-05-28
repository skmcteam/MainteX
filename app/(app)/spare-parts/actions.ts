"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotificationEvent } from "@/lib/notifications";

export async function getSpareParts() {
  const rows = await prisma.sparePart.findMany({
    where: { isDeleted: false },
    include: {
      unit: { select: { code: true, nameTh: true } },
      supplier: { select: { code: true, nameTh: true } },
      warehouse: { select: { code: true, nameTh: true } },
    },
    orderBy: { code: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    partNumber: r.partNumber,
    stockOnHand: Number(r.stockOnHand),
    reorderPoint: Number(r.reorderPoint),
    unitCost: r.unitCost ? Number(r.unitCost) : null,
    shelfLocation: r.shelfLocation,
    description: r.description,
    unit: r.unit,
    supplier: r.supplier,
    warehouse: r.warehouse,
    isLowStock: Number(r.stockOnHand) <= Number(r.reorderPoint),
  }));
}

export type SparePartRow = Awaited<ReturnType<typeof getSpareParts>>[number];

export async function getPartsFormData() {
  const [units, suppliers, warehouses] = await Promise.all([
    prisma.unitOfMeasure.findMany({ orderBy: { code: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.warehouse.findMany({ orderBy: { code: "asc" } }),
  ]);
  return { units, suppliers, warehouses };
}

export type PartsFormData = Awaited<ReturnType<typeof getPartsFormData>>;

const SparePartSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  partNumber: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  shelfLocation: z.string().optional().nullable(),
  reorderPoint: z.coerce.number().min(0).default(0),
  unitCost: z.coerce.number().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function createSparePart(input: z.infer<typeof SparePartSchema>) {
  const data = SparePartSchema.parse(input);
  await prisma.sparePart.create({ data: { ...data, stockOnHand: 0 } });
  revalidatePath("/spare-parts");
  return { success: true };
}

export async function updateSparePart(id: string, input: z.infer<typeof SparePartSchema>) {
  const data = SparePartSchema.parse(input);
  await prisma.sparePart.update({ where: { id }, data });
  revalidatePath("/spare-parts");
  return { success: true };
}

const AdjustSchema = z.object({
  sparePartId: z.string().min(1),
  delta: z.coerce.number(),
  reason: z.string().optional().nullable(),
});

export async function adjustStock(input: z.infer<typeof AdjustSchema>) {
  const data = AdjustSchema.parse(input);
  const part = await prisma.sparePart.findUnique({
    where: { id: data.sparePartId },
    select: { code: true, nameTh: true, stockOnHand: true, reorderPoint: true },
  });
  if (!part) throw new Error("ไม่พบอะไหล่");
  const newStock = Number(part.stockOnHand) + data.delta;
  if (newStock < 0) throw new Error("สต็อกไม่เพียงพอ");
  await prisma.sparePart.update({ where: { id: data.sparePartId }, data: { stockOnHand: newStock } });

  if (data.delta < 0 && newStock <= Number(part.reorderPoint)) {
    await createNotificationEvent({
      event: "parts_low_stock",
      type: "PARTS_LOW",
      titleTh: `สต็อกอะไหล่ต่ำ: ${part.nameTh}`,
      titleEn: `Low stock: ${part.nameTh}`,
      bodyTh: `${part.code} เหลือ ${newStock} หน่วย`,
      bodyEn: `${part.code} has ${newStock} units remaining`,
      link: "/spare-parts",
    });
  }

  revalidatePath("/spare-parts");
  return { success: true };
}
