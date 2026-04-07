import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const plaidEnv = process.env.PLAID_ENV || "sandbox";

const environment =
  plaidEnv === "production"
    ? PlaidEnvironments.production
    : plaidEnv === "development"
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox;

const config = new Configuration({
  basePath: environment,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || ""
    }
  }
});


export const plaidClient = new PlaidApi(config);
