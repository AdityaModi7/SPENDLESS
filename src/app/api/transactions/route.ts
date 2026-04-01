import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

const USER_ID = "local-user";

type TransactionRow = {
  id: string;
  account_id: string;
  merchant_name: string;
  name: string;
  amount: number;
  plaid_primary_category: string | null;
  simplified_category: string | null;
  user_category_override: string | null;
  allocation_bucket: string | null;
  is_fixed_expense: boolean;
  is_investment_transfer: boolean;
  is_lifestyle: boolean;
  trip_id: number | null;
  category: string;
  date: string;
  accounts: {
    user_id: string;
    name: string;
    custom_name: string | null;
    type: string;
    subtype: string | null;
    current_balance: number;
  }[];
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("transactions")
      .select("id,account_id,merchant_name,name,amount,category,date,plaid_primary_category,simplified_category,user_category_override,allocation_bucket,is_fixed_expense,is_investment_transfer,is_lifestyle,trip_id,accounts!inner(user_id,name,custom_name,type,subtype,current_balance)")
      .eq("accounts.user_id", USER_ID)
      .eq("pending", false)
      .order("date", { ascending: false })
      .limit(1000);

    if (error) {
      throw error;
    }

    const transactions = ((data || []) as TransactionRow[]).map((tx) => ({
      id: tx.id,
      account_id: tx.account_id,
      merchant_name: tx.merchant_name,
      name: tx.name,
      amount: tx.amount,
      plaid_primary_category: tx.plaid_primary_category,
      simplified_category: tx.simplified_category,
      user_category_override: tx.user_category_override,
      allocation_bucket: tx.allocation_bucket,
      is_fixed_expense: tx.is_fixed_expense,
      is_investment_transfer: tx.is_investment_transfer,
      is_lifestyle: tx.is_lifestyle,
      trip_id: tx.trip_id,
      category: tx.category,
      date: tx.date,
      account_name: tx.accounts?.[0]?.custom_name || tx.accounts?.[0]?.name || "Unknown account",
      account_type: tx.accounts?.[0]?.type || "",
      account_subtype: tx.accounts?.[0]?.subtype || null,
      current_balance: Number(tx.accounts?.[0]?.current_balance || 0)
    }));

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("transactions route error", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
