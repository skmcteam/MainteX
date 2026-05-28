"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, ChevronUp, ChevronDown, AlertTriangle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
} from "../actions";
import type { TemplateDetail, ItemRow } from "../actions";

type Category = { id: string; code: string; nameTh: string; color: string };

const ItemSchema = z.object({
  descriptionTh: z.string().min(1, "กรุณาระบุรายละเอียดภาษาไทย"),
  descriptionEn: z.string().min(1, "กรุณาระบุรายละเอียดภาษาอังกฤษ"),
  categoryId: z.string().optional().nullable(),
  standard: z.string().optional().nullable(),
  whoResponsible: z.string().optional().nullable(),
  isCritical: z.boolean(),
});
type ItemFormValues = z.infer<typeof ItemSchema>;

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
  template: TemplateDetail;
  categories: Category[];
}

export function ItemBuilder({ template, categories }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({ resolver: zodResolver(ItemSchema) });

  const isCriticalVal = watch("isCritical");

  function openAdd() {
    setEditingItem(null);
    reset({ descriptionTh: "", descriptionEn: "", categoryId: "", standard: "", whoResponsible: "", isCritical: false });
    setModalOpen(true);
  }

  function openEdit(item: ItemRow) {
    setEditingItem(item);
    reset({
      descriptionTh: item.descriptionTh,
      descriptionEn: item.descriptionEn,
      categoryId: item.categoryId ?? "",
      standard: item.standard ?? "",
      whoResponsible: item.whoResponsible ?? "",
      isCritical: item.isCritical,
    });
    setModalOpen(true);
  }

  async function onSubmit(values: ItemFormValues) {
    try {
      if (editingItem) {
        await updateChecklistItem(editingItem.id, values);
        toast.success("แก้ไขสำเร็จ");
      } else {
        await addChecklistItem({ templateId: template.id, ...values });
        toast.success("เพิ่มรายการสำเร็จ");
      }
      setModalOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteChecklistItem(id);
      toast.success("ลบรายการสำเร็จ");
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMove(id: string, dir: "up" | "down") {
    setMoving(id + dir);
    try {
      await moveChecklistItem(id, dir);
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setMoving(null);
    }
  }

  const items = template.items;

  return (
    <>
      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14} /> เพิ่มรายการ
        </button>
      </div>

      {/* Items list */}
      <div className="panel-border rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <p className="text-sm" style={{ color: "var(--text-sub)" }}>ยังไม่มีรายการตรวจสอบ</p>
            <button onClick={openAdd} className="text-xs underline" style={{ color: "var(--brand)" }}>
              เพิ่มรายการแรก
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--line)", background: "var(--panel-2)" }}>
                <th className="px-3 py-2.5 text-left label-caps w-10">#</th>
                <th className="px-3 py-2.5 text-left label-caps">หมวด</th>
                <th className="px-3 py-2.5 text-left label-caps">รายละเอียด</th>
                <th className="px-3 py-2.5 text-left label-caps">มาตรฐาน</th>
                <th className="px-3 py-2.5 text-left label-caps w-12">วิกฤต</th>
                <th className="px-3 py-2.5 text-left label-caps w-28"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="row-hover" style={{ borderBottom: "0.5px solid var(--line)" }}>
                  <td className="px-3 py-3 text-xs font-mono-num" style={{ color: "var(--text-sub)" }}>
                    {item.sortOrder}
                  </td>
                  <td className="px-3 py-3">
                    {item.category ? (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ background: item.category.color }}
                      >
                        {item.category.nameTh}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-sub)" }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p style={{ color: "var(--text)" }}>{item.descriptionTh}</p>
                    <p className="text-xs" style={{ color: "var(--text-sub)" }}>{item.descriptionEn}</p>
                    {item.whoResponsible && (
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-sub)" }}>
                        ผู้รับผิดชอบ: {item.whoResponsible}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: "var(--text-sub)" }}>
                    {item.standard || "—"}
                  </td>
                  <td className="px-3 py-3">
                    {item.isCritical && (
                      <AlertTriangle size={14} style={{ color: "var(--danger)" }} />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleMove(item.id, "up")}
                        disabled={idx === 0 || moving === item.id + "up"}
                        className="rounded p-1 transition-all hover:bg-panel-2 disabled:opacity-30"
                        title="เลื่อนขึ้น"
                      >
                        <ChevronUp size={13} style={{ color: "var(--text-sub)" }} />
                      </button>
                      <button
                        onClick={() => handleMove(item.id, "down")}
                        disabled={idx === items.length - 1 || moving === item.id + "down"}
                        className="rounded p-1 transition-all hover:bg-panel-2 disabled:opacity-30"
                        title="เลื่อนลง"
                      >
                        <ChevronDown size={13} style={{ color: "var(--text-sub)" }} />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded p-1 transition-all hover:bg-panel-2"
                        title="แก้ไข"
                      >
                        <Pencil size={13} style={{ color: "var(--text-sub)" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded p-1 transition-all hover:bg-panel-2 disabled:opacity-50"
                        title="ลบ"
                      >
                        <Trash2 size={13} style={{ color: "var(--danger)" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit item modal */}
      <Dialog.Root open={modalOpen} onOpenChange={(v) => { if (!v) setModalOpen(false); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-5"
            style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {editingItem ? "แก้ไขรายการ" : "เพิ่มรายการตรวจสอบ"}
              </Dialog.Title>
              <button onClick={() => setModalOpen(false)}>
                <X size={16} style={{ color: "var(--text-sub)" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <Field label="รายละเอียด (ภาษาไทย) *" error={errors.descriptionTh?.message}>
                <textarea
                  {...register("descriptionTh")}
                  rows={2}
                  placeholder="ตรวจสอบ..."
                  className="form-input resize-none"
                />
              </Field>
              <Field label="รายละเอียด (ภาษาอังกฤษ) *" error={errors.descriptionEn?.message}>
                <textarea
                  {...register("descriptionEn")}
                  rows={2}
                  placeholder="Check..."
                  className="form-input resize-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="หมวดหมู่">
                  <select {...register("categoryId")} className="form-input">
                    <option value="">— ไม่ระบุ —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameTh}</option>
                    ))}
                  </select>
                </Field>
                <Field label="มาตรฐาน / ค่าที่ยอมรับ">
                  <input {...register("standard")} placeholder="80 N·m, MIN–MAX…" className="form-input" />
                </Field>
              </div>
              <Field label="ผู้รับผิดชอบ">
                <input {...register("whoResponsible")} placeholder="ช่างไฟฟ้า, ผู้ควบคุม…" className="form-input" />
              </Field>

              {/* Critical toggle */}
              <button
                type="button"
                onClick={() => setValue("isCritical", !isCriticalVal)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                style={{
                  background: isCriticalVal ? "color-mix(in srgb, var(--danger) 10%, transparent)" : "var(--panel-2)",
                  border: `0.5px solid ${isCriticalVal ? "var(--danger)" : "var(--line)"}`,
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: isCriticalVal ? "var(--danger)" : "var(--text-sub)" }}
                />
                <span className="text-xs font-medium" style={{ color: isCriticalVal ? "var(--danger)" : "var(--text-sub)" }}>
                  {isCriticalVal ? "รายการวิกฤต (Critical)" : "ทำเครื่องหมายเป็นรายการวิกฤต"}
                </span>
              </button>

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
