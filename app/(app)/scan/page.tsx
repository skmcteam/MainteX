import { QRScanner } from "@/components/scan/qr-scanner";
export default function ScanPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>สแกน QR Code</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>สแกน QR เพื่อเปิดหน้ารายละเอียดอุปกรณ์</p>
      </div>
      <QRScanner />
    </div>
  );
}
