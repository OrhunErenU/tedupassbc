import Link from "next/link";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TranscriptDocument } from "@/components/transcript-document";
import { getTranscript } from "@/lib/transcript";
import { resolveShareToken } from "@/lib/share";
import { clientEnv } from "@/lib/env";
import { ShieldCheck, LinkIcon } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Paylaşılabilir transkript doğrulama sayfası.
 *
 * Erişim, öğrencinin ürettiği iptal edilebilir bir paylaşım jetonuna bağlıdır.
 * Önceden adres doğrudan öğrencinin kullanıcı kimliğiydi: bağlantı geri
 * alınamıyordu ve kimliği ele geçen herkes belgeyi açabiliyordu. Jeton
 * süresi dolabilir, öğrenci istediği an iptal edebilir ve öğrenci numarası
 * öğrenci ayrıca izin vermedikçe maskeli görünür.
 */
export default async function PublicTranscriptPage({ params }: { params: { token: string } }) {
  const link = await resolveShareToken(params.token);

  if (link.status !== "ok") {
    return <TranscriptUnavailable status={link.status} />;
  }

  const data = await getTranscript(link.userId, { revealStudentId: link.revealStudentId });
  if (!data) return <TranscriptUnavailable status="missing" />;

  const shareUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/transkript/${params.token}`;

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

        <div className="mt-6 print:hidden">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Bu belge TED Üniversitesi TEDU Pass sisteminden canlı olarak üretilmiştir. Aşağıdaki
            her katılım kaydı, etkinlik anında QR ile alınmış check-in verisine dayanır. Belgeyi
            paylaşan öğrenci bu bağlantıyı istediği an iptal edebilir.
          </p>
        </div>

        <div className="mt-6 print:mt-0">
          <TranscriptDocument data={data} verifyUrl={shareUrl} />
        </div>
      </div>
    </main>
  );
}

const MESSAGES: Record<string, { title: string; body: string }> = {
  missing: {
    title: "Bağlantı bulunamadı",
    body: "Bu paylaşım bağlantısı geçerli değil. Bağlantıyı sana gönderen öğrenciden güncel bir bağlantı isteyebilirsin."
  },
  revoked: {
    title: "Bağlantı iptal edildi",
    body: "Öğrenci bu paylaşım bağlantısını iptal etti. Belgeyi görmek için öğrenciden yeni bir bağlantı isteyebilirsin."
  },
  expired: {
    title: "Bağlantının süresi doldu",
    body: "Bu paylaşım bağlantısının geçerlilik süresi doldu. Öğrenciden yeni bir bağlantı isteyebilirsin."
  }
};

function TranscriptUnavailable({ status }: { status: "missing" | "revoked" | "expired" }) {
  const msg = MESSAGES[status];
  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container-tight">
        <Link href="/">
          <Logo />
        </Link>
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <LinkIcon className="h-8 w-8 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{msg.title}</h1>
            <p className="max-w-md text-sm text-muted-foreground">{msg.body}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
