import { formatCurrency } from "@/lib/utils";

type Props = {
  total: number;
  periodLabel: "This Week" | "This Month";
};

export default function SpendingSummary({ total, periodLabel }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{periodLabel} Spending</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{formatCurrency(total)}</h1>
    </section>
  );
}
