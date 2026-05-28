"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertTriangle size={32} style={{ color: "var(--danger)" }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>เกิดข้อผิดพลาด</p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-sub)" }}>{error.message || "ไม่สามารถโหลดข้อมูลได้"}</p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-white"
        style={{ background: "var(--brand)" }}
      >
        <RefreshCw size={13} /> ลองใหม่
      </button>
    </div>
  );
}
