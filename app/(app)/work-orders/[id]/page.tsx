import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ChevronLeft,
  ClipboardList,
  Wrench,
  Package,
  User,
  Clock,
} from "lucide-react";
import { getWorkOrder, getAvailableParts } from "@/app/(app)/work-orders/actions";
import { WOStatusPill, PriorityPill } from "@/components/shared/status-pill";
import { WOStatusActions } from "@/components/work-orders/wo-status-actions";
import { WOChecklist } from "@/components/work-orders/wo-checklist";
import { WOPartsPanel } from "@/components/work-orders/wo-parts-panel";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const t = await getTranslations("wo");
  const { id } = await params;
  const [wo, availableParts] = await Promise.all([
    getWorkOrder(id),
    getAvailableParts(),
  ]);
  if (!wo) notFound();

  const durationMinutes =
    wo.startTime && wo.endTime
      ? Math.round((new Date(wo.endTime).getTime() - new Date(wo.startTime).getTime()) / 60000)
      : null;

  const durationLabel = durationMinutes != null
    ? durationMinutes >= 60
      ? t("duration.hoursMinutes", { hours: Math.floor(durationMinutes / 60), minutes: durationMinutes % 60 })
      : t("duration.minutesOnly", { minutes: durationMinutes })
    : "-";

  const approvalActionLabel = (action: string) => {
    if (action === "APPROVED") return t("approve");
    if (action === "REJECTED") return t("reject");
    if (action === "RETURNED") return t("return");
    return t("approval.skipped");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/work-orders"
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: "var(--text-sub)" }}
        >
          <ChevronLeft size={14} />
          {t("title")}
        </Link>
        <span className="text-xs" style={{ color: "var(--text-sub)" }}>/</span>
        <span className="text-xs font-medium font-mono-num" style={{ color: "var(--text)" }}>
          {wo.woNumber}
        </span>
      </div>

      {/* Header card */}
      <div className="panel-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-num text-xs font-semibold" style={{ color: "var(--brand)" }}>
                {wo.woNumber}
              </span>
              <WOStatusPill status={wo.status} />
              <PriorityPill priority={wo.priority.code} />
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${wo.type.color}22`, color: wo.type.color }}
              >
                {wo.type.nameTh}
              </span>
            </div>
            <h1 className="mt-2 text-[17px] font-semibold" style={{ color: "var(--text)" }}>
              {wo.title}
            </h1>
            {wo.description && (
              <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>
                {wo.description}
              </p>
            )}
          </div>

          {/* Status actions */}
          <WOStatusActions woId={wo.id} woNumber={wo.woNumber} currentStatus={wo.status} />
        </div>

        {/* Meta row */}
        <div
          className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4"
          style={{ borderColor: "var(--line)" }}
        >
          <Meta label={t("meta.asset")} value={`${wo.asset.code} · ${wo.asset.nameTh}`} />
          <Meta label={t("meta.department")} value={wo.department?.nameTh ?? "-"} />
          <Meta label={t("meta.assignee")} value={wo.assignee?.nameTh ?? t("meta.unassigned")} />
          <Meta label={t("meta.reporter")} value={wo.creator.nameTh} />
          <Meta label={t("meta.openedAt")} value={formatDateTime(wo.createdAt)} />
          <Meta label={t("meta.startedAt")} value={formatDateTime(wo.startTime)} />
          <Meta label={t("meta.completedAt")} value={formatDateTime(wo.endTime)} />
          <Meta label={t("meta.duration")} value={durationLabel} />
        </div>
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Checklist */}
          {wo.checklistItems.length > 0 && (
            <WOChecklist woId={wo.id} items={wo.checklistItems} />
          )}

          {/* Parts used */}
          <WOPartsPanel
            woId={wo.id}
            parts={wo.parts}
            availableParts={availableParts}
            woStatus={wo.status}
          />

          {/* Approvals */}
          {wo.approvals.length > 0 && (
            <Section icon={User} title={t("section.approval")}>
              <div className="flex flex-col gap-2">
                {wo.approvals.map((ap) => (
                  <div
                    key={ap.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: "var(--panel-2)" }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                        {ap.stepNameTh} ({t("approval.step", { number: ap.stepNumber })})
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                        {ap.user?.nameTh ?? t("approval.unassigned")}
                      </p>
                    </div>
                    <div className="text-right">
                      {ap.action ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background: ap.action === "APPROVED" ? "var(--success-soft)" : ap.action === "REJECTED" ? "var(--danger-soft)" : "var(--warning-soft)",
                            color: ap.action === "APPROVED" ? "var(--success)" : ap.action === "REJECTED" ? "var(--danger)" : "var(--warning)",
                          }}
                        >
                          {approvalActionLabel(ap.action)}
                        </span>
                      ) : (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "var(--panel-2)", color: "var(--text-sub)" }}
                        >
                          {t("approval.pending")}
                        </span>
                      )}
                      {ap.actedAt && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
                          {formatDate(ap.actedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Cost summary */}
          <Section icon={Clock} title={t("section.cost")}>
            <div className="flex flex-col gap-2">
              <CostRow label={t("cost.labor")} value={formatCurrency(wo.laborCost)} />
              <CostRow label={t("cost.parts")} value={formatCurrency(wo.totalPartsCost)} />
              {wo.laborCost != null || wo.totalPartsCost != null ? (
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: "0.5px solid var(--line)" }}
                >
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                    {t("cost.total")}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                    {formatCurrency((wo.laborCost ?? 0) + (wo.totalPartsCost ?? 0))}
                  </span>
                </div>
              ) : null}
              {wo.laborHours != null && (
                <CostRow label={t("cost.laborHours")} value={t("cost.laborHoursValue", { hours: wo.laborHours })} />
              )}
            </div>
          </Section>

          {/* Failure codes */}
          {(wo.failureCode || wo.causeCode || wo.actionCode) && (
            <Section icon={Wrench} title={t("section.failureCodes")}>
              {wo.failureCode && (
                <CostRow label={t("failure.label")} value={`${wo.failureCode.code} — ${wo.failureCode.nameTh}`} />
              )}
              {wo.causeCode && (
                <CostRow label={t("failure.cause")} value={`${wo.causeCode.code} — ${wo.causeCode.nameTh}`} />
              )}
              {wo.actionCode && (
                <CostRow label={t("failure.action")} value={`${wo.actionCode.code} — ${wo.actionCode.nameTh}`} />
              )}
            </Section>
          )}

          {/* Notes */}
          {wo.notes && (
            <Section icon={ClipboardList} title={t("section.notes")}>
              <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                {wo.notes}
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-border overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "0.5px solid var(--line)" }}
      >
        <Icon size={14} style={{ color: "var(--brand)" }} />
        <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--text-sub)" }}>{label}</p>
      <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-sub)" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}
