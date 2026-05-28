"use client";

import { useSidebar } from "@/store/sidebar";

export function SidebarMargin({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className="transition-all duration-200"
      style={{ marginLeft: collapsed ? "56px" : "var(--sidebar-w)" }}
    >
      {children}
    </div>
  );
}
