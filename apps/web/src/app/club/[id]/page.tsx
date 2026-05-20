import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, EventStatus } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { safeQuery } from "@/lib/safe-db";

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const club = await safeQuery(
    () =>
      prisma.club.findUnique({
        where: { id: params.id },
        include: {
          events: { orderBy: { date: "desc" }, take: 20, include: { _count: { select: { attendances: true } } } },
          _count: { select: { members: true, events: true } }
        }
      }),
    null
  );
  if (!club) notFound();

  return (
    <DashboardShell
      role="Kulüp Yöneticisi"
      title={club.name}
      description={club.description ?? "Kulüp paneli"}
      actions={
        <Button asChild>
          <Link href={`/club/${club.id}/events/new`}>+ Yeni etkinlik</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Üye" value={club._count.members} />
        <Stat label="Toplam etkinlik" value={club._count.events} />
        <Stat
          label="Onay"
          value={club.approvedBySks ? "Onaylı" : "Bekliyor"}
        />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Etkinlikler</CardTitle>
          <CardDescription>Son 20 etkinlik.</CardDescription>
        </CardHeader>
        <CardContent>
          {club.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz etkinlik yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {club.events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/club/${club.id}/events/${e.id}`} className="font-medium hover:text-tedu">
                      {e.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {e.date.toLocaleString("tr-TR")} · {e._count.attendances} katılım
                    </div>
                  </div>
                  <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
function statusVariant(s: EventStatus) {
  if (s === EventStatus.ACTIVE) return "success" as const;
  if (s === EventStatus.CLOSED) return "outline" as const;
  return "warning" as const;
}
