"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Square, XSquare, MinusSquare } from "lucide-react";
import { toast } from "sonner";
import { updateChecklistItem } from "@/app/(app)/work-orders/actions";
import { useRouter } from "next/navigation";

type CheckStatus = "PENDING" | "PASS" | "FAIL" | "NA";

interface Item {
  id: string;
  descriptionTh: string;
  descriptionEn: string;
  status: CheckStatus;
  notes: string | null;
}

interface Props {
  woId: string;
  items: Item[];
}

const STATUS_ICONS: Record<CheckStatus, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  PENDING: Square,
  PASS: CheckSquare,
  FAIL: XSquare,
  NA: MinusSquare,
};

const STATUS_COLORS: Record<CheckStatus, string> = {
  PENDING: "var(--text-sub)",
  PASS: "var(--success)",
  FAIL: "var(--danger)",
  NA: "var(--warning)",
};

const STATUS_CYCLE: CheckStatus[] = ["PENDING", "PASS", "FAIL", "NA"];

export function WOChecklist({ woId, items }: Props) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>(
    Object.fromEntries(items.map((i) => [i.id, i.status]))
  );
  const [pending, startTransition] = useTransition();

  const cycleStatus = (itemId: string) => {
    const current = statuses[itemId] ?? "PENDING";
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    setStatuses((prev) => ({ ...prev, [itemId]: next }));

    startTransition(async () => {
      try {
        await updateChecklistItem(itemId, next);
        router.refresh();
      } catch {
        toast.error("เกิดข้อผิดพลาด");
        setStatuses((prev) => ({ ...prev, [itemId]: current }));
      }
    });
  };

  const done = Object.values(statuses).filter((s) => s !== "PENDING").length;
  const total = items.length;

  return (
    <div className="panel-border overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "0.5px solid var(--line)" }}
      >
        <div className="flex items-center gap-2">
          <CheckSquare size={14} style={{ color: "var(--brand)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            Checklist
          </p>
        </div>
        <span className="text-xs" style={{ color: "var(--text-sub)" }}>
          {done}/{total} รายการ
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 w-full"
        style={{ background: "var(--panel-2)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${(done / total) * 100}%`,
            background: done === total ? "var(--success)" : "var(--brand)",
          }}
        />
      </div>

      <div className="divide-y" style={{ borderColor: "var(--line)" }}>
        {items.map((item) => {
          const status = statuses[item.id] ?? "PENDING";
          const Icon = STATUS_ICONS[status];
          return (
            <button
              key={item.id}
              onClick={() => cycleStatus(item.id)}
              disabled={pending}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--panel-2)]"
            >
              <Icon
                size={16}
                style={{ color: STATUS_COLORS[status], marginTop: 1, flexShrink: 0 }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-medium"
                  style={{
                    color: "var(--text)",
                    textDecoration: status === "NA" ? "line-through" : "none",
                    opacity: status === "NA" ? 0.5 : 1,
                  }}
                >
                  {item.descriptionTh}
                </p>
                {item.notes && (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
                    {item.notes}
                  </p>
                )}
              </div>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  background: `${STATUS_COLORS[status]}20`,
                  color: STATUS_COLORS[status],
                  flexShrink: 0,
                }}
              >
                {status === "PENDING" ? "รอ" : status === "PASS" ? "ผ่าน" : status === "FAIL" ? "ไม่ผ่าน" : "N/A"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
