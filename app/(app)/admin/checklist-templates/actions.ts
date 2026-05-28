"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, writeAuditLog } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Templates ────────────────────────────────────────────────

export async function getChecklistTemplates() {
  const rows = await prisma.checklistTemplate.findMany({
    include: {
      assetClass: { select: { code: true, nameTh: true, color: true } },
      _count: { select: { items: true } },
    },
    orderBy: { code: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    assetClassId: r.assetClassId,
    assetClass: r.assetClass,
    isActive: r.isActive,
    itemCount: r._count.items,
  }));
}

export type TemplateRow = Awaited<ReturnType<typeof getChecklistTemplates>>[number];

export async function getTemplateFormData() {
  const assetClasses = await prisma.assetClass.findMany({ orderBy: { code: "asc" } });
  return { assetClasses };
}

const TemplateSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  assetClassId: z.string().optional().nullable(),
});

export async function createChecklistTemplate(input: z.infer<typeof TemplateSchema>) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const data = TemplateSchema.parse(input);
  const tmpl = await prisma.checklistTemplate.create({
    data: { ...data, assetClassId: data.assetClassId || null, isActive: true },
  });
  await writeAuditLog({ userId: session.user.id, entity: "ChecklistTemplate", entityId: tmpl.id, action: "CREATE", after: { code: data.code } });
  revalidatePath("/admin/checklist-templates");
  return { success: true };
}

export async function updateChecklistTemplate(id: string, input: z.infer<typeof TemplateSchema> & { isActive?: boolean }) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const data = TemplateSchema.parse(input);
  await prisma.checklistTemplate.update({
    where: { id },
    data: { ...data, assetClassId: data.assetClassId || null, ...(input.isActive !== undefined ? { isActive: input.isActive } : {}) },
  });
  await writeAuditLog({ userId: session.user.id, entity: "ChecklistTemplate", entityId: id, action: "UPDATE" });
  revalidatePath("/admin/checklist-templates");
  return { success: true };
}

export async function toggleChecklistTemplate(id: string, isActive: boolean) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  await prisma.checklistTemplate.update({ where: { id }, data: { isActive } });
  await writeAuditLog({ userId: session.user.id, entity: "ChecklistTemplate", entityId: id, action: "UPDATE", after: { isActive } });
  revalidatePath("/admin/checklist-templates");
  return { success: true };
}

// ─── Template Detail (for item builder) ───────────────────────

export async function getChecklistTemplateDetail(id: string) {
  const tmpl = await prisma.checklistTemplate.findUnique({
    where: { id },
    include: {
      assetClass: { select: { code: true, nameTh: true } },
      items: {
        include: { category: { select: { code: true, nameTh: true, color: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!tmpl) return null;
  return {
    id: tmpl.id,
    code: tmpl.code,
    nameTh: tmpl.nameTh,
    nameEn: tmpl.nameEn,
    assetClass: tmpl.assetClass,
    isActive: tmpl.isActive,
    items: tmpl.items.map((i) => ({
      id: i.id,
      sortOrder: i.sortOrder,
      descriptionTh: i.descriptionTh,
      descriptionEn: i.descriptionEn,
      standard: i.standard,
      whoResponsible: i.whoResponsible,
      isCritical: i.isCritical,
      categoryId: i.categoryId,
      category: i.category,
    })),
  };
}

export type TemplateDetail = NonNullable<Awaited<ReturnType<typeof getChecklistTemplateDetail>>>;
export type ItemRow = TemplateDetail["items"][number];

export async function getItemFormData() {
  const categories = await prisma.checklistCategory.findMany({ orderBy: { code: "asc" } });
  return { categories };
}

// ─── Items ────────────────────────────────────────────────────

const ItemSchema = z.object({
  templateId: z.string().min(1),
  descriptionTh: z.string().min(1),
  descriptionEn: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  standard: z.string().optional().nullable(),
  whoResponsible: z.string().optional().nullable(),
  isCritical: z.boolean().default(false),
});

export async function addChecklistItem(input: z.infer<typeof ItemSchema>) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const data = ItemSchema.parse(input);

  const agg = await prisma.checklistItem.aggregate({
    where: { templateId: data.templateId },
    _max: { sortOrder: true },
  });
  const nextOrder = (agg._max.sortOrder ?? 0) + 1;

  const item = await prisma.checklistItem.create({
    data: {
      templateId: data.templateId,
      descriptionTh: data.descriptionTh,
      descriptionEn: data.descriptionEn,
      categoryId: data.categoryId || null,
      standard: data.standard || null,
      whoResponsible: data.whoResponsible || null,
      isCritical: data.isCritical,
      sortOrder: nextOrder,
    },
  });
  await writeAuditLog({ userId: session.user.id, entity: "ChecklistItem", entityId: item.id, action: "CREATE", after: { templateId: data.templateId } });

  revalidatePath(`/admin/checklist-templates/${data.templateId}`);
  return { success: true };
}

const UpdateItemSchema = z.object({
  descriptionTh: z.string().min(1),
  descriptionEn: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  standard: z.string().optional().nullable(),
  whoResponsible: z.string().optional().nullable(),
  isCritical: z.boolean().default(false),
});

export async function updateChecklistItem(id: string, input: z.infer<typeof UpdateItemSchema>) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const data = UpdateItemSchema.parse(input);
  const item = await prisma.checklistItem.findUnique({ where: { id }, select: { templateId: true } });
  if (!item) throw new Error("ไม่พบรายการ");

  await prisma.checklistItem.update({
    where: { id },
    data: {
      descriptionTh: data.descriptionTh,
      descriptionEn: data.descriptionEn,
      categoryId: data.categoryId || null,
      standard: data.standard || null,
      whoResponsible: data.whoResponsible || null,
      isCritical: data.isCritical,
    },
  });
  await writeAuditLog({ userId: session.user.id, entity: "ChecklistItem", entityId: id, action: "UPDATE" });

  revalidatePath(`/admin/checklist-templates/${item.templateId}`);
  return { success: true };
}

export async function deleteChecklistItem(id: string) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const item = await prisma.checklistItem.findUnique({ where: { id }, select: { templateId: true, sortOrder: true } });
  if (!item) throw new Error("ไม่พบรายการ");

  await prisma.checklistItem.delete({ where: { id } });
  await writeAuditLog({ userId: session.user.id, entity: "ChecklistItem", entityId: id, action: "DELETE" });

  const remaining = await prisma.checklistItem.findMany({
    where: { templateId: item.templateId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  await Promise.all(
    remaining.map((r, idx) =>
      prisma.checklistItem.update({ where: { id: r.id }, data: { sortOrder: idx + 1 } })
    )
  );

  revalidatePath(`/admin/checklist-templates/${item.templateId}`);
  return { success: true };
}

export async function moveChecklistItem(id: string, direction: "up" | "down") {
  await requireRole(["SYSTEM_ADMIN"]);
  const item = await prisma.checklistItem.findUnique({
    where: { id },
    select: { templateId: true, sortOrder: true },
  });
  if (!item) throw new Error("ไม่พบรายการ");

  const sibling = await prisma.checklistItem.findFirst({
    where: {
      templateId: item.templateId,
      sortOrder: direction === "up" ? { lt: item.sortOrder } : { gt: item.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!sibling) return { success: true };

  await prisma.$transaction([
    prisma.checklistItem.update({ where: { id }, data: { sortOrder: sibling.sortOrder } }),
    prisma.checklistItem.update({ where: { id: sibling.id }, data: { sortOrder: item.sortOrder } }),
  ]);

  revalidatePath(`/admin/checklist-templates/${item.templateId}`);
  return { success: true };
}
