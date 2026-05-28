"use client";

import { Bell, LogOut, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { useNotificationStore } from "@/store/notifications";
import { useSidebar } from "@/store/sidebar";

interface TopbarProps {
  userNameTh?: string;
  userNameEn?: string;
  userRole?: string;
  userEmail?: string;
}

export function Topbar({ userNameTh, userNameEn, userRole, userEmail }: TopbarProps) {
  const t = useTranslations();
  const unread = useNotificationStore((s) => s.unreadCount);
  const { collapsed } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-[var(--topbar-h)] items-center gap-2 px-4 transition-all duration-200"
      style={{
        left: collapsed ? "56px" : "var(--sidebar-w)",
        background: "var(--panel)",
        borderBottom: "0.5px solid var(--line)",
      }}
    >
      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />

        {/* Notifications */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-panel-2"
          aria-label={t("notifications.title")}
        >
          <Bell size={15} style={{ color: "var(--text-sub)" }} />
          {unread > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white"
              style={{ background: "var(--danger)" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px" style={{ background: "var(--line)" }} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all hover:bg-panel-2"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              {(userNameTh || userNameEn || "U").charAt(0)}
            </div>
            <div className="hidden flex-col items-start sm:flex">
              <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                {userNameTh || userNameEn || "User"}
              </span>
              <span className="label-caps" style={{ fontSize: "9.5px" }}>
                {userRole}
              </span>
            </div>
            <ChevronDown size={12} style={{ color: "var(--text-sub)" }} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg py-1"
                style={{
                  background: "var(--panel)",
                  border: "0.5px solid var(--line)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                <div className="border-b px-3 py-2" style={{ borderColor: "var(--line)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                    {userNameTh}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-all hover:bg-panel-2"
                  style={{ color: "var(--danger)" }}
                >
                  <LogOut size={13} />
                  {t("auth.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
