import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ClipboardList,
  Wrench,
  Package,
  User,
  Clock,
} from "lucide-react";
import { getWorkOrder } from "@/app/(app)/work-orders/actions";
import { WOStatusPill, PriorityPill } from "@/components/shared/status-pill";
import { WOStatusActions } from "@/components/work-orders/wo-status-actions";
import { WOChecklist } from "@/components/work-orders/wo-checklist";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const wo = await getWorkOrder(id);
  if (!wo) notFound();

  const durationMinutes =
    wo.startTime && wo.endTime
      ? Math.round((new Date(wo.endTime).getTime() - new Date(wo.startTime).getTime()) / 60000)
      : null;

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
          ใบสั่งซ่อม
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
          <Meta label="อุปกรณ์" value={`${wo.asset.code} · ${wo.asset.nameTh}`} />
          <Meta label="แผนก" value={wo.department?.nameTh ?? "-"} />
          <Meta label="ผู้รับผิดชอบ" value={wo.assignee?.nameTh ?? "ยังไม่ระบุ"} />
          <Meta label="ผู้แจ้ง" value={wo.creator.nameTh} />
          <Meta label="วันที่เปิด" value={formatDateTime(wo.createdAt)} />
          <Meta label="เริ่มดำเนินการ" value={formatDateTime(wo.startTime)} />
          <Meta label="เสร็จสิ้น" value={formatDateTime(wo.endTime)} />
          <Meta
            label="ระยะเวลา"
            value={
              durationMinutes != null
                ? durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)} ชม. ${durationMinutes % 60} นาที`
                  : `${durationMinutes} นาที`
                : "-"
            }
          />
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
          {wo.parts.length > 0 && (
            <Section icon={Package} title={`อะไหล่ที่ใช้ (${wo.parts.length})`}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                    {["รหัส", "ชื่ออะไหล่", "จำนวน", "ต้นทุน"].map((h) => (
                      <th
                        key={h}
                        className="pb-2 text-left font-medium"
                        style={{ color: "var(--text-sub)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wo.parts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                      <td className="py-2 font-mono-num" style={{ color: "var(--brand)" }}>
                        {p.sparePart.code}
                      </td>
                      <td className="py-2" style={{ color: "var(--text)" }}>
                        {p.sparePart.nameTh}
                      </td>
                      <td className="py-2" style={{ color: "var(--text)" }}>
                        {p.quantity} {p.sparePart.unit?.code ?? ""}
                      </td>
                      <td className="py-2" style={{ color: "var(--text)" }}>
                        {p.unitCost ? formatCurrency(p.quantity * p.unitCost) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Approvals */}
          {wo.approvals.length > 0 && (
            <Section icon={User} title="การอนุมัติ">
              <div className="flex flex-col gap-2">
                {wo.approvals.map((ap) => (
                  <div
                    key={ap.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: "var(--panel-2)" }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                        {ap.stepNameTh} (ขั้นที่ {ap.stepNumber})
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                        {ap.user?.nameTh ?? "ยังไม่ระบุผู้อนุมัติ"}
                      </p>
                    </div>
                    <div className="text-right">
                      {ap.action ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background:
                              ap.action === "APPROVED"
                                ? "var(--success-soft)"
                                : ap.action === "REJECTED"
                                ? "var(--danger-soft)"
                                : "var(--warning-soft)",
                            color:
                              ap.action === "APPROVED"
                                ? "var(--success)"
                                : ap.action === "REJECTED"
                                ? "var(--danger)"
                                : "var(--warning)",
                          }}
                        >
                          {ap.action === "APPROVED"
                            ? "อนุมัติ"
                            : ap.action === "REJECTED"
                            ? "ไม่อนุมัติ"
                            : ap.action === "RETURNED"
                            ? "ส่งคืน"
                            : "ข้าม"}
                        </span>
                      ) : (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "var(--panel-2)", color: "var(--text-sub)" }}
                        >
                          รอการอนุมัติ
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
          <Section icon={Clock} title="สรุปต้นทุน">
            <div className="flex flex-col gap-2">
              <CostRow label="ค่าแรง" value={formatCurrency(wo.laborCost)} />
              <CostRow label="ค่าอะไหล่" value={formatCurrency(wo.totalPartsCost)} />
              {wo.laborCost != null || wo.totalPartsCost != null ? (
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: "0.5px solid var(--line)" }}
                >
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                    รวม
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                    {formatCurrency((wo.laborCost ?? 0) + (wo.totalPartsCost ?? 0))}
                  </span>
                </div>
              ) : null}
              {wo.laborHours != null && (
                <CostRow label="ชั่วโมงแรงงาน" value={`${wo.laborHours} ชม.`} />
              )}
            </div>
          </Section>

          {/* Failure codes */}
          {(wo.failureCode || wo.causeCode || wo.actionCode) && (
            <Section icon={Wrench} title="รหัสความเสียหาย">
              {wo.failureCode && (
                <CostRow label="รหัสความเสีย" value={`${wo.failureCode.code} — ${wo.failureCode.nameTh}`} />
              )}
              {wo.causeCode && (
                <CostRow label="สาเหตุ" value={`${wo.causeCode.code} — ${wo.causeCode.nameTh}`} />
              )}
              {wo.actionCode && (
                <CostRow label="การแก้ไข" value={`${wo.actionCode.code} — ${wo.actionCode.nameTh}`} />
              )}
            </Section>
          )}

          {/* Notes */}
          {wo.notes && (
            <Section icon={ClipboardList} title="หมายเหตุ">
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
      <p className="text-xs" style={{ color: "var(--text-sub)" }}>
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-sub)" }}>
        {label}
      </span>
      <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
