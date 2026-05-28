"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--panel)",
    border: "0.5px solid var(--line)",
    borderRadius: "8px",
    fontSize: "11px",
    color: "var(--text)",
  },
};

// ─── WO by month stacked bar ──────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  CM: "var(--danger)",
  PM: "var(--success)",
  CALIBRATION: "var(--brand)",
  INSPECTION: "var(--cyan)",
  IMPROVEMENT: "var(--purple)",
};

const TYPE_LABELS: Record<string, string> = {
  CM: "ซ่อมแซม (CM)",
  PM: "PM",
  CALIBRATION: "สอบเทียบ",
  INSPECTION: "ตรวจสอบ",
  IMPROVEMENT: "ปรับปรุง",
};

type WOMonthData = {
  month: string;
  [key: string]: string | number;
};

export function WOByMonthChart({ data }: { data: WOMonthData[] }) {
  const types = ["CM", "PM", "CALIBRATION", "INSPECTION", "IMPROVEMENT"];
  const activeTypes = types.filter((t) => data.some((d) => (d[t] as number) > 0));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: "10px", color: "var(--text-sub)" }} formatter={(v) => TYPE_LABELS[v as string] ?? v} />
        {activeTypes.map((type) => (
          <Bar key={type} dataKey={type} stackId="a" fill={TYPE_COLORS[type]} radius={type === activeTypes[activeTypes.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Top bad actors horizontal bar ───────────────────────────

interface BadActor { code: string; nameTh: string; woCount: number; openCount: number }

export function BadActorsChart({ data }: { data: BadActor[] }) {
  const chartData = data.slice(0, 8).map((d) => ({
    name: d.code,
    label: d.nameTh.length > 18 ? d.nameTh.slice(0, 18) + "…" : d.nameTh,
    total: d.woCount,
    open: d.openCount,
    closed: d.woCount - d.openCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 32)}>
      <BarChart layout="vertical" data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--brand)" }} width={64} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => [v, n === "closed" ? "ปิดแล้ว" : "ยังเปิด"]} />
        <Bar dataKey="closed" stackId="a" fill="var(--success)" name="closed" radius={[0, 0, 0, 0]} />
        <Bar dataKey="open" stackId="a" fill="var(--danger)" name="open" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Cost by department ───────────────────────────────────────

interface CostDept { dept: string; labor: number; parts: number; total: number }

export function CostByDeptChart({ data }: { data: CostDept[] }) {
  if (data.length === 0) return <EmptyChart message="ยังไม่มีข้อมูลต้นทุน" />;
  const chartData = data.slice(0, 6).map((d) => ({
    name: d.dept.length > 12 ? d.dept.slice(0, 12) + "…" : d.dept,
    "ค่าแรง": Math.round(d.labor),
    "ค่าอะไหล่": Math.round(d.parts),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`฿${Number(v).toLocaleString("th-TH")}`, ""]} />
        <Legend wrapperStyle={{ fontSize: "10px" }} />
        <Bar dataKey="ค่าแรง" stackId="a" fill="var(--brand)" />
        <Bar dataKey="ค่าอะไหล่" stackId="a" fill="var(--warning)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── PM compliance line chart ─────────────────────────────────

interface PMCompliance { month: string; compliance: number; done: number; total: number }

export function PMComplianceChart({ data }: { data: PMCompliance[] }) {
  if (data.length === 0) return <EmptyChart message="ยังไม่มีข้อมูล PM" />;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}%`, "PM Compliance"]} />
        <ReferenceLine y={80} stroke="var(--warning)" strokeDasharray="4 2" label={{ value: "80%", fontSize: 10, fill: "var(--warning)", position: "right" }} />
        <Line type="monotone" dataKey="compliance" stroke="var(--brand)" strokeWidth={2} dot={{ fill: "var(--brand)", r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Calibration status pie ───────────────────────────────────

interface CalStatus { label: string; value: number; color: string }

export function CalibrationStatusChart({ data }: { data: CalStatus[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart message="ยังไม่มีเครื่องมือวัด" />;
  const active = data.filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={active} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
          {active.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} formatter={(v, _, p) => [v, p.payload.label]} />
        <Legend wrapperStyle={{ fontSize: "10px", color: "var(--text-sub)" }} formatter={(_, e) => (e.payload as CalStatus).label} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-xs" style={{ color: "var(--text-sub)" }}>
      {message}
    </div>
  );
}
