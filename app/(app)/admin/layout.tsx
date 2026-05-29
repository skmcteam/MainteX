import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Guard the entire /admin subtree — only SYSTEM_ADMIN may enter.
// Write actions already call requireRole() individually; this adds
// a UI-level gate so non-admins never see admin pages at all.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "SYSTEM_ADMIN") redirect("/dashboard");
  return <>{children}</>;
}
