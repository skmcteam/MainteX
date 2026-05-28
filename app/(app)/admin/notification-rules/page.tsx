"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { getNotificationRules, toggleNotificationRule, createNotificationRule } from "@/app/(app)/admin/actions";
import { StatusPill } from "@/components/shared/status-pill";
import { SimpleFormModal } from "@/components/admin/simple-form-modal";
import { toast } from "sonner";

type Rule = Awaited<ReturnType<typeof getNotificationRules>>[number];

const EVENT_LABELS: Record<string, string> = {
  urgent_WO_created: "สร้าง WO เร่งด่วน",
  PM_due_soon: "PM ใกล้ครบกำหนด",
  calibration_overdue: "สอบเทียบเกินกำหนด",
  parts_low_stock: "อะไหล่ใกล้หมด",
  WO_pending_approval: "รออนุมัติ WO",
};

export default function NotificationRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => { setRules(await getNotificationRules()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleToggle = async (rule: Rule) => {
    try {
      await toggleNotificationRule(rule.id, !rule.isActive);
      toast.success(rule.isActive ? "ปิดการแจ้งเตือนแล้ว" : "เปิดการแจ้งเตือนแล้ว");
      await load();
    } catch { toast.error("เกิดข้อผิดพลาด"); }
  };

  if (loading) return <div className="py-8 text-center text-xs" style={{ color: "var(--text-sub)" }}>กำลังโหลด...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>กฎการแจ้งเตือน</h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>กำหนด event × audience × channel · {rules.length} กฎ</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
          style={{ background: "var(--brand)" }}>
          <BellRing size={13} /> เพิ่มกฎ
        </button>
      </div>

      <div className="panel-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
              {["Event", "กลุ่มเป้าหมาย", "ช่องทาง", "สถานะ", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                <td className="px-4 py-2.5">
                  <p className="font-medium" style={{ color: "var(--text)" }}>{EVENT_LABELS[rule.event] ?? rule.event}</p>
                  <p className="font-mono-num" style={{ color: "var(--text-sub)" }}>{rule.event}</p>
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--text)" }}>{rule.audience}</td>
                <td className="px-4 py-2.5">
                  <StatusPill label={rule.channel} color={rule.channel === "in_app" ? "brand" : rule.channel === "email" ? "success" : "purple"} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill label={rule.isActive ? "เปิด" : "ปิด"} color={rule.isActive ? "success" : "neutral"} dot />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleToggle(rule)}
                    className="rounded-md px-2 py-1 text-[10px] font-medium"
                    style={{ background: rule.isActive ? "var(--danger-soft)" : "var(--success-soft)", color: rule.isActive ? "var(--danger)" : "var(--success)" }}>
                    {rule.isActive ? "ปิด" : "เปิด"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SimpleFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); load(); }}
        title="เพิ่มกฎการแจ้งเตือน"
        fields={[
          { key: "event", label: "Event *", required: true, type: "select", options: Object.entries(EVENT_LABELS).map(([v, l]) => ({ value: v, label: l })) },
          { key: "audience", label: "กลุ่มเป้าหมาย *", required: true, type: "select", options: [
            { value: "MAINTENANCE_SUPERVISOR", label: "หัวหน้าซ่อมบำรุง" },
            { value: "MAINTENANCE_MANAGER", label: "ผู้จัดการซ่อมบำรุง" },
            { value: "DEPT_SUPERVISOR", label: "หัวหน้าแผนก" },
            { value: "ALL", label: "ทุกคน" },
          ]},
          { key: "channel", label: "ช่องทาง *", required: true, type: "select", options: [{ value: "in_app", label: "ในแอป" }, { value: "email", label: "อีเมล" }] },
        ]}
        onSave={async (v) => { await createNotificationRule({ event: String(v.event), audience: String(v.audience), channel: String(v.channel) }); }}
      />
    </div>
  );
}
