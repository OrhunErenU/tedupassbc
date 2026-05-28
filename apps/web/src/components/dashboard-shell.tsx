"use client";

import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ALLOWED_DOMAIN = "tedu.edu.tr";
const DEV_LOGIN = process.env.NEXT_PUBLIC_DEV_LOGIN === "1";

function useOptionalPrivy() {
  try {
    return usePrivy();
  } catch {
    return null;
  }
}

const navByRole: Record<string, { href: string; label: string }[]> = {
  Öğrenci: [
    { href: "/student", label: "Cüzdanım" },
    { href: "/student/scan", label: "QR Tara" },
    { href: "/student/profile", label: "Profil" }
  ],
  "Kulüp Yöneticisi": [
    { href: "/club", label: "Kulüplerim" }
  ],
  SKS: [
    { href: "/sks", label: "Özet" },
    { href: "/sks/clubs", label: "Kulüpler" },
    { href: "/sks/students", label: "Öğrenciler" }
  ]
};

export function DashboardShell({
  role,
  title,
  description,
  actions,
  children
}: {
  role: keyof typeof navByRole | string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const privy = useOptionalPrivy();
  const privyConfigured = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  const links = navByRole[role] ?? [];

  useEffect(() => {
    if (DEV_LOGIN) return; // dev impersonation bypasses the Privy client guard
    if (!privyConfigured || !privy?.ready) return;
    if (!privy.authenticated) {
      router.replace(`/?from=${encodeURIComponent(pathname)}`);
      return;
    }
    const email = privy.user?.email?.address?.toLowerCase();
    if (email && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      privy.logout();
      router.replace("/");
    }
  }, [privy, privyConfigured, pathname, router]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Logo />
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex">{role}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {privy?.user?.email?.address ? (
              <span className="hidden text-muted-foreground md:inline">
                {privy.user.email.address}
              </span>
            ) : null}
            {DEV_LOGIN ? (
              <>
                <Badge variant="warning" className="hidden sm:inline-flex">dev</Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dev">Kullanıcı değiştir</Link>
                </Button>
              </>
            ) : privy?.authenticated ? (
              <Button variant="ghost" size="sm" onClick={() => privy.logout()}>
                Çıkış
              </Button>
            ) : !privyConfigured ? (
              <Badge variant="warning">Auth devre dışı (dev)</Badge>
            ) : null}
          </div>
        </div>
        {links.length ? (
          <div className="container flex gap-1 overflow-x-auto pb-2">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </header>
      <main className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-1 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        <div className="mt-8 animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
