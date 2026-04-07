import { classifyTransaction } from "@/lib/budget";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const USER_ID = "local-user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactionId = Number(body.transactionId);
    const simplifiedCategory = body.simplifiedCategory ? String(body.simplifiedCategory) : null;
    const tripId = body.tripId === null || body.tripId === undefined || body.tripId === "" ? null : Number(body.tripId);

    if (!transactionId || Number.isNaN(transactionId)) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    if (tripId !== null && Number.isNaN(tripId)) {
      return NextResponse.json({ error: "tripId is invalid" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("id,merchant_name,name,plaid_primary_category,amount,account_id,accounts!inner(user_id)")
      .eq("id", transactionId)
      .single();

    if (txError || !tx) {
      throw txError || new Error("Transaction not found");
    }

    const accountRelation = Array.isArray(tx.accounts) ? tx.accounts[0] : tx.accounts;
    if (!accountRelation || accountRelation.user_id !== USER_ID) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const classification = classifyTransaction({
      merchantName: tx.merchant_name,
      name: tx.name,
      plaidPrimaryCategory: tx.plaid_primary_category,
      amount: Number(tx.amount),
      categoryOverride: simplifiedCategory
    });

    const { error } = await supabase
      .from("transactions")
      .update({
        user_category_override: simplifiedCategory,
        ...classification,
        trip_id: tripId,
        updated_at: new Date().toISOString()
      })
      .eq("id", transactionId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("transactions update error", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
