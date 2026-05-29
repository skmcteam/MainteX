"use client";

import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
