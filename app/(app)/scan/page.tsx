import { getTranslations } from "next-intl/server";
import { QRScanner } from "@/components/scan/qr-scanner";

export default async function ScanPage() {
  const t = await getTranslations("scan");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>{t("title")}</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>{t("subtitle")}</p>
      </div>
      <QRScanner />
    </div>
  );
}
