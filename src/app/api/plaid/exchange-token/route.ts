import { plaidClient } from "@/lib/plaid";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import type { AccountBase } from "plaid";

const USER_ID = "local-user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const publicToken = body.publicToken as string;

    if (!publicToken) {
      return NextResponse.json({ error: "publicToken is required" }, { status: 400 });
    }

    const exchange = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    const [itemDetails, accountsResponse] = await Promise.all([
      plaidClient.itemGet({ access_token: accessToken }),
      plaidClient.accountsGet({ access_token: accessToken })
    ]);

    const institutionName = itemDetails.data.item.institution_id ?? "Connected Institution";
    const supabase = getSupabaseAdmin();

    await supabase.from("users").upsert({ id: USER_ID, email: "local@spendlens.app" });

    const { error: itemError } = await supabase.from("plaid_items").upsert({
      user_id: USER_ID,
      item_id: itemId,
      institution_name: institutionName,
      access_token: accessToken
    });

    if (itemError) {
      throw itemError;
    }

    const accountRows = accountsResponse.data.accounts.map((account: AccountBase) => ({
      id: account.account_id,
      user_id: USER_ID,
      item_id: itemId,
      name: account.name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
      current_balance: account.balances.current ?? 0,
      available_balance: account.balances.available
    }));

    if (accountRows.length > 0) {
      const { error: accountError } = await supabase.from("accounts").upsert(accountRows);
      if (accountError) {
        throw accountError;
      }
    }

    return NextResponse.json({ success: true, itemId });
  } catch (error) {
    console.error("exchange-token error", error);
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
  }
}
