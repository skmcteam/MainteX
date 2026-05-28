import { getWorkOrders, getWOFormData } from "@/app/(app)/work-orders/actions";
import { WorkOrderList } from "@/components/work-orders/wo-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkOrdersPage() {
  const [data, formData] = await Promise.all([
    getWorkOrders(),
    getWOFormData(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          ใบสั่งซ่อม
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          ระบบบริหารจัดการใบสั่งซ่อมบำรุง · {data.length} รายการ
        </p>
      </div>
      <WorkOrderList data={data} formData={formData} />
    </div>
  );
}
