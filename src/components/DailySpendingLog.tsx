"use client";

import { SIMPLIFIED_CATEGORIES } from "@/lib/budget";
import { formatCurrency } from "@/lib/utils";
import { format, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";

type Tx = {
  id: string;
  merchant_name: string;
  name: string;
  amount: number;
  date: string;
  simplified_category: string | null;
  trip_id: number | null;
  account_name: string;
};

type Trip = {
  id: number;
  name: string;
};

type Props = {
  transactions: Tx[];
  trips: Trip[];
  onUpdated: () => void;
};

export default function DailySpendingLog({ transactions, trips, onUpdated }: Props) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState<Record<string, string>>({});
  const [draftTrip, setDraftTrip] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const byWeek = new Map<string, Map<string, Tx[]>>();

    for (const tx of transactions) {
      const weekStart = startOfWeek(new Date(tx.date), { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      if (!byWeek.has(weekKey)) {
        byWeek.set(weekKey, new Map());
      }
      const byDay = byWeek.get(weekKey)!;
      if (!byDay.has(tx.date)) {
        byDay.set(tx.date, []);
      }
      byDay.get(tx.date)!.push(tx);
    }

    return [...byWeek.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([weekKey, dayMap], weekIndex) => {
        const days = [...dayMap.entries()]
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .map(([day, txs]) => ({
            day,
            txs,
            total: txs.reduce((sum, tx) => sum + tx.amount, 0)
          }));

        return {
          weekKey,
          weekLabel: `Week ${weekIndex + 1}`,
          days,
          total: days.reduce((sum, day) => sum + day.total, 0)
        };
      });
  }, [transactions]);

  const monthTotal = useMemo(
    () => transactions.reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  async function saveTransaction(txId: string, existingCategory: string | null, existingTripId: number | null) {
    setSavingId(txId);
    try {
      const category = draftCategory[txId] ?? existingCategory ?? "Other";
      const tripValue = draftTrip[txId];
      const tripId = tripValue === undefined ? existingTripId : tripValue === "" ? null : Number(tripValue);

      await fetch("/api/transactions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: Number(txId), simplifiedCategory: category, tripId })
      });

      onUpdated();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Daily Spending Log</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Grouped by week (Mon-Sun) with daily totals and line items.</p>

      <div className="mt-4 space-y-5">
        {grouped.map((week) => (
          <div key={week.weekKey} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{week.weekLabel}</p>
              <p className="text-sm font-semibold">Total: {formatCurrency(week.total)}</p>
            </div>

            <div className="space-y-4">
              {week.days.map((day) => (
                <div key={day.day}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <p className="font-medium">{format(new Date(day.day), "EEE, MMM d")}</p>
                    <p className="font-medium">{formatCurrency(day.total)}</p>
                  </div>

                  <div className="space-y-2">
                    {day.txs.map((tx) => (
                      <div key={tx.id} className="rounded-md border border-slate-200 p-2 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-2 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{tx.merchant_name || tx.name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{tx.account_name}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(tx.amount)}</p>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <select
                            value={draftCategory[tx.id] ?? tx.simplified_category ?? "Other"}
                            onChange={(event) =>
                              setDraftCategory((prev) => ({
                                ...prev,
                                [tx.id]: event.target.value
                              }))
                            }
                            className="rounded-md border border-slate-300 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
                          >
                            {SIMPLIFIED_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>

                          <select
                            value={draftTrip[tx.id] ?? (tx.trip_id ? String(tx.trip_id) : "")}
                            onChange={(event) =>
                              setDraftTrip((prev) => ({
                                ...prev,
                                [tx.id]: event.target.value
                              }))
                            }
                            className="rounded-md border border-slate-300 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
                          >
                            <option value="">No Trip</option>
                            {trips.map((trip) => (
                              <option key={trip.id} value={trip.id}>
                                {trip.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => saveTransaction(tx.id, tx.simplified_category, tx.trip_id)}
                            disabled={savingId === tx.id}
                            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-950"
                          >
                            {savingId === tx.id ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-slate-200 p-3 text-sm font-semibold dark:border-slate-800">
          Monthly total: {formatCurrency(monthTotal)}
        </div>
      </div>
    </section>
  );
}
