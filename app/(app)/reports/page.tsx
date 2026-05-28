import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>รายงาน</h1>
      <div className="mt-4 panel-border p-8 text-center" style={{ color: "var(--text-sub)" }}>
        <BarChart3 size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Phase 3 — Reports &amp; History</p>
      </div>
    </div>
  );
}
