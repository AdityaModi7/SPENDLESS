import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const USER_ID = "local-user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accountId = body.accountId as string;
    const customName = (body.customName as string | undefined)?.trim() ?? "";

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("accounts")
      .update({ custom_name: customName.length > 0 ? customName : null, updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .eq("user_id", USER_ID);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("accounts rename error", error);
    return NextResponse.json({ error: "Failed to update account nickname" }, { status: 500 });
  }
}
