import type { Metadata, Viewport } from "next";
import { getMessages, getLocale } from "next-intl/server";
import { type AbstractIntlMessages } from "next-intl";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKMC CMMS",
  description: "Computerized Maintenance Management System — SKMC Factory",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SKMC CMMS" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1218" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers messages={messages as AbstractIntlMessages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
