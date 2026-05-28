"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAsset, updateAsset } from "@/app/(app)/assets/actions";
import type { AssetFormData, AssetDetail } from "@/app/(app)/assets/actions";

const schema = z.object({
  code: z.string().min(1, "กรุณาระบุรหัส"),
  nameTh: z.string().min(1, "กรุณาระบุชื่อภาษาไทย"),
  nameEn: z.string().min(1, "กรุณาระบุชื่อภาษาอังกฤษ"),
  status: z.string().min(1),
  assetClassId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  // MACHINE
  powerKw: z.string().optional().nullable(),
  voltage: z.string().optional().nullable(),
  // MOLD
  cavityCount: z.string().optional().nullable(),
  moldLifeShots: z.string().optional().nullable(),
  // IT
  ipAddress: z.string().optional().nullable(),
  macAddress: z.string().optional().nullable(),
  osVersion: z.string().optional().nullable(),
  // INSTRUMENT
  instrumentTypeId: z.string().optional().nullable(),
  calPeriodMonths: z.string().optional().nullable(),
  calLabId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  category: "MACHINE" | "MOLD" | "IT" | "INSTRUMENT";
  formData: AssetFormData;
  editAsset?: AssetDetail;
}

const FIELD_LABEL: Record<Props["category"], string> = {
  MACHINE: "เครื่องจักร",
  MOLD: "แม่พิมพ์",
  IT: "อุปกรณ์ไอที",
  INSTRUMENT: "เครื่องมือวัด",
};

export function AssetFormModal({ open, onClose, category, formData, editAsset }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deptId, setDeptId] = useState<string>("");
  const isEdit = !!editAsset;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editAsset ? {
      code: editAsset.code,
      nameTh: editAsset.nameTh,
      nameEn: editAsset.nameEn,
      status: editAsset.status,
      assetClassId: editAsset.assetClass?.id ?? null,
      departmentId: editAsset.department?.id ?? null,
      sectionId: editAsset.section?.id ?? null,
      areaId: editAsset.area?.id ?? null,
      manufacturer: editAsset.manufacturer ?? null,
      model: editAsset.model ?? null,
      serialNumber: editAsset.serialNumber ?? null,
      description: editAsset.description ?? null,
      powerKw: editAsset.powerKw?.toString() ?? null,
      voltage: editAsset.voltage?.toString() ?? null,
      cavityCount: editAsset.cavityCount?.toString() ?? null,
      moldLifeShots: editAsset.moldLifeShots?.toString() ?? null,
      ipAddress: editAsset.ipAddress ?? null,
      macAddress: editAsset.macAddress ?? null,
      osVersion: editAsset.osVersion ?? null,
      instrumentTypeId: editAsset.instrumentType?.id ?? null,
      calPeriodMonths: editAsset.calPeriodMonths?.toString() ?? null,
      calLabId: editAsset.calLab?.id ?? null,
    } : { status: "ACTIVE" },
  });

  const watchedDept = watch("departmentId");
  useEffect(() => { setDeptId(watchedDept ?? ""); }, [watchedDept]);

  const sections =
    formData.departments.find((d) => d.id === deptId)?.sections ?? [];

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        category,
        status: values.status as "ACTIVE",
        powerKw: values.powerKw ? Number(values.powerKw) : null,
        voltage: values.voltage ? Number(values.voltage) : null,
        cavityCount: values.cavityCount ? Number(values.cavityCount) : null,
        moldLifeShots: values.moldLifeShots ? Number(values.moldLifeShots) : null,
        calPeriodMonths: values.calPeriodMonths ? Number(values.calPeriodMonths) : null,
      };
      if (isEdit && editAsset) {
        await updateAsset(editAsset.id, payload);
        toast.success("อัปเดตข้อมูลสำเร็จ");
      } else {
        await createAsset(payload);
        toast.success(`เพิ่ม${FIELD_LABEL[category]}สำเร็จ`);
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

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-6"
          style={{
            background: "var(--panel)",
            border: "0.5px solid var(--line)",
            maxHeight: "90vh",
          }}
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              {isEdit ? `แก้ไข${FIELD_LABEL[category]}` : `เพิ่ม${FIELD_LABEL[category]}ใหม่`}
            </Dialog.Title>
            <button
              onClick={onClose}
              aria-label="ปิด"
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: "var(--text-sub)" }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Code + Status row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="รหัสอุปกรณ์ *" error={errors.code?.message}>
                <input
                  {...register("code")}
                  placeholder="เช่น MC-001"
                  className="form-input"
                />
              </Field>
              <Field label="สถานะ">
                <select {...register("status")} className="form-input">
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="INACTIVE">ไม่ใช้งาน</option>
                  <option value="UNDER_REPAIR">ซ่อมบำรุง</option>
                  <option value="RETIRED">เลิกใช้</option>
                </select>
              </Field>
            </div>

            {/* Names */}
            <Field label="ชื่อภาษาไทย *" error={errors.nameTh?.message}>
              <input
                {...register("nameTh")}
                placeholder="ชื่อภาษาไทย"
                className="form-input"
              />
            </Field>
            <Field label="ชื่อภาษาอังกฤษ *" error={errors.nameEn?.message}>
              <input
                {...register("nameEn")}
                placeholder="English name"
                className="form-input"
              />
            </Field>

            {/* Asset Class */}
            {formData.assetClasses.length > 0 && (
              <Field label="ประเภท (Asset Class)">
                <select {...register("assetClassId")} className="form-input">
                  <option value="">— เลือกประเภท —</option>
                  {formData.assetClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.nameTh}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Dept + Section */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="แผนก">
                <select {...register("departmentId")} className="form-input">
                  <option value="">— เลือกแผนก —</option>
                  {formData.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameTh}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ส่วนงาน">
                <select {...register("sectionId")} className="form-input" disabled={!deptId}>
                  <option value="">— เลือกส่วนงาน —</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameTh}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Area */}
            <Field label="พื้นที่">
              <select {...register("areaId")} className="form-input">
                <option value="">— เลือกพื้นที่ —</option>
                {formData.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nameTh}
                  </option>
                ))}
              </select>
            </Field>

            {/* Manufacturer + Model */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="ผู้ผลิต">
                <input {...register("manufacturer")} placeholder="Manufacturer" className="form-input" />
              </Field>
              <Field label="รุ่น">
                <input {...register("model")} placeholder="Model" className="form-input" />
              </Field>
            </div>

            <Field label="Serial Number">
              <input {...register("serialNumber")} placeholder="SN/Serial" className="form-input" />
            </Field>

            {/* Category-specific fields */}
            {category === "MACHINE" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="กำลัง (kW)">
                  <input {...register("powerKw")} type="number" step="0.01" placeholder="0.00" className="form-input" />
                </Field>
                <Field label="แรงดัน (V)">
                  <input {...register("voltage")} type="number" placeholder="380" className="form-input" />
                </Field>
              </div>
            )}

            {category === "MOLD" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="จำนวนช่อง (Cavity)">
                  <input {...register("cavityCount")} type="number" placeholder="0" className="form-input" />
                </Field>
                <Field label="อายุการใช้งาน (shots)">
                  <input {...register("moldLifeShots")} type="number" placeholder="0" className="form-input" />
                </Field>
              </div>
            )}

            {category === "IT" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="IP Address">
                    <input {...register("ipAddress")} placeholder="192.168.x.x" className="form-input" />
                  </Field>
                  <Field label="MAC Address">
                    <input {...register("macAddress")} placeholder="XX:XX:XX:XX:XX:XX" className="form-input" />
                  </Field>
                </div>
                <Field label="OS / Version">
                  <input {...register("osVersion")} placeholder="Windows 11, Ubuntu 22.04…" className="form-input" />
                </Field>
              </>
            )}

            {category === "INSTRUMENT" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ประเภทเครื่องมือ">
                    <select {...register("instrumentTypeId")} className="form-input">
                      <option value="">— เลือกประเภท —</option>
                      {formData.instrumentTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nameTh}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="รอบสอบเทียบ (เดือน)">
                    <input {...register("calPeriodMonths")} type="number" placeholder="12" className="form-input" />
                  </Field>
                </div>
                <Field label="ห้องปฏิบัติการสอบเทียบ">
                  <select {...register("calLabId")} className="form-input">
                    <option value="">— เลือก Lab —</option>
                    {formData.calLabs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {l.nameTh}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            {/* Description */}
            <Field label="หมายเหตุ">
              <textarea
                {...register("description")}
                rows={2}
                placeholder="รายละเอียดเพิ่มเติม..."
                className="form-input resize-none"
              />
            </Field>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  background: "var(--panel-2)",
                  color: "var(--text-sub)",
                  border: "0.5px solid var(--line)",
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-60"
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
