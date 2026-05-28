// Locale configuration — used by request.ts for locale detection.
// We do NOT use next-intl's routing middleware to avoid path rewriting issues.
export const routing = {
  locales: ["th", "en"] as const,
  defaultLocale: "th" as const,
};

export type Locale = (typeof routing.locales)[number];
