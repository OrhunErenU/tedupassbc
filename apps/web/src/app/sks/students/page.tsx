import Link from "next/link";
import { prisma, UserRole } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeQuery } from "@/lib/safe-db";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SksStudentsPage() {
  await requirePageRole([UserRole.SKS_ADMIN]);
  const students = await safeQuery(
    () =>
      prisma.user.findMany({
        where: { role: "STUDENT" },
        select: {
          id: true,
          name: true,
          username: true,
          teduEmail: true,
          isPublic: true,
          studentId: true,
          _count: { select: { badges: true, attendances: true } }
        },
        orderBy: { badges: { _count: "desc" } },
        take: 100
      }),
    []
  );

  return (
    <DashboardShell
      role="SKS"
      title="Öğrenciler"
      description="En aktif öğrenciler ve katılım istatistikleri."
    >
      <Card>
        <CardHeader>
          <CardTitle>İlk 100 öğrenci</CardTitle>
          <CardDescription>Rozet sayısına göre sıralı.</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz kayıtlı öğrenci yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">#</th>
                    <th>Öğrenci</th>
                    <th>Numara</th>
                    <th>Rozet</th>
                    <th>Katılım</th>
                    <th>Profil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((u, i) => (
                    <tr key={u.id}>
                      <td className="py-3 text-muted-foreground">{i + 1}</td>
                      <td>
                        <div className="font-medium">{u.name ?? u.teduEmail.split("@")[0]}</div>
                        <div className="text-xs text-muted-foreground">{u.teduEmail}</div>
                      </td>
                      <td className="text-xs text-muted-foreground">{u.studentId ?? "—"}</td>
                      <td>
                        <Badge>{u._count.badges}</Badge>
                      </td>
                      <td>{u._count.attendances}</td>
                      <td>
                        {u.isPublic && u.username ? (
                          <Link href={`/u/${u.username}`} className="text-xs text-tedu hover:underline">
                            /u/{u.username}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">Gizli</span>
                        )}
                      </td>
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
