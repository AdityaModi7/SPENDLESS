import { plaidClient } from "@/lib/plaid";
import { getSupabaseAdmin } from "@/lib/supabase";
import { classifyTransaction } from "@/lib/budget";
import { NextResponse } from "next/server";
import { RemovedTransaction, Transaction } from "plaid";

async function syncItemTransactions(itemId: string, accessToken: string) {
  const supabase = getSupabaseAdmin();
  let cursor: string | null = null;

  const { data: itemRow } = await supabase
    .from("plaid_items")
    .select("user_id")
    .eq("item_id", itemId)
    .single();

  const userId = itemRow?.user_id;

  if (!userId) {
    throw new Error(`Missing user_id for item ${itemId}`);
  }

  const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
  const accountRows = accountsResponse.data.accounts.map((account) => ({
    id: account.account_id,
    user_id: userId,
    item_id: itemId,
    name: account.name,
    mask: account.mask,
    type: account.type,
    subtype: account.subtype,
    current_balance: account.balances.current ?? 0,
    available_balance: account.balances.available,
    updated_at: new Date().toISOString()
  }));

  if (accountRows.length > 0) {
    await supabase.from("accounts").upsert(accountRows);
  }

  const { data: cursorRow } = await supabase
    .from("plaid_items")
    .select("sync_cursor")
    .eq("item_id", itemId)
    .single();

  cursor = cursorRow?.sync_cursor ?? null;

  let hasMore = true;

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor || undefined,
      count: 100
    });

    const added = response.data.added;
    const modified = response.data.modified;
    const removed = response.data.removed;

    await upsertTransactions(itemId, [...added, ...modified]);
    await deleteTransactions(removed);

    cursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }

  const { error: cursorError } = await supabase
    .from("plaid_items")
    .update({ sync_cursor: cursor, last_synced_at: new Date().toISOString() })
    .eq("item_id", itemId);

  if (cursorError) {
    throw cursorError;
  }
}

async function upsertTransactions(itemId: string, transactions: Transaction[]) {
  if (transactions.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const plaidIds = transactions.map((tx) => tx.transaction_id);
  const { data: existingRows } = await supabase
    .from("transactions")
    .select("plaid_transaction_id,user_category_override")
    .in("plaid_transaction_id", plaidIds);

  const overrideMap = new Map<string, string | null>();
  for (const row of existingRows || []) {
    overrideMap.set(row.plaid_transaction_id, row.user_category_override);
  }

  const rows = transactions.map((tx) => ({
    ...classifyTransaction({
      merchantName: tx.merchant_name,
      name: tx.name,
      plaidPrimaryCategory: tx.personal_finance_category?.primary,
      amount: tx.amount,
      categoryOverride: overrideMap.get(tx.transaction_id) || null
    }),
    plaid_transaction_id: tx.transaction_id,
    item_id: itemId,
    account_id: tx.account_id,
    merchant_name: tx.merchant_name || tx.name,
    name: tx.name,
    amount: tx.amount,
    date: tx.date,
    plaid_primary_category: tx.personal_finance_category?.primary || null,
    category: tx.personal_finance_category?.primary || tx.category?.[0] || "Other",
    pending: tx.pending
  }));

  const { error } = await supabase.from("transactions").upsert(rows, {
    onConflict: "plaid_transaction_id"
  });

  if (error) {
    throw error;
  }
}

async function deleteTransactions(removed: RemovedTransaction[]) {
  if (removed.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const ids = removed.map((tx) => tx.transaction_id);
  const { error } = await supabase.from("transactions").delete().in("plaid_transaction_id", ids);

  if (error) {
    throw error;
  }
}

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: items, error } = await supabase
      .from("plaid_items")
      .select("item_id,access_token");

    if (error) {
      throw error;
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, syncedItems: 0 });
    }

    for (const item of items) {
      await syncItemTransactions(item.item_id, item.access_token);
    }

    return NextResponse.json({ success: true, syncedItems: items.length });
  } catch (error) {
    console.error("sync-transactions error", error);
    return NextResponse.json({ error: "Transaction sync failed" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
