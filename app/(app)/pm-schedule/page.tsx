import { getPMPlans, getPMFormData } from "@/app/(app)/pm-schedule/actions";
import { PMList } from "@/components/pm/pm-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PMSchedulePage() {
  const [data, formData] = await Promise.all([
    getPMPlans(),
    getPMFormData(),
  ]);

  const overdue = data.filter((p) => {
    if (!p.nextDueDate) return false;
    return new Date(p.nextDueDate) < new Date();
  }).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          แผนบำรุงรักษาเชิงป้องกัน (PM)
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          แผน PM ทั้งหมด {data.length} รายการ
          {overdue > 0 && (
            <span style={{ color: "var(--danger)" }}> · เกินกำหนด {overdue} รายการ</span>
          )}
        </p>
      </div>
      <PMList data={data} formData={formData} />
    </div>
  );
}
