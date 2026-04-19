import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

export type TimePeriod = "week" | "month";

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

export function prettifyCategory(category: string | null | undefined): string {
  if (!category) {
    return "Other";
  }
  return category
    .split("_")
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && lower === "and") {
        return "and";
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function getDateRange(period: TimePeriod): { start: Date; end: Date } {
  if (period === "month") {
    return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
  }

  return {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  };
}

export function isInDateRange(date: string, period: TimePeriod): boolean {
  const parts = date.split("-");
  const value = parts.length === 3
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date(date);
  const range = getDateRange(period);
  return value >= range.start && value <= range.end;
}
