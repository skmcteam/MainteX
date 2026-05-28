import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";
import { th } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BKK = "Asia/Bangkok";

export function toBkkTime(date: Date | string): Date {
  return toZonedTime(new Date(date), BKK);
}

export function formatDate(date: Date | string | null | undefined, fmt = "dd MMM yyyy"): string {
  if (!date) return "-";
  return format(toBkkTime(new Date(date)), fmt, { locale: th });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(toBkkTime(new Date(date)), "dd MMM yyyy HH:mm", { locale: th });
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: th });
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function generateWONumber(pattern: string, lastNumber: number): string {
  const now = toBkkTime(new Date());
  const yy = format(now, "yy");
  const mm = format(now, "MM");
  const seq = String(lastNumber + 1).padStart(4, "0");
  return pattern
    .replace("{YY}", yy)
    .replace("{MM}", mm)
    .replace("{####}", seq);
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
