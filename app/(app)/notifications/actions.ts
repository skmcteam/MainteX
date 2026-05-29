"use server";

import { prisma } from "@/lib/prisma";
import { auth, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMyNotifications() {
  const session = await requireAuth();

  const rows = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    titleTh: r.titleTh,
    titleEn: r.titleEn,
    bodyTh: r.bodyTh,
    bodyEn: r.bodyEn,
    link: r.link,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
  }));
}

export type NotificationRow = Awaited<ReturnType<typeof getMyNotifications>>[number];

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/notifications");
  return { success: true };
}

export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return prisma.notification.count({ where: { userId: session.user.id, isRead: false } });
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}
