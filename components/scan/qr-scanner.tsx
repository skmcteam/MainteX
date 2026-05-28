"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Keyboard, ArrowRight, Camera, CameraOff } from "lucide-react";

export function QRScanner() {
  const router = useRouter();
  const scannerRef = useRef<unknown>(null);
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "found" | "error">("idle");
  const [lastScan, setLastScan] = useState("");
  const [cameraError, setCameraError] = useState("");
  const divId = "qr-scanner-div";

  useEffect(() => {
    if (mode !== "camera") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let html5QrCode: any = null;

    async function startScanner() {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        html5QrCode = new Html5QrcodeScanner(
          divId,
          { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
          false
        );
        html5QrCode.render(
          (decodedText: string) => {
            setLastScan(decodedText);
            setStatus("found");
            handleResult(decodedText);
          },
          (_error: unknown) => { /* ignore scan errors */ }
        );
        setStatus("scanning");
      } catch (_err) {
        setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาใช้การพิมพ์รหัสแทน");
        setMode("manual");
      }
    }

    startScanner();
    return () => {
      try { html5QrCode?.clear(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleResult(text: string) {
    const trimmed = text.trim();
    // If it's a full URL path like /assets/machines/[id]
    if (trimmed.startsWith("/assets/") || trimmed.includes("/assets/")) {
      const match = trimmed.match(/\/assets\/([^/]+)\/([^/?]+)/);
      if (match) { router.push(`/assets/${match[1]}/${match[2]}`); return; }
    }
    // If it looks like an asset code, search across categories
    router.push(`/assets/machines?q=${encodeURIComponent(trimmed)}`);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleResult(manualCode.trim());
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("camera")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
          style={{
            background: mode === "camera" ? "var(--brand)" : "var(--panel-2)",
            color: mode === "camera" ? "#fff" : "var(--text-sub)",
            border: "0.5px solid var(--line)",
          }}
        >
          <Camera size={16} /> กล้อง
        </button>
        <button
          onClick={() => setMode("manual")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
          style={{
            background: mode === "manual" ? "var(--brand)" : "var(--panel-2)",
            color: mode === "manual" ? "#fff" : "var(--text-sub)",
            border: "0.5px solid var(--line)",
          }}
        >
          <Keyboard size={16} /> พิมพ์รหัส
        </button>
      </div>

      {mode === "camera" && (
        <div className="panel-border overflow-hidden rounded-2xl">
          {cameraError ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <CameraOff size={32} style={{ color: "var(--danger)" }} />
              <p className="text-sm" style={{ color: "var(--danger)" }}>{cameraError}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-sub)" }}>
                <ScanLine size={14} />
                <span>{status === "found" ? `พบ: ${lastScan}` : "กำลังสแกน..."}</span>
              </div>
              <div id={divId} className="w-full max-w-sm" />
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <div className="panel-border rounded-2xl p-6">
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>พิมพ์รหัสอุปกรณ์</p>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="เช่น SK-P-001"
              autoFocus
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "var(--panel-2)",
                border: "0.5px solid var(--line)",
                color: "var(--text)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              เปิดอุปกรณ์ <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
