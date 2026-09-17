import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { TranscriptDocument } from "@/components/transcript-document";
import { TranscriptActions } from "@/components/transcript-actions";
import { getTranscript } from "@/lib/transcript";
import { prisma } from "@tedu-pass/db";
import { ShareLinks, type ShareLinkRow } from "./share-links";
import { getSessionUser } from "@/lib/auth";
import { clientEnv } from "@/lib/env";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function StudentTranscriptPage() {
  const user = await getSessionUser().catch(() => null);

  if (!user) {
    return (
      <DashboardShell role="Öğrenci" title="Transkriptim">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Transkriptini görmek için giriş yapmalısın.{" "}
            <Link href="/" className="text-tedu hover:underline">
              Ana sayfaya dön
            </Link>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  // The student sees their own record in full; only shared copies are masked.
  const data = await getTranscript(user.id, { revealStudentId: true });

  if (!data) {
    return (
      <DashboardShell role="Öğrenci" title="Transkriptim">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Transkript verisi okunamadı. Lütfen daha sonra tekrar dene.
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const links = await prisma.shareLink.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const rows: ShareLinkRow[] = links.map((l) => ({
    id: l.id,
    token: l.token,
    label: l.label,
    revealStudentId: l.revealStudentId,
    createdAt: l.createdAt.toISOString(),
    expiresAt: l.expiresAt?.toISOString() ?? null,
    revokedAt: l.revokedAt?.toISOString() ?? null,
    viewCount: l.viewCount,
    lastViewedAt: l.lastViewedAt?.toISOString() ?? null
  }));

  return (
    <DashboardShell
      role="Öğrenci"
      title="Etkinlik katılım transkriptim"
      description="Resmî, doğrulanabilir katılım belgen — CV'ne, burs ve değişim başvurularına ekleyebilirsin."
      actions={<TranscriptActions />}
    >
      <div className="mb-6">
        <ShareLinks links={rows} appUrl={clientEnv.NEXT_PUBLIC_APP_URL} />
      </div>

      <TranscriptDocument data={data} />
    </DashboardShell>
  );
}
