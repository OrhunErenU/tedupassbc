import { redirect } from "next/navigation";
import { prisma } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth";
import { safeQuery } from "@/lib/safe-db";
import { ProfileForm } from "./profile-form";
import { MembershipClaims } from "./membership-claims";

export default async function ProfilePage() {
  const session = await getSessionUser().catch(() => null);
  if (!session) {
    return (
      <DashboardShell role="Öğrenci" title="Profil">
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Profilini düzenlemek için giriş yapmalısın.
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/");

  const [clubs, memberships] = await Promise.all([
    safeQuery(
      () =>
        prisma.club.findMany({
          where: { approvedBySks: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        }),
      []
    ),
    safeQuery(
      () =>
        prisma.clubMember.findMany({
          where: { userId: user.id },
          include: { club: { select: { id: true, name: true } } },
          orderBy: { joinedAt: "desc" }
        }),
      []
    )
  ]);

  const shareUrl = user.username
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/u/${user.username}`
    : null;

  return (
    <DashboardShell
      role="Öğrenci"
      title="Profil"
      description="CV gibi düşün: fotoğrafın, başlığın ve toplulukta üstlendiğin roller. Roller kulüp tarafından onaylanınca doğrulanmış olur."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil bilgileri</CardTitle>
              <CardDescription>Fotoğraf, isim, başlık ve kısa tanıtım.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initial={{
                  name: user.name ?? "",
                  username: user.username ?? "",
                  studentId: user.studentId ?? "",
                  title: user.title ?? "",
                  bio: user.bio ?? "",
                  avatarUrl: user.avatarUrl ?? "",
                  isPublic: user.isPublic
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Topluluklar ve görevlerim</CardTitle>
              <CardDescription>
                Rol aldığın topluluğu, görevini ve durumunu ekle. Kulüp onayladığında profilinde
                "doğrulandı" rozetiyle görünür.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipClaims
                clubs={clubs}
                memberships={memberships.map((m) => ({
                  clubId: m.clubId,
                  clubName: m.club.name,
                  role: m.role,
                  title: m.title,
                  status: m.status
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Paylaşım</CardTitle>
            <CardDescription>İşveren veya komiteye yollayacağın link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">E-posta</p>
              <p className="font-medium">{user.teduEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cüzdan</p>
              <p className="font-mono text-xs">
                {user.walletAddress ?? "Privy login ile otomatik gelir"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Public link</p>
              {shareUrl ? (
                <a href={shareUrl} className="break-all text-sm text-tedu hover:underline">
                  {shareUrl}
                </a>
              ) : (
                <Badge variant="warning">Önce bir kullanıcı adı seç</Badge>
              )}
            </div>
            {!user.isPublic ? (
              <Badge variant="outline">Profilin şu an gizli</Badge>
            ) : (
              <Badge variant="success">Profilin public</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
