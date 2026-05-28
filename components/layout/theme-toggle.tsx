"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("maintex-theme") as "light" | "dark" | null;
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("maintex-theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-panel-2"
      aria-label={theme === "light" ? "เปิดโหมดกลางคืน" : "เปิดโหมดกลางวัน"}
    >
      {theme === "light" ? (
        <Moon size={15} style={{ color: "var(--text-sub)" }} />
      ) : (
        <Sun size={15} style={{ color: "var(--text-sub)" }} />
      )}
    </button>
  );
}
