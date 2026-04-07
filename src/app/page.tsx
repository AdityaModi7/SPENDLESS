"use client";

import { useEffect, useMemo, useState } from "react";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import CreditCardsPanel from "@/components/CreditCardsPanel";
import DailySpendingLog from "@/components/DailySpendingLog";
import LifestyleHero from "@/components/LifestyleHero";
import PlaidLinkButton from "@/components/PlaidLink";
import SavingsGoalCard from "@/components/SavingsGoalCard";
import TrendSummary from "@/components/TrendSummary";
import TripsPanel from "@/components/TripsPanel";
import { SIMPLIFIED_CATEGORIES } from "@/lib/budget";
import { isInDateRange, formatCurrency, TimePeriod } from "@/lib/utils";
import { format } from "date-fns";

type Account = {
  id: string;
  name: string;
  custom_name: string | null;
  type: string;
  subtype: string | null;
  current_balance: number;
};

type Tx = {
  id: string;
  account_id: string;
  merchant_name: string;
  name: string;
  amount: number;
  simplified_category: string | null;
  allocation_bucket: string | null;
  is_lifestyle: boolean;
  trip_id: number | null;
  category: string;
  date: string;
  account_name: string;
  account_type: string;
  current_balance: number;
};

type Settings = {
  monthly_income: number;
  savings_goal_percent: number;
  warning_threshold_percent: number;
  yearly_event_budget: number;
  monthly_essentials: number;
};

type Trip = {
  id: number;
  name: string;
  created_at: string;
};

