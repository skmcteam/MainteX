import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  // Locale priority: 1) cookie, 2) Accept-Language, 3) default
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale = routing.defaultLocale as string;
  if (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    const acceptLang = headerStore.get("Accept-Language") ?? "";
    if (acceptLang.startsWith("en")) locale = "en";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
