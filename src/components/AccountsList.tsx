import { formatCurrency } from "@/lib/utils";

type Account = {
  id: string;
  name: string;
  custom_name: string | null;
  type: string;
  subtype: string | null;
  current_balance: number;
};

type Props = {
  accounts: Account[];
};

export default function AccountsList({ accounts }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Accounts Overview</h2>
      <div className="mt-4 space-y-3">
        {accounts.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No connected accounts yet.</p>
        )}
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div>
              <p className="font-medium">{account.custom_name || account.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {account.type}{account.subtype ? ` • ${account.subtype}` : ""}
              </p>
            </div>
            <p className="font-medium">{formatCurrency(account.current_balance ?? 0)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
