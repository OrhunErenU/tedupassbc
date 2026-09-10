import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { TranscriptDocument } from "@/components/transcript-document";
import { TranscriptActions } from "@/components/transcript-actions";
import { getTranscript } from "@/lib/transcript";
import { clientEnv } from "@/lib/env";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Paylaşılabilir transkript doğrulama sayfası.
 *
 * Erişim modeli /verify/[badgeId] ile aynı: bağlantıyı bilen görür. Kimlik
 * tahmin edilemez (cuid) olduğu için belge yalnızca öğrencinin paylaştığı
 * kişilere ulaşır; ayrıca oturum gerekmez, böylece işveren/burs komisyonu
 * hesap açmadan teyit edebilir.
 */
export default async function PublicTranscriptPage({ params }: { params: { id: string } }) {
  const data = await getTranscript(params.id);
  if (!data) notFound();

  const shareUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/transkript/${params.id}`;

  return (
    <main className="min-h-screen bg-background py-12 print:py-0">
      <div className="container-tight">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/">
            <Logo />
          </Link>
          <Badge variant="success" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Doğrulandı
          </Badge>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="max-w-xl text-sm text-muted-foreground">
            Bu belge TED Üniversitesi TEDU Pass sisteminden canlı olarak üretilmiştir. Aşağıdaki
            her katılım kaydı, etkinlik anında QR ile alınmış check-in verisine dayanır.
          </p>
          <TranscriptActions shareUrl={shareUrl} />
        </div>

        <div className="mt-6 print:mt-0">
          <TranscriptDocument data={data} verifyUrl={shareUrl} />
        </div>
      </div>
    </main>
  );
}
