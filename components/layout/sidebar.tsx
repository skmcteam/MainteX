"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/store/sidebar";
import { mainNav, assetNav, secondaryNav } from "./nav-items";

type NavItem = {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>;
  labelKey: string;
};

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();

  const isActive =
    item.href === "/"
      ? pathname === "/" || pathname === ""
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? t(item.labelKey) : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        isActive
          ? "text-brand bg-brand-soft"
          : "hover:bg-panel-2 text-sub hover:text-primary"
      )}
      style={
        isActive
          ? { color: "var(--brand)", background: "var(--brand-soft)" }
          : {}
      }
    >
      <Icon
        size={16}
        className={cn("shrink-0", isActive ? "text-brand" : "text-sub")}
        style={isActive ? { color: "var(--brand)" } : { color: "var(--text-sub)" }}
      />
      {!collapsed && (
        <span className="truncate" style={{ color: isActive ? "var(--brand)" : "var(--text)" }}>
          {t(item.labelKey)}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <div className="mb-1">
      {!collapsed && (
        <p className="label-caps mb-1.5 px-3">{label}</p>
      )}
      {collapsed && <div className="my-2 border-t" style={{ borderColor: "var(--line)" }} />}
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink key={item.key} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const t = useTranslations();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col transition-all duration-200"
      style={{
        width: collapsed ? "56px" : "var(--sidebar-w)",
        background: "var(--panel)",
        borderRight: "0.5px solid var(--line)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-[var(--topbar-h)] items-center gap-3 px-3"
        style={{ borderBottom: "0.5px solid var(--line)" }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--brand)", color: "var(--on-brand)" }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.5px", lineHeight: 1 }}>M</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
              MainteX
            </p>
            <p className="label-caps truncate" style={{ fontSize: "9.5px" }}>
              Maintenance System
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <NavSection label={t("nav.dashboard")} items={mainNav} collapsed={collapsed} />
        <NavSection label={t("nav.assets")} items={assetNav} collapsed={collapsed} />
        <NavSection label="" items={secondaryNav} collapsed={collapsed} />
      </nav>

      {/* Collapse toggle */}
      <div
        className="px-2 pb-3"
        style={{ borderTop: "0.5px solid var(--line)", paddingTop: "8px" }}
      >
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs transition-all hover:bg-panel-2"
          style={{ color: "var(--text-sub)" }}
          aria-label={collapsed ? "ขยาย sidebar" : "ย่อ sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <>
              <ChevronLeft size={14} />
              <span>ย่อ</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
