"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type Props = {
  onConnected: () => void;
};

export default function PlaidLinkButton({ onConnected }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch("/api/plaid/create-link-token", { method: "POST" });
      const data = await response.json();
      setLinkToken(data.link_token || null);
    };

    createLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken: string) => {
      setLoading(true);
      try {
        await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken })
        });

        await fetch("/api/plaid/sync-transactions", { method: "POST" });
        onConnected();
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken || loading}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300"
    >
      {loading ? "Syncing..." : "Connect Account"}
    </button>
  );
}
