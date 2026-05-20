import Link from "next/link";
import { prisma } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { safeQuery } from "@/lib/safe-db";
import { Trophy, QrCode } from "lucide-react";

export default async function StudentDashboardPage() {
  const user = await getSessionUser().catch(() => null);

  const badges = user
    ? await safeQuery(
        () =>
          prisma.badge.findMany({
            where: { userId: user.id },
            include: {
              badgeTemplate: {
                include: { event: { include: { club: true } } }
              }
            },
            orderBy: { createdAt: "desc" }
          }),
        []
      )
    : [];

  return (
    <DashboardShell
      role="Öğrenci"
      title={user ? `Merhaba, ${user.name ?? user.teduEmail.split("@")[0]}` : "Cüzdanım"}
      description="Toplandığın tüm rozetler burada."
      actions={
        <Button asChild>
          <Link href="/student/scan">
            <QrCode className="h-4 w-4" />
            QR Tara
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Toplam rozet" value={badges.length} />
        <StatCard label="Bu dönem" value={badges.filter((b) => b.createdAt > monthsAgo(6)).length} />
        <StatCard label="Cüzdan" value={user?.walletAddress ? short(user.walletAddress) : "—"} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Rozetlerim</CardTitle>
          <CardDescription>
            Her rozet, katıldığın bir etkinliğin ya da üstlendiğin bir rolün kalıcı kaydı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">
                Henüz rozetin yok. Bir kulüp etkinliğinde QR'ı tarayarak ilk rozetini al.
              </p>
              <Button asChild className="mt-4">
                <Link href="/student/scan">QR Tara</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {badges.map((b) => (
                <Link key={b.id} href={`/verify/${b.id}`} className="group">
                  <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-tedu to-tedu-700 p-4 text-white shadow-sm transition group-hover:scale-[1.02]">
                    <Trophy className="h-5 w-5 opacity-90" />
                    <div className="mt-8 text-[10px] font-medium uppercase tracking-wider opacity-80">
                      {b.badgeTemplate.roleType}
                    </div>
                    <div className="text-xs font-semibold leading-tight">
                      {b.badgeTemplate.event.title}
                    </div>
                    <div className="mt-1 text-[10px] opacity-75">
                      {b.badgeTemplate.event.club.name}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {b.createdAt.toLocaleDateString("tr-TR")}
                    </span>
                    {b.txHash ? (
                      <Badge variant="success">on-chain</Badge>
                    ) : (
                      <Badge variant="warning">bekliyor</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
function monthsAgo(m: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
}
