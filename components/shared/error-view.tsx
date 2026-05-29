"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorView({ error, reset }: Props) {
  const t = useTranslations("common.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertTriangle size={32} style={{ color: "var(--danger)" }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t("title")}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
          {error.message || t("message")}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium"
        style={{ background: "var(--brand)", color: "var(--on-brand)" }}
      >
        <RefreshCw size={13} /> {t("retry")}
      </button>
    </div>
  );
}
