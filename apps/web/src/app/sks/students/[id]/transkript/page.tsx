import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { TranscriptDocument } from "@/components/transcript-document";
import { TranscriptActions } from "@/components/transcript-actions";
import { getTranscript } from "@/lib/transcript";
import { requirePageRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * SKS'in bir öğrencinin transkriptini görüntülemesi.
 *
 * Öğrencinin paylaşım jetonu üzerinden değil, kendi oturumu üzerinden erişir —
 * personelin belge görmek için öğrenciden bağlantı istemesi gerekmez, ve
 * bakılan belge bir paylaşım bağlantısı üretmez. Öğrenci numarası açık:
 * SKS bu alanı zaten öğrenci listesinde görüyor.
 */
export default async function SksStudentTranscriptPage({ params }: { params: { id: string } }) {
  await requirePageRole([UserRole.SKS_ADMIN]);

  const data = await getTranscript(params.id, { revealStudentId: true });
  if (!data) notFound();

  return (
    <DashboardShell
      role="SKS"
      title={data.user.name ?? data.user.teduEmail}
      description="Öğrencinin etkinlik katılım transkripti"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sks/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Öğrenciler
            </Link>
          </Button>
          <TranscriptActions />
        </div>
      }
    >
      <TranscriptDocument data={data} />
    </DashboardShell>
  );
}
