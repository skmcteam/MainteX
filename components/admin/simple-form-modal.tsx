"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "color" | "select" | "textarea" | "checkbox";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldDef[];
  defaultValues?: Record<string, unknown>;
  onSave: (values: Record<string, string | boolean | number | null>) => Promise<void>;
}

export function SimpleFormModal({ open, onClose, title, fields, defaultValues, onSave }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean | number | null>>(
    () => {
      const init: Record<string, string | boolean | number | null> = {};
      for (const f of fields) {
        init[f.key] = (defaultValues?.[f.key] as string | boolean | number | null) ?? (f.type === "checkbox" ? false : f.type === "number" ? "" : "");
      }
      return init;
    }
  );

  const set = (key: string, val: string | boolean | number | null) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(values);
      toast.success("บันทึกสำเร็จ");
      onClose();
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-6" style={{ background: "var(--panel)", border: "0.5px solid var(--line)", maxHeight: "90vh" }}>
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</Dialog.Title>
            <button onClick={onClose} style={{ color: "var(--text-sub)" }}><X size={16} /></button>
          </div>
          <div className="flex flex-col gap-3">
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>
                  {f.label}{f.required && " *"}
                </label>
                {f.type === "select" ? (
                  <select
                    className="form-input"
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => set(f.key, e.target.value)}
                  >
                    <option value="">— เลือก —</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    className="form-input resize-none"
                    rows={2}
                    placeholder={f.placeholder}
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : f.type === "checkbox" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.key])}
                      onChange={(e) => set(f.key, e.target.checked)}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: "var(--brand)" }}
                    />
                    <span className="text-xs" style={{ color: "var(--text-sub)" }}>{f.placeholder}</span>
                  </div>
                ) : (
                  <input
                    type={f.type ?? "text"}
                    className="form-input"
                    placeholder={f.placeholder}
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} aria-label="ปิด"
              className="rounded-lg px-4 py-2 text-xs font-medium" style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
                {loading && <Loader2 size={13} className="animate-spin" />}
                บันทึก
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
