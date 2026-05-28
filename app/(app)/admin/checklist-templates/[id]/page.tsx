export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getChecklistTemplateDetail, getItemFormData } from "../actions";
import { ItemBuilder } from "./item-builder";

export default async function ItemBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tmpl, itemFormData] = await Promise.all([
    getChecklistTemplateDetail(id),
    getItemFormData(),
  ]);
  if (!tmpl) notFound();

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/checklist-templates"
          className="flex items-center gap-1 text-xs transition-all hover:underline"
          style={{ color: "var(--text-sub)" }}
        >
          <ChevronLeft size={12} /> Checklist Templates
        </Link>
        <span style={{ color: "var(--line)" }}>/</span>
        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{tmpl.code}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>{tmpl.nameTh}</h1>
          {!tmpl.isActive && (
            <span className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: "var(--panel-2)", color: "var(--text-sub)" }}>
              ปิดใช้งาน
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          {tmpl.nameEn} · {tmpl.items.length} รายการ
          {tmpl.assetClass && ` · ${tmpl.assetClass.nameTh}`}
        </p>
      </div>

      <ItemBuilder template={tmpl} categories={itemFormData.categories} />
    </div>
  );
}
