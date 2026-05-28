import { cn } from "@/lib/utils";

type Color = "brand" | "success" | "warning" | "danger" | "purple" | "cyan" | "orange" | "neutral";

interface StatusPillProps {
  label: string;
  color?: Color;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const colorMap: Record<Color, { bg: string; text: string }> = {
  brand: { bg: "var(--brand-soft)", text: "var(--brand)" },
  success: { bg: "var(--success-soft)", text: "var(--success)" },
  warning: { bg: "var(--warning-soft)", text: "var(--warning)" },
  danger: { bg: "var(--danger-soft)", text: "var(--danger)" },
  purple: { bg: "var(--purple-soft)", text: "var(--purple)" },
  cyan: { bg: "var(--cyan-soft)", text: "var(--cyan)" },
  orange: { bg: "var(--orange-soft)", text: "var(--orange)" },
  neutral: { bg: "var(--panel-2)", text: "var(--text-sub)" },
};

export function StatusPill({ label, color = "neutral", dot = false, size = "md", className }: StatusPillProps) {
  const { bg, text } = colorMap[color];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{ background: bg, color: text }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: text }}
        />
      )}
      {label}
    </span>
  );
}

export function WOStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    OPEN: { label: "เปิด", color: "brand" },
    IN_PROGRESS: { label: "กำลังดำเนินการ", color: "warning" },
    ON_HOLD: { label: "พัก", color: "orange" },
    DONE: { label: "เสร็จสิ้น", color: "success" },
    CANCELLED: { label: "ยกเลิก", color: "neutral" },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" as Color };
  return <StatusPill label={cfg.label} color={cfg.color} dot />;
}

export function AssetStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    ACTIVE: { label: "ใช้งาน", color: "success" },
    INACTIVE: { label: "ไม่ใช้งาน", color: "neutral" },
    UNDER_REPAIR: { label: "ซ่อมบำรุง", color: "warning" },
    RETIRED: { label: "เลิกใช้", color: "orange" },
    SCRAPPED: { label: "ทิ้ง", color: "danger" },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" as Color };
  return <StatusPill label={cfg.label} color={cfg.color} dot />;
}

export function CalStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    NORMAL: { label: "ปกติ", color: "success" },
    DUE_SOON: { label: "ใกล้ครบกำหนด", color: "warning" },
    OVERDUE: { label: "เกินกำหนด", color: "danger" },
  };
  const cfg = map[status] ?? { label: status, color: "neutral" as Color };
  return <StatusPill label={cfg.label} color={cfg.color} dot />;
}

export function PriorityPill({ priority }: { priority: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    URGENT: { label: "เร่งด่วน", color: "danger" },
    HIGH: { label: "สูง", color: "orange" },
    MEDIUM: { label: "ปานกลาง", color: "warning" },
    LOW: { label: "ต่ำ", color: "neutral" },
  };
  const cfg = map[priority] ?? { label: priority, color: "neutral" as Color };
  return <StatusPill label={cfg.label} color={cfg.color} />;
}
