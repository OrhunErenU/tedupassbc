import Link from "next/link";
import { prisma } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeQuery } from "@/lib/safe-db";
import { ApproveClubButtons } from "../clubs-actions";

export const dynamic = "force-dynamic";

export default async function SksClubsPage() {
  const clubs = await safeQuery(
    () =>
      prisma.club.findMany({
        include: {
          createdBy: { select: { teduEmail: true, name: true } },
          _count: { select: { members: true, events: true } },
          events: { select: { _count: { select: { attendances: true } } } }
        },
        orderBy: [{ approvedBySks: "asc" }, { createdAt: "desc" }]
      }),
    []
  );

  return (
    <DashboardShell role="SKS" title="Tüm kulüpler" description="Onay durumu, üye ve etkinlik istatistikleri.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{clubs.length} kulüp</CardTitle>
            <div className="flex gap-2">
              <Badge variant="warning">{clubs.filter((c) => !c.approvedBySks).length} bekleyen</Badge>
              <Badge variant="success">{clubs.filter((c) => c.approvedBySks).length} onaylı</Badge>
            </div>
          </div>
          <CardDescription>Onay verilmemiş kulüpler etkinlik oluşturamaz.</CardDescription>
        </CardHeader>
        <CardContent>
          {clubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz kayıtlı kulüp yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Kulüp</th>
                    <th>Kurucu</th>
                    <th>Üye</th>
                    <th>Etkinlik</th>
                    <th>Katılım</th>
                    <th>Durum</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clubs.map((c) => {
                    const att = c.events.reduce((s, e) => s + e._count.attendances, 0);
                    return (
                      <tr key={c.id}>
                        <td className="py-3">
                          <Link href={`/club/${c.id}`} className="font-medium hover:text-tedu">
                            {c.name}
                          </Link>
                          {c.description ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                          ) : null}
                        </td>
                        <td className="text-xs text-muted-foreground">
                          {c.createdBy.name ?? c.createdBy.teduEmail}
                        </td>
                        <td>{c._count.members}</td>
                        <td>{c._count.events}</td>
                        <td>{att}</td>
                        <td>
                          {c.approvedBySks ? (
                            <Badge variant="success">Onaylı</Badge>
                          ) : (
                            <Badge variant="warning">Bekliyor</Badge>
                          )}
                        </td>
                        <td className="text-right">
                          {!c.approvedBySks ? <ApproveClubButtons clubId={c.id} /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
