import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, UserRole } from "@tedu-pass/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { safeQuery } from "@/lib/safe-db";

export const dynamic = "force-dynamic";

const DEV_LOGIN = process.env.DEV_LOGIN === "1";

const ROLE_TARGET: Record<string, string> = {
  STUDENT: "/student",
  CLUB_ADMIN: "/club",
  SKS_ADMIN: "/sks"
};
const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Öğrenci",
  CLUB_ADMIN: "Kulüp Yöneticisi",
  SKS_ADMIN: "SKS Yetkilisi"
};

export default async function DevLoginPage() {
  if (!DEV_LOGIN) notFound();

  const users = await safeQuery(
    () =>
      prisma.user.findMany({
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { teduEmail: true, name: true, role: true, _count: { select: { badges: true } } }
      }),
    []
  );

  const groups: Record<string, typeof users> = { SKS_ADMIN: [], CLUB_ADMIN: [], STUDENT: [] };
  for (const u of users) (groups[u.role] ??= []).push(u);

  return (
    <main className="min-h-screen bg-muted/30 py-12">
      <div className="container-tight">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <div className="mt-6">
          <Badge variant="warning">Geliştirici girişi</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Demo kullanıcısı seç</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Privy e-posta akışı olmadan bir kullanıcı olarak giriş yap. Bu sayfa yalnızca{" "}
            <code>DEV_LOGIN=1</code> iken görünür.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {(Object.keys(groups) as UserRole[]).map((role) =>
            groups[role]?.length ? (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="text-base">{ROLE_LABEL[role]}</CardTitle>
                  <CardDescription>{groups[role].length} kullanıcı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {groups[role].map((u) => (
                      <a
                        key={u.teduEmail}
                        href={`/api/auth/dev?email=${encodeURIComponent(u.teduEmail)}&redirect=${ROLE_TARGET[role]}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition hover:border-tedu/40 hover:shadow-sm"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{u.name ?? u.teduEmail}</div>
                          <div className="truncate text-xs text-muted-foreground">{u.teduEmail}</div>
                        </div>
                        {u._count.badges > 0 ? (
                          <Badge variant="outline" className="ml-2 shrink-0">{u._count.badges}</Badge>
                        ) : null}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      </div>
    </main>
  );
}
