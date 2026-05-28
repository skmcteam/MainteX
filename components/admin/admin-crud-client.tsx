"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTable, type AdminColumn } from "./admin-table";
import { SimpleFormModal, type FieldDef } from "./simple-form-modal";
import { toast } from "sonner";

interface Props<T extends { id: string }> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: AdminColumn<T>[];
  searchKeys: (keyof T)[];
  createLabel?: string;
  fields: FieldDef[];
  toFormValues: (row: T) => Record<string, unknown>;
  onCreate: (values: Record<string, string | boolean | number | null>) => Promise<unknown>;
  onUpdate: (id: string, values: Record<string, string | boolean | number | null>) => Promise<unknown>;
  onDelete?: (row: T) => Promise<unknown>;
  extraActions?: (row: T) => React.ReactNode;
}

export function AdminCrudClient<T extends { id: string }>({
  title, subtitle, data, columns, searchKeys, createLabel = "สร้างใหม่",
  fields, toFormValues, onCreate, onUpdate, onDelete, extraActions,
}: Props<T>) {
  const router = useRouter();
  const [modal, setModal] = useState<{ open: boolean; edit?: T }>({ open: false });

  const handleSave = async (values: Record<string, string | boolean | number | null>) => {
    if (modal.edit) {
      await onUpdate(modal.edit.id, values);
      toast.success("อัปเดตสำเร็จ");
    } else {
      await onCreate(values);
      toast.success("สร้างสำเร็จ");
    }
    setModal({ open: false });
    router.refresh();
  };

  const handleDelete = async (row: T) => {
    if (!onDelete) return;
    if (!confirm("ต้องการลบรายการนี้?")) return;
    try {
      await onDelete(row);
      toast.success("ลบสำเร็จ");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "ไม่สามารถลบได้");
    }
  };

  return (
    <>
      <AdminTable
        title={subtitle ?? title}
        data={data}
        columns={columns}
        searchKeys={searchKeys}
        createLabel={createLabel}
        onCreate={() => setModal({ open: true })}
        onEdit={(row) => setModal({ open: true, edit: row })}
        onDelete={onDelete ? handleDelete : undefined}
        extraActions={extraActions}
      />
      <SimpleFormModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.edit ? `แก้ไข${createLabel?.replace("สร้าง", "").replace("เพิ่ม", "")}` : createLabel ?? ""}
        fields={fields}
        defaultValues={modal.edit ? toFormValues(modal.edit) : undefined}
        onSave={handleSave}
      />
    </>
  );
}
