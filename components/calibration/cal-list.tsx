"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, Gauge, AlertTriangle, CheckCircle2, Clock, Pencil } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { CalStatusPill } from "@/components/shared/status-pill";
import { CalFormModal } from "./cal-form-modal";
import { formatDate, daysUntil } from "@/lib/utils";
import type { CalRow } from "@/app/(app)/calibration/actions";
import type { CalibrationLab } from "@prisma/client";

const STATUS_KEYS = ["all", "OVERDUE", "DUE_SOON", "NORMAL", "none"] as const;

interface Props {
  data: CalRow[];
  labs: CalibrationLab[];
}

export function CalList({ data, labs }: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<CalRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  type EditTarget = { id: string; calDate: string; nextCalDate: string; certNumber?: string | null; labId?: string | null; result?: string | null; notes?: string | null };
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const statusLabel = (key: string) => {
    if (key === "all") return t("common.all");
    if (key === "none") return t("cal.status.NONE");
    return t(`cal.status.${key}` as Parameters<typeof t>[0]);
  };

  const filtered = useMemo(() => {
    let rows = data;
    if (tab === "OVERDUE") rows = rows.filter((r) => r.calStatus === "OVERDUE");
    else if (tab === "DUE_SOON") rows = rows.filter((r) => r.calStatus === "DUE_SOON");
    else if (tab === "NORMAL") rows = rows.filter((r) => r.calStatus === "NORMAL");
    else if (tab === "none") rows = rows.filter((r) => !r.calStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
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

  const COLUMNS = [
    t("cal.columns.codeAndName"), t("cal.columns.type"), t("cal.columns.calStatus"),
    t("cal.columns.lastCalDate"), t("cal.columns.nextCalDate"), t("cal.columns.period"), "",
  ];

  return (
    <>
      <div className="panel-border overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
          <div className="flex flex-1 items-center gap-1 overflow-x-auto">
            {STATUS_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{ background: tab === key ? "var(--brand)" : "transparent", color: tab === key ? "#fff" : "var(--text-sub)" }}
              >
                {statusLabel(key)}
                <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]" style={{
                  background: tab === key ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                  color: tab === key ? "#fff" : "var(--text-sub)",
                }}>
                  {counts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
              style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "160px" }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Gauge} title={t("cal.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {COLUMNS.map((h, i) => (
                    <th key={i} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const days = daysUntil(row.nextCalDate);
                  return (
                    <tr key={row.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold font-mono-num" style={{ color: "var(--brand)" }}>{row.code}</p>
                        <p style={{ color: "var(--text)" }}>{row.nameTh}</p>
                        {row.department?.nameTh && <p style={{ color: "var(--text-sub)" }}>{row.department.nameTh}</p>}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>{row.instrumentType?.nameTh ?? "-"}</td>
                      <td className="px-4 py-3">
                        {row.calStatus ? <CalStatusPill status={row.calStatus} /> : <span style={{ color: "var(--text-sub)" }}>{t("cal.notSet")}</span>}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>
                        {formatDate(row.lastCalDate)}
                        {row.lastCalibration?.certNumber && <p style={{ color: "var(--text-sub)" }}>Cert: {row.lastCalibration.certNumber}</p>}
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
                              <p style={{ color: row.calStatus === "OVERDUE" ? "var(--danger)" : row.calStatus === "DUE_SOON" ? "var(--warning)" : "var(--text)" }}>
                                {formatDate(row.nextCalDate)}
                              </p>
                              {days != null && (
                                <p style={{ color: "var(--text-sub)" }}>
                                  {days < 0 ? t("cal.daysOverdue", { days: Math.abs(days) }) : days === 0 ? t("cal.today") : t("cal.daysUntil", { days })}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-sub)" }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>{row.calPeriodMonths ?? "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {row.lastCalibration && (
                            <button
                              onClick={() => { setSelectedAsset(row); setEditTarget({ id: row.lastCalibration!.id, calDate: row.lastCalibration!.calDate, nextCalDate: row.lastCalibration!.nextCalDate, certNumber: row.lastCalibration!.certNumber, result: row.lastCalibration!.result }); setModalOpen(true); }}
                              aria-label={`แก้ไขผลสอบเทียบล่าสุด ${row.code}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-panel-2"
                              style={{ color: "var(--text-sub)" }}
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedAsset(row); setEditTarget(null); setModalOpen(true); }}
                            aria-label={`บันทึกผลสอบเทียบใหม่ ${row.code}`}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95"
                            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                          >
                            {t("cal.record")}
                          </button>
                        </div>
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
            {t("cal.showing", { count: filtered.length })}
          </div>
        )}
      </div>

      <CalFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedAsset(null); setEditTarget(null); }}
        asset={selectedAsset}
        labs={labs}
        editTarget={editTarget}
      />
    </>
  );
}
