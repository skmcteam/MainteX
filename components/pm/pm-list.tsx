"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Search, CalendarCheck, ChevronRight, AlertTriangle, Zap, Loader2, List, CalendarDays, Grid3x3 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AssetStatusPill } from "@/components/shared/status-pill";
import { PMFormModal } from "./pm-form-modal";
import { PMCalendar } from "./pm-calendar";
import { PMMatrix } from "./pm-matrix";
import { formatDate, daysUntil } from "@/lib/utils";
import type { PMRow, PMFormData } from "@/app/(app)/pm-schedule/actions";
import { generatePMWorkOrders } from "@/app/(app)/pm-schedule/actions";
import { toast } from "sonner";

const FILTER_KEYS = ["all", "overdue", "due_soon", "normal"] as const;
type ViewMode = "list" | "calendar" | "matrix";

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
  const t = useTranslations();
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generatePMWorkOrders();
      toast.success(t("pm.generateSuccess", { created: result.created, skipped: result.skipped }));
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("pm.generateError"));
    } finally {
      setGenerating(false);
    }
  };

  const filtered = useMemo(() => {
    let rows = data;
    if (tab === "overdue") rows = rows.filter((r) => getDueStatus(r.nextDueDate) === "overdue");
    else if (tab === "due_soon") rows = rows.filter((r) => getDueStatus(r.nextDueDate) === "due_soon");
    else if (tab === "normal") rows = rows.filter((r) => getDueStatus(r.nextDueDate) === "normal");
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
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

  const filterLabel = (key: string) => key === "all" ? t("common.all") : t(`pm.status.${key}`);

  const VIEW_BUTTONS: { mode: ViewMode; icon: React.ReactNode; labelKey: string }[] = [
    { mode: "list", icon: <List size={13} />, labelKey: "pm.list" },
    { mode: "calendar", icon: <CalendarDays size={13} />, labelKey: "pm.calendar" },
    { mode: "matrix", icon: <Grid3x3 size={13} />, labelKey: "pm.matrix" },
  ];

  const COLUMNS = [
    t("pm.columns.asset"), t("pm.columns.status"), t("pm.columns.frequency"),
    t("pm.columns.checklist"), t("pm.columns.nextDue"), t("pm.columns.lastDone"), "",
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="panel-border overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)" }}>
              {VIEW_BUTTONS.map(({ mode, icon, labelKey }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all"
                  style={{ background: viewMode === mode ? "var(--brand)" : "transparent", color: viewMode === mode ? "var(--on-brand)" : "var(--text-sub)" }}
                  title={t(labelKey as Parameters<typeof t>[0])}
                >
                  {icon}
                  <span className="hidden sm:inline">{t(labelKey as Parameters<typeof t>[0])}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-1 items-center gap-1 overflow-x-auto">
              {FILTER_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                  style={{ background: tab === key ? "var(--brand)" : "transparent", color: tab === key ? "var(--on-brand)" : "var(--text-sub)" }}
                >
                  {filterLabel(key)}
                  <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]" style={{
                    background: tab === key ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                    color: tab === key ? "var(--on-brand)" : "var(--text-sub)",
                  }}>
                    {counts[key]}
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
                  placeholder={t("common.search")}
                  className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
                  style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "160px" }}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white active:scale-95 disabled:opacity-60"
                style={{ background: "var(--success)" }}
              >
                {generating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                {t("pm.generateWOsBtn")}
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white active:scale-95"
                style={{ background: "var(--brand)" }}
              >
                <Plus size={13} />
                {t("pm.createPlan")}
              </button>
            </div>
          </div>

          {viewMode === "list" && (
            <>
              {filtered.length === 0 ? (
                <EmptyState icon={CalendarCheck} title={t("pm.empty")} />
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
                      {filtered.map((pm) => {
                        const dueStatus = getDueStatus(pm.nextDueDate);
                        const days = daysUntil(pm.nextDueDate);
                        return (
                          <tr key={pm.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                            <td className="px-4 py-3">
                              <p className="font-semibold" style={{ color: "var(--text)" }}>{pm.asset.code}</p>
                              <p style={{ color: "var(--text-sub)" }}>{pm.asset.nameTh}</p>
                              {pm.asset.department?.nameTh && <p style={{ color: "var(--text-sub)" }}>{pm.asset.department.nameTh}</p>}
                            </td>
                            <td className="px-4 py-3"><AssetStatusPill status={pm.asset.status} /></td>
                            <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                              {pm.frequency.nameTh}
                              {pm.frequency.intervalDays && (
                                <p style={{ color: "var(--text-sub)" }}>{t("pm.intervalDays", { days: pm.frequency.intervalDays })}</p>
                              )}
                            </td>
                            <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>{pm.checklistTemplate?.nameTh ?? "-"}</td>
                            <td className="px-4 py-3">
                              {pm.nextDueDate ? (
                                <div className="flex items-center gap-1.5">
                                  {dueStatus === "overdue" && <AlertTriangle size={12} style={{ color: "var(--danger)" }} />}
                                  <div>
                                    <p className="font-medium" style={{
                                      color: dueStatus === "overdue" ? "var(--danger)" : dueStatus === "due_soon" ? "var(--warning)" : "var(--text)",
                                    }}>
                                      {formatDate(pm.nextDueDate)}
                                    </p>
                                    {days != null && (
                                      <p style={{ color: "var(--text-sub)" }}>
                                        {days < 0 ? t("pm.daysOverdue", { days: Math.abs(days) }) : days === 0 ? t("pm.today") : t("pm.daysUntil", { days })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-sub)" }}>—</span>
                              )}
                            </td>
                            <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>{formatDate(pm.lastDoneDate)}</td>
                            <td className="px-4 py-3 text-right"><ChevronRight size={14} style={{ color: "var(--text-sub)" }} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {filtered.length > 0 && (
                <div className="px-4 py-2 text-xs" style={{ color: "var(--text-sub)", borderTop: "0.5px solid var(--line)" }}>
                  {t("pm.showing", { count: filtered.length })}
                </div>
              )}
            </>
          )}
        </div>

        {viewMode === "calendar" && <PMCalendar data={filtered} />}
        {viewMode === "matrix" && <PMMatrix data={filtered} />}
      </div>

      <PMFormModal open={modalOpen} onClose={() => setModalOpen(false)} formData={formData} />
    </>
  );
}
