import { getTranslations } from "next-intl/server";
import { Factory } from "lucide-react";
export default async function AssetPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>{t("asset.title")} — it</h1>
      <div className="mt-4 panel-border p-8 text-center" style={{ color: "var(--text-sub)" }}>
        <Factory size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Phase 2 — Asset Registry (it)</p>
      </div>
    </div>
  );
}
