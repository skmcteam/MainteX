"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = () => {
    const next = locale === "th" ? "en" : "th";
    // Set cookie for next-intl locale detection
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      onClick={switchLocale}
      disabled={isPending}
      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-all hover:bg-panel-2"
      style={{ color: "var(--text-sub)" }}
      aria-label="เปลี่ยนภาษา / Switch language"
    >
      <Languages size={14} />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {locale === "th" ? "TH" : "EN"}
      </span>
    </button>
  );
}
