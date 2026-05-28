import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Mail, Shield, Building2, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, department: true, section: true },
  });
  if (!user) redirect("/login");

  function Field({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; value?: string | null }) {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
        <Icon size={15} style={{ color: "var(--text-sub)", marginTop: 1 }} />
        <div>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>{label}</p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text)" }}>{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>โปรไฟล์</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>ข้อมูลบัญชีผู้ใช้งาน</p>
      </div>

      <div className="panel-border overflow-hidden rounded-2xl">
        {/* Avatar header */}
        <div className="flex items-center gap-4 p-6" style={{ borderBottom: "0.5px solid var(--line)", background: "var(--panel-2)" }}>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: "var(--brand)" }}
          >
            {user.nameTh.charAt(0)}
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>{user.nameTh}</p>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>{user.nameEn}</p>
            <span
              className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              {user.role.nameTh}
            </span>
          </div>
        </div>

        <div className="px-6 py-2">
          <Field icon={Mail} label="อีเมล" value={user.email} />
          <Field icon={Phone} label="เบอร์โทร" value={user.phone} />
          <Field icon={Shield} label="บทบาท" value={`${user.role.nameTh} (${user.role.code})`} />
          <Field icon={Building2} label="แผนก" value={user.department?.nameTh} />
          <Field icon={Building2} label="หน่วยงาน" value={user.section?.nameTh} />
        </div>
      </div>
    </div>
  );
}
