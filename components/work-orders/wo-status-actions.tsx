"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateWOStatus } from "@/app/(app)/work-orders/actions";
import { WOCloseDialog } from "./wo-close-dialog";

interface Props {
  woId: string;
  woNumber: string;
  currentStatus: string;
}

type SimpleTransition = {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  next: string;
  color: string;
};

const SIMPLE_TRANSITIONS: Record<string, SimpleTransition[]> = {
  OPEN: [
    { label: "เริ่มดำเนินการ", icon: Play, next: "IN_PROGRESS", color: "var(--brand)" },
    { label: "ยกเลิก", icon: XCircle, next: "CANCELLED", color: "var(--danger)" },
  ],
  IN_PROGRESS: [
    { label: "พักงาน", icon: Pause, next: "ON_HOLD", color: "var(--warning)" },
  ],
  ON_HOLD: [
    { label: "กลับมาดำเนินการ", icon: Play, next: "IN_PROGRESS", color: "var(--brand)" },
    { label: "ยกเลิก", icon: XCircle, next: "CANCELLED", color: "var(--danger)" },
  ],
  DONE: [],
  CANCELLED: [],
};

export function WOStatusActions({ woId, woNumber, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  const simpleActions = SIMPLE_TRANSITIONS[currentStatus] ?? [];
  const showClose = currentStatus === "IN_PROGRESS";

  if (simpleActions.length === 0 && !showClose) return null;

  const handleSimple = async (next: string) => {
    setLoading(next);
    try {
      await updateWOStatus(woId, next as "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "CANCELLED");
      toast.success("อัปเดตสถานะสำเร็จ");
      router.refresh();
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {simpleActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.next}
              onClick={() => handleSimple(action.next)}
              disabled={loading !== null}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
              style={{ borderColor: action.color, color: action.color, background: `${action.color}15` }}
            >
              {loading === action.next ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
              {action.label}
            </button>
          );
        })}

        {showClose && (
          <button
            onClick={() => setCloseOpen(true)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
            style={{ borderColor: "var(--success)", color: "var(--success)", background: "var(--success-soft)" }}
          >
            เสร็จสิ้น
          </button>
        )}
      </div>

      <WOCloseDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        woId={woId}
        woNumber={woNumber}
      />
    </>
  );
}
