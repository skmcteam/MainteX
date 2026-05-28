import { getSuppliersAdmin, createSupplier, updateSupplier, toggleSupplier } from "@/app/(app)/admin/actions";
import { AdminCrudClient } from "@/components/admin/admin-crud-client";
import { StatusPill } from "@/components/shared/status-pill";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await getSuppliersAdmin();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>ผู้จำหน่าย (Suppliers)</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>ซัพพลายเออร์อะไหล่และวัสดุสิ้นเปลือง · {suppliers.length} ราย</p>
      </div>
      <AdminCrudClient
        title="ผู้จำหน่าย"
        data={suppliers}
        searchKeys={["code", "nameTh", "contact"]}
        createLabel="เพิ่มผู้จำหน่าย"
        columns={[
          { key: "code", label: "รหัส", render: (r) => <span className="font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{r.code}</span> },
          { key: "name", label: "ชื่อ", render: (r) => <div><p style={{ color: "var(--text)" }}>{r.nameTh}</p><p style={{ color: "var(--text-sub)" }}>{r.contact ?? ""}</p></div> },
          { key: "contact", label: "ติดต่อ", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r.phone ?? "—"}</span> },
          { key: "leadTime", label: "Lead time", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r.leadTimeDays} วัน</span> },
          { key: "parts", label: "อะไหล่", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r._count.spareParts}</span> },
          { key: "status", label: "สถานะ", render: (r) => <StatusPill label={r.isActive ? "ใช้งาน" : "ไม่ใช้งาน"} color={r.isActive ? "success" : "neutral"} dot /> },
        ]}
        fields={[
          { key: "code", label: "รหัส *", required: true, placeholder: "SUP-001" },
          { key: "nameTh", label: "ชื่อภาษาไทย *", required: true, placeholder: "บริษัท ตัวอย่าง จำกัด" },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ *", required: true, placeholder: "Example Co., Ltd." },
          { key: "contact", label: "ชื่อผู้ติดต่อ", placeholder: "คุณสมชาย" },
          { key: "phone", label: "เบอร์โทร", placeholder: "02-xxx-xxxx" },
          { key: "email", label: "อีเมล", type: "email" },
          { key: "leadTimeDays", label: "Lead time (วัน)", type: "number", placeholder: "7" },
          { key: "isActive", label: "สถานะ", type: "checkbox", placeholder: "เปิดใช้งาน" },
        ]}
        toFormValues={(r) => ({ code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, contact: r.contact ?? "", phone: r.phone ?? "", email: r.email ?? "", leadTimeDays: r.leadTimeDays, isActive: r.isActive })}
        onCreate={(v) => createSupplier({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), contact: String(v.contact || ""), phone: String(v.phone || ""), email: String(v.email || ""), leadTimeDays: Number(v.leadTimeDays || 7), isActive: Boolean(v.isActive ?? true) })}
        onUpdate={(id, v) => updateSupplier(id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), contact: String(v.contact || ""), phone: String(v.phone || ""), email: String(v.email || ""), leadTimeDays: Number(v.leadTimeDays || 7), isActive: Boolean(v.isActive ?? true) })}
      />
    </div>
  );
}
