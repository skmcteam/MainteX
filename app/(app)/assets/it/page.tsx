import { getAssets, getAssetFormData } from "@/app/(app)/assets/actions";
import { AssetTable } from "@/components/assets/asset-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}

export default async function ITPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const status = params.status ?? "all";

  const [result, formData] = await Promise.all([
    getAssets({ category: "IT", q, page, status }),
    getAssetFormData("IT"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          อุปกรณ์ไอที
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          ทะเบียนอุปกรณ์ไอทีทั้งหมด · {result.statusCounts.all} รายการ
        </p>
      </div>
      <AssetTable
        data={result.data}
        category="IT"
        formData={formData}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        pageSize={result.pageSize}
        statusCounts={result.statusCounts}
        initialQ={q}
        initialStatus={status}
      />
    </div>
  );
}
