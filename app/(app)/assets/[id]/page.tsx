import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Cpu,
  Wrench,
  CalendarCheck,
  Package,
  Info,
} from "lucide-react";
import { getAsset, getAssetFormData } from "@/app/(app)/assets/actions";
import { AssetStatusPill, CalStatusPill, WOStatusPill, PriorityPill } from "@/components/shared/status-pill";
import { AssetEditButton } from "@/components/assets/asset-edit-button";
import { AssetQRButton } from "@/components/assets/asset-qr-button";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_HREF: Record<string, string> = {
  MACHINE: "/assets/machines",
  MOLD: "/assets/molds",
  IT: "/assets/it",
  INSTRUMENT: "/assets/instruments",
};

const CATEGORY_LABEL: Record<string, string> = {
  MACHINE: "เครื่องจักร",
  MOLD: "แม่พิมพ์",
  IT: "อุปกรณ์ไอที",
  INSTRUMENT: "เครื่องมือวัด",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();
  const formData = await getAssetFormData(asset.category as "MACHINE" | "MOLD" | "IT" | "INSTRUMENT");

  const backHref = CATEGORY_HREF[asset.category] ?? "/assets/machines";
  const catLabel = CATEGORY_LABEL[asset.category] ?? "อุปกรณ์";

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: "var(--text-sub)" }}
        >
          <ChevronLeft size={14} />
          {catLabel}
        </Link>
        <span className="text-xs" style={{ color: "var(--text-sub)" }}>/</span>
        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
          {asset.code}
        </span>
      </div>

      {/* Header */}
      <div
        className="panel-border p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="font-mono-num text-xs font-semibold"
                style={{ color: "var(--brand)" }}
              >
                {asset.code}
              </span>
              <AssetStatusPill status={asset.status} />
              {asset.calStatus && <CalStatusPill status={asset.calStatus} />}
            </div>
            <h1
              className="mt-1.5 text-[17px] font-semibold"
              style={{ color: "var(--text)" }}
            >
              {asset.nameTh}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              {asset.nameEn}
              {asset.manufacturer && ` · ${asset.manufacturer}`}
              {asset.model && ` ${asset.model}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AssetQRButton assetCode={asset.code} assetName={asset.nameTh} assetId={asset.id} />
            <AssetEditButton asset={asset} formData={formData} />
          </div>
        </div>

        {/* Quick stat row */}
        <div
          className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4"
          style={{ borderColor: "var(--line)" }}
        >
          <QuickStat label="แผนก" value={asset.department?.nameTh ?? "-"} />
          <QuickStat label="ส่วนงาน" value={asset.section?.nameTh ?? "-"} />
          <QuickStat label="ประเภท" value={asset.assetClass?.nameTh ?? "-"} />
          <QuickStat label="วันที่ติดตั้ง" value={formatDate(asset.installDate)} />
        </div>
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Info */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Section icon={Info} title="ข้อมูลทั่วไป">
            <InfoRow label="Serial No." value={asset.serialNumber} />
            <InfoRow label="ราคาซื้อ" value={formatCurrency(asset.purchaseCost)} />
            <InfoRow label="วันที่ซื้อ" value={formatDate(asset.purchaseDate)} />
            <InfoRow label="ประกันหมด" value={formatDate(asset.warrantyExpiry)} />
            {asset.description && (
              <div className="pt-1">
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                  {asset.description}
                </p>
              </div>
            )}
          </Section>

          {/* Category-specific info */}
          {asset.category === "MACHINE" && (
            <Section icon={Cpu} title="ข้อมูลเครื่องจักร">
              <InfoRow label="ชั่วโมงเดิน" value={asset.machineHours != null ? `${formatNumber(asset.machineHours)} ชม.` : null} />
              <InfoRow label="กำลัง" value={asset.powerKw != null ? `${asset.powerKw} kW` : null} />
              <InfoRow label="แรงดัน" value={asset.voltage != null ? `${asset.voltage} V` : null} />
            </Section>
          )}

          {asset.category === "MOLD" && (
            <Section icon={Cpu} title="ข้อมูลแม่พิมพ์">
              <InfoRow label="Shot count" value={asset.shotCount != null ? formatNumber(asset.shotCount) : null} />
              <InfoRow label="จำนวนช่อง" value={asset.cavityCount != null ? `${asset.cavityCount} Cavity` : null} />
              <InfoRow label="อายุการใช้งาน" value={asset.moldLifeShots != null ? `${formatNumber(asset.moldLifeShots)} shots` : null} />
            </Section>
          )}

          {asset.category === "IT" && (
            <Section icon={Cpu} title="ข้อมูล IT">
              <InfoRow label="IP Address" value={asset.ipAddress} />
              <InfoRow label="MAC Address" value={asset.macAddress} />
              <InfoRow label="OS" value={asset.osVersion} />
            </Section>
          )}

          {asset.category === "INSTRUMENT" && (
            <Section icon={Cpu} title="ข้อมูลการสอบเทียบ">
              <InfoRow label="ประเภทเครื่องมือ" value={asset.instrumentType?.nameTh} />
              <InfoRow label="ห้องปฏิบัติการ" value={asset.calLab?.nameTh} />
              <InfoRow label="รอบสอบเทียบ" value={asset.calPeriodMonths != null ? `${asset.calPeriodMonths} เดือน` : null} />
              <InfoRow label="สอบเทียบล่าสุด" value={formatDate(asset.lastCalDate)} />
              <InfoRow label="ครั้งถัดไป" value={formatDate(asset.nextCalDate)} />
            </Section>
          )}
        </div>

        {/* Right: Related data */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Work Orders */}
          <Section icon={Wrench} title={`ใบสั่งซ่อม (${asset.workOrders.length})`}>
            {asset.workOrders.length === 0 ? (
              <p className="py-2 text-xs" style={{ color: "var(--text-sub)" }}>
                ไม่มีใบสั่งซ่อม
              </p>
            ) : (
              <div className="flex flex-col gap-0">
                {asset.workOrders.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="row-hover flex items-center justify-between rounded-lg px-2 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono-num text-xs font-semibold"
                        style={{ color: "var(--brand)" }}
                      >
                        {wo.woNumber}
                      </span>
                      <WOStatusPill status={wo.status} />
                      <PriorityPill priority={wo.priority.code} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "var(--text)" }}>
                        {wo.title.length > 30 ? `${wo.title.slice(0, 30)}…` : wo.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                        {formatDate(wo.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          {/* PM Plans */}
          <Section icon={CalendarCheck} title={`แผน PM (${asset.pmPlans.length})`}>
            {asset.pmPlans.length === 0 ? (
              <p className="py-2 text-xs" style={{ color: "var(--text-sub)" }}>
                ไม่มีแผน PM
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {asset.pmPlans.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2"
                    style={{ background: "var(--panel-2)" }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                        {pm.frequency.nameTh}
                      </p>
                      {pm.checklistTemplate && (
                        <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                          Checklist: {pm.checklistTemplate.nameTh}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "var(--warning)" }}>
                        ถัดไป: {formatDate(pm.nextDueDate)}
                      </p>
                      {pm.lastDoneDate && (
                        <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                          ล่าสุด: {formatDate(pm.lastDoneDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Calibration history (INSTRUMENT only) */}
          {asset.category === "INSTRUMENT" && (
            <Section icon={Cpu} title={`ประวัติสอบเทียบ (${asset.calibrations.length})`}>
              {asset.calibrations.length === 0 ? (
                <p className="py-2 text-xs" style={{ color: "var(--text-sub)" }}>
                  ยังไม่มีประวัติสอบเทียบ
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {asset.calibrations.map((cal) => (
                    <div
                      key={cal.id}
                      className="flex items-start justify-between rounded-lg px-2 py-2"
                      style={{ borderBottom: "0.5px solid var(--line)" }}
                    >
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                          {formatDate(cal.calDate)}
                        </p>
                        {cal.certNumber && (
                          <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                            Cert: {cal.certNumber}
                          </p>
                        )}
                        {cal.lab && (
                          <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                            Lab: {cal.lab.nameTh}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                          ถัดไป: {formatDate(cal.nextCalDate)}
                        </p>
                        {cal.result && (
                          <p
                            className="text-xs font-medium"
                            style={{
                              color: cal.result === "PASS" ? "var(--success)" : "var(--danger)",
                            }}
                          >
                            {cal.result}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Spare Parts */}
          {asset.spareParts.length > 0 && (
            <Section icon={Package} title={`อะไหล่ที่เกี่ยวข้อง (${asset.spareParts.length})`}>
              <div className="flex flex-col gap-1">
                {asset.spareParts.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-center justify-between px-2 py-1.5"
                    style={{ borderBottom: "0.5px solid var(--line)" }}
                  >
                    <div>
                      <span
                        className="font-mono-num text-xs font-semibold"
                        style={{ color: "var(--brand)" }}
                      >
                        {sp.sparePart.code}
                      </span>
                      <span className="ml-2 text-xs" style={{ color: "var(--text)" }}>
                        {sp.sparePart.nameTh}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-sub)" }}>
                      คงเหลือ {sp.sparePart.stockOnHand} {sp.sparePart.unit?.code ?? ""}
                    </span>
                  </div>
                ))}
              </div>
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1">
      <span className="text-xs" style={{ color: "var(--text-sub)" }}>
        {label}
      </span>
      <span className="text-right text-xs font-medium" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--text-sub)" }}>
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}
