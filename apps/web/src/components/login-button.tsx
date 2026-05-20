"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ALLOWED_DOMAIN = "tedu.edu.tr";

function useOptionalPrivy() {
  try {
    return usePrivy();
  } catch {
    return null;
  }
}

export function LoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const privy = useOptionalPrivy();
  const configured = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  useEffect(() => {
    if (!privy?.authenticated || !privy.user?.email?.address) return;
    const email = privy.user.email.address.toLowerCase();
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Sadece @${ALLOWED_DOMAIN} adresleri ile giriş yapılabilir.`);
      privy.logout();
      return;
    }
    (async () => {
      setBusy(true);
      try {
        const accessToken = await privy.getAccessToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken })
        });
        router.push("/student");
      } finally {
        setBusy(false);
      }
    })();
  }, [privy, router]);

  if (!configured || !privy) {
    return (
      <Button size="lg" disabled title="NEXT_PUBLIC_PRIVY_APP_ID eklenince aktif olur">
        TEDÜ E-posta ile Giriş
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        size="lg"
        disabled={busy}
        onClick={
          privy.authenticated
            ? async () => {
                await fetch("/api/auth/session", { method: "DELETE" });
                privy.logout();
              }
            : () => privy.login()
        }
      >
        {busy ? "Bağlanıyor..." : privy.authenticated ? "Çıkış yap" : "TEDÜ E-posta ile Giriş"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
