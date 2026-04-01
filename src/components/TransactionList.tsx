import { formatCurrency, formatDate } from "@/lib/utils";

type Transaction = {
  id: string;
  merchant_name: string;
  amount: number;
  category: string;
  date: string;
  account_name: string;
};

type Props = {
  transactions: Transaction[];
};

export default function TransactionList({ transactions }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Recent Transactions</h2>
      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {transactions.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No transactions found.</p>
        )}
        {transactions.map((tx) => (
          <div key={tx.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{tx.merchant_name || "Unknown merchant"}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{tx.category} • {tx.account_name}</p>
              </div>
              <p className="font-medium">{formatCurrency(tx.amount)}</p>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(tx.date)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
