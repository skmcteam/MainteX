"use server";

import { prisma } from "@/lib/prisma";
import { subMonths, format } from "date-fns";
import { th } from "date-fns/locale";
import { computeKPIs } from "@/lib/kpi";

// ─── WO count per month by type (last 12 months) ─────────────

export async function getWOByMonth() {
  const since = subMonths(new Date(), 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  type Row = { month: Date; type_code: string; count: bigint };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      DATE_TRUNC('month', wo."createdAt") AS month,
      t.code AS type_code,
      COUNT(*) AS count
    FROM "WorkOrder" wo
    JOIN "WOType" t ON wo."typeId" = t.id
    WHERE wo."isDeleted" = false
      AND wo."createdAt" >= ${since}
    GROUP BY DATE_TRUNC('month', wo."createdAt"), t.code
    ORDER BY month ASC
  `;

  // Build month series
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    months.push(format(subMonths(new Date(), i), "MMM yy", { locale: th }));
  }

  // Types to track
  const types = ["CM", "PM", "CALIBRATION", "INSPECTION", "IMPROVEMENT"];

  type MonthEntry = { month: string; [key: string]: string | number };
  const data: MonthEntry[] = months.map((label, i) => {
    const entry: MonthEntry = { month: label };
    for (const type of types) {
      const found = rows.find((r) => {
        const rowMonth = format(new Date(r.month), "MMM yy", { locale: th });
        return rowMonth === label && r.type_code === type;
      });
      entry[type] = found ? Number(found.count) : 0;
    }
    return entry;
  });

  return data;
}

// ─── Top bad actors (assets with most WOs) ───────────────────

export async function getTopBadActors() {
  type Row = { code: string; nameTh: string; category: string; wo_count: bigint; open_count: bigint };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      a.code,
      a."nameTh",
      a.category,
      COUNT(wo.id) AS wo_count,
      SUM(CASE WHEN wo.status IN ('OPEN','IN_PROGRESS','ON_HOLD') THEN 1 ELSE 0 END) AS open_count
    FROM "Asset" a
    LEFT JOIN "WorkOrder" wo ON wo."assetId" = a.id AND wo."isDeleted" = false
    WHERE a."isDeleted" = false
    GROUP BY a.id, a.code, a."nameTh", a.category
    HAVING COUNT(wo.id) > 0
    ORDER BY wo_count DESC
    LIMIT 10
  `;
  return rows.map((r) => ({
    code: r.code,
    nameTh: r.nameTh,
    category: r.category,
    woCount: Number(r.wo_count),
    openCount: Number(r.open_count),
  }));
}

// ─── Cost by department ───────────────────────────────────────

export async function getCostByDepartment() {
  const since = subMonths(new Date(), 11);
  type Row = { dept_name: string; labor_cost: number; parts_cost: number };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      d."nameTh" AS dept_name,
      CAST(COALESCE(SUM(wo."laborCost"), 0) AS FLOAT) AS labor_cost,
      CAST(COALESCE(SUM(wo."totalPartsCost"), 0) AS FLOAT) AS parts_cost
    FROM "WorkOrder" wo
    JOIN "Department" d ON wo."departmentId" = d.id
    WHERE wo."isDeleted" = false
      AND wo."createdAt" >= ${since}
    GROUP BY d.id, d."nameTh"
    ORDER BY (CAST(COALESCE(SUM(wo."laborCost"), 0) AS FLOAT) + CAST(COALESCE(SUM(wo."totalPartsCost"), 0) AS FLOAT)) DESC
  `;
  return rows.map((r) => ({
    dept: r.dept_name,
    labor: Number(r.labor_cost),
    parts: Number(r.parts_cost),
    total: Number(r.labor_cost) + Number(r.parts_cost),
  }));
}

// ─── PM Compliance per month ──────────────────────────────────

export async function getPMComplianceByMonth() {
  const since = subMonths(new Date(), 5);
  since.setDate(1); since.setHours(0, 0, 0, 0);

  type Row = { month: Date; done_count: bigint; total_count: bigint };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      DATE_TRUNC('month', wo."createdAt") AS month,
      SUM(CASE WHEN wo.status = 'DONE' THEN 1 ELSE 0 END) AS done_count,
      COUNT(*) AS total_count
    FROM "WorkOrder" wo
    JOIN "WOType" t ON wo."typeId" = t.id
    WHERE t.code = 'PM'
      AND wo."isDeleted" = false
      AND wo."createdAt" >= ${since}
    GROUP BY DATE_TRUNC('month', wo."createdAt")
    ORDER BY month ASC
  `;

  return rows.map((r) => ({
    month: format(new Date(r.month), "MMM yy", { locale: th }),
    compliance: Number(r.total_count) > 0
      ? Math.round((Number(r.done_count) / Number(r.total_count)) * 100)
      : 0,
    done: Number(r.done_count),
    total: Number(r.total_count),
  }));
}

// ─── Calibration summary ──────────────────────────────────────

export async function getCalibrationSummary() {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const instruments = await prisma.asset.findMany({
    where: { category: "INSTRUMENT", isDeleted: false },
    select: { id: true, nextCalDate: true, status: true },
  });

  let normal = 0, dueSoon = 0, overdue = 0, noDate = 0;
  for (const a of instruments) {
    if (!a.nextCalDate) { noDate++; continue; }
    if (a.nextCalDate < now) overdue++;
    else if (a.nextCalDate < soon) dueSoon++;
    else normal++;
  }

  return [
    { label: "ปกติ", value: normal, color: "var(--success)" },
    { label: "ใกล้ครบกำหนด", value: dueSoon, color: "var(--warning)" },
    { label: "เกินกำหนด", value: overdue, color: "var(--danger)" },
    { label: "ยังไม่ระบุ", value: noDate, color: "var(--text-sub)" },
  ];
}

// ─── Overall KPI summary ──────────────────────────────────────

export async function getReportKPIs() {
  const since = subMonths(new Date(), 1);

  const [totalWOs, openWOs, doneWOs, activeAssets, lowStockParts, closedCMs] = await Promise.all([
    prisma.workOrder.count({ where: { isDeleted: false, createdAt: { gte: since } } }),
    prisma.workOrder.count({ where: { isDeleted: false, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.workOrder.count({ where: { isDeleted: false, status: "DONE", createdAt: { gte: since } } }),
    prisma.asset.count({ where: { isDeleted: false, status: "ACTIVE" } }),
    prisma.sparePart.findMany({ where: { isDeleted: false }, select: { stockOnHand: true, reorderPoint: true } })
      .then(parts => parts.filter(p => Number(p.stockOnHand) <= Number(p.reorderPoint)).length),
    prisma.workOrder.findMany({
      where: { status: "DONE", type: { code: "CM" }, startTime: { not: null }, endTime: { not: null }, isDeleted: false, createdAt: { gte: since } },
      select: { startTime: true, endTime: true, holdDuration: true },
    }),
  ]);

  const totalRepairMinutes = closedCMs.reduce((s, wo) => {
    if (!wo.startTime || !wo.endTime) return s;
    return s + (wo.endTime.getTime() - wo.startTime.getTime()) / 60000;
  }, 0);
  const holdMinutes = closedCMs.reduce((s, wo) => s + (wo.holdDuration ?? 0), 0);
  const totalUptimeHours = 30 * 24 * activeAssets;
  const kpis = computeKPIs({ totalUptimeHours, correctiveWOCount: closedCMs.length || 1, totalRepairMinutes, holdMinutes });

  return {
    totalWOs,
    openWOs,
    doneWOs,
    activeAssets,
    lowStockParts,
    ...kpis,
  };
}

export type ReportKPIs = Awaited<ReturnType<typeof getReportKPIs>>;
