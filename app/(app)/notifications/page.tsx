export const dynamic = "force-dynamic";

import { getLocale } from "next-intl/server";
import { getMyNotifications } from "./actions";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const [notifications, locale] = await Promise.all([
    getMyNotifications(),
    getLocale(),
  ]);

  return <NotificationsClient notifications={notifications} locale={locale} />;
}
