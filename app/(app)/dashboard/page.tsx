import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ClipboardList,
  Cpu,
  Gauge,
  CalendarCheck,
  AlertTriangle,
  Activity,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { WOStatusPill, PriorityPill } from "@/components/shared/status-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { getDashboardStats } from "./actions";
import { formatDate } from "@/lib/utils";
import { DashboardCharts } from "./dashboard-charts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const t = await getTranslations();
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-5">
      {/* Page title */}
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          {t("dashboard.title")}
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          ระบบบำรุงรักษา SKMC · อัปเดตล่าสุด: {new Date().toLocaleTimeString("th-TH")}
        </p>
      </div>

      {/* KPI top row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("dashboard.openWOs")}
          value={stats.openWOs}
          icon={ClipboardList}
          color={stats.urgentWOs > 0 ? "danger" : "brand"}
          trend={undefined}
        />
        <StatCard
          label={t("dashboard.activeAssets")}
          value={stats.activeAssets}
          icon={Cpu}
          color="success"
        />
        <StatCard
          label={t("dashboard.calOverdue")}
          value={stats.calOverdue}
          icon={Gauge}
          color={stats.calOverdue > 0 ? "danger" : "success"}
        />
        <StatCard
          label={t("dashboard.pmCompliance")}
          value={`${stats.pmCompliance}%`}
          icon={CalendarCheck}
          color={stats.pmCompliance >= 80 ? "success" : "warning"}
        />
      </div>

      {/* KPI second row — MTBF/MTTR */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("dashboard.mtbf")}
          value={stats.mtbf}
          unit={t("dashboard.hours")}
          icon={Activity}
          color="cyan"
          size="sm"
        />
        <StatCard
          label={t("dashboard.mttr")}
          value={stats.mttr}
          unit={t("dashboard.hours")}
          icon={Timer}
          color={stats.mttr > 4 ? "warning" : "brand"}
          size="sm"
        />
        <StatCard
          label={t("dashboard.availability")}
          value={`${stats.availability}%`}
          icon={CheckCircle2}
          color={stats.availability >= 95 ? "success" : "warning"}
          size="sm"
        />
        <StatCard
          label={t("dashboard.downtime")}
          value={stats.downtimeHours}
          unit={t("dashboard.hours")}
          icon={AlertTriangle}
          color={stats.downtimeHours > 24 ? "danger" : "warning"}
          size="sm"
        />
      </div>

      {/* Charts row */}
      <Suspense fallback={<ChartSkeleton />}>
        <DashboardCharts assetStatusCounts={stats.assetStatusCounts} />
      </Suspense>

      {/* Bottom row: Recent WOs + Upcoming PMs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent WOs */}
        <div className="panel-border overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "0.5px solid var(--line)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {t("dashboard.recentWOs")}
            </p>
            <Link href="/work-orders" className="text-xs" style={{ color: "var(--brand)" }}>
              ดูทั้งหมด →
            </Link>
          </div>
          {stats.recentWOs.length === 0 ? (
            <EmptyState title="ไม่มีใบสั่งซ่อม" icon={ClipboardList} />
          ) : (
            <div>
              {stats.recentWOs.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/work-orders/${wo.id}`}
                  className="row-hover flex items-start gap-3 px-4 py-2.5"
                  style={{ borderBottom: "0.5px solid var(--line)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono-num text-xs"
                        style={{ color: "var(--brand)" }}
                      >
                        {wo.woNumber}
                      </span>
                      <WOStatusPill status={wo.status} />
                      <PriorityPill priority={wo.priorityCode} />
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium" style={{ color: "var(--text)" }}>
                      {wo.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
                      {wo.assetCode} · {formatDate(wo.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming PMs */}
        <div className="panel-border overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "0.5px solid var(--line)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {t("dashboard.upcomingPMs")}
            </p>
            <Link href="/pm-schedule" className="text-xs" style={{ color: "var(--brand)" }}>
              ดูทั้งหมด →
            </Link>
          </div>
          {stats.upcomingPMs.length === 0 ? (
            <EmptyState title="ไม่มี PM ที่จะถึง" icon={CalendarCheck} />
          ) : (
            <div>
              {stats.upcomingPMs.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-start gap-3 px-4 py-2.5"
                  style={{ borderBottom: "0.5px solid var(--line)" }}
                >
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    <CalendarCheck size={12} style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" style={{ color: "var(--text)" }}>
                      {pm.assetName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                      {pm.assetCode} · {pm.frequency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "var(--warning)" }}>
                      {pm.nextDueDate ? formatDate(pm.nextDueDate) : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="panel-border h-48 animate-pulse" style={{ background: "var(--panel-2)" }} />
  );
}
