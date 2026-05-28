import { getWorkflows, getRoles } from "./actions";
import { WorkflowDesignerClient } from "@/components/admin/workflow-designer-client";

export const dynamic = "force-dynamic";

export default async function WorkflowDesignerPage() {
  const [workflows, roles] = await Promise.all([getWorkflows(), getRoles()]);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>
          Workflow Designer
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
          ออกแบบขั้นตอนการอนุมัติสำหรับใบสั่งซ่อม
        </p>
      </div>
      <WorkflowDesignerClient workflows={workflows} roles={roles} />
    </div>
  );
}
