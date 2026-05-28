import { getAssetClassesAdmin, createAssetClass, updateAssetClass } from "@/app/(app)/admin/actions";
import { AdminCrudClient } from "@/components/admin/admin-crud-client";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = { MACHINE: "เครื่องจักร", MOLD: "แม่พิมพ์", IT: "ไอที", INSTRUMENT: "เครื่องมือวัด" };
const CRIT_LABEL: Record<string, string> = { A: "A (วิกฤต)", B: "B (ปานกลาง)", C: "C (ต่ำ)" };

export default async function AssetClassesPage() {
  const classes = await getAssetClassesAdmin();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>ประเภทสินทรัพย์ (Asset Class)</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>กลุ่ม A/B/C ตาม criticality · {classes.length} ประเภท</p>
      </div>
      <AdminCrudClient
        title="ประเภทสินทรัพย์"
        data={classes}
        searchKeys={["code", "nameTh"]}
        createLabel="เพิ่มประเภท"
        columns={[
          { key: "code", label: "รหัส", render: (r) => <span className="font-mono-num font-semibold" style={{ color: r.color ?? "var(--brand)" }}>{r.code}</span> },
          { key: "nameTh", label: "ชื่อภาษาไทย", render: (r) => <span style={{ color: "var(--text)" }}>{r.nameTh}</span> },
          { key: "category", label: "หมวด", render: (r) => <span style={{ color: "var(--text-sub)" }}>{CATEGORY_LABEL[r.category]}</span> },
          { key: "criticality", label: "Criticality", render: (r) => <span style={{ color: r.criticality === "A" ? "var(--danger)" : r.criticality === "B" ? "var(--warning)" : "var(--text-sub)" }}>{CRIT_LABEL[r.criticality]}</span> },
          { key: "assets", label: "อุปกรณ์", render: (r) => <span style={{ color: "var(--text-sub)" }}>{r._count.assets}</span> },
        ]}
        fields={[
          { key: "code", label: "รหัส *", required: true, placeholder: "PRESS" },
          { key: "nameTh", label: "ชื่อภาษาไทย *", required: true, placeholder: "เครื่องอัด (Press)" },
          { key: "nameEn", label: "ชื่อภาษาอังกฤษ *", required: true, placeholder: "Press Machine" },
          { key: "category", label: "หมวด *", type: "select", required: true, options: [{ value: "MACHINE", label: "เครื่องจักร" }, { value: "MOLD", label: "แม่พิมพ์" }, { value: "IT", label: "ไอที" }, { value: "INSTRUMENT", label: "เครื่องมือวัด" }] },
          { key: "criticality", label: "Criticality *", type: "select", required: true, options: [{ value: "A", label: "A — วิกฤต" }, { value: "B", label: "B — ปานกลาง" }, { value: "C", label: "C — ต่ำ" }] },
          { key: "color", label: "สี (hex)", type: "color" },
        ]}
        toFormValues={(r) => ({ code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, category: r.category, criticality: r.criticality, color: r.color ?? "#1B6FE8" })}
        onCreate={(v) => createAssetClass({ code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), category: v.category as "MACHINE", criticality: v.criticality as "A", color: String(v.color || "") })}
        onUpdate={(id, v) => updateAssetClass(id, { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), category: v.category as "MACHINE", criticality: v.criticality as "A", color: String(v.color || "") })}
      />
    </div>
  );
}
