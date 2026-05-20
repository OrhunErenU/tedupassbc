"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function Providers({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    // Auth devre dışı — geliştirme için doğrudan render et.
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#C8102E",
          logo: undefined
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets"
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
