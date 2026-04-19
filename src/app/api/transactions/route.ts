import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const USER_ID = "local-user";

type TransactionRow = {
  id: string;
  account_id: string;
  merchant_name: string;
  name: string;
  amount: number;
  category: string | null;
  date: string;
  accounts: {
    user_id: string;
    name: string;
    type: string;
  } | null;
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("transactions")
      .select("id,account_id,merchant_name,name,amount,category,date,accounts!inner(user_id,name,type)")
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
      category: tx.category,
      date: tx.date,
      account_name: tx.accounts?.name || "Unknown account",
      account_type: tx.accounts?.type || ""
    }));

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("transactions route error", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
