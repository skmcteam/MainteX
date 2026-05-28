import { getCalibrationLabsAdmin, createCalibrationLab, updateCalibrationLab } from "@/app/(app)/admin/actions";
import { AdminCrudClient } from "@/components/admin/admin-crud-client";

export const dynamic = "force-dynamic";

export default async function CalibrationLabsPage() {
  const labs = await getCalibrationLabsAdmin();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>ห้องปฏิบัติการสอบเทียบ</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>SP Metrology, PCaL, Kawata ฯลฯ · {labs.length} แห่ง</p>
      </div>
      <AdminCrudClient
        title="ห้องปฏิบัติการ"
        data={labs}
        searchKeys={["code", "nameTh", "accreditNo"]}
        createLabel="เพิ่ม Lab"
        columns={[
          { key: "code", label: "รหัส", render: (r) => <span className="font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{r.code}</span> },
          { key: "name", label: "ชื่อ", render: (r) => <div><p style={{ color: "var(--text)" }}>{r.nameTh}</p><p style={{ color: "var(--text-sub)" }}>{r.accreditNo}</p></div> },
          { key: "contact", label: "ติดต่อ", render: (r) => <div><p style={{ color: "var(--text-sub)" }}>{r.phone ?? "—"}</p><p style={{ color: "var(--text-sub)" }}>{r.email ?? "—"}</p></div> },
          { key: "stats", label: "อุปกรณ์/บันทึก", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r._count.assets} / {r._count.calibrations}</span> },
        ]}
        fields={[
          { key: "code", label: "รหัส *", required: true, placeholder: "SP-METRO" },
          { key: "nameTh", label: "ชื่อภาษาไทย *", required: true, placeholder: "SP Metrology" },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ *", required: true, placeholder: "SP Metrology Co., Ltd." },
          { key: "accreditNo", label: "เลขที่การรับรอง", placeholder: "T-0123" },
          { key: "contact", label: "ชื่อผู้ติดต่อ", placeholder: "คุณสมชาย" },
          { key: "phone", label: "เบอร์โทร", placeholder: "02-xxx-xxxx" },
          { key: "email", label: "อีเมล", type: "email", placeholder: "contact@lab.co.th" },
        ]}
        toFormValues={(r) => ({ code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, accreditNo: r.accreditNo ?? "", contact: r.contact ?? "", phone: r.phone ?? "", email: r.email ?? "" })}
        onCreate={(v) => createCalibrationLab({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), accreditNo: String(v.accreditNo || ""), contact: String(v.contact || ""), phone: String(v.phone || ""), email: String(v.email || "") })}
        onUpdate={(id, v) => updateCalibrationLab(id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), accreditNo: String(v.accreditNo || ""), contact: String(v.contact || ""), phone: String(v.phone || ""), email: String(v.email || "") })}
      />
    </div>
  );
}
