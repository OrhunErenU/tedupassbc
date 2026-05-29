import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, EventStatus, UserRole } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { safeQuery } from "@/lib/safe-db";
import { requirePageRole } from "@/lib/auth";
import { MembershipReview } from "./membership-review";

const ROLE_LABEL: Record<string, string> = { PRESIDENT: "Başkan", BOARD: "Yönetim Kurulu", MEMBER: "Üye" };

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  await requirePageRole([UserRole.CLUB_ADMIN, UserRole.SKS_ADMIN]);
  const club = await safeQuery(
    () =>
      prisma.club.findUnique({
        where: { id: params.id },
        include: {
          events: { orderBy: { date: "desc" }, take: 20, include: { _count: { select: { attendances: true } } } },
          members: {
            where: { status: "PENDING" },
            include: { user: { select: { id: true, name: true, teduEmail: true } } }
          },
          _count: { select: { members: true, events: true } }
        }
      }),
    null
  );
  if (!club) notFound();

  const pending = club.members;

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

      {pending.length > 0 ? (
        <Card className="mt-8 border-tedu/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Üyelik talepleri</CardTitle>
              <Badge variant="warning">{pending.length} bekliyor</Badge>
            </div>
            <CardDescription>
              Öğrencilerin bu toplulukta üstlendiğini belirttiği roller. Onayladığında profillerinde
              "doğrulandı" olarak görünür.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {pending.map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{m.user.name ?? m.user.teduEmail}</div>
                    <div className="text-xs text-muted-foreground">
                      {ROLE_LABEL[m.role] ?? m.role}{m.title ? ` · ${m.title}` : ""} · {m.user.teduEmail}
                    </div>
                  </div>
                  <MembershipReview clubId={club.id} userId={m.userId} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

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