type DashboardResponse = {
  accounts: Account[];
  transactions: Tx[];
  trips: Trip[];
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<TimePeriod>("week");
  const [data, setData] = useState<DashboardResponse>({ accounts: [], transactions: [], trips: [] });
  const [settings, setSettings] = useState<Settings>({
    monthly_income: 4656,
    savings_goal_percent: 60,
    warning_threshold_percent: 35,
    yearly_event_budget: 2500,
    monthly_essentials: 1363
  });
  const [loading, setLoading] = useState(true);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const lifestyleBudget = Math.max(
    settings.monthly_income - (settings.monthly_income * settings.savings_goal_percent / 100) - settings.monthly_essentials,
    0
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsRes, txRes, settingsRes, tripsRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/transactions"),
        fetch("/api/settings"),
        fetch("/api/trips")
      ]);
      const accountsJson = await accountsRes.json();
      const txJson = await txRes.json();
      const settingsJson = await settingsRes.json();
      const tripsJson = await tripsRes.json();
      setData({
        accounts: accountsJson.accounts || [],
        transactions: txJson.transactions || [],
        trips: tripsJson.trips || []
      });
      if (settingsJson.settings) {
        setSettings(settingsJson.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  const connectSandbox = async () => {
    setSandboxLoading(true);
    try {
      const res = await fetch("/api/plaid/sandbox-connect", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        console.error("Sandbox connect failed:", err);
        return;
      }
      // Sync transactions after connecting
      await fetch("/api/plaid/sync-transactions", { method: "POST" });
      await loadData();
    } finally {
      setSandboxLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lifestyleTransactions = useMemo(
    () => data.transactions.filter((tx) => tx.is_lifestyle && tx.amount > 0),
    [data.transactions]
  );

  const filteredLifestyleTransactions = useMemo(
    () => lifestyleTransactions.filter((tx) => isInDateRange(tx.date, period)),
    [lifestyleTransactions, period]
  );

  const monthLifestyleTransactions = useMemo(
    () => lifestyleTransactions.filter((tx) => isInDateRange(tx.date, "month")),
    [lifestyleTransactions]
  );

  const monthAllTransactions = useMemo(
    () => data.transactions.filter((tx) => isInDateRange(tx.date, "month") && tx.amount > 0),
    [data.transactions]
  );

  const lifestyleSpentThisMonth = useMemo(
    () => monthLifestyleTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [monthLifestyleTransactions]
  );

  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of filteredLifestyleTransactions) {
      const category = tx.simplified_category || "Other";
      totals.set(category, (totals.get(category) || 0) + tx.amount);
    }
    return SIMPLIFIED_CATEGORIES.map((category) => ({ category, amount: totals.get(category) || 0 }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [filteredLifestyleTransactions]);

  const allocationTotals = useMemo(() => {
    return monthAllTransactions.reduce(
      (acc, tx) => {
        const bucket = tx.allocation_bucket || "Lifestyle";
        if (bucket === "Essentials") {
          acc.essentials += tx.amount;
        } else if (bucket === "Investments") {
          acc.investments += tx.amount;
        } else if (bucket === "Savings") {
          acc.savings += tx.amount;
        } else {
          acc.lifestyle += tx.amount;
        }
        return acc;
      },
      { essentials: 0, lifestyle: 0, investments: 0, savings: 0 }
    );
  }, [monthAllTransactions]);

  const creditCards = useMemo(() => {
    const cardAccounts = data.accounts.filter((account) => account.type === "credit");
    return cardAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      custom_name: account.custom_name,
      current_balance: account.current_balance,
      period_spend: filteredLifestyleTransactions
        .filter((tx) => tx.account_id === account.id)
        .reduce((sum, tx) => sum + tx.amount, 0)
    }));
  }, [data.accounts, filteredLifestyleTransactions]);

  const weeklyTotals = useMemo(() => {
    const byWeek = new Map<string, number>();
    for (const tx of monthLifestyleTransactions) {
      const weekLabel = format(new Date(tx.date), "'Week' I");
      byWeek.set(weekLabel, (byWeek.get(weekLabel) || 0) + tx.amount);
    }
    return [...byWeek.entries()].map(([label, amount]) => ({ label, amount }));
  }, [monthLifestyleTransactions]);

  const monthlyTotals = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const tx of lifestyleTransactions) {
      const label = format(new Date(tx.date), "MMM yy");
      byMonth.set(label, (byMonth.get(label) || 0) + tx.amount);
    }
    return [...byMonth.entries()]
      .map(([label, amount]) => ({ label, amount }))
      .slice(-8);
  }, [lifestyleTransactions]);

  const tripTotalsByTrip = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const totals = new Map<number, number>();
    for (const tx of data.transactions) {
      if (!tx.trip_id) {
        continue;
      }
      const txYear = new Date(tx.date).getFullYear();
      if (txYear !== thisYear) {
        continue;
      }
      totals.set(tx.trip_id, (totals.get(tx.trip_id) || 0) + tx.amount);
    }
    return [...totals.entries()].map(([id, total]) => ({ id, total }));
  }, [data.transactions]);

  const rothYtd = useMemo(
    () => data.transactions
      .filter((tx) => {
        const text = `${tx.merchant_name || ""} ${tx.name || ""}`.toLowerCase();
        return text.includes("roth") || text.includes("ira");
      })
      .reduce((sum, tx) => sum + tx.amount, 0),
    [data.transactions]
  );

  const brokerageYtd = useMemo(
    () => data.transactions
      .filter((tx) => {
        const text = `${tx.merchant_name || ""} ${tx.name || ""}`.toLowerCase();
        return text.includes("schwab") || text.includes("brokerage") || text.includes("swvxx");
      })
      .reduce((sum, tx) => sum + tx.amount, 0),
    [data.transactions]
  );

  const savingsYtd = useMemo(
    () => data.transactions
      .filter((tx) => (tx.allocation_bucket || "") === "Savings")
      .reduce((sum, tx) => sum + tx.amount, 0),
    [data.transactions]
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">SpendLens</p>
          <h1 className="text-2xl font-semibold tracking-tight">Personal Finance Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={connectSandbox}
            disabled={sandboxLoading}
            className="rounded-lg border border-amber-500 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
          >
            {sandboxLoading ? "Connecting..." : "Connect Sandbox Account"}
          </button>
          <PlaidLinkButton onConnected={loadData} />
        </div>
      </header>

      <section className="flex gap-2">
        <button
          onClick={() => setPeriod("week")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            period === "week"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            period === "month"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriod("pay-period")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            period === "pay-period"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          This Pay Period
        </button>
        <button
          onClick={() => setPeriod("all-time")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            period === "all-time"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          All Time
        </button>
      </section>

      <LifestyleHero
        lifestyleSpent={lifestyleSpentThisMonth}
        lifestyleBudget={lifestyleBudget}
        warningPercent={settings.warning_threshold_percent}
        allocationTotals={allocationTotals}
      />

      <SavingsGoalCard
        settings={settings}
        monthSpend={lifestyleSpentThisMonth}
        onSaved={(updated) =>
          setSettings((prev) => ({
            ...prev,
            ...updated
          }))
        }
      />

      <DailySpendingLog transactions={filteredLifestyleTransactions} trips={data.trips} onUpdated={loadData} />

      <CategoryBreakdown categories={categories} lifestyleBudget={lifestyleBudget} />

      <CreditCardsPanel cards={creditCards} onRenamed={loadData} />

      <TripsPanel
        trips={data.trips}
        totalsByTrip={tripTotalsByTrip}
        yearlyBudget={settings.yearly_event_budget}
        onCreated={loadData}
      />

      <TrendSummary weeklyTotals={weeklyTotals} monthlyTotals={monthlyTotals} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-medium">Savings & Investment Tracker</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>Roth IRA (YTD): <span className="font-medium">${rothYtd.toFixed(2)} / $7,000</span></p>
          <p>Brokerage (YTD): <span className="font-medium">${brokerageYtd.toFixed(2)}</span></p>
          <p>Savings transfers (YTD): <span className="font-medium">${savingsYtd.toFixed(2)}</span></p>
        </div>
      </section>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading data...</p>}
    </main>
  );
}
