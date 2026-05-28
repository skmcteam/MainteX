import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md", className)}
      style={{ background: "var(--panel-2)", ...style }}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Page title area */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>

      {/* Table card */}
      <div className="panel-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
          <div className="flex gap-2">
            {[80, 60, 70, 55, 65].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-lg" style={{ width: `${w}px` }} />
            ))}
          </div>
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel-border overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
