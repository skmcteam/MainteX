import { getTranslations } from "next-intl/server";
import { getSpareParts, getLowStockParts, getLowStockCount, getPartsFormData } from "./actions";
import { PartsClient } from "@/components/spare-parts/parts-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ q?: string; page?: string; tab?: string }>;
}

export default async function SparePartsPage({ searchParams }: Props) {
  const t = await getTranslations();
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const tab = params.tab ?? "all";

  const [result, formData, lowStockCount] = await Promise.all([
    tab === "low" ? Promise.resolve(null) : getSpareParts({ q, page }),
    getPartsFormData(),
    getLowStockCount(),
  ]);

  const lowStockParts = tab === "low" ? await getLowStockParts() : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>{t("parts.title")}</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          {t("parts.inventorySubtitle", { count: result ? result.total : lowStockCount })}
          {lowStockCount > 0 && tab !== "low" && (
            <span style={{ color: "var(--danger)" }}>{t("parts.lowStockCount", { count: lowStockCount })}</span>
          )}
        </p>
      </div>
      <PartsClient
        data={tab === "low" ? lowStockParts : (result?.data ?? [])}
        formData={formData}
        total={result?.total ?? lowStockCount}
        page={result?.page ?? 1}
        totalPages={result?.totalPages ?? 1}
        pageSize={result?.pageSize ?? 50}
        initialQ={q}
        initialTab={tab}
        lowStockCount={lowStockCount}
      />
    </div>
  );
}
