import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@tedu-pass/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const user = await prisma.user
    .findFirst({
      where: { username: params.username, isPublic: true },
      include: {
        badges: {
          include: { badgeTemplate: { include: { event: { include: { club: true } } } } },
          orderBy: { createdAt: "desc" }
        }
      }
    })
    .catch(() => null);

  if (!user) notFound();

  return (
    <main className="min-h-screen bg-muted/30 py-12">
      <div className="container-tight">
        <Link href="/">
          <Logo />
        </Link>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{user.name ?? user.username}</CardTitle>
                <CardDescription>TED Üniversitesi · {user.badges.length} rozet</CardDescription>
              </div>
              <Badge variant="success">Public profil</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {user.badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz paylaşılan rozet yok.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {user.badges.map((b) => (
                  <Link key={b.id} href={`/verify/${b.id}`} className="group">
                    <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-tedu to-tedu-700 p-4 text-white transition group-hover:scale-[1.02]">
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
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bu sayfadaki her rozet TEDU Pass üzerinde tek tıkla doğrulanabilir.
        </p>
      </div>
    </main>
  );
}
