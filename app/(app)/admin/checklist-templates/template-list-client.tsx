"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, ChevronRight, ListChecks, ToggleLeft, ToggleRight } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { TemplateRow } from "./actions";
import type { getTemplateFormData } from "./actions";

type FormData = Awaited<ReturnType<typeof getTemplateFormData>>;

const Schema = z.object({
  code: z.string().min(1, "กรุณาระบุรหัส"),
  nameTh: z.string().min(1, "กรุณาระบุชื่อภาษาไทย"),
  nameEn: z.string().min(1, "กรุณาระบุชื่อภาษาอังกฤษ"),
  assetClassId: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof Schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="label-caps">{label}</label>
      {children}
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}

interface Props {
  templates: TemplateRow[];
  formData: FormData;
  onCreate: (v: FormValues) => Promise<{ success: boolean }>;
  onUpdate: (id: string, v: FormValues & { isActive?: boolean }) => Promise<{ success: boolean }>;
  onToggle: (id: string, isActive: boolean) => Promise<{ success: boolean }>;
}

export function TemplateListClient({ templates, formData, onCreate, onUpdate, onToggle }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [search, setSearch] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  });

  function openCreate() {
    setEditing(null);
    reset({ code: "", nameTh: "", nameEn: "", assetClassId: "" });
    setModalOpen(true);
  }

  function openEdit(t: TemplateRow) {
    setEditing(t);
    reset({ code: t.code, nameTh: t.nameTh, nameEn: t.nameEn, assetClassId: t.assetClassId ?? "" });
    setModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await onUpdate(editing.id, values);
        toast.success("แก้ไขสำเร็จ");
      } else {
        await onCreate(values);
        toast.success("สร้างสำเร็จ");
      }
      setModalOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleToggle(t: TemplateRow) {
    try {
      await onToggle(t.id, !t.isActive);
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  }

  const filtered = templates.filter((t) =>
    [t.code, t.nameTh, t.nameEn].some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา..."
          className="form-input w-56"
        />
        <div className="flex-1" />
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14} /> เพิ่ม Template
        </button>
      </div>

      {/* Table */}
      <div className="panel-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--line)", background: "var(--panel-2)" }}>
              {["รหัส", "ชื่อ", "ประเภทสินทรัพย์", "รายการ", "สถานะ", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left label-caps">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-sub)" }}>ไม่พบข้อมูล</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="row-hover" style={{ borderBottom: "0.5px solid var(--line)" }}>
                <td className="px-4 py-3">
                  <span className="font-mono-num font-semibold text-xs" style={{ color: "var(--brand)" }}>{t.code}</span>
                </td>
                <td className="px-4 py-3">
                  <p style={{ color: "var(--text)" }}>{t.nameTh}</p>
                  <p className="text-xs" style={{ color: "var(--text-sub)" }}>{t.nameEn}</p>
                </td>
                <td className="px-4 py-3">
                  {t.assetClass ? (
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                      style={{ background: t.assetClass.color ?? undefined }}
                    >
                      {t.assetClass.nameTh}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-sub)" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-sub)" }}>
                    <ListChecks size={12} /> {t.itemCount} รายการ
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(t)} className="transition-all hover:opacity-70">
                    {t.isActive
                      ? <ToggleRight size={20} style={{ color: "var(--success)" }} />
                      : <ToggleLeft size={20} style={{ color: "var(--text-sub)" }} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded p-1.5 transition-all hover:bg-panel-2"
                      title="แก้ไข"
                    >
                      <Pencil size={13} style={{ color: "var(--text-sub)" }} />
                    </button>
                    <Link
                      href={`/admin/checklist-templates/${t.id}`}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all hover:bg-panel-2"
                      style={{ color: "var(--brand)" }}
                    >
                      จัดการรายการ <ChevronRight size={12} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      <Dialog.Root open={modalOpen} onOpenChange={(v) => { if (!v) setModalOpen(false); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-5"
            style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}
          >
            <Dialog.Title className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
              {editing ? "แก้ไข Template" : "เพิ่ม Template ใหม่"}
            </Dialog.Title>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <Field label="รหัส *" error={errors.code?.message}>
                <input {...register("code")} placeholder="CL-PRESS-M" className="form-input" />
              </Field>
              <Field label="ชื่อภาษาไทย *" error={errors.nameTh?.message}>
                <input {...register("nameTh")} placeholder="รายการตรวจสอบ..." className="form-input" />
              </Field>
              <Field label="ชื่อภาษาอังกฤษ *" error={errors.nameEn?.message}>
                <input {...register("nameEn")} placeholder="Checklist..." className="form-input" />
              </Field>
              <Field label="ประเภทสินทรัพย์">
                <select {...register("assetClassId")} className="form-input">
                  <option value="">— ทั้งหมด —</option>
                  {formData.assetClasses.map((a) => (
                    <option key={a.id} value={a.id}>{a.nameTh} ({a.code})</option>
                  ))}
                </select>
              </Field>

              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
