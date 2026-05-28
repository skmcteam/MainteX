"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Factory, ChevronRight } from "lucide-react";
import { AssetStatusPill, CalStatusPill } from "@/components/shared/status-pill";
import { EmptyState } from "@/components/shared/empty-state";
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
}

export function AssetTable({ data, category, formData }: Props) {
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
          r.code.toLowerCase().includes(q) ||
          r.nameTh.toLowerCase().includes(q) ||
          r.nameEn.toLowerCase().includes(q) ||
          (r.manufacturer ?? "").toLowerCase().includes(q) ||
          (r.model ?? "").toLowerCase().includes(q)
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "0.5px solid var(--line)" }}
        >
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
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
                        background:
                          tab === t.key ? "rgba(255,255,255,0.25)" : "var(--panel-2)",
                        color: tab === t.key ? "#fff" : "var(--text-sub)",
                      }}
                    >
                      {counts[t.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-sub)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหารหัส / ชื่อ..."
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
            {/* New button */}
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
        {filtered.length === 0 ? (
          <EmptyState icon={Factory} title={`ไม่พบ${CATEGORY_LABEL[category]}`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                  <th
                    className="px-4 py-2.5 text-left font-medium"
                    style={{ color: "var(--text-sub)" }}
                  >
                    รหัส
                  </th>
                  <th
                    className="px-4 py-2.5 text-left font-medium"
                    style={{ color: "var(--text-sub)" }}
                  >
                    ชื่ออุปกรณ์
                  </th>
                  <th
                    className="px-4 py-2.5 text-left font-medium"
                    style={{ color: "var(--text-sub)" }}
                  >
                    สถานะ
                  </th>
                  <th
                    className="px-4 py-2.5 text-left font-medium"
                    style={{ color: "var(--text-sub)" }}
                  >
                    ประเภท/Class
                  </th>
                  <th
                    className="px-4 py-2.5 text-left font-medium"
                    style={{ color: "var(--text-sub)" }}
                  >
                    แผนก
                  </th>
                  {category === "INSTRUMENT" && (
                    <th
                      className="px-4 py-2.5 text-left font-medium"
                      style={{ color: "var(--text-sub)" }}
                    >
                      สถานะสอบเทียบ
                    </th>
                  )}
                  {category === "MOLD" && (
                    <th
                      className="px-4 py-2.5 text-left font-medium"
                      style={{ color: "var(--text-sub)" }}
                    >
                      Shot count
                    </th>
                  )}
                  <th
                    className="px-4 py-2.5 text-left font-medium"
                    style={{ color: "var(--text-sub)" }}
                  >
                    WO / PM
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/assets/${row.id}`)}
                    className="row-hover cursor-pointer"
                    style={{ borderBottom: "0.5px solid var(--line)" }}
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className="font-mono-num font-semibold"
                        style={{ color: "var(--brand)" }}
                      >
                        {row.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium" style={{ color: "var(--text)" }}>
                        {row.nameTh}
                      </p>
                      {row.manufacturer && (
                        <p className="mt-0.5" style={{ color: "var(--text-sub)" }}>
                          {row.manufacturer}
                          {row.model ? ` · ${row.model}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <AssetStatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                      {row.assetClass?.nameTh ?? "-"}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                      {row.department?.nameTh ?? "-"}
                      {row.section && (
                        <span> · {row.section.nameTh}</span>
                      )}
                    </td>
                    {category === "INSTRUMENT" && (
                      <td className="px-4 py-2.5">
                        {row.calStatus ? (
                          <div>
                            <CalStatusPill status={row.calStatus} />
                            {row.nextCalDate && (
                              <p className="mt-0.5" style={{ color: "var(--text-sub)" }}>
                                {formatDate(row.nextCalDate)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-sub)" }}>-</span>
                        )}
                      </td>
                    )}
                    {category === "MOLD" && (
                      <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>
                        {row.shotCount != null ? row.shotCount.toLocaleString("th-TH") : "-"}
                        {row.moldLifeShots != null && (
                          <span> / {row.moldLifeShots.toLocaleString("th-TH")}</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <span style={{ color: "var(--text-sub)" }}>
                        {row._count.workOrders} WO · {row._count.pmPlans} PM
                      </span>
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

        {/* Footer count */}
        {filtered.length > 0 && (
          <div
            className="px-4 py-2 text-xs"
            style={{ color: "var(--text-sub)", borderTop: "0.5px solid var(--line)" }}
          >
            แสดง {filtered.length} รายการ
          </div>
        )}
      </div>

      <AssetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={category}
        formData={formData}
      />
    </>
  );
}
