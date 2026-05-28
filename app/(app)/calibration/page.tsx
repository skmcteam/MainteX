import { getTranslations } from "next-intl/server";
import { Gauge } from "lucide-react";
export default async function CalibrationPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>{t("cal.title")}</h1>
      <div className="mt-4 panel-border p-8 text-center" style={{ color: "var(--text-sub)" }}>
        <Gauge size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Phase 2 — Calibration Tracking</p>
      </div>
    </div>
  );
}
