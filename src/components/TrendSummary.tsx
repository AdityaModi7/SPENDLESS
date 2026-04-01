import { formatCurrency } from "@/lib/utils";

type Point = {
  label: string;
  amount: number;
};

type Props = {
  weeklyTotals: Point[];
  monthlyTotals: Point[];
};

export default function TrendSummary({ weeklyTotals, monthlyTotals }: Props) {
  const max = Math.max(1, ...monthlyTotals.map((point) => point.amount));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Weekly & Monthly Summaries</h2>

      <div className="mt-4 space-y-2 text-sm">
        {weeklyTotals.map((week) => (
          <p key={week.label}>{week.label}: <span className="font-medium">{formatCurrency(week.amount)}</span></p>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Monthly lifestyle trend</p>
        <div className="flex items-end gap-2 overflow-x-auto pb-1">
          {monthlyTotals.map((month) => (
            <div key={month.label} className="min-w-14 text-center">
              <div className="mx-auto flex h-28 w-8 items-end rounded bg-slate-200 dark:bg-slate-800">
                <div
                  className="w-8 rounded bg-slate-900 dark:bg-slate-200"
                  style={{ height: `${Math.max((month.amount / max) * 100, 4)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{month.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
