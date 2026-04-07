import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

export type TimePeriod = "week" | "month" | "pay-period" | "all-time";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string): string {
  return format(new Date(value), "MMM d");
}

export function getDateRange(period: TimePeriod): { start: Date; end: Date } {
  if (period === "all-time") {
    return { start: new Date("2000-01-01"), end: new Date() };
  }

  if (period === "month") {
    return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
  }

  if (period === "pay-period") {
    const now = new Date();
    if (now.getDate() <= 15) {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59) };
    }

    return {
      start: new Date(now.getFullYear(), now.getMonth(), 16),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    };
  }

  return {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  };
}

export function isInDateRange(date: string, period: TimePeriod): boolean {
  // Parse date-only strings (YYYY-MM-DD) as local time, not UTC
  const parts = date.split("-");
  const value = parts.length === 3
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date(date);
  const range = getDateRange(period);
  return value >= range.start && value <= range.end;
}
