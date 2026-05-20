import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@tedu-pass/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ExternalLink, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: { badgeId: string } }) {
  const badge = await prisma.badge
    .findUnique({
      where: { id: params.badgeId },
      include: {
        user: true,
        badgeTemplate: { include: { event: { include: { club: true } } } }
      }
    })
    .catch(() => null);

  if (!badge) notFound();

  const holderName = badge.user.isPublic
    ? badge.user.name ?? badge.user.teduEmail.split("@")[0]
    : "Gizli";

  const explorerUrl = badge.txHash
    ? `https://sepolia.basescan.org/tx/${badge.txHash}`
    : null;

  return (
    <main className="min-h-screen bg-muted/30 py-12">
      <div className="container-tight">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>

        <Card className="mt-6 overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1fr_1.4fr]">
            <div className="relative flex items-center justify-center bg-gradient-to-br from-tedu via-tedu-600 to-tedu-700 p-10 text-white">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
              <div className="relative aspect-square w-48 rounded-2xl bg-white/10 p-5 backdrop-blur">
                <Trophy className="h-7 w-7" />
                <div className="mt-12 text-[10px] font-medium uppercase tracking-wider opacity-80">
                  {badge.badgeTemplate.roleType}
                </div>
                <div className="text-sm font-semibold leading-tight">
                  {badge.badgeTemplate.event.title}
                </div>
              </div>
            </div>
            <div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <Badge variant="success">Doğrulandı</Badge>
                </div>
                <CardTitle className="mt-2 text-2xl">{badge.badgeTemplate.name}</CardTitle>
                <CardDescription>
                  {badge.badgeTemplate.event.club.name} · {badge.badgeTemplate.event.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Row label="Sahip" value={holderName} />
                <Row label="Rol" value={badge.badgeTemplate.roleType} />
                <Row
                  label="Etkinlik tarihi"
                  value={badge.badgeTemplate.event.date.toLocaleDateString("tr-TR")}
                />
                <Row
                  label="Verildi"
                  value={(badge.mintedAt ?? badge.createdAt).toLocaleDateString("tr-TR")}
                />
                <Separator />
                <Row label="Token ID" value={badge.tokenId ?? "—"} mono />
                <Row label="İşlem" value={badge.txHash ? short(badge.txHash) : "—"} mono />
                {explorerUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={explorerUrl} target="_blank" rel="noreferrer">
                      Basescan'de görüntüle
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bu rozet, TED Üniversitesi öğrenci topluluğu tarafından düzenlenen bir etkinlikteki katılımın
          doğrulanabilir kaydıdır. Devredilemez (ERC-5192 Soulbound) NFT olarak Base ağında saklanır.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
    </div>
  );
}

function short(s: string) {
  return s.length > 16 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s;
}
