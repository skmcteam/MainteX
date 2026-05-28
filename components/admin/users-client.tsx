"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTable } from "./admin-table";
import { UserFormModal } from "./user-form-modal";
import { toggleUserActive } from "@/app/(app)/admin/actions";
import type { UserRow } from "@/app/(app)/admin/actions";
import { StatusPill } from "@/components/shared/status-pill";
import { toast } from "sonner";

type FormData = { roles: { id: string; code: string; nameTh: string }[]; departments: { id: string; nameTh: string; sections: { id: string; nameTh: string }[] }[] };

interface Props {
  users: UserRow[];
  formData: FormData;
}

export function UsersClient({ users, formData }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | undefined>(undefined);

  const handleToggle = async (user: UserRow) => {
    try {
      await toggleUserActive(user.id, !user.isActive);
      toast.success(user.isActive ? "ปิดใช้งานแล้ว" : "เปิดใช้งานแล้ว");
      router.refresh();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  return (
    <>
      <AdminTable
        title="รายชื่อผู้ใช้งาน"
        data={users}
        searchKeys={["nameTh", "nameEn", "email"]}
        createLabel="เพิ่มผู้ใช้งาน"
        onCreate={() => { setEditUser(undefined); setModalOpen(true); }}
        onEdit={(u) => { setEditUser(u); setModalOpen(true); }}
        extraActions={(u) => (
          <button
            onClick={() => handleToggle(u)}
            className="rounded-md px-2 py-1 text-[10px] font-medium"
            style={{
              background: u.isActive ? "var(--danger-soft)" : "var(--success-soft)",
              color: u.isActive ? "var(--danger)" : "var(--success)",
            }}
          >
            {u.isActive ? "ปิดใช้" : "เปิดใช้"}
          </button>
        )}
        columns={[
          {
            key: "name", label: "ชื่อ",
            render: (u) => (
              <div>
                <p className="font-medium" style={{ color: "var(--text)" }}>{u.nameTh}</p>
                <p style={{ color: "var(--text-sub)" }}>{u.email}</p>
              </div>
            ),
          },
          { key: "role", label: "บทบาท", render: (u) => <span style={{ color: "var(--text)" }}>{u.role.nameTh}</span> },
          { key: "dept", label: "แผนก", render: (u) => <span style={{ color: "var(--text-sub)" }}>{u.department?.nameTh ?? "—"}</span> },
          { key: "phone", label: "เบอร์โทร", render: (u) => <span style={{ color: "var(--text-sub)" }}>{u.phone ?? "—"}</span> },
          {
            key: "status", label: "สถานะ",
            render: (u) => <StatusPill label={u.isActive ? "ใช้งาน" : "ไม่ใช้งาน"} color={u.isActive ? "success" : "neutral"} dot />,
          },
        ]}
      />
      <UserFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditUser(undefined); router.refresh(); }}
        formData={formData}
        editUser={editUser}
      />
    </>
  );
}
