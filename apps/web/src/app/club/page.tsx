import Link from "next/link";
import { prisma } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { safeQuery } from "@/lib/safe-db";

export default async function ClubIndexPage() {
  const user = await getSessionUser().catch(() => null);

  const memberships = user
    ? await safeQuery(
        () =>
          prisma.clubMember.findMany({
            where: { userId: user.id, role: { in: ["PRESIDENT", "BOARD"] } },
            include: {
              club: { include: { _count: { select: { events: true, members: true } } } }
            }
          }),
        []
      )
    : [];

  return (
    <DashboardShell
      role="Kulüp Yöneticisi"
      title="Kulüplerim"
      description="Yönetici olduğun tüm kulüpler ve hızlı aksiyonlar."
      actions={
        <Button variant="outline" asChild>
          <Link href="/club/new">+ Yeni kulüp</Link>
        </Button>
      }
    >
      {memberships.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Henüz yönetici olduğun bir kulüp yok. Kulüp oluşturduğunda SKS onayı beklenir.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map((m) => (
            <Card key={m.clubId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{m.club.name}</CardTitle>
                  {m.club.approvedBySks ? (
                    <Badge variant="success">Onaylı</Badge>
                  ) : (
                    <Badge variant="warning">Onay bekliyor</Badge>
                  )}
                </div>
                <CardDescription>
                  {m.club._count.members} üye · {m.club._count.events} etkinlik
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild>
                  <Link href={`/club/${m.clubId}`}>Yönet</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/club/${m.clubId}/events/new`}>Etkinlik oluştur</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
