"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateWOStatus, getClosureFormData } from "@/app/(app)/work-orders/actions";
import { useEffect } from "react";

const schema = z.object({
  laborHours: z.coerce.number().min(0).optional(),
  failureCodeId: z.string().optional().nullable(),
  causeCodeId: z.string().optional().nullable(),
  actionCodeId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;
type ClosureData = Awaited<ReturnType<typeof getClosureFormData>>;

interface Props {
  open: boolean;
  onClose: () => void;
  woId: string;
  woNumber: string;
}

export function WOCloseDialog({ open, onClose, woId, woNumber }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<ClosureData | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open && !codes) {
      getClosureFormData().then(setCodes);
    }
  }, [open, codes]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await updateWOStatus(woId, "DONE", {
        laborHours: values.laborHours,
        failureCodeId: values.failureCodeId ?? undefined,
        causeCodeId: values.causeCodeId ?? undefined,
        actionCodeId: values.actionCodeId ?? undefined,
        notes: values.notes ?? undefined,
      });
      toast.success("ปิดใบสั่งซ่อมสำเร็จ");
      reset();
      onClose();
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6"
          style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                ปิดใบสั่งซ่อม
              </Dialog.Title>
              <p className="mt-0.5 font-mono-num text-xs" style={{ color: "var(--text-sub)" }}>
                {woNumber}
              </p>
            </div>
            <button onClick={onClose} style={{ color: "var(--text-sub)" }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label="ชั่วโมงแรงงาน">
              <input {...register("laborHours")} type="number" step="0.5" min="0" placeholder="0.0" className="form-input" />
            </Field>

            <div className="grid grid-cols-1 gap-3">
              <Field label="รหัสความเสียหาย">
                <select {...register("failureCodeId")} className="form-input">
                  <option value="">— ไม่ระบุ —</option>
                  {codes?.failureCodes.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.nameTh}</option>
                  ))}
                </select>
              </Field>
              <Field label="รหัสสาเหตุ">
                <select {...register("causeCodeId")} className="form-input">
                  <option value="">— ไม่ระบุ —</option>
                  {codes?.causeCodes.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.nameTh}</option>
                  ))}
                </select>
              </Field>
              <Field label="รหัสการแก้ไข">
                <select {...register("actionCodeId")} className="form-input">
                  <option value="">— ไม่ระบุ —</option>
                  {codes?.actionCodes.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.nameTh}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="หมายเหตุ">
              <textarea {...register("notes")} rows={2} className="form-input resize-none" placeholder="สรุปการซ่อม..." />
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-medium"
                style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>
                ยกเลิก
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                style={{ background: "var(--success)" }}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                ปิดงาน
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>{label}</label>
      {children}
    </div>
  );
}
