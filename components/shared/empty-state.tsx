import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)" }}
      >
        <Icon size={20} style={{ color: "var(--text-sub)" }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {title}
        </p>
        {description && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
