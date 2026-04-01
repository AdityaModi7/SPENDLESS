import { plaidClient } from "@/lib/plaid";
import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";

const USER_ID = "local-user";

export async function POST() {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: USER_ID },
      client_name: "SpendLens",
      language: "en",
      country_codes: [CountryCode.Us],
      products: [Products.Transactions]
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("create-link-token error", error);
    return NextResponse.json({ error: "Failed to create link token" }, { status: 500 });
  }
}
