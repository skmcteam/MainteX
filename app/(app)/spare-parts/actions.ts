"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, writeAuditLog } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotificationEvent } from "@/lib/notifications";

const PAGE_SIZE = 50;

function serializePart(r: {
  id: string; code: string; nameTh: string; nameEn: string; partNumber: string | null;
  stockOnHand: { toNumber: () => number } | number; reorderPoint: { toNumber: () => number } | number;
  unitCost: { toNumber: () => number } | number | null; shelfLocation: string | null;
  description: string | null;
  unit: { code: string; nameTh: string } | null;
  supplier: { code: string; nameTh: string } | null;
  warehouse: { code: string; nameTh: string } | null;
}) {
  const stock = Number(r.stockOnHand);
  const reorder = Number(r.reorderPoint);
  return {
    id: r.id, code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, partNumber: r.partNumber,
    stockOnHand: stock, reorderPoint: reorder,
    unitCost: r.unitCost ? Number(r.unitCost) : null,
    shelfLocation: r.shelfLocation, description: r.description,
    unit: r.unit, supplier: r.supplier, warehouse: r.warehouse,
    isLowStock: stock <= reorder,
  };
}

export async function getSpareParts(opts?: { q?: string; page?: number }) {
  await requireAuth();
  const { q, page = 1 } = opts ?? {};
  const where = {
    isDeleted: false,
    ...(q?.trim()
      ? {
          OR: [
            { code: { contains: q.trim(), mode: "insensitive" as const } },
            { nameTh: { contains: q.trim(), mode: "insensitive" as const } },
            { nameEn: { contains: q.trim(), mode: "insensitive" as const } },
            { partNumber: { contains: q.trim(), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const include = {
    unit: { select: { code: true, nameTh: true } },
    supplier: { select: { code: true, nameTh: true } },
    warehouse: { select: { code: true, nameTh: true } },
  };

  const [rows, total] = await Promise.all([
    prisma.sparePart.findMany({ where, include, orderBy: { code: "asc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    prisma.sparePart.count({ where }),
  ]);

  return { data: rows.map(serializePart), total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export type SparePartRow = Awaited<ReturnType<typeof getSpareParts>>["data"][number];

// Cross-field comparison (stockOnHand <= reorderPoint) requires raw SQL
export async function getLowStockParts() {
  await requireAuth();
  type RawRow = { id: string; code: string; nameTh: string; nameEn: string; partNumber: string | null; stockOnHand: number; reorderPoint: number; unitCost: number | null; shelfLocation: string | null; description: string | null };
  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT sp.id, sp.code, sp."nameTh", sp."nameEn", sp."partNumber",
           sp."stockOnHand"::float, sp."reorderPoint"::float, sp."unitCost"::float,
           sp."shelfLocation", sp.description
    FROM "SparePart" sp
    WHERE sp."isDeleted" = false AND sp."stockOnHand" <= sp."reorderPoint"
    ORDER BY sp.code ASC
  `;
  return rows.map((r) => ({ ...r, unit: null as null, supplier: null as null, warehouse: null as null, isLowStock: true }));
}

export async function getLowStockCount() {
  await requireAuth();
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM "SparePart" WHERE "isDeleted" = false AND "stockOnHand" <= "reorderPoint"
  `;
  return Number(result[0].count);
}

export async function getPartsFormData() {
  await requireAuth();
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
  const session = await requireAuth();
  const data = SparePartSchema.parse(input);
  const part = await prisma.sparePart.create({ data: { ...data, stockOnHand: 0, createdBy: session.user.id } });
  await writeAuditLog({ userId: session.user.id, entity: "SparePart", entityId: part.id, action: "CREATE", after: { code: data.code } });
  revalidatePath("/spare-parts");
  return { success: true };
}

export async function updateSparePart(id: string, input: z.infer<typeof SparePartSchema>) {
  const session = await requireAuth();
  const data = SparePartSchema.parse(input);
  await prisma.sparePart.update({ where: { id }, data });
  await writeAuditLog({ userId: session.user.id, entity: "SparePart", entityId: id, action: "UPDATE", after: { code: data.code } });
  revalidatePath("/spare-parts");
  return { success: true };
}

const AdjustSchema = z.object({
  sparePartId: z.string().min(1),
  delta: z.coerce.number(),
  reason: z.string().optional().nullable(),
});

export async function adjustStock(input: z.infer<typeof AdjustSchema>) {
  const session = await requireAuth();
  const data = AdjustSchema.parse(input);
  const part = await prisma.sparePart.findUnique({
    where: { id: data.sparePartId },
    select: { code: true, nameTh: true, stockOnHand: true, reorderPoint: true },
  });
  if (!part) throw new Error("ไม่พบอะไหล่");
  const prevStock = Number(part.stockOnHand);
  const newStock = prevStock + data.delta;
  if (newStock < 0) throw new Error("สต็อกไม่เพียงพอ");
  await prisma.sparePart.update({ where: { id: data.sparePartId }, data: { stockOnHand: newStock } });

  await writeAuditLog({
    userId: session.user.id,
    entity: "SparePart",
    entityId: data.sparePartId,
    action: "UPDATE",
    before: { stockOnHand: prevStock },
    after: { stockOnHand: newStock, delta: data.delta, reason: data.reason },
  });

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
