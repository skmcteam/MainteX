"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { createPMPlan } from "@/app/(app)/pm-schedule/actions";
import type { PMFormData } from "@/app/(app)/pm-schedule/actions";

const schema = z.object({
  assetId: z.string().min(1, "กรุณาเลือกอุปกรณ์"),
  frequencyId: z.string().min(1, "กรุณาเลือกความถี่"),
  checklistTemplateId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  leadTimeDays: z.string().min(1),
  nextDueDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  formData: PMFormData;
}

export function PMFormModal({ open, onClose, formData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leadTimeDays: "7", assetId: "", frequencyId: "" },
  });

  const filteredAssets = assetSearch.trim()
    ? formData.assets.filter(
        (a) =>
          a.code.toLowerCase().includes(assetSearch.toLowerCase()) ||
          a.nameTh.toLowerCase().includes(assetSearch.toLowerCase())
      )
    : formData.assets.slice(0, 50);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await createPMPlan({
        ...values,
        leadTimeDays: Number(values.leadTimeDays) || 7,
      });
      toast.success("สร้างแผน PM สำเร็จ");
      reset();
      setAssetSearch("");
      onClose();
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setAssetSearch("");
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-6"
          style={{
            background: "var(--panel)",
            border: "0.5px solid var(--line)",
            maxHeight: "90vh",
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              สร้างแผน PM ใหม่
            </Dialog.Title>
            <button onClick={handleClose} aria-label="ปิด"
              className="rounded-lg p-1.5" style={{ color: "var(--text-sub)" }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Asset */}
            <Field label="อุปกรณ์ *" error={errors.assetId?.message}>
              <div className="relative mb-1">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }} />
                <input
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="ค้นหารหัส / ชื่ออุปกรณ์..."
                  className="form-input pl-7"
                />
              </div>
              <select {...register("assetId")} className="form-input" size={4}>
                <option value="">— เลือกอุปกรณ์ —</option>
                {filteredAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.nameTh}
                  </option>
                ))}
              </select>
            </Field>

            {/* Frequency */}
            <Field label="ความถี่ *" error={errors.frequencyId?.message}>
              <select {...register("frequencyId")} className="form-input">
                <option value="">— เลือกความถี่ —</option>
                {formData.frequencies.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nameTh} ({f.code})
                  </option>
                ))}
              </select>
            </Field>

            {/* Checklist Template */}
            <Field label="Checklist Template">
              <select {...register("checklistTemplateId")} className="form-input">
                <option value="">— ไม่ระบุ —</option>
                {formData.templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameTh}
                  </option>
                ))}
              </select>
            </Field>

            {/* Assignee + Lead time */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="ผู้รับผิดชอบ">
                <select {...register("assigneeId")} className="form-input">
                  <option value="">— ไม่ระบุ —</option>
                  {formData.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nameTh}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="แจ้งล่วงหน้า (วัน)">
                <input {...register("leadTimeDays")} type="number" min="0" className="form-input" />
              </Field>
            </div>

            {/* Next due date */}
            <Field label="วันที่ PM ครั้งถัดไป">
              <input {...register("nextDueDate")} type="date" className="form-input" />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-xs font-medium"
                style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                style={{ background: "var(--brand)" }}
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                บันทึก
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>{label}</label>
      {children}
      {error && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
