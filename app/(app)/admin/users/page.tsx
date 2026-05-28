import { getUsers, getUserFormData } from "@/app/(app)/admin/actions";
import { UsersClient } from "@/components/admin/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, formData] = await Promise.all([getUsers(), getUserFormData()]);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>ผู้ใช้งาน</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>จัดการบัญชีผู้ใช้ · {users.length} รายการ</p>
      </div>
      <UsersClient users={users} formData={formData} />
    </div>
  );
}
