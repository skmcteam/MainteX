"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Search, Plus, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { WOStatusPill, PriorityPill } from "@/components/shared/status-pill";
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
}

export function WorkOrderList({ data, formData }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = data;
    if (tab !== "all") rows = rows.filter((r) => r.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.woNumber.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.asset.code.toLowerCase().includes(q) ||
          r.asset.nameTh.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, tab, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length };
    for (const r of data) {
      c[r.status] = (c[r.status] ?? 0) + 1;
    }
    return c;
  }, [data]);

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
                onClick={() => setTab(t.key)}
                className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: tab === t.key ? "var(--brand)" : "transparent",
                  color: tab === t.key ? "#fff" : "var(--text-sub)",
                }}
              >
                {t.label}
                {counts[t.key] != null && (
                  <span
                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: tab === t.key ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                      color: tab === t.key ? "#fff" : "var(--text-sub)",
                    }}
                  >
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-sub)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา WO# / หัวข้อ..."
                className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
                style={{
                  background: "var(--panel-2)",
                  border: "0.5px solid var(--line)",
                  color: "var(--text)",
                  outline: "none",
                  width: "180px",
                }}
              />
            </div>
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
        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="ไม่พบใบสั่งซ่อม"
            description="ลองเปลี่ยนตัวกรอง หรือสร้างใบสั่งซ่อมใหม่"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {["WO#", "หัวข้อ", "อุปกรณ์", "สถานะ", "ลำดับความสำคัญ", "ประเภท", "ผู้รับผิดชอบ", "วันที่"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-medium"
                      style={{ color: "var(--text-sub)" }}
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((wo) => (
                  <tr
                    key={wo.id}
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                    className="row-hover cursor-pointer"
                    style={{ borderBottom: "0.5px solid var(--line)" }}
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className="font-mono-num font-semibold"
                        style={{ color: "var(--brand)" }}
                      >
                        {wo.woNumber}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" style={{ maxWidth: "240px" }}>
                      <p
                        className="truncate font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {wo.title}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p style={{ color: "var(--text)" }}>{wo.asset.code}</p>
                      <p style={{ color: "var(--text-sub)" }}>{wo.asset.nameTh}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <WOStatusPill status={wo.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <PriorityPill priority={wo.priority.code} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: `${wo.type.color}22`, color: wo.type.color }}
                      >
                        {wo.type.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                      {wo.assignee?.nameTh ?? "—"}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                      {formatDate(wo.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ChevronRight size={14} style={{ color: "var(--text-sub)" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div
            className="px-4 py-2 text-xs"
            style={{ color: "var(--text-sub)", borderTop: "0.5px solid var(--line)" }}
          >
            แสดง {filtered.length} รายการ
          </div>
        )}
      </div>

      <WOFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        formData={formData}
      />
    </>
  );
}
