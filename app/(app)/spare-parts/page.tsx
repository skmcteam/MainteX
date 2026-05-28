import { getSpareParts, getPartsFormData } from "./actions";
import { PartsClient } from "@/components/spare-parts/parts-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SparePartsPage() {
  const [data, formData] = await Promise.all([getSpareParts(), getPartsFormData()]);
  const lowStock = data.filter((r) => r.isLowStock).length;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>อะไหล่</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          คลังอะไหล่ · {data.length} รายการ
          {lowStock > 0 && <span style={{ color: "var(--danger)" }}> · สต็อกต่ำ {lowStock} รายการ</span>}
        </p>
      </div>
      <PartsClient data={data} formData={formData} />
    </div>
  );
}
