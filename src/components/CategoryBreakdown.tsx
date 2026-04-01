import { formatCurrency } from "@/lib/utils";

type CategoryItem = {
  category: string;
  amount: number;
};

type Props = {
  categories: CategoryItem[];
  lifestyleBudget: number;
};

export default function CategoryBreakdown({ categories, lifestyleBudget }: Props) {
  const max = categories[0]?.amount || 1;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Spending by Category</h2>
      <div className="mt-4 space-y-3">
        {categories.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No spending yet in this period.</p>
        )}
        {categories.map((item) => {
          const width = Math.max((item.amount / max) * 100, 6);
          return (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate pr-3">{item.category}</span>
                <span className="font-medium">
                  {formatCurrency(item.amount)}
                  {lifestyleBudget > 0 ? ` • ${((item.amount / lifestyleBudget) * 100).toFixed(1)}%` : ""}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-slate-900 dark:bg-slate-200" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
