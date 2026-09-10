import Link from "next/link";
import { UserRole } from "@tedu-pass/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { DocumentHeader } from "@/components/document-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePageRole } from "@/lib/auth";
import { getReportBundle, statusLabel } from "@/lib/reports";
import { parseTerm, currentTerm, recentTerms } from "@/lib/term";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SksReportPage({
  searchParams
}: {
  searchParams: { donem?: string };
}) {
  await requirePageRole([UserRole.SKS_ADMIN]);

  const donem = searchParams.donem;
  const isAll = donem === "tum";
  const term = isAll ? null : (parseTerm(donem) ?? currentTerm());
  const data = await getReportBundle(term);

  const terms = recentTerms(6);
  const activeId = isAll ? "tum" : term!.id;
  const scopeLabel = term ? term.label : "Tüm zamanlar";
  const qs = isAll ? "tum" : term!.id;

  return (
    <DashboardShell
      role="SKS"
      title="Raporlar"
      description="Dönem bazlı kulüp, öğrenci ve etkinlik raporları — Excel'e aktarılabilir."
    >
      <DocumentHeader
        caption={`SKS · Dönem Raporu · ${scopeLabel}`}
        serial="REPORT-002"
        title={`${scopeLabel} faaliyet raporu`}
        subtitle="Bütçe görüşmeleri, akreditasyon dosyaları ve rektörlük sunumları için hazır veri. Her tablo tek tıkla Excel'e aktarılır."
        variant="blue"
        className="mb-8"
      />

      {/* Dönem seçici */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">Dönem</span>
        {terms.map((t) => (
          <TermChip key={t.id} href={`/sks/rapor?donem=${t.id}`} active={activeId === t.id}>
            {t.label}
          </TermChip>
        ))}
        <TermChip href="/sks/rapor?donem=tum" active={isAll}>
          Tüm zamanlar
        </TermChip>
      </div>

      {/* Özet */}
      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Etkinlik" value={data.totals.events} />
        <Stat label="Toplam katılım" value={data.totals.attendances} />
        <Stat label="Etkinlik yapan kulüp" value={data.totals.activeClubs} />
        <Stat label="Farklı öğrenci" value={data.totals.participants} />
      </div>

      {/* İndirme */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Excel'e aktar</CardTitle>
          <CardDescription>
            {scopeLabel} verisi, Türkçe karakterler ve sütun ayrımı Excel uyumlu olacak şekilde
            indirilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={`/api/sks/rapor/kulupler?donem=${qs}`}>
              <Download className="mr-2 h-4 w-4" /> Kulüp raporu
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/sks/rapor/ogrenciler?donem=${qs}`}>
              <Download className="mr-2 h-4 w-4" /> Öğrenci raporu
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/sks/rapor/etkinlikler?donem=${qs}`}>
              <Download className="mr-2 h-4 w-4" /> Etkinlik raporu
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Kulüp tablosu */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Kulüp faaliyet tablosu</CardTitle>
          <CardDescription>Toplam katılıma göre sıralı.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.clubs.length === 0 ? (
            <Empty>Bu dönemde etkinlik yapan kulüp yok.</Empty>
          ) : (
            <Table
              head={["#", "Kulüp", "Etkinlik", "Katılım", "Farklı katılımcı", "Üye"]}
              rows={data.clubs.map((c, i) => [
                i + 1,
                <span key="n" className="font-medium">
                  {c.name}
                  {!c.approved ? (
                    <Badge variant="warning" className="ml-2">
                      onay bekliyor
                    </Badge>
                  ) : null}
                </span>,
                c.eventCount,
                c.attendanceCount,
                c.uniqueParticipants,
                c.memberCount
              ])}
            />
          )}
        </CardContent>
      </Card>

      {/* Etkinlik tablosu */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Etkinlikler</CardTitle>
          <CardDescription>{data.events.length} etkinlik · en yeniden eskiye.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.events.length === 0 ? (
            <Empty>Bu dönemde kayıtlı etkinlik yok.</Empty>
          ) : (
            <Table
              head={["Tarih", "Etkinlik", "Kulüp", "Durum", "Katılım", "Rozet"]}
              rows={data.events.slice(0, 50).map((e) => [
                <span key="d" className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {e.date.toLocaleDateString("tr-TR")}
                </span>,
                <span key="t" className="font-medium">
                  {e.title}
                </span>,
                <span key="c" className="text-muted-foreground">
                  {e.clubName}
                </span>,
                statusLabel(e.status),
                e.attendeeCount,
                e.badgeCount
              ])}
            />
          )}
          {data.events.length > 50 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              İlk 50 etkinlik gösteriliyor — tamamı için Excel raporunu indir.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function TermChip({
  href,
  active,
  children
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-transparent bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="py-2.5 pr-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
