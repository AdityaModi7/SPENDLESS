"use client";

import { formatCurrency } from "@/lib/utils";
import { FormEvent, useState } from "react";

type Settings = {
  monthly_income: number;
  savings_goal_percent: number;
  warning_threshold_percent: number;
  monthly_essentials: number;
};

type Props = {
  settings: Settings;
  monthSpend: number;
  onSaved: (settings: Settings) => void;
};

export default function SavingsGoalCard({ settings, monthSpend, onSaved }: Props) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  const goalSavings = (form.monthly_income * form.savings_goal_percent) / 100;
  const totalSpendCap = Math.max(form.monthly_income - goalSavings, 0);
  const lifestyleCap = Math.max(totalSpendCap - form.monthly_essentials, 0);
  const warningAt = (lifestyleCap * form.warning_threshold_percent) / 100;

  const status =
    lifestyleCap === 0
      ? "neutral"
      : monthSpend > lifestyleCap
        ? "over"
        : monthSpend >= warningAt
          ? "warning"
          : "ok";

  const message =
    status === "over"
      ? `Over target by ${formatCurrency(monthSpend - lifestyleCap)}. Reduce spending this month to protect your savings goal.`
      : status === "warning"
        ? `Approaching your limit. ${formatCurrency(lifestyleCap - monthSpend)} left before hitting your target cap.`
        : `On track. ${formatCurrency(Math.max(lifestyleCap - monthSpend, 0))} remaining in your target spend cap.`;

  const bannerStyle =
    status === "over"
      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
      : status === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
        : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        monthly_income: Number(form.monthly_income),
        savings_goal_percent: Number(form.savings_goal_percent),
        warning_threshold_percent: Number(form.warning_threshold_percent),
        monthly_essentials: Number(form.monthly_essentials)
      };

      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      onSaved(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Monthly Savings Goal</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set your target and get alerts as you approach or exceed your monthly spend cap.</p>

      <div className={`mt-4 rounded-lg border p-3 text-sm ${bannerStyle}`}>{message}</div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <p>Month Spend: <span className="font-medium">{formatCurrency(monthSpend)}</span></p>
        <p>Target Savings: <span className="font-medium">{formatCurrency(goalSavings)}</span></p>
        <p>Essentials: <span className="font-medium">{formatCurrency(form.monthly_essentials)}</span></p>
        <p>Lifestyle Cap: <span className="font-medium">{formatCurrency(lifestyleCap)}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="text-sm">
          Monthly Income
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.monthly_income}
            onChange={(event) => setForm((prev) => ({ ...prev, monthly_income: Number(event.target.value) }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
          />
        </label>

        <label className="text-sm">
          Monthly Essentials
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.monthly_essentials}
            onChange={(event) => setForm((prev) => ({ ...prev, monthly_essentials: Number(event.target.value) }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
          />
        </label>

        <label className="text-sm">
          Savings Goal (%)
          <input
            type="number"
            min={0}
            max={100}
            step="1"
            value={form.savings_goal_percent}
            onChange={(event) => setForm((prev) => ({ ...prev, savings_goal_percent: Number(event.target.value) }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
          />
        </label>

        <label className="text-sm">
          Warning At (%)
          <input
            type="number"
            min={1}
            max={100}
            step="1"
            value={form.warning_threshold_percent}
            onChange={(event) => setForm((prev) => ({ ...prev, warning_threshold_percent: Number(event.target.value) }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300 sm:col-span-4"
        >
          {saving ? "Saving..." : "Save Goal Settings"}
        </button>
      </form>
    </section>
  );
}
