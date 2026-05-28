"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AssetCategory, Criticality } from "@prisma/client";
import * as bcrypt from "bcryptjs";

// ─── Users ────────────────────────────────────────────────────

export async function getUsers() {
  const rows = await prisma.user.findMany({
    include: { role: true, department: true, section: true },
    orderBy: { nameTh: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    phone: r.phone,
    isActive: r.isActive,
    role: r.role,
    department: r.department,
    section: r.section,
    createdAt: r.createdAt.toISOString(),
  }));
}

export type UserRow = Awaited<ReturnType<typeof getUsers>>[number];

export async function getUserFormData() {
  const [roles, departments] = await Promise.all([
    prisma.role.findMany({ orderBy: { code: "asc" } }),
    prisma.department.findMany({ orderBy: { code: "asc" }, include: { sections: { orderBy: { code: "asc" } } } }),
  ]);
  return { roles, departments };
}

const UserCreateSchema = z.object({
  email: z.string().email("กรุณาระบุอีเมลที่ถูกต้อง"),
  nameTh: z.string().min(1, "กรุณาระบุชื่อภาษาไทย"),
  nameEn: z.string().min(1, "กรุณาระบุชื่อภาษาอังกฤษ"),
  phone: z.string().optional().nullable(),
  roleId: z.string().min(1, "กรุณาเลือกบทบาท"),
  departmentId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร").optional(),
});

export async function createUser(input: z.infer<typeof UserCreateSchema>) {
  const data = UserCreateSchema.parse(input);
  if (!data.password) throw new Error("กรุณาระบุรหัสผ่าน");
  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: {
      email: data.email,
      nameTh: data.nameTh,
      nameEn: data.nameEn,
      phone: data.phone,
      roleId: data.roleId,
      departmentId: data.departmentId,
      sectionId: data.sectionId,
      passwordHash,
      isActive: true,
    },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(id: string, input: Omit<z.infer<typeof UserCreateSchema>, "password"> & { password?: string }) {
  const { password, ...data } = input;
  const updateData: Record<string, unknown> = { ...data };
  if (password && password.length >= 6) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }
  await prisma.user.update({ where: { id }, data: updateData });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActive(id: string, isActive: boolean) {
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Roles ────────────────────────────────────────────────────

export async function getRoles() {
  return prisma.role.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { code: "asc" },
  });
}

// ─── Departments ──────────────────────────────────────────────

export async function getDepartmentsAdmin() {
  const rows = await prisma.department.findMany({
    include: {
      plant: { select: { code: true } },
      _count: { select: { users: true, assets: true } },
      sections: { orderBy: { code: "asc" } },
    },
    orderBy: { code: "asc" },
  });
  return rows;
}

const DeptSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  plantId: z.string().min(1),
});

export async function createDepartment(input: z.infer<typeof DeptSchema>) {
  const data = DeptSchema.parse(input);
  await prisma.department.create({ data });
  revalidatePath("/admin/departments");
  return { success: true };
}

export async function updateDepartment(id: string, input: z.infer<typeof DeptSchema>) {
  const data = DeptSchema.parse(input);
  await prisma.department.update({ where: { id }, data });
  revalidatePath("/admin/departments");
  return { success: true };
}

// ─── Sections ─────────────────────────────────────────────────

const SectionSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  departmentId: z.string().min(1),
});

export async function createSection(input: z.infer<typeof SectionSchema>) {
  await prisma.section.create({ data: SectionSchema.parse(input) });
  revalidatePath("/admin/departments");
  return { success: true };
}

export async function updateSection(id: string, input: z.infer<typeof SectionSchema>) {
  await prisma.section.update({ where: { id }, data: SectionSchema.parse(input) });
  revalidatePath("/admin/departments");
  return { success: true };
}

// ─── Areas ────────────────────────────────────────────────────

export async function getAreas() {
  return prisma.area.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { code: "asc" },
  });
}

const AreaSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
});

export async function createArea(input: z.infer<typeof AreaSchema>) {
  await prisma.area.create({ data: AreaSchema.parse(input) });
  revalidatePath("/admin/areas");
  return { success: true };
}

export async function updateArea(id: string, input: z.infer<typeof AreaSchema>) {
  await prisma.area.update({ where: { id }, data: AreaSchema.parse(input) });
  revalidatePath("/admin/areas");
  return { success: true };
}

export async function deleteArea(id: string) {
  await prisma.area.delete({ where: { id } });
  revalidatePath("/admin/areas");
  return { success: true };
}

// ─── WO Types ─────────────────────────────────────────────────

