"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Package, AlertTriangle, ArrowUpDown, Download } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { SimpleFormModal } from "@/components/admin/simple-form-modal";
import { createSparePart, updateSparePart, adjustStock } from "@/app/(app)/spare-parts/actions";
import type { SparePartRow, PartsFormData } from "@/app/(app)/spare-parts/actions";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";

const TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "low", label: "สต็อกต่ำ" },
];

interface Props {
  data: SparePartRow[];
  formData: PartsFormData;
}

export function PartsClient({ data, formData }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editPart, setEditPart] = useState<SparePartRow | null>(null);
  const [adjustPart, setAdjustPart] = useState<SparePartRow | null>(null);

  const filtered = useMemo(() => {
    let rows = tab === "low" ? data.filter((r) => r.isLowStock) : data;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.code.toLowerCase().includes(q) || r.nameTh.toLowerCase().includes(q) || (r.partNumber ?? "").toLowerCase().includes(q));
    }
    return rows;
  }, [data, tab, search]);

  const counts = { all: data.length, low: data.filter((r) => r.isLowStock).length };

  const toFields = (formData: PartsFormData) => [
    { key: "code", label: "รหัส *", required: true, placeholder: "SP-HY-001" },
    { key: "nameTh", label: "ชื่อภาษาไทย *", required: true, placeholder: "ซีลไฮดรอลิก 50mm" },
    { key: "nameEn", label: "ชื่อภาษาอังกฤษ *", required: true, placeholder: "Hydraulic Seal 50mm" },
    { key: "partNumber", label: "Part Number", placeholder: "SKF-6205" },
    { key: "unitId", label: "หน่วย", type: "select" as const, options: formData.units.map((u) => ({ value: u.id, label: `${u.code} — ${u.nameTh}` })) },
    { key: "supplierId", label: "ผู้จำหน่าย", type: "select" as const, options: formData.suppliers.map((s) => ({ value: s.id, label: s.nameTh })) },
    { key: "shelfLocation", label: "ที่เก็บ", placeholder: "A-01" },
    { key: "reorderPoint", label: "จุดสั่งซื้อ", type: "number" as const, placeholder: "5" },
    { key: "unitCost", label: "ราคาต่อหน่วย (บาท)", type: "number" as const, placeholder: "0" },
  ];

  return (
    <>
      <div className="panel-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
          <div className="flex flex-1 items-center gap-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ background: tab === t.key ? "var(--brand)" : "transparent", color: tab === t.key ? "#fff" : "var(--text-sub)" }}>
                {t.label}
                <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                  style={{ background: tab === t.key ? "rgba(255,255,255,0.25)" : "var(--panel-2)", color: tab === t.key ? "#fff" : counts[t.key as keyof typeof counts] > 0 && t.key === "low" ? "var(--danger)" : "var(--text-sub)" }}>
                  {counts[t.key as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหารหัส / ชื่อ..."
                className="rounded-lg py-1.5 pl-7 pr-3 text-xs" style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "180px" }} />
            </div>
            <button
              onClick={() => downloadCSV(`spare-parts-${new Date().toISOString().slice(0,10)}.csv`, filtered.map((r) => ({ รหัส: r.code, ชื่อ: r.nameTh, "Part No": r.partNumber ?? "", หน่วย: r.unit?.code ?? "", คงเหลือ: r.stockOnHand, จุดสั่งซื้อ: r.reorderPoint, ราคา: r.unitCost ?? "", ที่เก็บ: r.shelfLocation ?? "" })))}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white active:scale-95"
              style={{ background: "var(--brand)" }}>
              <Plus size={13} /> เพิ่มอะไหล่
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="ไม่พบอะไหล่" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {["รหัส / ชื่อ", "Part No.", "หน่วย", "คงเหลือ", "จุดสั่งซื้อ", "ราคา/หน่วย", "ที่เก็บ", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((part) => (
                  <tr key={part.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {part.isLowStock && <AlertTriangle size={12} style={{ color: "var(--danger)", flexShrink: 0 }} />}
                        <div>
                          <p className="font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{part.code}</p>
                          <p style={{ color: "var(--text)" }}>{part.nameTh}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.partNumber ?? "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.unit?.code ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold" style={{ color: part.isLowStock ? "var(--danger)" : "var(--text)" }}>
                        {formatNumber(part.stockOnHand)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{formatNumber(part.reorderPoint)}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.unitCost ? formatCurrency(part.unitCost) : "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{part.shelfLocation ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setAdjustPart(part)}
                          className="rounded-md px-2 py-1 text-[10px] font-medium"
                          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                          <ArrowUpDown size={11} className="inline mr-1" />ปรับสต็อก
                        </button>
                        <button onClick={() => setEditPart(part)}
                          className="rounded-md px-2 py-1 text-[10px] font-medium"
                          style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>
                          แก้ไข
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-2 text-xs" style={{ color: "var(--text-sub)", borderTop: "0.5px solid var(--line)" }}>
            แสดง {filtered.length} รายการ · มูลค่ารวม {formatCurrency(filtered.reduce((s, r) => s + r.stockOnHand * (r.unitCost ?? 0), 0))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <SimpleFormModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); router.refresh(); }}
        title="เพิ่มอะไหล่ใหม่"
        fields={toFields(formData)}
        onSave={async (v) => { await createSparePart({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), partNumber: String(v.partNumber || "") || null, unitId: String(v.unitId || "") || null, supplierId: String(v.supplierId || "") || null, warehouseId: null, shelfLocation: String(v.shelfLocation || "") || null, reorderPoint: Number(v.reorderPoint || 0), unitCost: Number(v.unitCost || 0) || null }); }}
      />

      {/* Edit modal */}
      {editPart && (
        <SimpleFormModal
          open={!!editPart}
          onClose={() => { setEditPart(null); router.refresh(); }}
          title={`แก้ไข ${editPart.code}`}
          fields={toFields(formData)}
          defaultValues={{ code: editPart.code, nameTh: editPart.nameTh, nameEn: editPart.nameEn, partNumber: editPart.partNumber ?? "", unitId: editPart.unit ? formData.units.find((u) => u.code === editPart.unit?.code)?.id ?? "" : "", supplierId: editPart.supplier ? formData.suppliers.find((s) => s.code === editPart.supplier?.code)?.id ?? "" : "", shelfLocation: editPart.shelfLocation ?? "", reorderPoint: editPart.reorderPoint, unitCost: editPart.unitCost ?? "" }}
          onSave={async (v) => { await updateSparePart(editPart.id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), partNumber: String(v.partNumber || "") || null, unitId: String(v.unitId || "") || null, supplierId: String(v.supplierId || "") || null, warehouseId: null, shelfLocation: String(v.shelfLocation || "") || null, reorderPoint: Number(v.reorderPoint || 0), unitCost: Number(v.unitCost || 0) || null }); }}
        />
      )}

      {/* Adjust stock dialog */}
      {adjustPart && (
        <StockAdjustDialog
          part={adjustPart}
          onClose={() => { setAdjustPart(null); router.refresh(); }}
        />
      )}
    </>
  );
}

