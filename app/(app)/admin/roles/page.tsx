import { getRoles } from "@/app/(app)/admin/actions";
import { StatusPill } from "@/components/shared/status-pill";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const roles = await getRoles();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>บทบาทและสิทธิ์</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>บทบาทที่กำหนดในระบบ (System roles ไม่สามารถแก้ไขได้)</p>
      </div>
      <div className="panel-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--line)" }}>
              {["รหัส", "ชื่อบทบาท", "ประเภท", "ผู้ใช้งาน"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-sub)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
                <td className="px-4 py-2.5 font-mono-num font-semibold" style={{ color: "var(--brand)" }}>{r.code}</td>
                <td className="px-4 py-2.5">
                  <p className="font-medium" style={{ color: "var(--text)" }}>{r.nameTh}</p>
                  <p style={{ color: "var(--text-sub)" }}>{r.nameEn}</p>
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill label={r.isSystem ? "ระบบ" : "กำหนดเอง"} color={r.isSystem ? "brand" : "neutral"} />
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--text-sub)" }}>{r._count.users} คน</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
