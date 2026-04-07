export type SimplifiedCategory =
  | "Food & Drinks"
  | "Going Out"
  | "Transport"
  | "Subscriptions"
  | "Groceries"
  | "Travel"
  | "Shopping"
  | "Other";

export const SIMPLIFIED_CATEGORIES: SimplifiedCategory[] = [
  "Food & Drinks",
  "Going Out",
  "Transport",
  "Subscriptions",
  "Groceries",
  "Travel",
  "Shopping",
  "Other"
];

export type AllocationBucket = "Essentials" | "Lifestyle" | "Investments" | "Savings" | "Buffer";

type ClassifyInput = {
  merchantName?: string | null;
  name?: string | null;
  plaidPrimaryCategory?: string | null;
  amount: number;
  categoryOverride?: string | null;
};

const fixedMerchantKeywords = [
  "rent",
  "landlord",
  "spotify",
  "icloud",
  "reuters",
  "anthropic",
  "claude",
  "openai",
  "gpt",
  "internet",
  "comcast",
  "xfinity",
  "electric",
  "utility",
  "coned",
  "duke energy"
];

const investmentKeywords = ["schwab", "swvxx", "roth", "ira", "brokerage", "vanguard", "fidelity", "etrade"];
const savingsKeywords = ["savings", "high yield", "hysa"];

function normalize(value?: string | null): string {
  return (value || "").toLowerCase().trim();
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function mapPlaidToSimplifiedCategory(
  plaidPrimaryCategory?: string | null,
  merchantName?: string | null,
  txName?: string | null
): SimplifiedCategory {
  const category = normalize(plaidPrimaryCategory);
  const merchant = normalize(merchantName);
  const name = normalize(txName);
  const text = `${merchant} ${name}`;

  if (text.includes("whole foods") || text.includes("trader joe") || text.includes("grocery")) {
    return "Groceries";
  }

  if (text.includes("doordash") || text.includes("ubereats") || text.includes("starbucks")) {
    return "Food & Drinks";
  }

  if (text.includes("bar") || text.includes("club") || text.includes("night")) {
    return "Going Out";
  }

  if (category.includes("grocery")) {
    return "Groceries";
  }

  if (category.includes("food_and_drink") || category.includes("restaurant")) {
    return "Food & Drinks";
  }

  if (category.includes("transport") || category.includes("taxi") || category.includes("rideshare")) {
    return "Transport";
  }

  if (category.includes("travel") || category.includes("airline") || category.includes("lodging")) {
    return "Travel";
  }

  if (category.includes("entertainment") && (text.includes("bar") || text.includes("club"))) {
    return "Going Out";
  }

  if (category.includes("subscription") || includesAny(text, ["spotify", "icloud", "claude", "gpt", "reuters"])) {
    return "Subscriptions";
  }

  if (category.includes("shopping") || category.includes("general_merchandise")) {
    return "Shopping";
  }

  return "Other";
}

export function classifyTransaction(input: ClassifyInput) {
  const merchant = normalize(input.merchantName);
  const name = normalize(input.name);
  const combined = `${merchant} ${name}`;

  const isFixedExpense = includesAny(combined, fixedMerchantKeywords);
  const isInvestmentTransfer = includesAny(combined, investmentKeywords) || normalize(input.plaidPrimaryCategory).includes("investment");
  const isSavingsTransfer = includesAny(combined, savingsKeywords);

  const simplifiedCategory = (input.categoryOverride as SimplifiedCategory | null) ||
    mapPlaidToSimplifiedCategory(input.plaidPrimaryCategory, input.merchantName, input.name);

  let allocationBucket: AllocationBucket = "Lifestyle";
  if (isInvestmentTransfer) {
    allocationBucket = "Investments";
  } else if (isSavingsTransfer) {
    allocationBucket = "Savings";
  } else if (isFixedExpense || simplifiedCategory === "Subscriptions") {
    allocationBucket = "Essentials";
  }

  const isLifestyle = allocationBucket === "Lifestyle" && input.amount > 0;

  return {
    simplified_category: simplifiedCategory,
    allocation_bucket: allocationBucket,
    is_fixed_expense: isFixedExpense,
    is_investment_transfer: isInvestmentTransfer,
    is_lifestyle: isLifestyle
  };
}
