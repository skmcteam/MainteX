import { getAssets, getAssetFormData } from "@/app/(app)/assets/actions";
import { AssetTable } from "@/components/assets/asset-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MoldsPage() {
  const [data, formData] = await Promise.all([
    getAssets("MOLD"),
    getAssetFormData("MOLD"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          แม่พิมพ์
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          ทะเบียนแม่พิมพ์ทั้งหมด · {data.length} รายการ
        </p>
      </div>
      <AssetTable data={data} category="MOLD" formData={formData} />
    </div>
  );
}
