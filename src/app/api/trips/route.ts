import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const USER_ID = "local-user";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("trips")
      .select("id,name,created_at")
      .eq("user_id", USER_ID)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ trips: data || [] });
  } catch (error) {
    console.error("trips GET error", error);
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Trip name is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("trips")
      .insert({ user_id: USER_ID, name })
      .select("id,name,created_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ trip: data });
  } catch (error) {
    console.error("trips POST error", error);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
