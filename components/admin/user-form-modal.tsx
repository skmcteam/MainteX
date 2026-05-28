"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/app/(app)/admin/actions";
import type { UserRow } from "@/app/(app)/admin/actions";

const schema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  nameTh: z.string().min(1, "กรุณาระบุชื่อภาษาไทย"),
  nameEn: z.string().min(1, "กรุณาระบุชื่อภาษาอังกฤษ"),
  phone: z.string().optional().nullable(),
  roleId: z.string().min(1, "กรุณาเลือกบทบาท"),
  departmentId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type FormDataType = { roles: { id: string; code: string; nameTh: string }[]; departments: { id: string; nameTh: string; sections: { id: string; nameTh: string }[] }[] };

interface Props {
  open: boolean;
  onClose: () => void;
  formData: FormDataType;
  editUser?: UserRow;
}

export function UserFormModal({ open, onClose, formData, editUser }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editUser;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editUser ? {
      email: editUser.email,
      nameTh: editUser.nameTh,
      nameEn: editUser.nameEn,
      phone: editUser.phone ?? null,
      roleId: editUser.role.id,
      departmentId: editUser.department?.id ?? null,
      sectionId: editUser.section?.id ?? null,
    } : {},
  });

  const deptId = watch("departmentId");
  const sections = formData.departments.find((d) => d.id === deptId)?.sections ?? [];

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (isEdit && editUser) {
        await updateUser(editUser.id, values);
        toast.success("อัปเดตผู้ใช้งานสำเร็จ");
      } else {
        if (!values.password) { toast.error("กรุณาระบุรหัสผ่าน"); setLoading(false); return; }
        await createUser({ ...values, password: values.password });
        toast.success("สร้างผู้ใช้งานสำเร็จ");
      }
      reset(); onClose(); router.refresh();
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
            <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {isEdit ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}
            </Dialog.Title>
            <button onClick={onClose} style={{ color: "var(--text-sub)" }}><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อภาษาไทย *" error={errors.nameTh?.message}>
                <input {...register("nameTh")} className="form-input" placeholder="ชื่อ นามสกุล" />
              </Field>
              <Field label="ชื่อภาษาอังกฤษ *" error={errors.nameEn?.message}>
                <input {...register("nameEn")} className="form-input" placeholder="First Last" />
              </Field>
            </div>
            <Field label="อีเมล *" error={errors.email?.message}>
              <input {...register("email")} type="email" className="form-input" placeholder="name@skmc.co.th" />
            </Field>
            <Field label={isEdit ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน *"} error={errors.password?.message}>
              <input {...register("password")} type="password" className="form-input" placeholder="อย่างน้อย 6 ตัวอักษร" />
            </Field>
            <Field label="เบอร์โทร">
              <input {...register("phone")} className="form-input" placeholder="0812345678" />
            </Field>
            <Field label="บทบาท *" error={errors.roleId?.message}>
              <select {...register("roleId")} className="form-input">
                <option value="">— เลือกบทบาท —</option>
                {formData.roles.map((r) => <option key={r.id} value={r.id}>{r.nameTh} ({r.code})</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="แผนก">
                <select {...register("departmentId")} className="form-input">
                  <option value="">— ไม่ระบุ —</option>
                  {formData.departments.map((d) => <option key={d.id} value={d.id}>{d.nameTh}</option>)}
                </select>
              </Field>
              <Field label="ส่วนงาน">
                <select {...register("sectionId")} className="form-input" disabled={!deptId}>
                  <option value="">— ไม่ระบุ —</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.nameTh}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-medium" style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>ยกเลิก</button>
              <button type="submit" disabled={loading} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
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
