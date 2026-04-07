import { plaidClient } from "@/lib/plaid";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { Products } from "plaid";

const USER_ID = "local-user";

export async function POST() {
  try {
    if ((process.env.PLAID_ENV || "sandbox") !== "sandbox") {
      return NextResponse.json({ error: "Only available in sandbox mode" }, { status: 403 });
    }

    // Create a sandbox public token directly (bypasses Plaid Link UI)
    const sandboxResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: "ins_109508", // First Platypus Bank
      initial_products: [Products.Transactions],
      options: {
        override_username: "user_good",
        override_password: "pass_good"
      }
    });

    const publicToken = sandboxResponse.data.public_token;

    // Exchange for access token
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    // Fetch item and account details
    const [itemDetails, accountsResponse] = await Promise.all([
      plaidClient.itemGet({ access_token: accessToken }),
      plaidClient.accountsGet({ access_token: accessToken })
    ]);

    const institutionName = itemDetails.data.item.institution_id ?? "First Platypus Bank";
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

    const accountRows = accountsResponse.data.accounts.map((account) => ({
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

    return NextResponse.json({
      success: true,
      itemId,
      accountCount: accountRows.length
    });
  } catch (error) {
    console.error("sandbox-connect error", error);
    return NextResponse.json({ error: "Failed to connect sandbox account" }, { status: 500 });
  }
}
