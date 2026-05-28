"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Plus, Package, AlertTriangle, ArrowUpDown, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { SimpleFormModal } from "@/components/admin/simple-form-modal";
import { createSparePart, updateSparePart, adjustStock } from "@/app/(app)/spare-parts/actions";
import type { SparePartRow, PartsFormData } from "@/app/(app)/spare-parts/actions";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";

interface Props {
  data: SparePartRow[];
  formData: PartsFormData;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  initialQ: string;
  initialTab: string;
  lowStockCount: number;
}

export function PartsClient({ data, formData, total, page, totalPages, initialQ, initialTab, lowStockCount }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialQ);
  const [tab, setTab] = useState(initialTab);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPart, setEditPart] = useState<SparePartRow | null>(null);
  const [adjustPart, setAdjustPart] = useState<SparePartRow | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pushParams = (overrides: { q?: string; tab?: string; page?: number }) => {
    const params = new URLSearchParams();
    const q = overrides.q ?? search;
    const tb = overrides.tab ?? tab;
    const p = overrides.page ?? 1;
    if (q) params.set("q", q);
    if (tb !== "all") params.set("tab", tb);
    if (p > 1) params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ q: value, page: 1 }), 350);
  };

  const handleTabChange = (tb: string) => {
    setTab(tb);
    pushParams({ tab: tb, page: 1 });
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const TABS = [
    { key: "all", label: t("common.all") },
    { key: "low", label: t("parts.lowStock") },
  ];

  const COLUMNS = [
    t("parts.columns.codeAndName"), t("parts.columns.partNo"), t("parts.columns.unit"),
    t("parts.columns.stockOnHand"), t("parts.columns.reorderPoint"), t("parts.columns.unitCost"),
    t("parts.columns.location"), "",
  ];

  const toFields = (fd: PartsFormData) => [
    { key: "code", label: `${t("parts.code")} *`, required: true, placeholder: "SP-HY-001" },
    { key: "nameTh", label: `${t("common.name")} (TH) *`, required: true, placeholder: "ซีลไฮดรอลิก 50mm" },
    { key: "nameEn", label: `${t("common.name")} (EN) *`, required: true, placeholder: "Hydraulic Seal 50mm" },
    { key: "partNumber", label: "Part Number", placeholder: "SKF-6205" },
    { key: "unitId", label: t("parts.unit"), type: "select" as const, options: fd.units.map((u) => ({ value: u.id, label: `${u.code} — ${u.nameTh}` })) },
    { key: "supplierId", label: t("parts.supplier"), type: "select" as const, options: fd.suppliers.map((s) => ({ value: s.id, label: s.nameTh })) },
    { key: "shelfLocation", label: t("parts.location"), placeholder: "A-01" },
    { key: "reorderPoint", label: `${t("parts.reorderPoint")} *`, required: true, type: "number" as const, placeholder: "5" },
    { key: "unitCost", label: `${t("parts.unitCost")} (THB)`, type: "number" as const, placeholder: "0" },
  ];

  return (
    <>
      <div className="panel-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
          <div className="flex flex-1 items-center gap-1">
            {TABS.map((tb) => (
              <button
                key={tb.key}
                onClick={() => handleTabChange(tb.key)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ background: tab === tb.key ? "var(--brand)" : "transparent", color: tab === tb.key ? "#fff" : "var(--text-sub)" }}
              >
                {tb.label}
                <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]" style={{
                  background: tab === tb.key ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                  color: tab === tb.key ? "#fff" : tb.key === "low" && lowStockCount > 0 ? "var(--danger)" : "var(--text-sub)",
                }}>
                  {tb.key === "low" ? lowStockCount : total}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }} />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("common.search")}
                aria-label={t("common.search")}
                className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
                style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "180px" }}
              />
            </div>
            <button
              onClick={() => downloadCSV(`spare-parts-${new Date().toISOString().slice(0, 10)}.csv`, data.map((r) => ({
                [t("parts.code")]: r.code,
                [t("common.name")]: r.nameTh,
                "Part No": r.partNumber ?? "",
                [t("parts.unit")]: r.unit?.code ?? "",
                [t("parts.stockOnHand")]: r.stockOnHand,
                [t("parts.reorderPoint")]: r.reorderPoint,
                [t("parts.unitCost")]: r.unitCost ?? "",
                [t("parts.location")]: r.shelfLocation ?? "",
              })))}
              aria-label="CSV"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white active:scale-95"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={13} /> {t("parts.add")}
            </button>
          </div>
        </div>

        {/* Table */}
        {data.length === 0 ? (
          <EmptyState icon={Package} title={t("parts.empty")} />
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
                {data.map((part) => (
                  <tr key={part.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {part.isLowStock && <AlertTriangle size={12} style={{ color: "var(--danger)", flexShrink: 0 }} aria-label={t("parts.lowStock")} />}
                        <div>
                          <p className="font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{part.code}</p>
                          <p style={{ color: "var(--text)" }}>{part.nameTh}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.partNumber ?? "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.unit?.code ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold" style={{ color: part.isLowStock ? "var(--danger)" : "var(--text)" }}>{formatNumber(part.stockOnHand)}</span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{formatNumber(part.reorderPoint)}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.unitCost ? formatCurrency(part.unitCost) : "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.shelfLocation ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setAdjustPart(part)}
                          aria-label={`${t("parts.adjustStock")} ${part.code}`}
                          className="rounded-md px-2 py-1 text-[10px] font-medium"
                          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                        >
                          <ArrowUpDown size={11} className="inline mr-1" />{t("parts.adjustStock")}
                        </button>
                        <button
                          onClick={() => setEditPart(part)}
                          aria-label={`${t("common.edit")} ${part.code}`}
                          className="rounded-md px-2 py-1 text-[10px] font-medium"
                          style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}
                        >
                          {t("common.edit")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: count + pagination */}
        {data.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ color: "var(--text-sub)", borderTop: "0.5px solid var(--line)" }}>
            <span>
              {t("common.showing")} {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} {t("common.of")} {total} · {t("parts.totalValue")} {formatCurrency(data.reduce((s, r) => s + r.stockOnHand * (r.unitCost ?? 0), 0))}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => pushParams({ page: page - 1 })} disabled={page <= 1} aria-label={t("common.previous")} className="flex h-7 w-7 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: "0.5px solid var(--line)" }}>
                  <ChevronLeft size={13} />
                </button>
                <span style={{ color: "var(--text)" }}>{page} / {totalPages}</span>
                <button onClick={() => pushParams({ page: page + 1 })} disabled={page >= totalPages} aria-label={t("common.next")} className="flex h-7 w-7 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: "0.5px solid var(--line)" }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <SimpleFormModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); router.refresh(); }}
        title={t("parts.addNew")}
        fields={toFields(formData)}
        onSave={async (v) => {
          await createSparePart({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), partNumber: String(v.partNumber || "") || null, unitId: String(v.unitId || "") || null, supplierId: String(v.supplierId || "") || null, warehouseId: null, shelfLocation: String(v.shelfLocation || "") || null, reorderPoint: Number(v.reorderPoint || 0), unitCost: Number(v.unitCost || 0) || null });
        }}
      />

      {editPart && (
        <SimpleFormModal
          open={!!editPart}
          onClose={() => { setEditPart(null); router.refresh(); }}
          title={t("parts.editTitle", { code: editPart.code })}
          fields={toFields(formData)}
          defaultValues={{ code: editPart.code, nameTh: editPart.nameTh, nameEn: editPart.nameEn, partNumber: editPart.partNumber ?? "", unitId: editPart.unit ? formData.units.find((u) => u.code === editPart.unit?.code)?.id ?? "" : "", supplierId: editPart.supplier ? formData.suppliers.find((s) => s.code === editPart.supplier?.code)?.id ?? "" : "", shelfLocation: editPart.shelfLocation ?? "", reorderPoint: editPart.reorderPoint, unitCost: editPart.unitCost ?? "" }}
          onSave={async (v) => { await updateSparePart(editPart.id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), partNumber: String(v.partNumber || "") || null, unitId: String(v.unitId || "") || null, supplierId: String(v.supplierId || "") || null, warehouseId: null, shelfLocation: String(v.shelfLocation || "") || null, reorderPoint: Number(v.reorderPoint || 0), unitCost: Number(v.unitCost || 0) || null }); }}
        />
      )}

      {adjustPart && (
        <StockAdjustDialog part={adjustPart} onClose={() => { setAdjustPart(null); router.refresh(); }} />
      )}
    </>
  );
}

