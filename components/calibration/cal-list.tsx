"use client";

import { useState, useMemo } from "react";
import { Search, Gauge, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { CalStatusPill } from "@/components/shared/status-pill";
import { CalFormModal } from "./cal-form-modal";
import { formatDate, daysUntil } from "@/lib/utils";
import type { CalRow } from "@/app/(app)/calibration/actions";
import type { CalibrationLab } from "@prisma/client";

const STATUS_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "OVERDUE", label: "เกินกำหนด" },
  { key: "DUE_SOON", label: "ใกล้ครบกำหนด" },
  { key: "NORMAL", label: "ปกติ" },
  { key: "none", label: "ยังไม่ระบุ" },
];

interface Props {
  data: CalRow[];
  labs: CalibrationLab[];
}

export function CalList({ data, labs }: Props) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<CalRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = data;
    if (tab === "OVERDUE") rows = rows.filter((r) => r.calStatus === "OVERDUE");
    else if (tab === "DUE_SOON") rows = rows.filter((r) => r.calStatus === "DUE_SOON");
    else if (tab === "NORMAL") rows = rows.filter((r) => r.calStatus === "NORMAL");
    else if (tab === "none") rows = rows.filter((r) => !r.calStatus);

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.nameTh.toLowerCase().includes(q) ||
          (r.instrumentType?.nameTh ?? "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, tab, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length, none: 0 };
    for (const r of data) {
      if (r.calStatus) c[r.calStatus] = (c[r.calStatus] ?? 0) + 1;
      else c.none = (c.none ?? 0) + 1;
    }
    return c;
  }, [data]);

  const openModal = (asset: CalRow) => {
    setSelectedAsset(asset);
    setModalOpen(true);
  };

  return (
    <>
      <div className="panel-border overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-3"
          style={{ borderBottom: "0.5px solid var(--line)" }}
        >
          <div className="flex flex-1 items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((t) => (
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
                  {counts[t.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
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
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState icon={Gauge} title="ไม่พบเครื่องมือวัด" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {["รหัส / ชื่อ", "ประเภท", "สถานะสอบเทียบ", "สอบเทียบล่าสุด", "ครั้งถัดไป", "รอบ (เดือน)", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const days = daysUntil(row.nextCalDate);
                  return (
                    <tr key={row.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold font-mono-num" style={{ color: "var(--brand)" }}>
                          {row.code}
                        </p>
                        <p style={{ color: "var(--text)" }}>{row.nameTh}</p>
                        {row.department?.nameTh && (
                          <p style={{ color: "var(--text-sub)" }}>{row.department.nameTh}</p>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>
                        {row.instrumentType?.nameTh ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {row.calStatus ? (
                          <CalStatusPill status={row.calStatus} />
                        ) : (
                          <span style={{ color: "var(--text-sub)" }}>ยังไม่ระบุ</span>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>
                        {formatDate(row.lastCalDate)}
                        {row.lastCalibration?.certNumber && (
                          <p style={{ color: "var(--text-sub)" }}>
                            Cert: {row.lastCalibration.certNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.nextCalDate ? (
                          <div className="flex items-center gap-1.5">
                            {row.calStatus === "OVERDUE" ? (
                              <AlertTriangle size={12} style={{ color: "var(--danger)" }} />
                            ) : row.calStatus === "DUE_SOON" ? (
                              <Clock size={12} style={{ color: "var(--warning)" }} />
                            ) : (
                              <CheckCircle2 size={12} style={{ color: "var(--success)" }} />
                            )}
                            <div>
                              <p
                                style={{
                                  color:
                                    row.calStatus === "OVERDUE"
                                      ? "var(--danger)"
                                      : row.calStatus === "DUE_SOON"
                                      ? "var(--warning)"
                                      : "var(--text)",
                                }}
                              >
                                {formatDate(row.nextCalDate)}
                              </p>
                              {days != null && (
                                <p style={{ color: "var(--text-sub)" }}>
                                  {days < 0
                                    ? `เกิน ${Math.abs(days)} วัน`
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
                        {row.calPeriodMonths ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openModal(row)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95"
                          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                        >
                          บันทึกผล
                        </button>
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

      <CalFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedAsset(null); }}
        asset={selectedAsset}
        labs={labs}
      />
    </>
  );
}
