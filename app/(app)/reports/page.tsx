import {
  getWOByMonth,
  getTopBadActors,
  getCostByDepartment,
  getPMComplianceByMonth,
  getCalibrationSummary,
  getReportKPIs,
} from "./actions";
import {
  WOByMonthChart,
  BadActorsChart,
  CostByDeptChart,
  PMComplianceChart,
  CalibrationStatusChart,
} from "./report-charts";
import { StatCard } from "@/components/shared/stat-card";
import { ClipboardList, Cpu, Activity, Timer, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
  const [kpis, woByMonth, badActors, costByDept, pmCompliance, calSummary] =
    await Promise.all([
      getReportKPIs(),
      getWOByMonth(),
      getTopBadActors(),
      getCostByDepartment(),
      getPMComplianceByMonth(),
      getCalibrationSummary(),
    ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          รายงานและวิเคราะห์
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          ข้อมูล 12 เดือนย้อนหลัง · Real-time
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="WO เดือนนี้" value={kpis.totalWOs} icon={ClipboardList} color="brand" size="sm" />
        <StatCard label="WO ที่เปิด" value={kpis.openWOs} icon={ClipboardList} color={kpis.openWOs > 5 ? "danger" : "warning"} size="sm" />
        <StatCard label="WO ปิดแล้ว" value={kpis.doneWOs} icon={CheckCircle2} color="success" size="sm" />
        <StatCard label="Asset ใช้งาน" value={kpis.activeAssets} icon={Cpu} color="cyan" size="sm" />
        <StatCard label="MTBF" value={kpis.mtbf} unit="ชม." icon={Activity} color="brand" size="sm" />
        <StatCard label="MTTR" value={kpis.mttr} unit="ชม." icon={Timer} color={kpis.mttr > 4 ? "warning" : "brand"} size="sm" />
        <StatCard label="Availability" value={`${kpis.availability}%`} icon={CheckCircle2} color={kpis.availability >= 95 ? "success" : "warning"} size="sm" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* WO by month — full width */}
        <div className="panel-border p-4 lg:col-span-2">
          <ChartHeader title="ใบสั่งซ่อมรายเดือน (12 เดือน)" sub="จำแนกตามประเภทงาน" />
          <WOByMonthChart data={woByMonth} />
        </div>

        {/* Bad actors */}
        <div className="panel-border p-4">
          <ChartHeader title="อุปกรณ์ที่ซ่อมบ่อยที่สุด" sub="Top 10 by WO count" />
          {badActors.length === 0
            ? <Empty msg="ยังไม่มีข้อมูลใบสั่งซ่อม" />
            : <BadActorsChart data={badActors} />}
        </div>

        {/* Cost by dept */}
        <div className="panel-border p-4">
          <ChartHeader title="ต้นทุนตามแผนก" sub="ค่าแรง + ค่าอะไหล่ (12 เดือน)" />
          <CostByDeptChart data={costByDept} />
        </div>

        {/* PM Compliance */}
        <div className="panel-border p-4">
          <ChartHeader title="PM Compliance" sub="อัตราเสร็จงาน PM ต่อเดือน (เป้าหมาย 80%)" />
          <PMComplianceChart data={pmCompliance} />
        </div>

        {/* Calibration pie */}
        <div className="panel-border p-4">
          <ChartHeader title="สถานะการสอบเทียบ" sub={`เครื่องมือวัด ${calSummary.reduce((s, d) => s + d.value, 0)} รายการ`} />
          <CalibrationStatusChart data={calSummary} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {calSummary.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--panel-2)" }}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs" style={{ color: "var(--text-sub)" }}>{s.label}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bad actors detail table */}
      {badActors.length > 0 && (
        <div className="panel-border overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>รายละเอียดอุปกรณ์ที่ซ่อมบ่อย</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {["#", "รหัส", "ชื่อ", "หมวด", "WO ทั้งหมด", "WO เปิด"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {badActors.map((a, i) => (
                  <tr key={a.code} style={{ borderBottom: "0.5px solid var(--line)" }}>
                    <td className="px-4 py-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ background: i < 3 ? "var(--danger-soft)" : "var(--panel-2)", color: i < 3 ? "var(--danger)" : "var(--text-sub)" }}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{a.code}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text)" }}>{a.nameTh}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{a.category}</td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "var(--text)" }}>{a.woCount}</td>
                    <td className="px-4 py-2.5">
                      {a.openCount > 0 ? (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                          {a.openCount}
                        </span>
                      ) : <span style={{ color: "var(--text-sub)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</p>
      {sub && <p className="text-[11px]" style={{ color: "var(--text-sub)" }}>{sub}</p>}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="flex h-36 items-center justify-center text-xs" style={{ color: "var(--text-sub)" }}>{msg}</div>;
}