function StockAdjustDialog({ part, onClose }: { part: SparePartRow; onClose: () => void }) {
  const t = useTranslations();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const d = Number(delta);
    if (isNaN(d) || d === 0) { toast.error(t("parts.adjustError")); return; }
    setLoading(true);
    try {
      await adjustStock({ sparePartId: part.id, delta: d, reason });
      toast.success(t("parts.adjustSuccess", { delta: `${d > 0 ? "+" : ""}${d}` }));
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.noData"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-6"
          style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t("parts.adjustStock")}</Dialog.Title>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>{part.code} · {part.nameTh}</p>
              <p className="mt-1 text-xs font-semibold" style={{ color: "var(--brand)" }}>
                {t("parts.currentStock", { count: formatNumber(part.stockOnHand), unit: part.unit?.code ?? "" })}
              </p>
            </div>
            <button onClick={onClose} aria-label={t("common.close")} style={{ color: "var(--text-sub)" }}><X size={16} /></button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>{t("parts.adjustQty")}</label>
              <input type="number" step="1" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+10" className="form-input" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>{t("parts.reason")}</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="form-input" />
            </div>
            {delta && !isNaN(Number(delta)) && Number(delta) !== 0 && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--panel-2)" }}>
                {t("parts.afterAdjust", { count: formatNumber(part.stockOnHand + Number(delta)), unit: part.unit?.code ?? "" })}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-medium" style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>
                {t("common.cancel")}
              </button>
              <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
                {loading && <Loader2 size={13} className="animate-spin" />}{t("common.save")}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
