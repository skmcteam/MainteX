"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Search, Factory, ChevronRight } from "lucide-react";
import { AssetStatusPill, CalStatusPill } from "@/components/shared/status-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import type { AssetRow, AssetFormData } from "@/app/(app)/assets/actions";
import { AssetFormModal } from "./asset-form-modal";
import { formatDate } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "ACTIVE", label: "ใช้งาน" },
  { key: "INACTIVE", label: "ไม่ใช้งาน" },
  { key: "UNDER_REPAIR", label: "ซ่อมบำรุง" },
  { key: "RETIRED", label: "เลิกใช้" },
];

const CATEGORY_LABEL: Record<string, string> = {
  MACHINE: "เครื่องจักร",
  MOLD: "แม่พิมพ์",
  IT: "อุปกรณ์ไอที",
  INSTRUMENT: "เครื่องมือวัด",
};

interface Props {
  data: AssetRow[];
  category: "MACHINE" | "MOLD" | "IT" | "INSTRUMENT";
  formData: AssetFormData;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  statusCounts: Record<string, number>;
  initialQ: string;
  initialStatus: string;
}

export function AssetTable({ data, category, formData, total, page, totalPages, pageSize, statusCounts, initialQ, initialStatus }: Props) {
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
          <div className="flex items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleStatusChange(t.key)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
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
                placeholder="ค้นหารหัส / ชื่อ..."
                className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
                style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "180px" }}
              />
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-95"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={13} />
              เพิ่ม{CATEGORY_LABEL[category]}
            </button>
          </div>
        </div>

        {/* Table */}
        {data.length === 0 ? (
          <EmptyState icon={Factory} title={`ไม่พบ${CATEGORY_LABEL[category]}`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {["รหัส", "ชื่ออุปกรณ์", "สถานะ", "ประเภท/Class", "แผนก"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>{h}</th>
                  ))}
                  {category === "INSTRUMENT" && (
                    <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>สถานะสอบเทียบ</th>
                  )}
                  {category === "MOLD" && (
                    <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>Shot count</th>
                  )}
                  <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>WO / PM</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/assets/${row.id}`)}
                    className="row-hover cursor-pointer"
                    style={{ borderBottom: "0.5px solid var(--line)" }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{row.code}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium" style={{ color: "var(--text)" }}>{row.nameTh}</p>
                      {row.manufacturer && (
                        <p className="mt-0.5" style={{ color: "var(--text-sub)" }}>
                          {row.manufacturer}{row.model ? ` · ${row.model}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5"><AssetStatusPill status={row.status} /></td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{row.assetClass?.nameTh ?? "-"}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                      {row.department?.nameTh ?? "-"}
                      {row.section && <span> · {row.section.nameTh}</span>}
                    </td>
                    {category === "INSTRUMENT" && (
                      <td className="px-4 py-2.5">
                        {row.calStatus ? (
                          <div>
                            <CalStatusPill status={row.calStatus} />
                            {row.nextCalDate && <p className="mt-0.5" style={{ color: "var(--text-sub)" }}>{formatDate(row.nextCalDate)}</p>}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-sub)" }}>-</span>
                        )}
                      </td>
                    )}
                    {category === "MOLD" && (
                      <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                        {row.shotCount != null ? row.shotCount.toLocaleString("th-TH") : "-"}
                        {row.moldLifeShots != null && <span> / {row.moldLifeShots.toLocaleString("th-TH")}</span>}
                      </td>
                    )}
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                      {row._count.workOrders} WO · {row._count.pmPlans} PM
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

        {data.length > 0 && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            label={CATEGORY_LABEL[category]}
            onNavigate={(p) => pushParams({ page: p })}
          />
        )}
      </div>

      <AssetFormModal open={modalOpen} onClose={() => setModalOpen(false)} category={category} formData={formData} />
    </>
  );
}
