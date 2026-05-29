"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onNavigate: (page: number) => void;
  label?: string;
}

export function PaginationControls({ page, totalPages, total, pageSize, onNavigate, label }: Props) {
  const t = useTranslations("common");
  if (totalPages <= 1 && total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const resolvedLabel = label ?? t("items");

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs"
      style={{ color: "var(--text-sub)", borderTop: "0.5px solid var(--line)" }}
    >
      <span>
        {t("showing")} {from}–{to} {t("of")} {total} {resolvedLabel}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(page - 1)}
            disabled={page <= 1}
            aria-label={t("previous")}
            className="flex h-7 w-7 items-center justify-center rounded-lg disabled:opacity-40"
            style={{ border: "0.5px solid var(--line)" }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ color: "var(--text)" }}>{page} / {totalPages}</span>
          <button
            onClick={() => onNavigate(page + 1)}
            disabled={page >= totalPages}
            aria-label={t("next")}
            className="flex h-7 w-7 items-center justify-center rounded-lg disabled:opacity-40"
            style={{ border: "0.5px solid var(--line)" }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
