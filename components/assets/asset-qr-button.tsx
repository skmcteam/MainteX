"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Printer } from "lucide-react";

interface Props {
  assetCode: string;
  assetName: string;
  assetId: string;
}

export function AssetQRButton({ assetCode, assetName, assetId }: Props) {
  const [open, setOpen] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/assets/${assetId}`
    : `/assets/${assetId}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const svg = document.getElementById("asset-qr-svg")?.outerHTML ?? "";
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <title>QR — ${assetCode}</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .label { border: 1.5px solid #ccc; border-radius: 8px; padding: 16px 24px; text-align: center; }
          h2 { margin: 0 0 4px; font-size: 18px; }
          p { margin: 0 0 12px; font-size: 12px; color: #666; }
          svg { display: block; margin: 0 auto; }
          .code { margin-top: 8px; font-size: 13px; font-family: monospace; font-weight: bold; }
        </style>
      </head><body>
        <div class="label">
          <h2>${assetName}</h2>
          <p>SKMC Factory — MainteX</p>
          ${svg}
          <div class="code">${assetCode}</div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
        style={{ borderColor: "var(--line)", color: "var(--text-sub)", background: "var(--panel-2)" }}
      >
        <QrCode size={13} />
        QR Code
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-64 -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 text-center"
            style={{ background: "var(--panel)", border: "0.5px solid var(--line)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                QR Code
              </Dialog.Title>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-sub)" }}><X size={16} /></button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG
                  id="asset-qr-svg"
                  value={url}
                  size={160}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="font-mono-num text-sm font-bold" style={{ color: "var(--text)" }}>{assetCode}</p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{assetName}</p>
              </div>
              <button
                onClick={handlePrint}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-white"
                style={{ background: "var(--brand)" }}
              >
                <Printer size={13} />
                พิมพ์ QR Label
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
