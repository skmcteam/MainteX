import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: LucideIcon;
  color?: "brand" | "success" | "warning" | "danger" | "purple" | "cyan";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorMap = {
  brand: { bg: "var(--brand-soft)", text: "var(--brand)" },
  success: { bg: "var(--success-soft)", text: "var(--success)" },
  warning: { bg: "var(--warning-soft)", text: "var(--warning)" },
  danger: { bg: "var(--danger-soft)", text: "var(--danger)" },
  purple: { bg: "var(--purple-soft)", text: "var(--purple)" },
  cyan: { bg: "var(--cyan-soft)", text: "var(--cyan)" },
};

export function StatCard({
  label,
  value,
  unit,
  trend,
  icon: Icon,
  color = "brand",
  size = "md",
  className,
}: StatCardProps) {
  const { bg, text } = colorMap[color];

  const valueSize = size === "lg" ? "32px" : size === "sm" ? "20px" : "26px";

  return (
    <div
      className={cn("panel-border flex flex-col gap-3 p-4", className)}
    >
      <div className="flex items-start justify-between">
        <p className="label-caps">{label}</p>
        {Icon && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: bg }}
          >
            <Icon size={15} style={{ color: text }} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <p
          className="font-mono-num font-semibold leading-none"
          style={{ fontSize: valueSize, color: "var(--text)", letterSpacing: "-0.5px" }}
        >
          {typeof value === "number"
            ? new Intl.NumberFormat("th-TH").format(value)
            : value}
        </p>
        {unit && (
          <p className="mb-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
            {unit}
          </p>
        )}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend > 0 ? (
            <TrendingUp size={12} style={{ color: "var(--success)" }} />
          ) : trend < 0 ? (
            <TrendingDown size={12} style={{ color: "var(--danger)" }} />
          ) : (
            <Minus size={12} style={{ color: "var(--text-sub)" }} />
          )}
          <span
            className="text-xs"
            style={{
              color:
                trend > 0
                  ? "var(--success)"
                  : trend < 0
                    ? "var(--danger)"
                    : "var(--text-sub)",
            }}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        </div>
      )}
    </div>
  );
}
