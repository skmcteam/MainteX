import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarMargin } from "@/components/layout/sidebar-margin";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id?: string }).id;
  const unreadCount = userId
    ? await prisma.notification.count({ where: { userId, isRead: false } })
    : 0;

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    nameTh?: string;
    nameEn?: string;
    role?: string;
  };

  return (
    <>
      <Sidebar />
      <Topbar
        userNameTh={user.nameTh}
        userNameEn={user.nameEn || user.name || undefined}
        userRole={user.role}
        userEmail={user.email || undefined}
        initialUnreadCount={unreadCount}
      />

      <main
        id="main-content"
        className="min-h-screen transition-all duration-200"
        style={{ paddingTop: "var(--topbar-h)", paddingBottom: "72px" }}
      >
        <SidebarMargin>
          <div className="p-4 md:p-6">{children}</div>
        </SidebarMargin>
      </main>

      <BottomNav />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--panel)",
            border: "0.5px solid var(--line)",
            color: "var(--text)",
            fontSize: "13px",
          },
        }}
      />
    </>
  );
}
