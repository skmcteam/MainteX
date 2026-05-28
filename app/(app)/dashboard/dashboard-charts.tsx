"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface AssetStatusCount {
  status: string;
  count: number;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "ใช้งาน",
  INACTIVE: "ไม่ใช้งาน",
  UNDER_REPAIR: "ซ่อมบำรุง",
  RETIRED: "เลิกใช้",
  SCRAPPED: "ทิ้ง",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "var(--success)",
  INACTIVE: "var(--text-sub)",
  UNDER_REPAIR: "var(--warning)",
  RETIRED: "var(--orange)",
  SCRAPPED: "var(--danger)",
};

interface DashboardChartsProps {
  assetStatusCounts: AssetStatusCount[];
}

export function DashboardCharts({ assetStatusCounts }: DashboardChartsProps) {
  const data = assetStatusCounts
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] ?? "var(--text-sub)",
    }));

  if (data.length === 0) {
    return (
      <div
        className="panel-border flex items-center justify-center py-12"
        style={{ color: "var(--text-sub)" }}
      >
        <p className="text-sm">ยังไม่มีข้อมูลสินทรัพย์</p>
      </div>
    );
  }

  return (
    <div className="panel-border p-4">
      <p className="mb-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
        สถานะเครื่องจักร
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--panel)",
                border: "0.5px solid var(--line)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--text)",
              }}
              formatter={(value) => [value as number, ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "var(--text-sub)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
