import { getTranslations } from "next-intl/server";
import { getRoles } from "@/app/(app)/admin/actions";
import { RolesClient } from "@/components/admin/roles-client";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const t = await getTranslations();
  const roles = await getRoles();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          {t("admin.roles")}
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          {t("admin.rolesSubtitle", { count: roles.length })}
        </p>
      </div>
      <RolesClient roles={roles} />
    </div>
  );
}
