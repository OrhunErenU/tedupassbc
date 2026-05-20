import { PrivyClient } from "@privy-io/server-auth";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

export const privyServer =
  appId && appSecret ? new PrivyClient(appId, appSecret) : null;

export function ensurePrivyServer() {
  if (!privyServer) {
    throw new Error(
      "Privy server credentials missing. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET."
    );
  }
  return privyServer;
}
