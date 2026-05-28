import { getWorkflows, getRoles } from "./actions";
import { WorkflowDesignerClient } from "@/components/admin/workflow-designer-client";
import { Construction } from "lucide-react";

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

      {/* Phase 5 notice — remove once workflow engine is wired to WO */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
        style={{ background: "var(--warning-soft)", border: "0.5px solid var(--warning)", color: "var(--warning)" }}
      >
        <Construction size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Phase 5 — Approval Engine กำลังพัฒนา</p>
          <p className="mt-0.5 text-xs" style={{ opacity: 0.85 }}>
            Designer ใช้ตั้งค่าและบันทึก Workflow ได้ตามปกติ แต่ยังไม่ผูกกับใบสั่งซ่อม (WO) จริง
            — ใบสั่งซ่อมที่สร้างขึ้นยังข้ามขั้นตอน Approval ไปก่อน
          </p>
        </div>
      </div>

      <WorkflowDesignerClient workflows={workflows} roles={roles} />
    </div>
  );
}
