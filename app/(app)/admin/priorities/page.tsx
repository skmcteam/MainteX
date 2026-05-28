import { getPrioritiesAdmin, createPriority, updatePriority } from "@/app/(app)/admin/actions";
import { AdminCrudClient } from "@/components/admin/admin-crud-client";
import { StatusPill } from "@/components/shared/status-pill";

export const dynamic = "force-dynamic";

export default async function PrioritiesPage() {
  const priorities = await getPrioritiesAdmin();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>ระดับความสำคัญ</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>URGENT, HIGH, MEDIUM, LOW พร้อม SLA hours · {priorities.length} ระดับ</p>
      </div>
      <AdminCrudClient
        title="ระดับความสำคัญ"
        data={priorities}
        searchKeys={["code", "nameTh"]}
        createLabel="เพิ่มระดับ"
        columns={[
          { key: "badge", label: "ระดับ", render: (r) => <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: `${r.color}22`, color: r.color }}>{r.nameTh}</span> },
          { key: "code", label: "รหัส", render: (r) => <span className="font-mono-num" style={{ color: "var(--text-sub)" }}>{r.code}</span> },
          { key: "slaHours", label: "SLA (ชม.)", render: (r) => <span style={{ color: "var(--text)" }}>{r.slaHours} ชม.</span> },
          { key: "sort", label: "ลำดับ", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r.sortOrder}</span> },
          { key: "wos", label: "ใบสั่งซ่อม", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r._count.workOrders}</span> },
        ]}
        fields={[
          { key: "code", label: "รหัส *", required: true, placeholder: "URGENT" },
          { key: "nameTh", label: "ชื่อภาษาไทย *", required: true, placeholder: "เร่งด่วน" },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ *", required: true, placeholder: "Urgent" },
          { key: "color", label: "สี (hex) *", type: "color", required: true },
          { key: "slaHours", label: "SLA (ชั่วโมง) *", type: "number", required: true, placeholder: "2" },
          { key: "sortOrder", label: "ลำดับ", type: "number", placeholder: "1" },
        ]}
        toFormValues={(r) => ({ code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, color: r.color, slaHours: r.slaHours, sortOrder: r.sortOrder })}
        onCreate={(v) => createPriority({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), color: String(v.color), slaHours: Number(v.slaHours), sortOrder: Number(v.sortOrder || 0) })}
        onUpdate={(id, v) => updatePriority(id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), color: String(v.color), slaHours: Number(v.slaHours), sortOrder: Number(v.sortOrder || 0) })}
      />
    </div>
  );
}
