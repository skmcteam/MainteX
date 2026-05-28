import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { WorkOrderList } from "@/components/work-orders/wo-list";

export default async function WorkOrdersPage() {
  const t = await getTranslations();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
            {t("wo.title")}
          </h1>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all"
          style={{ background: "var(--brand)" }}
        >
          <Plus size={14} />
          {t("wo.create")}
        </button>
      </div>
      <WorkOrderList />
    </div>
  );
}
