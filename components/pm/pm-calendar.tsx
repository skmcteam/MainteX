"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PMRow } from "@/app/(app)/pm-schedule/actions";
import { daysUntil } from "@/lib/utils";

interface Props { data: PMRow[]; }

function getDueColor(nextDueDate: string | null) {
  const days = daysUntil(nextDueDate);
  if (days == null) return "var(--text-sub)";
  if (days < 0) return "var(--danger)";
  if (days <= 14) return "var(--warning)";
  return "var(--brand)";
}

export function PMCalendar({ data }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map day → PM plans due that day
  const pmByDay: Record<number, PMRow[]> = {};
  for (const pm of data) {
    if (!pm.nextDueDate) continue;
    const d = new Date(pm.nextDueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!pmByDay[day]) pmByDay[day] = [];
      pmByDay[day].push(pm);
    }
  }

  const MONTH_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const DAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  // Build cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="panel-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
        <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-2" style={{ color: "var(--text-sub)" }}>
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {MONTH_TH[month]} {year}
        </p>
        <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-2" style={{ color: "var(--text-sub)" }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--line)" }}>
        {DAY_TH.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-medium" style={{ color: "var(--text-sub)" }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const isToday = day !== null && day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const pms = day ? (pmByDay[day] ?? []) : [];
          return (
            <div
              key={idx}
              className="min-h-[72px] p-1"
              style={{ borderRight: (idx + 1) % 7 !== 0 ? "0.5px solid var(--line)" : undefined, borderBottom: idx < cells.length - 7 ? "0.5px solid var(--line)" : undefined }}
            >
              {day && (
                <>
                  <div
                    className="mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                    style={isToday ? { background: "var(--brand)", color: "#fff" } : { color: "var(--text-sub)" }}
                  >
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {pms.slice(0, 2).map((pm) => (
                      <div
                        key={pm.id}
                        className="truncate rounded px-1 py-0.5 text-[9px] font-medium"
                        style={{ background: getDueColor(pm.nextDueDate) + "22", color: getDueColor(pm.nextDueDate) }}
                        title={`${pm.asset.code} — ${pm.frequency.nameTh}`}
                      >
                        {pm.asset.code}
                      </div>
                    ))}
                    {pms.length > 2 && (
                      <div className="text-[9px]" style={{ color: "var(--text-sub)" }}>+{pms.length - 2}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2" style={{ borderTop: "0.5px solid var(--line)" }}>
        {[
          { label: "เกินกำหนด", color: "var(--danger)" },
          { label: "ใกล้ถึงกำหนด (≤14 วัน)", color: "var(--warning)" },
          { label: "ปกติ", color: "var(--brand)" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-sub)" }}>
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
