import { getTranslations } from "next-intl/server";
import { getCalibrationAssets, getCalLabs } from "@/app/(app)/calibration/actions";
import { CalList } from "@/components/calibration/cal-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CalibrationPage() {
  const t = await getTranslations();
  const [data, labs] = await Promise.all([
    getCalibrationAssets(),
    getCalLabs(),
  ]);

  const overdue = data.filter((r) => r.calStatus === "OVERDUE").length;
  const dueSoon = data.filter((r) => r.calStatus === "DUE_SOON").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          {t("cal.pageTitle")}
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          {t("cal.subtitle", { count: data.length })}
          {overdue > 0 && (
            <span style={{ color: "var(--danger)" }}>{t("cal.overdueCount", { count: overdue })}</span>
          )}
          {dueSoon > 0 && (
            <span style={{ color: "var(--warning)" }}>{t("cal.dueSoonCount", { count: dueSoon })}</span>
          )}
        </p>
      </div>
      <CalList data={data} labs={labs} />
    </div>
  );
}
