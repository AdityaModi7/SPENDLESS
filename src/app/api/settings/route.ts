import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const USER_ID = "local-user";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("user_settings")
      .select("monthly_income,savings_goal_percent,warning_threshold_percent,yearly_event_budget,monthly_essentials")
      .eq("user_id", USER_ID)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      settings: {
        monthly_income: Number(data.monthly_income || 4656),
        savings_goal_percent: Number(data.savings_goal_percent || 60),
        warning_threshold_percent: Number(data.warning_threshold_percent || 35),
        yearly_event_budget: Number(data.yearly_event_budget || 2500),
        monthly_essentials: Number(data.monthly_essentials || 1363)
      }
    });
  } catch (error) {
    console.error("settings GET error", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const monthlyIncome = Number(body.monthly_income ?? 4656);
    const savingsGoalPercent = Number(body.savings_goal_percent ?? 60);
    const warningThresholdPercent = Number(body.warning_threshold_percent ?? 35);
    const yearlyEventBudget = Number(body.yearly_event_budget ?? 2500);
    const monthlyEssentials = Number(body.monthly_essentials ?? 1363);

    if (monthlyIncome < 0 || savingsGoalPercent < 0 || savingsGoalPercent > 100 || warningThresholdPercent < 1 || warningThresholdPercent > 100 || yearlyEventBudget < 0 || monthlyEssentials < 0) {
      return NextResponse.json({ error: "Invalid settings values" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("user_settings").upsert({
      user_id: USER_ID,
      monthly_income: monthlyIncome,
      savings_goal_percent: savingsGoalPercent,
      warning_threshold_percent: warningThresholdPercent,
      yearly_event_budget: yearlyEventBudget,
      monthly_essentials: monthlyEssentials,
      updated_at: new Date().toISOString()
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("settings POST error", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
