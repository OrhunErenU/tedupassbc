import { notFound } from "next/navigation";
import { prisma, EventStatus } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventActions } from "./actions-client";
import { AttendeeRoleSelect } from "./attendee-role-select";

export default async function EventDetailPage({
  params
}: {
  params: { id: string; eventId: string };
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      club: true,
      attendances: { include: { user: true }, orderBy: { checkedInAt: "asc" } },
      badgeTemplates: true,
      _count: { select: { attendances: true } }
    }
  });
  if (!event || event.clubId !== params.id) notFound();

  return (
    <DashboardShell
      role="Kulüp Yöneticisi"
      title={event.title}
      description={`${event.club.name} · ${event.date.toLocaleString("tr-TR")}`}
      actions={<Badge variant={event.status === EventStatus.ACTIVE ? "success" : event.status === EventStatus.CLOSED ? "outline" : "warning"}>{event.status}</Badge>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Check-in QR</CardTitle>
            <CardDescription>Sahnede / kapıda göster — öğrenciler telefondan tarar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/events/${event.id}/qr`}
                alt="QR"
                className="aspect-square w-full"
              />
            </div>
            <a
              href={`/api/events/${event.id}/qr`}
              download={`tedupass-qr-${event.id}.png`}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-tedu px-4 text-sm font-medium text-white transition hover:bg-tedu-600"
            >
              QR'ı indir (PNG)
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              İndirip yazdırabilir veya bir yere yapıştırabilirsin. QR sadece etkinlik{" "}
              <code>ACTIVE</code> durumdayken işler.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Katılımcılar</CardTitle>
                <Badge variant="outline">{event._count.attendances} kişi</Badge>
              </div>
              <CardDescription>QR'ı tarayan herkes burada görünür.</CardDescription>
            </CardHeader>
            <CardContent>
              {event.attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz katılım yok.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {event.attendances.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-medium">{a.user.name ?? a.user.teduEmail}</div>
                        <div className="text-xs text-muted-foreground">{a.user.teduEmail}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {a.checkedInAt.toLocaleTimeString("tr-TR")}
                        </span>
                        <AttendeeRoleSelect attendanceId={a.id} current={a.role} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <EventActions eventId={event.id} status={event.status} />
        </div>
      </div>
    </DashboardShell>
  );
}
