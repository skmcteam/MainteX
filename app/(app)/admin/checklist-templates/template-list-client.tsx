"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

function useSchema() {
  const t = useTranslations("admin.checklistTemplate");
  return z.object({
    code: z.string().min(1, t("errorCode")),
    nameTh: z.string().min(1, t("errorNameTh")),
    nameEn: z.string().min(1, t("errorNameEn")),
    assetClassId: z.string().optional().nullable(),
  });
}

type FormValues = {
  code: string;
  nameTh: string;
  nameEn: string;
  assetClassId?: string | null;
};

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
  const t = useTranslations();
  const tc = useTranslations("admin.checklistTemplate");
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [search, setSearch] = useState("");

  const schema = useSchema();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function openCreate() {
    setEditing(null);
    reset({ code: "", nameTh: "", nameEn: "", assetClassId: "" });
    setModalOpen(true);
  }

  function openEdit(row: TemplateRow) {
    setEditing(row);
    reset({ code: row.code, nameTh: row.nameTh, nameEn: row.nameEn, assetClassId: row.assetClassId ?? "" });
    setModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await onUpdate(editing.id, values);
        toast.success(tc("updateSuccess"));
      } else {
        await onCreate(values);
        toast.success(tc("createSuccess"));
      }
      setModalOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error.title"));
    }
  }

  async function handleToggle(row: TemplateRow) {
    try {
      await onToggle(row.id, !row.isActive);
      router.refresh();
    } catch {
      toast.error(t("common.error.title"));
    }
  }

  const filtered = templates.filter((row) =>
    [row.code, row.nameTh, row.nameEn].some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const COLUMNS = [t("common.code"), t("common.name"), t("admin.assetClasses"), t("common.items"), t("common.status"), ""];

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="form-input w-56"
        />
        <div className="flex-1" />
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14} /> {tc("add")}
        </button>
      </div>

      {/* Table */}
      <div className="panel-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--line)", background: "var(--panel-2)" }}>
              {COLUMNS.map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left label-caps">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-sub)" }}>{t("common.noData")}</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="row-hover" style={{ borderBottom: "0.5px solid var(--line)" }}>
                <td className="px-4 py-3">
                  <span className="font-mono-num font-semibold text-xs" style={{ color: "var(--brand)" }}>{row.code}</span>
                </td>
                <td className="px-4 py-3">
                  <p style={{ color: "var(--text)" }}>{row.nameTh}</p>
                  <p className="text-xs" style={{ color: "var(--text-sub)" }}>{row.nameEn}</p>
                </td>
                <td className="px-4 py-3">
                  {row.assetClass ? (
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                      style={{ background: row.assetClass.color ?? undefined, color: "var(--on-brand)" }}
                    >
                      {row.assetClass.nameTh}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-sub)" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-sub)" }}>
                    <ListChecks size={12} /> {tc("itemCount", { count: row.itemCount })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(row)} className="transition-all hover:opacity-70">
                    {row.isActive
                      ? <ToggleRight size={20} style={{ color: "var(--success)" }} />
                      : <ToggleLeft size={20} style={{ color: "var(--text-sub)" }} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(row)}
                      className="rounded p-1.5 transition-all hover:bg-panel-2"
                      title={t("common.edit")}
                      aria-label={`${t("common.edit")} ${row.code}`}
                    >
                      <Pencil size={13} style={{ color: "var(--text-sub)" }} />
                    </button>
                    <Link
                      href={`/admin/checklist-templates/${row.id}`}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all hover:bg-panel-2"
                      style={{ color: "var(--brand)" }}
                    >
                      {tc("manage")} <ChevronRight size={12} />
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
              {editing ? tc("editTitle") : tc("addTitle")}
            </Dialog.Title>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <Field label={`${t("common.code")} *`} error={errors.code?.message}>
                <input {...register("code")} placeholder="CL-PRESS-M" className="form-input" />
              </Field>
              <Field label={tc("fieldNameTh")} error={errors.nameTh?.message}>
                <input {...register("nameTh")} placeholder={tc("placeholderNameTh")} className="form-input" />
              </Field>
              <Field label={tc("fieldNameEn")} error={errors.nameEn?.message}>
                <input {...register("nameEn")} placeholder="Checklist..." className="form-input" />
              </Field>
              <Field label={t("admin.assetClasses")}>
                <select {...register("assetClassId")} className="form-input">
                  <option value="">{tc("allClasses")}</option>
                  {formData.assetClasses.map((a) => (
                    <option key={a.id} value={a.id}>{a.nameTh} ({a.code})</option>
                  ))}
                </select>
              </Field>

              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                  {isSubmitting ? tc("saving") : t("common.save")}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
