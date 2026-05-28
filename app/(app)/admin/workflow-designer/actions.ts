"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, writeAuditLog } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getWorkflows() {
  return prisma.workflow.findMany({
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { workOrders: true } },
    },
    orderBy: { code: "asc" },
  });
}

export type WorkflowWithSteps = Awaited<ReturnType<typeof getWorkflows>>[number];

export async function getRoles() {
  return prisma.role.findMany({ orderBy: { code: "asc" } });
}

const WorkflowSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
});

export async function createWorkflow(input: z.infer<typeof WorkflowSchema>) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const data = WorkflowSchema.parse(input);
  const wf = await prisma.workflow.create({ data: { ...data, isActive: true } });
  await writeAuditLog({ userId: session.user.id, entity: "Workflow", entityId: wf.id, action: "CREATE" });
  revalidatePath("/admin/workflow-designer");
  return { success: true, id: wf.id };
}

export async function updateWorkflow(id: string, input: z.infer<typeof WorkflowSchema>) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const data = WorkflowSchema.parse(input);
  await prisma.workflow.update({ where: { id }, data });
  await writeAuditLog({ userId: session.user.id, entity: "Workflow", entityId: id, action: "UPDATE" });
  revalidatePath("/admin/workflow-designer");
  return { success: true };
}

export async function deleteWorkflow(id: string) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  await prisma.workflow.delete({ where: { id } });
  await writeAuditLog({ userId: session.user.id, entity: "Workflow", entityId: id, action: "DELETE" });
  revalidatePath("/admin/workflow-designer");
  return { success: true };
}

const StepSchema = z.object({
  workflowId: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  roleCode: z.string().min(1),
  allowedActions: z.array(z.string()).default(["approve", "reject"]),
  skipCondition: z.string().optional().nullable(),
  slaHours: z.coerce.number().int().positive().optional().nullable(),
});

export async function addStep(input: z.infer<typeof StepSchema>) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const data = StepSchema.parse(input);
  const maxStep = await prisma.workflowStep.aggregate({
    where: { workflowId: data.workflowId },
    _max: { stepNumber: true },
  });
  const nextStep = (maxStep._max.stepNumber ?? 0) + 1;
  const step = await prisma.workflowStep.create({
    data: { ...data, stepNumber: nextStep },
  });
  await writeAuditLog({ userId: session.user.id, entity: "WorkflowStep", entityId: step.id, action: "CREATE" });
  revalidatePath("/admin/workflow-designer");
  return { success: true };
}

export async function updateStep(id: string, input: Omit<z.infer<typeof StepSchema>, "workflowId">) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const { workflowId: _wf, ...rest } = StepSchema.parse({ ...input, workflowId: "skip" });
  await prisma.workflowStep.update({ where: { id }, data: rest });
  await writeAuditLog({ userId: session.user.id, entity: "WorkflowStep", entityId: id, action: "UPDATE" });
  revalidatePath("/admin/workflow-designer");
  return { success: true };
}

export async function deleteStep(id: string) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  const step = await prisma.workflowStep.findUnique({ where: { id }, select: { workflowId: true, stepNumber: true } });
  if (!step) throw new Error("ไม่พบขั้นตอน");
  await prisma.workflowStep.delete({ where: { id } });
  // Re-number remaining steps
  const remaining = await prisma.workflowStep.findMany({
    where: { workflowId: step.workflowId },
    orderBy: { stepNumber: "asc" },
    select: { id: true },
  });
  await Promise.all(remaining.map((s, idx) =>
    prisma.workflowStep.update({ where: { id: s.id }, data: { stepNumber: idx + 1 } })
  ));
  await writeAuditLog({ userId: session.user.id, entity: "WorkflowStep", entityId: id, action: "DELETE" });
  revalidatePath("/admin/workflow-designer");
  return { success: true };
}

export async function reorderSteps(workflowId: string, orderedIds: string[]) {
  const session = await requireRole(["SYSTEM_ADMIN"]);
  await Promise.all(orderedIds.map((id, idx) =>
    prisma.workflowStep.update({ where: { id }, data: { stepNumber: idx + 1 } })
  ));
  await writeAuditLog({ userId: session.user.id, entity: "Workflow", entityId: workflowId, action: "UPDATE", after: { action: "reorderSteps" } });
  revalidatePath("/admin/workflow-designer");
  return { success: true };
}
