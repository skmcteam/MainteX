import { getAreas, createArea, updateArea, deleteArea } from "@/app/(app)/admin/actions";
import { AdminCrudClient } from "@/components/admin/admin-crud-client";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const areas = await getAreas();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>พื้นที่ (Areas)</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>สายการผลิต / ห้อง / โซน · {areas.length} รายการ</p>
      </div>
      <AdminCrudClient
        title="พื้นที่"
        data={areas}
        searchKeys={["code", "nameTh", "nameEn"]}
        createLabel="เพิ่มพื้นที่"
        columns={[
          { key: "code", label: "รหัส", render: (r) => <span className="font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{r.code}</span> },
          { key: "nameTh", label: "ชื่อภาษาไทย", render: (r) => <span style={{ color: "var(--text)" }}>{r.nameTh}</span> },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r.nameEn}</span> },
          { key: "assets", label: "อุปกรณ์", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r._count.assets}</span> },
        ]}
        fields={[
          { key: "code", label: "รหัส *", required: true, placeholder: "MOLD-LINE-A" },
          { key: "nameTh", label: "ชื่อภาษาไทย *", required: true, placeholder: "สายการผลิต A" },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ *", required: true, placeholder: "Molding Line A" },
        ]}
        toFormValues={(r) => ({ code: r.code, nameTh: r.nameTh, nameEn: r.nameEn })}
        onCreate={(v) => createArea({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn) })}
        onUpdate={(id, v) => updateArea(id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn) })}
        onDelete={(r) => deleteArea(r.id)}
      />
    </div>
  );
}
