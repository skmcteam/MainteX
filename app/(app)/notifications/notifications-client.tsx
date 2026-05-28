"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  Bell, AlertTriangle, Wrench, Gauge, Package, CheckCircle, Clock, Info
} from "lucide-react";
import { toast } from "sonner";
import type { NotificationRow } from "./actions";
import { markNotificationRead, markAllNotificationsRead } from "./actions";
import { useNotificationStore } from "@/store/notifications";

const TYPE_ICON: Record<string, React.ReactNode> = {
  URGENT_WO: <AlertTriangle size={15} style={{ color: "var(--danger)" }} />,
  PM_DUE: <Wrench size={15} style={{ color: "var(--brand)" }} />,
  CAL_DUE: <Gauge size={15} style={{ color: "var(--warning)" }} />,
  CAL_OVERDUE: <Gauge size={15} style={{ color: "var(--danger)" }} />,
  PARTS_LOW: <Package size={15} style={{ color: "var(--warning)" }} />,
  WO_APPROVAL: <CheckCircle size={15} style={{ color: "var(--success)" }} />,
  WO_OVERDUE: <Clock size={15} style={{ color: "var(--danger)" }} />,
  SYSTEM: <Info size={15} style={{ color: "var(--text-sub)" }} />,
};

interface Props {
  notifications: NotificationRow[];
  locale: string;
}

export function NotificationsClient({ notifications, locale }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { decrement, setUnreadCount } = useNotificationStore();

  async function handleMarkRead(n: NotificationRow) {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      decrement();
    }
    if (n.link) router.push(n.link);
  }

  async function handleMarkAll() {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    await markAllNotificationsRead();
    setUnreadCount(0);
    if (unreadCount > 0) toast.success(t("notifications.markAllRead"));
    router.refresh();
  }

  const unread = notifications.filter((n) => !n.isRead).length;
  const isTh = locale === "th";

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} style={{ color: "var(--text)" }} />
          <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            {t("notifications.title")}
          </h1>
          {unread > 0 && (
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white"
              style={{ background: "var(--danger)" }}
            >
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs transition-all hover:underline"
            style={{ color: "var(--brand)" }}
          >
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {/* List */}
      <div className="panel-border rounded-xl overflow-hidden divide-y" style={{ borderColor: "var(--line)" }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Bell size={32} style={{ color: "var(--text-sub)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--text-sub)" }}>
              {t("notifications.noNotifications")}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleMarkRead(n)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-all hover:bg-panel-2"
              style={{
                background: n.isRead ? "transparent" : "color-mix(in srgb, var(--brand) 5%, transparent)",
              }}
            >
              <div className="mt-0.5 flex-shrink-0">
                {TYPE_ICON[n.type] ?? <Bell size={15} style={{ color: "var(--text-sub)" }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
                  {isTh ? n.titleTh : (n.titleEn || n.titleTh)}
                </p>
                {(isTh ? n.bodyTh : n.bodyEn) && (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>
                    {isTh ? n.bodyTh : n.bodyEn}
                  </p>
                )}
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-sub)" }}>
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: isTh ? th : undefined,
                  })}
                </p>
              </div>
              {!n.isRead && (
                <div
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
