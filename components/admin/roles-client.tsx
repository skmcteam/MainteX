"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { StatusPill } from "@/components/shared/status-pill";
import type { RoleRow } from "@/app/(app)/admin/actions";
import { createRole, updateRole, softDeleteRole } from "@/app/(app)/admin/actions";

const CreateSchema = z.object({
  code: z.string().min(1).regex(/^[A-Z0-9_]+$/),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional().nullable(),
});

const EditSchema = z.object({
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional().nullable(),
});

type CreateValues = z.infer<typeof CreateSchema>;
type EditValues = z.infer<typeof EditSchema>;

interface Props {
  roles: RoleRow[];
}

export function RolesClient({ roles }: Props) {
  const t = useTranslations();
  const tr = useTranslations("admin.role");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const createForm = useForm<CreateValues>({ resolver: zodResolver(CreateSchema) });
  const editForm = useForm<EditValues>({ resolver: zodResolver(EditSchema) });

  function openCreate() {
    createForm.reset({ code: "", nameTh: "", nameEn: "", description: "" });
    setModalMode("create");
  }

  function openEdit(role: RoleRow) {
    setEditing(role);
    editForm.reset({ nameTh: role.nameTh, nameEn: role.nameEn, description: role.description ?? "" });
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  async function onCreateSubmit(values: CreateValues) {
    try {
      await createRole(values);
      toast.success(tr("createSuccess"));
      closeModal();
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error.title"));
    }
  }

  async function onEditSubmit(values: EditValues) {
    if (!editing) return;
    try {
      await updateRole(editing.id, values);
      toast.success(tr("updateSuccess"));
      closeModal();
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error.title"));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await softDeleteRole(deleting.id);
      toast.success(tr("deleteSuccess"));
      setDeleting(null);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error.title"));
    } finally {
      setDeleteLoading(false);
    }
  }

  const filtered = roles.filter((r) =>
    [r.code, r.nameTh, r.nameEn].some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")} className="form-input w-56" />
        <div className="flex-1" />
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14} /> {tr("add")}
        </button>
      </div>

      {/* Table */}
      <div className="panel-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--line)", background: "var(--panel-2)" }}>
              {[t("common.code"), t("admin.roles"), t("common.type"), t("common.status"), ""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left label-caps">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-sub)" }}>{t("common.noData")}</td></tr>
            ) : filtered.map((role) => (
              <tr key={role.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                <td className="px-4 py-3">
                  <span className="font-mono-num font-semibold text-xs" style={{ color: "var(--brand)" }}>{role.code}</span>
                </td>
                <td className="px-4 py-3">
                  <p style={{ color: "var(--text)" }}>{role.nameTh}</p>
                  <p className="text-xs" style={{ color: "var(--text-sub)" }}>{role.nameEn}</p>
                  {role.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>{role.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <StatusPill label={role.isSystem ? tr("typeSystem") : tr("typeCustom")} color={role.isSystem ? "brand" : "neutral"} dot />
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-sub)" }}>
                  {tr("userCount", { count: role._count.users })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(role)} className="rounded p-1.5 transition-all hover:bg-panel-2" aria-label={`${t("common.edit")} ${role.code}`}>
                      <Pencil size={13} style={{ color: "var(--text-sub)" }} />
                    </button>
                    {!role.isSystem && (
                      <button onClick={() => setDeleting(role)} className="rounded p-1.5 transition-all hover:bg-panel-2" aria-label={`${tr("deleteTitle")} ${role.code}`}>
                        <Trash2 size={13} style={{ color: "var(--danger)" }} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Dialog.Root open={modalMode === "create"} onOpenChange={(v) => { if (!v) closeModal(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-5" style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}>
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>{tr("addTitle")}</Dialog.Title>
              <button onClick={closeModal} aria-label={t("common.close")} style={{ color: "var(--text-sub)" }}><X size={16} /></button>
            </div>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldCode")}</label>
                <input {...createForm.register("code")} placeholder="DEPT_SUPERVISOR" className="form-input font-mono-num" />
                {createForm.formState.errors.code && <p className="text-xs" style={{ color: "var(--danger)" }}>{tr("errorCodeFormat")}</p>}
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{tr("fieldCodeHint")}</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldNameTh")}</label>
                <input {...createForm.register("nameTh")} className="form-input" />
                {createForm.formState.errors.nameTh && <p className="text-xs" style={{ color: "var(--danger)" }}>{tr("errorNameTh")}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldNameEn")}</label>
                <input {...createForm.register("nameEn")} className="form-input" />
                {createForm.formState.errors.nameEn && <p className="text-xs" style={{ color: "var(--danger)" }}>{tr("errorNameEn")}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldDesc")}</label>
                <input {...createForm.register("description")} className="form-input" />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="btn-secondary text-sm">{t("common.cancel")}</button>
                <button type="submit" disabled={createForm.formState.isSubmitting} className="btn-primary text-sm">
                  {createForm.formState.isSubmitting ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit modal */}
      <Dialog.Root open={modalMode === "edit"} onOpenChange={(v) => { if (!v) closeModal(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-5" style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}>
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>{tr("editTitle")}</Dialog.Title>
              <button onClick={closeModal} aria-label={t("common.close")} style={{ color: "var(--text-sub)" }}><X size={16} /></button>
            </div>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-3">
              {/* Code — locked */}
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldCode")}</label>
                <div className="form-input font-mono-num" style={{ background: "var(--panel-2)", color: "var(--text-sub)" }}>{editing?.code}</div>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{tr("fieldCodeLocked")}</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldNameTh")}</label>
                <input {...editForm.register("nameTh")} className="form-input" />
                {editForm.formState.errors.nameTh && <p className="text-xs" style={{ color: "var(--danger)" }}>{tr("errorNameTh")}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldNameEn")}</label>
                <input {...editForm.register("nameEn")} className="form-input" />
                {editForm.formState.errors.nameEn && <p className="text-xs" style={{ color: "var(--danger)" }}>{tr("errorNameEn")}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-caps">{tr("fieldDesc")}</label>
                <input {...editForm.register("description")} className="form-input" />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="btn-secondary text-sm">{t("common.cancel")}</button>
                <button type="submit" disabled={editForm.formState.isSubmitting} className="btn-primary text-sm">
                  {editForm.formState.isSubmitting ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete confirmation */}
      <Dialog.Root open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl p-5" style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}>
            <Dialog.Title className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>{tr("deleteTitle")}</Dialog.Title>
            <p className="text-sm mb-3" style={{ color: "var(--text)" }}>
              {tr("deleteConfirm", { name: deleting?.nameTh ?? "" })}
            </p>
            {deleting && deleting._count.users > 0 && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <p className="text-xs">{tr("deleteWarning", { count: deleting._count.users })}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="btn-secondary text-sm">{t("common.cancel")}</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-60" style={{ background: "var(--danger)" }}>
                {deleteLoading ? t("common.loading") : t("common.delete")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
