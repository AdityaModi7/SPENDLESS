"use client";

import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

type CreditCard = {
  id: string;
  name: string;
  custom_name: string | null;
  period_spend: number;
  current_balance: number;
};

type Props = {
  cards: CreditCard[];
  onRenamed: () => void;
};

export default function CreditCardsPanel({ cards, onRenamed }: Props) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>(
    Object.fromEntries(cards.map((card) => [card.id, card.custom_name || ""]))
  );

  async function saveName(accountId: string) {
    setSavingId(accountId);
    try {
      await fetch("/api/accounts/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, customName: names[accountId] || "" })
      });
      onRenamed();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-medium">Credit Cards (Personalized)</h2>
      <div className="mt-4 space-y-3">
        {cards.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No credit card accounts connected yet.</p>
        )}

        {cards.map((card) => (
          <div key={card.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{card.custom_name || card.name}</p>
              <div className="text-right text-sm">
                <p className="font-medium">Spend: {formatCurrency(card.period_spend)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Balance: {formatCurrency(card.current_balance)}</p>
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <input
                value={names[card.id] || ""}
                onChange={(event) =>
                  setNames((prev) => ({
                    ...prev,
                    [card.id]: event.target.value
                  }))
                }
                placeholder="Set nickname (e.g., Travel Card)"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
              />
              <button
                onClick={() => saveName(card.id)}
                disabled={savingId === card.id}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300"
              >
                {savingId === card.id ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
