import { formatCurrency } from "@/lib/utils";

type AllocationTotals = {
  essentials: number;
  lifestyle: number;
  investments: number;
  savings: number;
};

type Props = {
  lifestyleSpent: number;
  lifestyleBudget: number;
  warningPercent: number;
  allocationTotals: AllocationTotals;
};

export default function LifestyleHero({
  lifestyleSpent,
  lifestyleBudget,
  warningPercent,
  allocationTotals
}: Props) {
  const progress = lifestyleBudget > 0 ? (lifestyleSpent / lifestyleBudget) * 100 : 0;
  const status = progress >= 100 ? "over" : progress >= warningPercent ? "warning" : "ok";

  const barClass =
    status === "over"
      ? "bg-red-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Budget Overview</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Lifestyle spent this month: {formatCurrency(lifestyleSpent)} / {formatCurrency(lifestyleBudget)}
      </h1>

      <div className="mt-4 h-3 rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-3 rounded-full ${barClass}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <p>Essentials: <span className="font-medium">{formatCurrency(allocationTotals.essentials)}</span></p>
        <p>Lifestyle: <span className="font-medium">{formatCurrency(allocationTotals.lifestyle)}</span></p>
        <p>Investments: <span className="font-medium">{formatCurrency(allocationTotals.investments)}</span></p>
        <p>Savings: <span className="font-medium">{formatCurrency(allocationTotals.savings)}</span></p>
      </div>
    </section>
  );
}
