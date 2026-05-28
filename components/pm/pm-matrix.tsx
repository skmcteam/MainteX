"use client";

import type { PMRow } from "@/app/(app)/pm-schedule/actions";
import { daysUntil, formatDate } from "@/lib/utils";

interface Props { data: PMRow[]; }

const FREQ_COLS = [
  { key: "ทุกเดือน", label: "M", title: "ทุกเดือน" },
  { key: "ทุก 3 เดือน", label: "3M", title: "ทุก 3 เดือน" },
  { key: "ทุก 6 เดือน", label: "6M", title: "ทุก 6 เดือน" },
  { key: "ทุกปี", label: "1Y", title: "ทุกปี" },
];

function cellStyle(pm: PMRow | undefined): { bg: string; text: string; label: string } {
  if (!pm) return { bg: "transparent", text: "var(--text-disabled)", label: "—" };
  const days = daysUntil(pm.nextDueDate);
  if (days == null) return { bg: "var(--panel-2)", text: "var(--text-sub)", label: "—" };
  if (days < 0) return { bg: "var(--danger-soft)", text: "var(--danger)", label: `${Math.abs(days)}d` };
  if (days <= 14) return { bg: "var(--warning-soft)", text: "var(--warning)", label: `${days}d` };
  return { bg: "var(--success-soft)", text: "var(--success)", label: `${days}d` };
}

export function PMMatrix({ data }: Props) {
  // Group by asset
  const assetMap = new Map<string, { assetCode: string; assetName: string; plans: Map<string, PMRow> }>();

  for (const pm of data) {
    const key = pm.asset.code;
    if (!assetMap.has(key)) {
      assetMap.set(key, { assetCode: pm.asset.code, assetName: pm.asset.nameTh, plans: new Map() });
    }
    assetMap.get(key)!.plans.set(pm.frequency.nameTh, pm);
  }

  const assets = Array.from(assetMap.values()).sort((a, b) => a.assetCode.localeCompare(b.assetCode));

  return (
    <div className="panel-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
              <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>อุปกรณ์</th>
              {FREQ_COLS.map((f) => (
                <th key={f.key} className="px-3 py-2.5 text-center font-medium" style={{ color: "var(--text-sub)" }}>
                  <div>{f.label}</div>
                  <div className="text-[9px] font-normal" style={{ color: "var(--text-sub)" }}>{f.title}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.assetCode} style={{ borderBottom: "0.5px solid var(--line)" }}>
                <td className="px-4 py-2.5">
                  <p className="font-semibold" style={{ color: "var(--text)" }}>{asset.assetCode}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>{asset.assetName}</p>
                </td>
                {FREQ_COLS.map((f) => {
                  const pm = asset.plans.get(f.key);
                  const { bg, text, label } = cellStyle(pm);
                  return (
                    <td key={f.key} className="px-3 py-2.5 text-center">
                      {pm ? (
                        <div
                          className="mx-auto inline-flex flex-col items-center rounded-lg px-2 py-1 min-w-[52px]"
                          style={{ background: bg }}
                          title={pm.nextDueDate ? formatDate(pm.nextDueDate) : undefined}
                        >
                          <span className="font-semibold text-[11px]" style={{ color: text }}>{label}</span>
                          {pm.nextDueDate && <span className="text-[9px]" style={{ color: text }}>{new Date(pm.nextDueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-disabled)" }}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2" style={{ borderTop: "0.5px solid var(--line)" }}>
        {[
          { label: "เกินกำหนด", bg: "var(--danger-soft)", text: "var(--danger)" },
          { label: "ใกล้ถึงกำหนด (≤14 วัน)", bg: "var(--warning-soft)", text: "var(--warning)" },
          { label: "ปกติ", bg: "var(--success-soft)", text: "var(--success)" },
        ].map(({ label, bg, text }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-sub)" }}>
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: bg, border: `0.5px solid ${text}` }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
