import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@tedu-pass/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { BadgeArt, roleLabel } from "@/components/badge-art";
import { ShieldCheck, ExternalLink } from "lucide-react";

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

  const ev = badge.badgeTemplate.event;
  const holderName = badge.user.isPublic
    ? badge.user.name ?? badge.user.teduEmail.split("@")[0]
    : "Gizli";

  const contract = process.env.TEDU_PASS_CONTRACT_ADDRESS || null;
  const explorerTx = badge.txHash ? `https://sepolia.basescan.org/tx/${badge.txHash}` : null;

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container-tight">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Doğrulanmış kayıt
          </span>
        </div>

        {/* Credential card */}
        <Card className="mt-6 overflow-hidden shadow-none">
          <div className="grid gap-0 md:grid-cols-[0.85fr_1.15fr]">
            <div className="flex items-center justify-center border-b border-border bg-secondary p-8 md:border-b-0 md:border-r">
              <BadgeArt
                role={badge.badgeTemplate.roleType}
                eventTitle={ev.title}
                clubName={ev.club.name}
                date={ev.date.toLocaleDateString("tr-TR")}
                className="w-52 rounded-2xl"
              />
            </div>
            <div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Doğrulandı</Badge>
                  <span className="text-xs text-muted-foreground">TEDÜ · Pass</span>
                </div>
                <CardTitle className="mt-2 text-2xl tracking-tight">
                  {badge.badgeTemplate.name}
                </CardTitle>
                <CardDescription>
                  {ev.club.name} · {ev.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <Spec label="Sahip" value={holderName} />
                  <Spec label="Rol" value={roleLabel(badge.badgeTemplate.roleType)} />
                  <Spec label="Etkinlik tarihi" value={ev.date.toLocaleDateString("tr-TR")} />
                  <Spec
                    label="Verildi"
                    value={(badge.mintedAt ?? badge.createdAt).toLocaleDateString("tr-TR")}
                  />
                  {ev.location ? <Spec label="Konum" value={ev.location} /> : null}
                </dl>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* On-chain record — data console */}
        <div className="mt-4 overflow-hidden rounded-xl bg-console text-console-foreground">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
              Zincir kaydı
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/80">
              {badge.txHash ? "on-chain" : "kuyrukta"}
            </span>
          </div>
          <dl className="grid gap-px bg-white/5 sm:grid-cols-2">
            <ChainRow label="Ağ" value="Base Sepolia" />
            <ChainRow label="Standart" value="ERC-5192 · Soulbound" />
            <ChainRow label="Kontrat" value={contract ? shortHex(contract) : "—"} />
            <ChainRow label="Token ID" value={badge.tokenId ?? "—"} />
            <ChainRow
              label="Sahip cüzdanı"
              value={badge.user.walletAddress ? shortHex(badge.user.walletAddress) : "—"}
            />
            <ChainRow label="İşlem" value={badge.txHash ? shortHex(badge.txHash) : "—"} />
          </dl>
          {explorerTx ? (
            <div className="border-t border-white/10 px-5 py-3">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={explorerTx} target="_blank" rel="noreferrer">
                  Basescan&apos;de görüntüle
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bu rozet, TED Üniversitesi öğrenci topluluğu tarafından düzenlenen bir etkinlikteki katılımın
          doğrulanabilir kaydıdır. Devredilemez (ERC-5192 Soulbound) NFT olarak Base ağında saklanır.
        </p>
      </div>
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function ChainRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-console px-5 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-white/45">{label}</dt>
      <dd className="mt-1 font-mono text-[13px] text-white/90">{value}</dd>
    </div>
  );
}

function shortHex(s: string) {
  return s.length > 16 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s;
}
