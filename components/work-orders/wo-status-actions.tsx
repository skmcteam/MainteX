"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateWOStatus } from "@/app/(app)/work-orders/actions";

interface Props {
  woId: string;
  currentStatus: string;
}

const TRANSITIONS: Record<string, { label: string; icon: React.ComponentType<{ size?: number }>; next: string; color: string }[]> = {
  OPEN: [
    { label: "เริ่มดำเนินการ", icon: Play, next: "IN_PROGRESS", color: "var(--brand)" },
    { label: "ยกเลิก", icon: XCircle, next: "CANCELLED", color: "var(--danger)" },
  ],
  IN_PROGRESS: [
    { label: "พักงาน", icon: Pause, next: "ON_HOLD", color: "var(--warning)" },
    { label: "เสร็จสิ้น", icon: CheckCircle2, next: "DONE", color: "var(--success)" },
  ],
  ON_HOLD: [
    { label: "กลับมาดำเนินการ", icon: Play, next: "IN_PROGRESS", color: "var(--brand)" },
    { label: "ยกเลิก", icon: XCircle, next: "CANCELLED", color: "var(--danger)" },
  ],
  DONE: [],
  CANCELLED: [],
};

export function WOStatusActions({ woId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  const handleAction = async (next: string) => {
    setLoading(next);
    try {
      await updateWOStatus(woId, next as "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "DONE" | "CANCELLED");
      toast.success("อัปเดตสถานะสำเร็จ");
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const isLoading = loading === action.next;
        return (
          <button
            key={action.next}
            onClick={() => handleAction(action.next)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
            style={{
              borderColor: action.color,
              color: action.color,
              background: `${action.color}15`,
            }}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Icon size={13} />
            )}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
