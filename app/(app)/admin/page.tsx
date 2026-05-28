import { getTranslations } from "next-intl/server";
import { Settings, Users, Workflow, Tag, Building2, Layers, Gauge, Truck, BellRing, ListChecks } from "lucide-react";
import Link from "next/link";

const sections = [
  { href: "/admin/users", icon: Users, titleTh: "ผู้ใช้งาน", descTh: "จัดการผู้ใช้และสิทธิ์" },
  { href: "/admin/roles", icon: Settings, titleTh: "บทบาท", descTh: "กำหนดบทบาทและสิทธิ์" },
  { href: "/admin/workflow-designer", icon: Workflow, titleTh: "ขั้นตอนอนุมัติ", descTh: "ออกแบบ workflow" },
  { href: "/admin/wo-types", icon: Tag, titleTh: "ประเภทใบสั่งซ่อม", descTh: "CM, PM, สอบเทียบ ฯลฯ" },
  { href: "/admin/departments", icon: Building2, titleTh: "แผนก/หน่วยงาน", descTh: "โครงสร้างองค์กร" },
  { href: "/admin/asset-classes", icon: Layers, titleTh: "ประเภทสินทรัพย์", descTh: "กลุ่ม A/B/C" },
  { href: "/admin/calibration-labs", icon: Gauge, titleTh: "ห้องปฏิบัติการ", descTh: "SP Metrology, PCaL ฯลฯ" },
  { href: "/admin/suppliers", icon: Truck, titleTh: "ผู้จำหน่าย", descTh: "ซัพพลายเออร์อะไหล่" },
  { href: "/admin/notification-rules", icon: BellRing, titleTh: "กฎการแจ้งเตือน", descTh: "event × audience × channel" },
  { href: "/admin/checklist-templates", icon: ListChecks, titleTh: "รายการตรวจสอบ", descTh: "สร้าง checklist สำหรับ PM" },
];

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
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.titleTh}</p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{s.descTh}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
