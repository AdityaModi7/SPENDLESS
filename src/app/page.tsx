"use client";

import { useEffect, useMemo, useState } from "react";
import PlaidLinkButton from "@/components/PlaidLink";
import { formatCurrency, formatDate, isInDateRange, prettifyCategory, TimePeriod } from "@/lib/utils";

type Tx = {
  id: string;
  account_id: string;
  merchant_name: string;
  name: string;
  amount: number;
  category: string | null;
  date: string;
  account_name: string;
  account_type: string;
};

type Account = {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  current_balance: number;
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<TimePeriod>("week");
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, accountsRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/accounts")
      ]);
      const txJson = await txRes.json();
      const accountsJson = await accountsRes.json();
      setTransactions(txJson.transactions || []);
      setAccounts(accountsJson.accounts || []);
    } finally {
      setLoading(false);
    }
  };

  const connectSandbox = async () => {
    setSandboxLoading(true);
    try {
      const res = await fetch("/api/plaid/sandbox-connect", { method: "POST" });
      if (!res.ok) {
        console.error("Sandbox connect failed:", await res.json());
        return;
      }
      await fetch("/api/plaid/sync-transactions", { method: "POST" });
      await loadData();
    } finally {
      setSandboxLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const spendTransactions = useMemo(
    () => transactions.filter((tx) => tx.amount > 0 && isInDateRange(tx.date, period)),
    [transactions, period]
  );

  const totalSpent = useMemo(
    () => spendTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [spendTransactions]
  );

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of spendTransactions) {
      const key = tx.category || "OTHER";
      totals.set(key, (totals.get(key) || 0) + tx.amount);
    }
    return [...totals.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [spendTransactions]);

  const maxCategoryAmount = byCategory[0]?.amount || 1;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-5 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">SpendLens</p>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={connectSandbox}
            disabled={sandboxLoading}
            className="rounded-lg border border-amber-500 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
          >
            {sandboxLoading ? "Connecting..." : "Sandbox"}
          </button>
          <PlaidLinkButton onConnected={loadData} />
        </div>
      </header>

      <section className="flex gap-2">
        {(["week", "month"] as TimePeriod[]).map((value) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              period === value
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {value === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total spent {period === "week" ? "this week" : "this month"}
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(totalSpent)}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {spendTransactions.length} transaction{spendTransactions.length === 1 ? "" : "s"}
        </p>
      </section>

      {accounts.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-medium">Accounts</h2>
          <div className="mt-3 space-y-2 text-sm">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between">
                <span className="truncate pr-3">
                  {account.name}
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    {account.subtype || account.type}
                  </span>
                </span>
                <span className="font-medium">{formatCurrency(account.current_balance)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-medium">By Category</h2>
        <div className="mt-4 space-y-3">
          {byCategory.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No spending yet in this period.</p>
          )}
          {byCategory.map((item) => {
            const width = Math.max((item.amount / maxCategoryAmount) * 100, 6);
            return (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-3">{prettifyCategory(item.category)}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-slate-900 dark:bg-slate-200" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-medium">Transactions</h2>
        <div className="mt-3 space-y-2 text-sm">
          {spendTransactions.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400">No transactions yet in this period.</p>
          )}
          {spendTransactions.map((tx) => (
            <div key={tx.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800">
              <div className="min-w-0">
                <p className="truncate font-medium">{tx.merchant_name || tx.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(tx.date)} • {prettifyCategory(tx.category)} • {tx.account_name}
                </p>
              </div>
              <p className="shrink-0 font-medium">{formatCurrency(tx.amount)}</p>
            </div>
          ))}
        </div>
      </section>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>}
    </main>
  );
}
