import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { TranscriptDocument } from "@/components/transcript-document";
import { TranscriptActions } from "@/components/transcript-actions";
import { getTranscript } from "@/lib/transcript";
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

  const data = await getTranscript(user.id);

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

  const shareUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/transkript/${user.id}`;

  return (
    <DashboardShell
      role="Öğrenci"
      title="Etkinlik katılım transkriptim"
      description="Resmî, doğrulanabilir katılım belgen — CV'ne, burs ve değişim başvurularına ekleyebilirsin."
      actions={<TranscriptActions shareUrl={shareUrl} />}
    >
      <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground print:hidden">
        <p>
          <span className="font-medium text-foreground">Paylaşım bağlantısı:</span> yukarıdaki
          bağlantıyı alan herkes (işveren, burs komisyonu, Erasmus ofisi) bu belgeyi TEDU Pass
          üzerinden teyit edebilir. Bağlantı tahmin edilemez; sadece paylaştığın kişiler erişir.
        </p>
      </div>

      <TranscriptDocument data={data} verifyUrl={shareUrl} />
    </DashboardShell>
  );
}
