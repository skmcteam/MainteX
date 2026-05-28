"use client";

import { useState, useEffect } from "react";
import { getPrioritiesAdmin, createPriority, updatePriority } from "@/app/(app)/admin/actions";
import { AdminCrudClient } from "@/components/admin/admin-crud-client";

type Row = Awaited<ReturnType<typeof getPrioritiesAdmin>>[number];

export default function PrioritiesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = async () => { setRows(await getPrioritiesAdmin()); };

  useEffect(() => { getPrioritiesAdmin().then(d => { setRows(d); setLoading(false); }); }, []);

  if (loading) return <div className="py-8 text-center text-xs" style={{ color: "var(--text-sub)" }}>กำลังโหลด...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>ระดับความสำคัญ</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>URGENT, HIGH, MEDIUM, LOW พร้อม SLA hours · {rows.length} ระดับ</p>
      </div>
      <AdminCrudClient
        title="ระดับความสำคัญ"
        data={rows}
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
        onCreate={async (v) => { await createPriority({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), color: String(v.color), slaHours: Number(v.slaHours), sortOrder: Number(v.sortOrder || 0) }); }}
        onUpdate={async (id, v) => { await updatePriority(id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), color: String(v.color), slaHours: Number(v.slaHours), sortOrder: Number(v.sortOrder || 0) }); }}
        onDataChanged={reload}
      />
    </div>
  );
}
