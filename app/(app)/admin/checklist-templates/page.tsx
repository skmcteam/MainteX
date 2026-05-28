export const dynamic = "force-dynamic";

import Link from "next/link";
import { ListChecks, ChevronRight } from "lucide-react";
import { getChecklistTemplates, getTemplateFormData, createChecklistTemplate, updateChecklistTemplate, toggleChecklistTemplate } from "./actions";
import { TemplateListClient } from "./template-list-client";

export default async function ChecklistTemplatesPage() {
  const [templates, formData] = await Promise.all([
    getChecklistTemplates(),
    getTemplateFormData(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          รายการตรวจสอบ (Checklist Templates)
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          สร้างและจัดการรายการตรวจสอบสำหรับแผน PM · {templates.length} รายการ
        </p>
      </div>
      <TemplateListClient
        templates={templates}
        formData={formData}
        onCreate={createChecklistTemplate}
        onUpdate={updateChecklistTemplate}
        onToggle={toggleChecklistTemplate}
      />
    </div>
  );
}
