import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function createNotificationEvent({
  event,
  type,
  titleTh,
  titleEn,
  bodyTh,
  bodyEn,
  link,
}: {
  event: string;
  type: NotificationType;
  titleTh: string;
  titleEn: string;
  bodyTh?: string;
  bodyEn?: string;
  link?: string;
}) {
  try {
    const rules = await prisma.notificationRule.findMany({
      where: { event, isActive: true, channel: "in_app" },
    });
    if (rules.length === 0) return;

    const userIdArrays = await Promise.all(
      rules.map(async (rule) => {
        const users = await prisma.user.findMany({
          where: {
            isActive: true,
            ...(rule.audience !== "ALL" ? { role: { code: rule.audience } } : {}),
          },
          select: { id: true },
        });
        return users.map((u) => u.id);
      })
    );

    const uniqueIds = [...new Set(userIdArrays.flat())];
    if (uniqueIds.length === 0) return;

    await prisma.notification.createMany({
      data: uniqueIds.map((userId) => ({
        userId,
        type,
        titleTh,
        titleEn,
        bodyTh: bodyTh ?? null,
        bodyEn: bodyEn ?? null,
        link: link ?? null,
        isRead: false,
      })),
    });
  } catch {
    // Notification failures must never break the calling mutation
  }
}
