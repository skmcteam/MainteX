"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { bottomNav } from "./nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch sm:hidden"
      style={{
        background: "var(--panel)",
        borderTop: "0.5px solid var(--line)",
      }}
    >
      {bottomNav.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname === ""
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-95"
          >
            <Icon
              size={20}
              style={{ color: isActive ? "var(--brand)" : "var(--text-sub)" }}
            />
            <span
              className={cn("text-center", isActive ? "font-medium" : "")}
              style={{
                fontSize: "10px",
                color: isActive ? "var(--brand)" : "var(--text-sub)",
                lineHeight: 1.2,
              }}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
