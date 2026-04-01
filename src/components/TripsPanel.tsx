"use client";

import { formatCurrency } from "@/lib/utils";
import { FormEvent, useState } from "react";

type Trip = {
  id: number;
  name: string;
};

type Props = {
  trips: Trip[];
  totalsByTrip: { id: number; total: number }[];
  yearlyBudget: number;
  onCreated: () => void;
};

export default function TripsPanel({ trips, totalsByTrip, yearlyBudget, onCreated }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const spent = totalsByTrip.reduce((sum, trip) => sum + trip.total, 0);
  const progress = yearlyBudget > 0 ? (spent / yearlyBudget) * 100 : 0;

  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setSaving(true);
    try {
      await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      setName("");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Trip / Event Tracking</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Yearly target: {formatCurrency(yearlyBudget)}</p>

      <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-2 rounded-full ${progress >= 100 ? "bg-red-500" : progress >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-sm">Spent this year: <span className="font-medium">{formatCurrency(spent)}</span></p>

      <form onSubmit={createTrip} className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add trip/event (e.g., Ultra Miami)"
          className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-950"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {trips.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No trips/events yet.</p>}
        {trips.map((trip) => {
          const total = totalsByTrip.find((entry) => entry.id === trip.id)?.total || 0;
          return (
            <div key={trip.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
              <p className="font-medium">{trip.name}</p>
              <p>{formatCurrency(total)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
