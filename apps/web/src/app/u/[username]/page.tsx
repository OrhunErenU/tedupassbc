import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@tedu-pass/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { BadgeArt } from "@/components/badge-art";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { PRESIDENT: "Başkan", BOARD: "Yönetim Kurulu", MEMBER: "Üye" };

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const user = await prisma.user
    .findFirst({
      where: { username: params.username, isPublic: true },
      include: {
        badges: {
          include: { badgeTemplate: { include: { event: { include: { club: true } } } } },
          orderBy: { createdAt: "desc" }
        },
        memberships: {
          where: { status: "APPROVED" },
          include: { club: { select: { name: true } } },
          orderBy: { joinedAt: "desc" }
        }
      }
    })
    .catch(() => null);

  if (!user) notFound();

  const initial = (user.name ?? user.username ?? "?").charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container-tight">
        <Link href="/">
          <Logo />
        </Link>

        {/* CV header */}
        <Card className="mt-6 shadow-none">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name ?? ""} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{user.name ?? user.username}</h1>
                <Badge variant="success">Doğrulanabilir profil</Badge>
              </div>
              {user.title ? <p className="mt-0.5 text-sm text-muted-foreground">{user.title}</p> : null}
              {user.bio ? <p className="mt-2 max-w-2xl text-sm">{user.bio}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">
                TED Üniversitesi · {user.badges.length} rozet · {user.memberships.length} doğrulanmış görev
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verified roles (CV) */}
        {user.memberships.length > 0 ? (
          <Card className="mt-4 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Topluluk görevleri</CardTitle>
              <CardDescription>Her görev, ilgili topluluk tarafından doğrulanmıştır.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {user.memberships.map((m) => (
                  <li key={m.clubId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{m.club.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_LABEL[m.role] ?? m.role}{m.title ? ` · ${m.title}` : ""}
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> doğrulandı
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {/* Badges */}
        <Card className="mt-4 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Rozetler</CardTitle>
            <CardDescription>Etkinlik katılımları ve roller — tek tıkla doğrulanabilir.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz paylaşılan rozet yok.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {user.badges.map((b) => (
                  <Link key={b.id} href={`/verify/${b.id}`} className="group">
                    <BadgeArt
                      role={b.badgeTemplate.roleType}
                      eventTitle={b.badgeTemplate.event.title}
                      clubName={b.badgeTemplate.event.club.name}
                      date={b.badgeTemplate.event.date.toLocaleDateString("tr-TR")}
                      imageUrl={b.badgeTemplate.imageUrl ?? b.badgeTemplate.event.badgeImageUrl}
                      className="overflow-hidden rounded-xl ring-1 ring-border/60 transition group-hover:scale-[1.02]"
                    />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bu sayfadaki her rozet ve görev TEDU Pass üzerinde tek tıkla doğrulanabilir.
        </p>
      </div>
    </main>
  );
}
