import { Settings } from "lucide-react";
export default function Page() {
  return (
    <div>
      <h1 className="text-[17px] font-semibold mb-4" style={{ color: "var(--text)" }}>sections</h1>
      <div className="panel-border p-8 text-center" style={{ color: "var(--text-sub)" }}>
        <Settings size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Phase 3 — Admin CRUD: sections</p>
      </div>
    </div>
  );
}