export async function getWOTypesAdmin() {
  return prisma.wOType.findMany({
    include: { _count: { select: { workOrders: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

const WOTypeSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  color: z.string().min(1),
  sortOrder: z.coerce.number().default(0),
});

export async function createWOType(input: z.infer<typeof WOTypeSchema>) {
  await prisma.wOType.create({ data: WOTypeSchema.parse(input) });
  revalidatePath("/admin/wo-types");
  return { success: true };
}

export async function updateWOType(id: string, input: z.infer<typeof WOTypeSchema>) {
  await prisma.wOType.update({ where: { id }, data: WOTypeSchema.parse(input) });
  revalidatePath("/admin/wo-types");
  return { success: true };
}

// ─── Priorities ───────────────────────────────────────────────

export async function getPrioritiesAdmin() {
  return prisma.priority.findMany({
    include: { _count: { select: { workOrders: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

const PrioritySchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  color: z.string().min(1),
  slaHours: z.coerce.number().int().min(1),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createPriority(input: z.infer<typeof PrioritySchema>) {
  await prisma.priority.create({ data: PrioritySchema.parse(input) });
  revalidatePath("/admin/priorities");
  return { success: true };
}

export async function updatePriority(id: string, input: z.infer<typeof PrioritySchema>) {
  await prisma.priority.update({ where: { id }, data: PrioritySchema.parse(input) });
  revalidatePath("/admin/priorities");
  return { success: true };
}

// ─── Asset Classes ────────────────────────────────────────────

export async function getAssetClassesAdmin() {
  return prisma.assetClass.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { code: "asc" },
  });
}

const AssetClassSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.nativeEnum(AssetCategory),
  criticality: z.nativeEnum(Criticality),
  color: z.string().optional().nullable(),
});

export async function createAssetClass(input: z.infer<typeof AssetClassSchema>) {
  await prisma.assetClass.create({ data: AssetClassSchema.parse(input) });
  revalidatePath("/admin/asset-classes");
  return { success: true };
}

export async function updateAssetClass(id: string, input: z.infer<typeof AssetClassSchema>) {
  await prisma.assetClass.update({ where: { id }, data: AssetClassSchema.parse(input) });
  revalidatePath("/admin/asset-classes");
  return { success: true };
}

// ─── Calibration Labs ─────────────────────────────────────────

export async function getCalibrationLabsAdmin() {
  return prisma.calibrationLab.findMany({
    include: { _count: { select: { assets: true, calibrations: true } } },
    orderBy: { code: "asc" },
  });
}

const CalLabSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  accreditNo: z.string().optional().nullable(),
});

export async function createCalibrationLab(input: z.infer<typeof CalLabSchema>) {
  await prisma.calibrationLab.create({ data: CalLabSchema.parse(input) });
  revalidatePath("/admin/calibration-labs");
  return { success: true };
}

export async function updateCalibrationLab(id: string, input: z.infer<typeof CalLabSchema>) {
  await prisma.calibrationLab.update({ where: { id }, data: CalLabSchema.parse(input) });
  revalidatePath("/admin/calibration-labs");
  return { success: true };
}

// ─── Suppliers ────────────────────────────────────────────────

export async function getSuppliersAdmin() {
  return prisma.supplier.findMany({
    include: { _count: { select: { spareParts: true } } },
    orderBy: { code: "asc" },
  });
}

const SupplierSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  leadTimeDays: z.coerce.number().int().min(0).default(7),
  isActive: z.boolean().default(true),
});

export async function createSupplier(input: z.infer<typeof SupplierSchema>) {
  await prisma.supplier.create({ data: SupplierSchema.parse(input) });
  revalidatePath("/admin/suppliers");
  return { success: true };
}

export async function updateSupplier(id: string, input: z.infer<typeof SupplierSchema>) {
  await prisma.supplier.update({ where: { id }, data: SupplierSchema.parse(input) });
  revalidatePath("/admin/suppliers");
  return { success: true };
}

export async function toggleSupplier(id: string, isActive: boolean) {
  await prisma.supplier.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/suppliers");
  return { success: true };
}

// ─── Notification Rules ───────────────────────────────────────

export async function getNotificationRules() {
  return prisma.notificationRule.findMany({ orderBy: { event: "asc" } });
}

export async function toggleNotificationRule(id: string, isActive: boolean) {
  await prisma.notificationRule.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/notification-rules");
  return { success: true };
}

const NotifRuleSchema = z.object({
  event: z.string().min(1),
  audience: z.string().min(1),
  channel: z.string().min(1),
});

export async function createNotificationRule(input: z.infer<typeof NotifRuleSchema>) {
  const data = NotifRuleSchema.parse(input);
  await prisma.notificationRule.create({ data: { ...data, isActive: true } });
  revalidatePath("/admin/notification-rules");
  return { success: true };
}
