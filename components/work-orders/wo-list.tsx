"use client";

import { useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslations } from "next-intl";

const TABS = [
  { key: "all", labelTh: "ทั้งหมด" },
  { key: "OPEN", labelTh: "เปิด" },
  { key: "IN_PROGRESS", labelTh: "กำลังดำเนินการ" },
  { key: "ON_HOLD", labelTh: "พัก" },
  { key: "DONE", labelTh: "เสร็จสิ้น" },
];

export function WorkOrderList() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const t = useTranslations();

  return (
    <div className="panel-border overflow-hidden">
      {/* Tabs */}
      <div
        className="flex items-center gap-1 overflow-x-auto px-4 pt-3"
        style={{ borderBottom: "0.5px solid var(--line)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-shrink-0 rounded-t px-3 pb-2 text-xs font-medium transition-all"
            style={{
              color: activeTab === tab.key ? "var(--brand)" : "var(--text-sub)",
              borderBottom: activeTab === tab.key ? "2px solid var(--brand)" : "2px solid transparent",
            }}
          >
            {tab.labelTh}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 pb-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-sub)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
              style={{
                background: "var(--panel-2)",
                border: "0.5px solid var(--line)",
                color: "var(--text)",
                outline: "none",
                width: "160px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Empty state placeholder — real data will be loaded by React Query in Phase 2 */}
      <div className="px-4 py-2 text-xs" style={{ color: "var(--text-sub)" }}>
        กำลังโหลดข้อมูล... (Phase 2 จะเพิ่ม React Query hooks)
      </div>

      <EmptyState
        icon={ClipboardList}
        title="ยังไม่มีใบสั่งซ่อม"
        description="สร้างใบสั่งซ่อมแรกของคุณเพื่อเริ่มต้น"
      />
    </div>
  );
}
