import { getTranslations } from "next-intl/server";
import { Settings, Users, Workflow, Tag, Building2, Layers, Gauge, Truck, BellRing, ListChecks } from "lucide-react";
import Link from "next/link";

const sections = [
  { href: "/admin/users",                icon: Users,       titleKey: "admin.users",             descKey: "admin.usersDesc" },
  { href: "/admin/roles",                icon: Settings,    titleKey: "admin.roles",              descKey: "admin.rolesDesc" },
  { href: "/admin/workflow-designer",    icon: Workflow,    titleKey: "admin.workflow",           descKey: "admin.workflowDesc" },
  { href: "/admin/wo-types",             icon: Tag,         titleKey: "admin.woTypes",            descKey: "admin.woTypesDesc" },
  { href: "/admin/departments",          icon: Building2,   titleKey: "admin.departments",        descKey: "admin.departmentsDesc" },
  { href: "/admin/asset-classes",        icon: Layers,      titleKey: "admin.assetClasses",       descKey: "admin.assetClassesDesc" },
  { href: "/admin/calibration-labs",     icon: Gauge,       titleKey: "admin.calibrationLabs",    descKey: "admin.calibrationLabsDesc" },
  { href: "/admin/suppliers",            icon: Truck,       titleKey: "admin.suppliers",          descKey: "admin.suppliersDesc" },
  { href: "/admin/notification-rules",   icon: BellRing,    titleKey: "admin.notificationRules",  descKey: "admin.notificationRulesDesc" },
  { href: "/admin/checklist-templates",  icon: ListChecks,  titleKey: "admin.checklistTemplates", descKey: "admin.checklistTemplatesDesc" },
] as const;

export default async function AdminPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>{t("admin.title")}</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="panel-border flex flex-col gap-2 p-4 transition-all hover:border-brand" style={{ "--hover-border": "var(--brand)" } as React.CSSProperties}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)" }}>
                <Icon size={16} style={{ color: "var(--brand)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{t(s.titleKey)}</p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{t(s.descKey)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
