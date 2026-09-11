import Link from "next/link";
import { prisma, UserRole, Prisma } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { safeQuery } from "@/lib/safe-db";
import { requirePageRole } from "@/lib/auth";
import { Search, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SksStudentsPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  await requirePageRole([UserRole.SKS_ADMIN]);

  const q = (searchParams.q ?? "").trim();

  // Ad, e-posta ve öğrenci numarasında arama. Boşsa en aktif ilk 100 öğrenci.
  const where: Prisma.UserWhereInput = q
    ? {
        role: "STUDENT",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { teduEmail: { contains: q, mode: "insensitive" } },
          { studentId: { contains: q, mode: "insensitive" } }
        ]
      }
    : { role: "STUDENT" };

  const students = await safeQuery(
    () =>
      prisma.user.findMany({
        where,
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
      description="Öğrenci ara, katılım geçmişini gör, resmî transkriptini aç."
    >
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{q ? `"${q}" için sonuçlar` : "En aktif öğrenciler"}</CardTitle>
              <CardDescription>
                {q
                  ? `${students.length} öğrenci bulundu.`
                  : "Rozet sayısına göre sıralı ilk 100 öğrenci."}
              </CardDescription>
            </div>
          </div>

          {/* Arama — sunucu tarafı, JS gerektirmez */}
          <form method="get" className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Ad, e-posta veya öğrenci numarası ara…"
                className="pl-9"
              />
            </div>
            <Button type="submit">Ara</Button>
            {q ? (
              <Button type="button" variant="ghost" asChild>
                <Link href="/sks/students">Temizle</Link>
              </Button>
            ) : null}
          </form>
        </CardHeader>

        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q ? "Bu aramayla eşleşen öğrenci yok." : "Henüz kayıtlı öğrenci yok."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 font-medium">#</th>
                    <th className="font-medium">Öğrenci</th>
                    <th className="font-medium">Numara</th>
                    <th className="font-medium">Rozet</th>
                    <th className="font-medium">Katılım</th>
                    <th className="font-medium">Profil</th>
                    <th className="font-medium">Belge</th>
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
                          <Link
                            href={`/u/${u.username}`}
                            className="text-xs text-tedu hover:underline"
                          >
                            /u/{u.username}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">Gizli</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/sks/students/${u.id}/transkript`}
                          className="inline-flex items-center gap-1 text-xs text-tedu hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Transkript
                        </Link>
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
