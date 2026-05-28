"use client";

import { useState, useMemo } from "react";
import { Plus, Search, CalendarCheck, ChevronRight, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AssetStatusPill } from "@/components/shared/status-pill";
import { PMFormModal } from "./pm-form-modal";
import { formatDate, daysUntil } from "@/lib/utils";
import type { PMRow, PMFormData } from "@/app/(app)/pm-schedule/actions";

const FILTER_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "overdue", label: "เกินกำหนด" },
  { key: "due_soon", label: "ใกล้ถึงกำหนด" },
  { key: "normal", label: "ปกติ" },
];

interface Props {
  data: PMRow[];
  formData: PMFormData;
}

function getDueStatus(nextDueDate: string | null): "overdue" | "due_soon" | "normal" {
  const days = daysUntil(nextDueDate);
  if (days == null) return "normal";
  if (days < 0) return "overdue";
  if (days <= 14) return "due_soon";
  return "normal";
}

export function PMList({ data, formData }: Props) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = data;
    if (tab === "overdue") rows = rows.filter((r) => getDueStatus(r.nextDueDate) === "overdue");
    else if (tab === "due_soon") rows = rows.filter((r) => getDueStatus(r.nextDueDate) === "due_soon");
    else if (tab === "normal") rows = rows.filter((r) => getDueStatus(r.nextDueDate) === "normal");

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.asset.code.toLowerCase().includes(q) ||
          r.asset.nameTh.toLowerCase().includes(q) ||
          r.frequency.nameTh.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, tab, search]);

  const counts = useMemo(() => ({
    all: data.length,
    overdue: data.filter((r) => getDueStatus(r.nextDueDate) === "overdue").length,
    due_soon: data.filter((r) => getDueStatus(r.nextDueDate) === "due_soon").length,
    normal: data.filter((r) => getDueStatus(r.nextDueDate) === "normal").length,
  }), [data]);

  return (
    <>
      <div className="panel-border overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-3"
          style={{ borderBottom: "0.5px solid var(--line)" }}
        >
          <div className="flex flex-1 items-center gap-1 overflow-x-auto">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: tab === t.key ? "var(--brand)" : "transparent",
                  color: tab === t.key ? "#fff" : "var(--text-sub)",
                }}
              >
                {t.label}
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                  style={{
                    background: tab === t.key ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                    color: tab === t.key ? "#fff" : "var(--text-sub)",
                  }}
                >
                  {counts[t.key as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา..."
                className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
                style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "160px" }}
              />
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white active:scale-95"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={13} />
              สร้างแผน PM
            </button>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="ไม่พบแผน PM" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {["อุปกรณ์", "สถานะ", "ความถี่", "Checklist", "ถัดไป", "ล่าสุด", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((pm) => {
                  const dueStatus = getDueStatus(pm.nextDueDate);
                  const days = daysUntil(pm.nextDueDate);
                  return (
                    <tr key={pm.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: "var(--text)" }}>
                          {pm.asset.code}
                        </p>
                        <p style={{ color: "var(--text-sub)" }}>{pm.asset.nameTh}</p>
                        {pm.asset.department?.nameTh && (
                          <p style={{ color: "var(--text-sub)" }}>{pm.asset.department.nameTh}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AssetStatusPill status={pm.asset.status} />
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                        {pm.frequency.nameTh}
                        {pm.frequency.intervalDays && (
                          <p style={{ color: "var(--text-sub)" }}>ทุก {pm.frequency.intervalDays} วัน</p>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>
                        {pm.checklistTemplate?.nameTh ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {pm.nextDueDate ? (
                          <div className="flex items-center gap-1.5">
                            {dueStatus === "overdue" && (
                              <AlertTriangle size={12} style={{ color: "var(--danger)" }} />
                            )}
                            <div>
                              <p
                                className="font-medium"
                                style={{
                                  color:
                                    dueStatus === "overdue"
                                      ? "var(--danger)"
                                      : dueStatus === "due_soon"
                                      ? "var(--warning)"
                                      : "var(--text)",
                                }}
                              >
                                {formatDate(pm.nextDueDate)}
                              </p>
                              {days != null && (
                                <p style={{ color: "var(--text-sub)" }}>
                                  {days < 0
                                    ? `เกินกำหนด ${Math.abs(days)} วัน`
                                    : days === 0
                                    ? "วันนี้"
                                    : `อีก ${days} วัน`}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-sub)" }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>
                        {formatDate(pm.lastDoneDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight size={14} style={{ color: "var(--text-sub)" }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-4 py-2 text-xs" style={{ color: "var(--text-sub)", borderTop: "0.5px solid var(--line)" }}>
            แสดง {filtered.length} รายการ
          </div>
        )}
      </div>

      <PMFormModal open={modalOpen} onClose={() => setModalOpen(false)} formData={formData} />
    </>
  );
}
