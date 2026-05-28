"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { addPartToWO, removePartFromWO } from "@/app/(app)/work-orders/actions";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type { WODetail } from "@/app/(app)/work-orders/actions";

type Part = WODetail["parts"][number];
type AvailablePart = { id: string; code: string; nameTh: string; stockOnHand: number; unitCost: number | null; unit: { code: string } | null };

interface Props {
  woId: string;
  parts: Part[];
  availableParts: AvailablePart[];
  woStatus: string;
}

export function WOPartsPanel({ woId, parts, availableParts, woStatus }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [qty, setQty] = useState("1");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canEdit = woStatus !== "DONE" && woStatus !== "CANCELLED";

  const filteredAvailable = search.trim()
    ? availableParts.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()) || p.nameTh.toLowerCase().includes(search.toLowerCase()))
    : availableParts.slice(0, 30);

  const handleAdd = async () => {
    if (!selectedPartId || !qty) return;
    setSaving(true);
    try {
      await addPartToWO({ workOrderId: woId, sparePartId: selectedPartId, quantity: Number(qty) });
      toast.success("เพิ่มอะไหล่สำเร็จ");
      setAdding(false); setSelectedPartId(""); setQty("1"); setSearch("");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await removePartFromWO(id);
      toast.success("ลบอะไหล่สำเร็จ");
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setRemoving(null);
    }
  };

  const totalCost = parts.reduce((s, p) => s + p.quantity * (p.unitCost ?? 0), 0);

  return (
    <div className="panel-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
        <div className="flex items-center gap-2">
          <Package size={14} style={{ color: "var(--brand)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            อะไหล่ที่ใช้ ({parts.length})
          </p>
          {totalCost > 0 && <span className="text-xs" style={{ color: "var(--text-sub)" }}>· {formatCurrency(totalCost)}</span>}
        </div>
        {canEdit && (
          <button onClick={() => setAdding(!adding)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            <Plus size={11} /> เพิ่มอะไหล่
          </button>
        )}
      </div>

      {/* Add part form */}
      {adding && (
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}>
          <div className="flex flex-col gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาอะไหล่..."
              className="form-input"
            />
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="form-input"
              size={4}
            >
              <option value="">— เลือกอะไหล่ —</option>
              {filteredAvailable.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.nameTh} (คงเหลือ: {formatNumber(p.stockOnHand)} {p.unit?.code ?? ""})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="จำนวน"
                className="form-input w-28"
              />
              <button onClick={handleAdd} disabled={saving || !selectedPartId}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                style={{ background: "var(--brand)" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                บันทึก
              </button>
              <button onClick={() => { setAdding(false); setSearch(""); }}
                className="rounded-lg px-3 py-1.5 text-xs" style={{ color: "var(--text-sub)" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parts list */}
      {parts.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs" style={{ color: "var(--text-sub)" }}>ยังไม่มีอะไหล่</div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--line)" }}>
          {parts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <span className="font-mono-num text-xs font-semibold" style={{ color: "var(--brand)" }}>{p.sparePart.code}</span>
                <span className="ml-2 text-xs" style={{ color: "var(--text)" }}>{p.sparePart.nameTh}</span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>{formatNumber(p.quantity)} {p.sparePart.unit?.code ?? ""}</span>
              {p.unitCost && (
                <span className="text-xs" style={{ color: "var(--text-sub)" }}>{formatCurrency(p.quantity * p.unitCost)}</span>
              )}
              {canEdit && (
                <button onClick={() => handleRemove(p.id)} disabled={removing === p.id}
                  className="rounded-md p-1 transition-colors" style={{ color: "var(--danger)" }}>
                  {removing === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
