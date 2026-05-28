"use client";

import { useState, useEffect } from "react";
import { getWOTypesAdmin, createWOType, updateWOType } from "@/app/(app)/admin/actions";
import { AdminCrudClient } from "@/components/admin/admin-crud-client";

type Row = Awaited<ReturnType<typeof getWOTypesAdmin>>[number];

export default function WOTypesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = async () => { setRows(await getWOTypesAdmin()); };

  useEffect(() => { getWOTypesAdmin().then(d => { setRows(d); setLoading(false); }); }, []);

  if (loading) return <div className="py-8 text-center text-xs" style={{ color: "var(--text-sub)" }}>กำลังโหลด...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>ประเภทใบสั่งซ่อม</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>CM, PM, Calibration ฯลฯ · {rows.length} ประเภท</p>
      </div>
      <AdminCrudClient
        title="ประเภทใบสั่งซ่อม"
        data={rows}
        searchKeys={["code", "nameTh"]}
        createLabel="เพิ่มประเภท"
        columns={[
          { key: "code", label: "รหัส", render: (r) => <span className="font-mono-num font-bold" style={{ background: `${r.color}22`, color: r.color, borderRadius: 4, padding: "2px 6px" }}>{r.code}</span> },
          { key: "nameTh", label: "ชื่อภาษาไทย", render: (r) => <span style={{ color: "var(--text)" }}>{r.nameTh}</span> },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r.nameEn}</span> },
          { key: "sort", label: "ลำดับ", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r.sortOrder}</span> },
          { key: "wos", label: "ใบสั่งซ่อม", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r._count.workOrders}</span> },
        ]}
        fields={[
          { key: "code", label: "รหัส *", required: true, placeholder: "CM" },
          { key: "nameTh", label: "ชื่อภาษาไทย *", required: true, placeholder: "ซ่อมแซม" },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ *", required: true, placeholder: "Corrective Maintenance" },
          { key: "color", label: "สี (hex) *", type: "color", required: true },
          { key: "sortOrder", label: "ลำดับการแสดง", type: "number", placeholder: "1" },
        ]}
        onCreate={async (v) => { await createWOType({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), color: String(v.color), sortOrder: Number(v.sortOrder || 0) }); }}
        onUpdate={async (id, v) => { await updateWOType(id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), color: String(v.color), sortOrder: Number(v.sortOrder || 0) }); }}
        onDataChanged={reload}
      />
    </div>
  );
}
