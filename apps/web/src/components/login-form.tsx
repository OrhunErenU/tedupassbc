"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, ShieldCheck, ArrowLeft } from "lucide-react";

const ALLOWED_DOMAIN = "tedu.edu.tr";

function useOptionalPrivy() {
  try {
    return usePrivy();
  } catch {
    return null;
  }
}

function useOptionalLoginWithEmail() {
  try {
    return useLoginWithEmail();
  } catch {
    return null;
  }
}

type Stage = "email" | "code";

export function LoginForm() {
  const router = useRouter();
  const privy = useOptionalPrivy();
  const emailLogin = useOptionalLoginWithEmail();
  const configured = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [synced, setSynced] = useState(false);

  // After Privy login completes, push the access token to our backend
  // so it can verify, upsert the User, and set the session cookie.
  useEffect(() => {
    if (!privy?.authenticated || synced) return;
    const userEmail = privy.user?.email?.address?.toLowerCase();
    if (!userEmail?.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Sadece @${ALLOWED_DOMAIN} adresleri ile giriş yapılabilir.`);
      privy.logout();
      setStage("email");
      setCode("");
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
        setSynced(true);
        router.push("/student");
      } finally {
        setBusy(false);
      }
    })();
  }, [privy, router, synced]);

  if (!configured) {
    return (
      <div className="space-y-3">
        <Button size="lg" disabled title="NEXT_PUBLIC_PRIVY_APP_ID eklenince aktif olur">
          TEDÜ E-posta ile Giriş
        </Button>
        <Badge variant="warning">Auth devre dışı — Privy yapılandırılmadı (dev)</Badge>
      </div>
    );
  }

  if (privy?.authenticated) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Badge variant="success">Giriş yapıldı: {privy.user?.email?.address}</Badge>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              await fetch("/api/auth/session", { method: "DELETE" });
              privy.logout();
              setSynced(false);
            }}
            variant="outline"
            size="sm"
          >
            Çıkış yap
          </Button>
          <Button onClick={() => router.push("/student")} size="sm">
            Cüzdanım
          </Button>
        </div>
      </div>
    );
  }

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = email.trim().toLowerCase();
    if (!cleaned.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Sadece @${ALLOWED_DOMAIN} uzantılı adresler kabul edilir.`);
      return;
    }
    if (!emailLogin) {
      setError("Privy henüz yüklenmedi, bir an sonra tekrar dene.");
      return;
    }
    setBusy(true);
    try {
      await emailLogin.sendCode({ email: cleaned });
      setEmail(cleaned);
      setStage("code");
    } catch (err: any) {
      setError(err?.message ?? "Doğrulama kodu gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!emailLogin) return;
    if (code.trim().length < 4) {
      setError("Kodu eksiksiz gir.");
      return;
    }
    setBusy(true);
    try {
      await emailLogin.loginWithCode({ code: code.trim() });
      // useEffect above handles the rest (session sync + redirect)
    } catch (err: any) {
      setError(err?.message ?? "Kod hatalı veya süresi dolmuş.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-sm">
      {stage === "email" ? (
        <form onSubmit={onSendCode} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-tedu" />
            TEDÜ E-posta ile Giriş
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta adresin</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder={`adin.soyadin@${ALLOWED_DOMAIN}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Sadece <code>@{ALLOWED_DOMAIN}</code> uzantılı adresler kabul edilir.
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Kod gönderiliyor..." : "Doğrulama kodu gönder"}
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerifyCode} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-tedu" />
            Kodu gir
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>{email}</strong> adresine 6 haneli kod gönderdik.
          </p>
          <div className="space-y-2">
            <Label htmlFor="code">Doğrulama kodu</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" disabled={busy || code.length < 4}>
              {busy ? "Doğrulanıyor..." : "Giriş yap"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setCode("");
                setError(null);
              }}
              className="inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              E-postayı değiştir
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
