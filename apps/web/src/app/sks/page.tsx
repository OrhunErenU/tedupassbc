import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSksSummary } from "@/lib/sks-stats";
import { requirePageRole } from "@/lib/auth";
import { UserRole } from "@tedu-pass/db";
import { Trophy, Users, CalendarCheck, Building2 } from "lucide-react";
import { ApproveClubButtons } from "./clubs-actions";

export const dynamic = "force-dynamic";

export default async function SksDashboardPage() {
  await requirePageRole([UserRole.SKS_ADMIN]);
  const s = await getSksSummary();

  return (
    <DashboardShell
      role="SKS"
      title="SKS Dashboard"
      description="TED Üniversitesi kulüp ekosisteminin canlı özeti."
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Building2 className="h-4 w-4" />} label="Aktif kulüp" value={s.totalClubs - s.pendingClubs} hint={`${s.pendingClubs} onay bekliyor`} />
        <Stat icon={<CalendarCheck className="h-4 w-4" />} label="Bu ay etkinlik" value={s.monthEvents} hint={`${s.activeEvents} aktif`} />
        <Stat icon={<Users className="h-4 w-4" />} label="Toplam katılım" value={s.totalAttendances} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Basılan rozet" value={s.totalBadges} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Onay bekleyen kulüpler</CardTitle>
              <Badge variant="outline">{s.pendingClubsList.length}</Badge>
            </div>
            <CardDescription>Yeni kulüpler SKS onayı olmadan etkinlik yapamaz.</CardDescription>
          </CardHeader>
          <CardContent>
            {s.pendingClubsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Şu an onay bekleyen kulüp yok.</p>
            ) : (
              <ul className="divide-y divide-border">
                {s.pendingClubsList.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.description ?? "—"} · {c.createdAt.toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    <ApproveClubButtons clubId={c.id} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En aktif öğrenciler</CardTitle>
            <CardDescription>Rozet sayısına göre.</CardDescription>
          </CardHeader>
          <CardContent>
            {s.topStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Veri toplandıkça listelenir.</p>
            ) : (
              <ol className="space-y-2">
                {s.topStudents.map((u, i) => (
                  <li key={u.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-medium">{u.name ?? u.teduEmail}</div>
                        <div className="text-xs text-muted-foreground">{u.teduEmail}</div>
                      </div>
                    </div>
                    <Badge>{u.badgeCount}</Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>En aktif kulüpler</CardTitle>
          <CardDescription>Toplam katılım sayısına göre.</CardDescription>
        </CardHeader>
        <CardContent>
          {s.topClubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">#</th>
                    <th>Kulüp</th>
                    <th>Etkinlik</th>
                    <th>Katılım</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.topClubs.map((c, i) => (
                    <tr key={c.id}>
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="font-medium">{c.name}</td>
                      <td>{c.eventCount}</td>
                      <td>{c.attendanceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function Stat({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        <span className="eyebrow">{label}</span>
      </div>
      <p className="mt-2.5 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
