"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { computeKPIs } from "@/lib/kpi";
import { subDays } from "date-fns";

export async function getDashboardStats() {
  await requireAuth();
  const [
    openWOs,
    urgentWOs,
    activeAssets,
    calOverdue,
    calDueSoon,
    recentWOs,
    assetStatusCounts,
    upcomingPMs,
  ] = await Promise.all([
    prisma.workOrder.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, isDeleted: false } }),
    prisma.workOrder.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        priority: { code: "URGENT" },
        isDeleted: false,
      },
    }),
    prisma.asset.count({ where: { status: "ACTIVE", isDeleted: false } }),
    prisma.asset.count({ where: { calStatus: "OVERDUE", isDeleted: false } }),
    prisma.asset.count({ where: { calStatus: "DUE_SOON", isDeleted: false } }),
    prisma.workOrder.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        asset: { select: { code: true, nameTh: true } },
        priority: { select: { code: true, nameTh: true, color: true } },
        type: { select: { code: true, nameTh: true } },
        assignee: { select: { nameTh: true } },
      },
    }),
    prisma.asset.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { id: true },
    }),
    prisma.pMPlan.findMany({
      where: {
        isActive: true,
        nextDueDate: { lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { nextDueDate: "asc" },
      take: 5,
      include: {
        asset: { select: { code: true, nameTh: true } },
        frequency: { select: { code: true, nameTh: true } },
      },
    }),
  ]);

  // Simplified KPIs from closed CMs in last 30 days
  const closedCMs = await prisma.workOrder.findMany({
    where: {
      status: "DONE",
      type: { code: "CM" },
      startTime: { not: null },
      endTime: { not: null },
      isDeleted: false,
      createdAt: { gte: subDays(new Date(), 30) },
    },
    select: { startTime: true, endTime: true, holdDuration: true },
  });

  const totalRepairMinutes = closedCMs.reduce((sum, wo) => {
    if (!wo.startTime || !wo.endTime) return sum;
    return sum + (wo.endTime.getTime() - wo.startTime.getTime()) / 60000;
  }, 0);
  const holdMinutes = closedCMs.reduce((s, wo) => s + (wo.holdDuration ?? 0), 0);
  const totalUptimeHours = 30 * 24 * activeAssets;

  const kpis = computeKPIs({
    totalUptimeHours,
    correctiveWOCount: closedCMs.length || 1,
    totalRepairMinutes,
    holdMinutes,
  });

  const pmPlanned = await prisma.pMPlan.count({ where: { isActive: true } });
  const pmCompleted = await prisma.workOrder.count({
    where: {
      type: { code: "PM" },
      status: "DONE",
      isDeleted: false,
      createdAt: { gte: subDays(new Date(), 30) },
    },
  });

  return {
    openWOs,
    urgentWOs,
    activeAssets,
    calOverdue,
    calDueSoon,
    pmCompliance: pmPlanned > 0 ? Math.round((pmCompleted / pmPlanned) * 100) : 100,
    ...kpis,
    recentWOs: recentWOs.map((wo) => ({
      id: wo.id,
      woNumber: wo.woNumber,
      title: wo.title,
      status: wo.status,
      priorityCode: wo.priority.code,
      priorityColor: wo.priority.color,
      typeCode: wo.type.code,
      assetCode: wo.asset.code,
      assetName: wo.asset.nameTh,
      assigneeName: wo.assignee?.nameTh ?? null,
      createdAt: wo.createdAt.toISOString(),
    })),
    assetStatusCounts: assetStatusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    upcomingPMs: upcomingPMs.map((pm) => ({
      id: pm.id,
      assetCode: pm.asset.code,
      assetName: pm.asset.nameTh,
      frequency: pm.frequency.nameTh,
      nextDueDate: pm.nextDueDate?.toISOString() ?? null,
    })),
  };
}
