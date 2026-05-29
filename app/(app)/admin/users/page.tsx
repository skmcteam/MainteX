import { getTranslations } from "next-intl/server";
import { getUsers, getUserFormData } from "@/app/(app)/admin/actions";
import { UsersClient } from "@/components/admin/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const t = await getTranslations();
  const [users, formData] = await Promise.all([getUsers(), getUserFormData()]);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>{t("admin.users")}</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>{t("admin.usersSubtitle", { count: users.length })}</p>
      </div>
      <UsersClient users={users} formData={formData} />
    </div>
  );
}
