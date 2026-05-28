"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ClipboardList, Search, Plus, ChevronRight, Download } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { EmptyState } from "@/components/shared/empty-state";
import { WOStatusPill, PriorityPill } from "@/components/shared/status-pill";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { WOFormModal } from "./wo-form-modal";
import { formatDate } from "@/lib/utils";
import type { WORow, WOFormData } from "@/app/(app)/work-orders/actions";

const STATUS_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "OPEN", label: "เปิด" },
  { key: "IN_PROGRESS", label: "กำลังดำเนินการ" },
  { key: "ON_HOLD", label: "พัก" },
  { key: "DONE", label: "เสร็จสิ้น" },
  { key: "CANCELLED", label: "ยกเลิก" },
];

interface Props {
  data: WORow[];
  formData: WOFormData;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  statusCounts: Record<string, number>;
  initialQ: string;
  initialStatus: string;
}

export function WorkOrderList({ data, formData, total, page, totalPages, pageSize, statusCounts, initialQ, initialStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [modalOpen, setModalOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pushParams = (overrides: { q?: string; status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const q = overrides.q ?? search;
    const s = overrides.status ?? status;
    const p = overrides.page ?? 1;
    if (q) params.set("q", q);
    if (s !== "all") params.set("status", s);
    if (p > 1) params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ q: value, page: 1 }), 350);
  };

  const handleStatusChange = (s: string) => {
    setStatus(s);
    pushParams({ status: s, page: 1 });
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <>
      <div className="panel-border overflow-hidden">
        {/* Tabs + Search + Button */}
        <div
          className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2"
          style={{ borderBottom: "0.5px solid var(--line)" }}
        >
          <div className="flex flex-1 items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleStatusChange(t.key)}
                className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: status === t.key ? "var(--brand)" : "transparent",
                  color: status === t.key ? "#fff" : "var(--text-sub)",
                }}
              >
                {t.label}
                {statusCounts[t.key] != null && (
                  <span
                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: status === t.key ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                      color: status === t.key ? "#fff" : "var(--text-sub)",
                    }}
                  >
                    {statusCounts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }} />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="ค้นหา WO# / หัวข้อ..."
                className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
                style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "180px" }}
              />
            </div>
            <button
              onClick={() => downloadCSV(`work-orders-${new Date().toISOString().slice(0, 10)}.csv`, data.map((r) => ({ "WO#": r.woNumber, หัวข้อ: r.title, อุปกรณ์: r.asset.code, สถานะ: r.status, ลำดับความสำคัญ: r.priority.code, ประเภท: r.type.code, ผู้รับผิดชอบ: r.assignee?.nameTh ?? "", วันที่: r.createdAt })))}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--panel-2)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-95"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={13} />
              สร้างใบสั่งซ่อม
            </button>
          </div>
        </div>

        {/* Table */}
        {data.length === 0 ? (
          <EmptyState icon={ClipboardList} title="ไม่พบใบสั่งซ่อม" description="ลองเปลี่ยนตัวกรอง หรือสร้างใบสั่งซ่อมใหม่" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {["WO#", "หัวข้อ", "อุปกรณ์", "สถานะ", "ลำดับความสำคัญ", "ประเภท", "ผู้รับผิดชอบ", "วันที่"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data.map((wo) => (
                  <tr
                    key={wo.id}
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                    className="row-hover cursor-pointer"
                    style={{ borderBottom: "0.5px solid var(--line)" }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{wo.woNumber}</span>
                    </td>
                    <td className="px-4 py-2.5" style={{ maxWidth: "240px" }}>
                      <p className="truncate font-medium" style={{ color: "var(--text)" }}>{wo.title}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p style={{ color: "var(--text)" }}>{wo.asset.code}</p>
                      <p style={{ color: "var(--text-sub)" }}>{wo.asset.nameTh}</p>
                    </td>
                    <td className="px-4 py-2.5"><WOStatusPill status={wo.status} /></td>
                    <td className="px-4 py-2.5"><PriorityPill priority={wo.priority.code} /></td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${wo.type.color}22`, color: wo.type.color }}>
                        {wo.type.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{wo.assignee?.nameTh ?? "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{formatDate(wo.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <ChevronRight size={14} style={{ color: "var(--text-sub)" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.length > 0 && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            label="ใบสั่งซ่อม"
            onNavigate={(p) => pushParams({ page: p })}
          />
        )}
      </div>

      <WOFormModal open={modalOpen} onClose={() => setModalOpen(false)} formData={formData} />
    </>
  );
}
