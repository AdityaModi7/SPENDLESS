import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

const USER_ID = "local-user";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("accounts")
      .select("id,name,custom_name,type,subtype,current_balance")
      .eq("user_id", USER_ID)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ accounts: data || [] });
  } catch (error) {
    console.error("accounts route error", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}
