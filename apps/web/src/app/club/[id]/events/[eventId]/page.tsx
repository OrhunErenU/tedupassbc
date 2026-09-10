import { notFound } from "next/navigation";
import { prisma, EventStatus } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireClubManagerPage } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventActions } from "./actions-client";
import { AttendeeRoleSelect } from "./attendee-role-select";
import { AddAttendeeForm, RemoveAttendeeButton } from "./attendance-controls";
import { CheckinQr } from "./checkin-qr";
import { checkinWindow, checkinWindowState } from "@/lib/checkin-code";

export default async function EventDetailPage({
  params
}: {
  params: { id: string; eventId: string };
}) {
  // Guard before the attendee query: a redirect thrown by the layout still lets
  // this page render, and its output (names + e-mails) rides along in the 307 body.
  await requireClubManagerPage(params.id);
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

  const window = checkinWindow(event);
  const windowState = checkinWindowState(event);

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
            <CardDescription>Sahnede / kapıda ekranda göster — öğrenciler telefondan tarar.</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckinQr eventId={event.id} windowState={windowState} />
            <dl className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Check-in açılış</dt>
                <dd className="font-medium text-foreground">{window.opensAt.toLocaleString("tr-TR")}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Check-in kapanış</dt>
                <dd className="font-medium text-foreground">{window.closesAt.toLocaleString("tr-TR")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Katılımcılar</CardTitle>
                <Badge variant="outline">{event._count.attendances} kişi</Badge>
              </div>
              <CardDescription>
                QR'ı tarayan herkes burada görünür. Telefonu tükenen ya da QR'a
                yetişemeyen katılımcıyı TEDÜ e-postasıyla elle ekleyebilirsin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddAttendeeForm eventId={event.id} />
              {event.attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz katılım yok.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {event.attendances.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.user.name ?? a.user.teduEmail}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.user.teduEmail}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {a.checkedInAt.toLocaleTimeString("tr-TR")}
                        </span>
                        <AttendeeRoleSelect attendanceId={a.id} current={a.role} />
                        <RemoveAttendeeButton
                          attendanceId={a.id}
                          name={a.user.name ?? a.user.teduEmail}
                        />
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
