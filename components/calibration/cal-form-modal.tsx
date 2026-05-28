"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { recordCalibration, updateCalibration } from "@/app/(app)/calibration/actions";
import type { CalRow } from "@/app/(app)/calibration/actions";
import type { CalibrationLab } from "@prisma/client";

const schema = z.object({
  calDate: z.string().min(1, "กรุณาระบุวันที่สอบเทียบ"),
  nextCalDate: z.string().min(1, "กรุณาระบุวันที่สอบเทียบครั้งถัดไป"),
  certNumber: z.string().optional().nullable(),
  labId: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface EditTarget {
  id: string;
  calDate: string;
  nextCalDate: string;
  certNumber?: string | null;
  labId?: string | null;
  result?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  asset: CalRow | null;
  labs: CalibrationLab[];
  editTarget?: EditTarget | null;
}

export function CalFormModal({ open, onClose, asset, labs, editTarget }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editTarget;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Pre-fill when editing an existing record
  useEffect(() => {
    if (open && editTarget) {
      reset({
        calDate: editTarget.calDate?.split("T")[0] ?? "",
        nextCalDate: editTarget.nextCalDate?.split("T")[0] ?? "",
        certNumber: editTarget.certNumber ?? "",
        labId: editTarget.labId ?? "",
        result: editTarget.result ?? "",
        notes: editTarget.notes ?? "",
      });
    } else if (open && !editTarget) {
      reset({ calDate: "", nextCalDate: "", certNumber: "", labId: "", result: "", notes: "" });
    }
  }, [open, editTarget, reset]);

  // Auto-fill next cal date from period when creating
  const handleCalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEdit || !asset?.calPeriodMonths) return;
    const d = new Date(e.target.value);
    if (isNaN(d.getTime())) return;
    d.setMonth(d.getMonth() + asset.calPeriodMonths);
    setValue("nextCalDate", d.toISOString().split("T")[0]);
  };

  const onSubmit = async (values: FormValues) => {
    if (!asset) return;
    setLoading(true);
    try {
      if (isEdit && editTarget) {
        await updateCalibration(editTarget.id, { ...values, assetId: asset.id });
        toast.success("แก้ไขผลการสอบเทียบสำเร็จ");
      } else {
        await recordCalibration({ ...values, assetId: asset.id });
        toast.success("บันทึกผลการสอบเทียบสำเร็จ");
      }
      reset();
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
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-6"
          style={{ background: "var(--panel)", border: "0.5px solid var(--line)", maxHeight: "90vh" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {isEdit ? "แก้ไขผลการสอบเทียบ" : "บันทึกผลการสอบเทียบ"}
              </Dialog.Title>
              {asset && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
                  {asset.code} · {asset.nameTh}
                </p>
              )}
            </div>
            <button onClick={handleClose} aria-label="ปิด" className="rounded-lg p-1.5" style={{ color: "var(--text-sub)" }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่สอบเทียบ *" error={errors.calDate?.message}>
                <input
                  {...register("calDate")}
                  type="date"
                  className="form-input"
                  onChange={(e) => {
                    register("calDate").onChange(e);
                    handleCalDateChange(e);
                  }}
                />
              </Field>
              <Field label="สอบเทียบครั้งถัดไป *" error={errors.nextCalDate?.message}>
                <input {...register("nextCalDate")} type="date" className="form-input" />
              </Field>
            </div>

            <Field label="เลขที่ใบรับรอง">
              <input {...register("certNumber")} placeholder="Cert No." className="form-input" />
            </Field>

            <Field label="ห้องปฏิบัติการ">
              <select {...register("labId")} className="form-input">
                <option value="">— เลือก Lab —</option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>{l.code} — {l.nameTh}</option>
                ))}
              </select>
            </Field>

            <Field label="ผลการสอบเทียบ">
              <select {...register("result")} className="form-input">
                <option value="">— เลือกผล —</option>
                <option value="PASS">ผ่าน (PASS)</option>
                <option value="FAIL">ไม่ผ่าน (FAIL)</option>
                <option value="CONDITIONAL">มีเงื่อนไข</option>
              </select>
            </Field>

            <Field label="หมายเหตุ">
              <textarea {...register("notes")} rows={2} className="form-input resize-none" placeholder="บันทึกเพิ่มเติม..." />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-medium" style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>
                ยกเลิก
              </button>
              <button type="submit" disabled={loading} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
                {loading && <Loader2 size={13} className="animate-spin" />}
                {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
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
