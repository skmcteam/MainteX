import { getCalibrationAssets, getCalLabs } from "@/app/(app)/calibration/actions";
import { CalList } from "@/components/calibration/cal-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CalibrationPage() {
  const [data, labs] = await Promise.all([
    getCalibrationAssets(),
    getCalLabs(),
  ]);

  const overdue = data.filter((r) => r.calStatus === "OVERDUE").length;
  const dueSoon = data.filter((r) => r.calStatus === "DUE_SOON").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          การสอบเทียบเครื่องมือวัด
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          เครื่องมือทั้งหมด {data.length} รายการ
          {overdue > 0 && (
            <span style={{ color: "var(--danger)" }}> · เกินกำหนด {overdue} รายการ</span>
          )}
          {dueSoon > 0 && (
            <span style={{ color: "var(--warning)" }}> · ใกล้ครบกำหนด {dueSoon} รายการ</span>
          )}
        </p>
      </div>
      <CalList data={data} labs={labs} />
    </div>
  );
}