function StockAdjustDialog({ part, onClose }: { part: SparePartRow; onClose: () => void }) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const d = Number(delta);
    if (isNaN(d) || d === 0) { toast.error("กรุณาระบุจำนวน"); return; }
    setLoading(true);
    try {
      await adjustStock({ sparePartId: part.id, delta: d, reason });
      toast.success(`ปรับสต็อก ${d > 0 ? "+" : ""}${d} สำเร็จ`);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl" style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>ปรับสต็อก</Dialog.Title>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>{part.code} · {part.nameTh}</p>
              <p className="mt-1 text-xs font-semibold" style={{ color: "var(--brand)" }}>คงเหลือปัจจุบัน: {formatNumber(part.stockOnHand)} {part.unit?.code ?? ""}</p>
            </div>
            <button onClick={onClose} style={{ color: "var(--text-sub)" }}><X size={16} /></button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>จำนวนที่ปรับ (+ รับเข้า / - จ่ายออก) *</label>
              <input type="number" step="1" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+10 หรือ -5" className="form-input" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>เหตุผล</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="รับของเข้าคลัง / ใช้งานซ่อม..." className="form-input" />
            </div>
            {delta && !isNaN(Number(delta)) && Number(delta) !== 0 && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--panel-2)" }}>
                หลังปรับ: <strong style={{ color: "var(--brand)" }}>{formatNumber(part.stockOnHand + Number(delta))} {part.unit?.code ?? ""}</strong>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-medium" style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
                {loading && <Loader2 size={13} className="animate-spin" />}บันทึก
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
