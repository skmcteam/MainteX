"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";

export interface AdminColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T extends { id: string }> {
  title: string;
  data: T[];
  columns: AdminColumn<T>[];
  searchKeys: (keyof T)[];
  createLabel?: string;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: (row: T) => React.ReactNode;
}

export function AdminTable<T extends { id: string }>({
  title,
  data,
  columns,
  searchKeys,
  createLabel = "สร้างใหม่",
  onCreate,
  onEdit,
  onDelete,
  extraActions,
}: Props<T>) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => {
        const val = row[k];
        return typeof val === "string" && val.toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const hasActions = !!(onEdit || onDelete || extraActions);

  return (
    <div className="panel-border overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "0.5px solid var(--line)" }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
          {title}
          <span className="ml-2 font-normal" style={{ color: "var(--text-sub)" }}>
            ({filtered.length})
          </span>
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-sub)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา..."
              className="rounded-lg py-1.5 pl-7 pr-3 text-xs"
              style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none", width: "160px" }}
            />
          </div>
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white active:scale-95"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={13} />
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Settings} title="ไม่พบข้อมูล" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>
                    {col.label}
                  </th>
                ))}
                {hasActions && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5">
                      {col.render(row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {extraActions?.(row)}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="flex items-center justify-center rounded-md p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1.5 transition-colors hover:bg-panel-2"
                            style={{ color: "var(--text-sub)" }}
                            title="แก้ไข"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="flex items-center justify-center rounded-md p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 transition-colors"
                            style={{ color: "var(--danger)" }}
                            title="ลบ"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
