"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createShareLink, revokeShareLink } from "@/lib/actions/share";
import { Link2, Check, Ban } from "lucide-react";

export type ShareLinkRow = {
  id: string;
  token: string;
  label: string | null;
  revealStudentId: boolean;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
};

const EXPIRY_CHOICES = [
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
  { days: 0, label: "Süresiz" }
];

function stateOf(l: ShareLinkRow): "revoked" | "expired" | "active" {
  if (l.revokedAt) return "revoked";
  if (l.expiresAt && new Date(l.expiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

export function ShareLinks({ links, appUrl }: { links: ShareLinkRow[]; appUrl: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(30);
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(`${appUrl}/transkript/${token}`);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* Pano yoksa bağlantı zaten ekranda yazılı. */
    }
  }

  function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await createShareLink({
          label: label || undefined,
          expiresInDays: days,
          revealStudentId: reveal
        });
        setLabel("");
        await copy(res.token);
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Bağlantı oluşturulamadı.");
      }
    });
  }

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Paylaşım bağlantıları</CardTitle>
        <CardDescription>
          Her kurum için ayrı bağlantı üret; birini iptal ettiğinde diğerleri çalışmaya devam eder.
          Öğrenci numaran, sen açıkça izin vermedikçe paylaşılan belgede maskeli görünür.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={create} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="label">Not (opsiyonel)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Erasmus başvurusu"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Geçerlilik</Label>
              <select
                id="expiry"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {EXPIRY_CHOICES.map((c) => (
                  <option key={c.days} value={c.days}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={reveal}
              onChange={(e) => setReveal(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Öğrenci numaram bu bağlantıda açık görünsün
              <span className="block text-xs">
                Çoğu işveren için gerekmez; sadece okulun resmî olarak istediği durumlarda işaretle.
              </span>
            </span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            <Link2 className="mr-2 h-4 w-4" />
            {pending ? "Oluşturuluyor..." : "Yeni bağlantı oluştur ve kopyala"}
          </Button>
        </form>

        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz paylaşım bağlantın yok. Belgeni paylaşmak için yukarıdan bir tane oluştur.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {links.map((l) => {
              const state = stateOf(l);
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{l.label ?? "Paylaşım bağlantısı"}</span>
                      {state === "active" ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : state === "expired" ? (
                        <Badge variant="outline">Süresi doldu</Badge>
                      ) : (
                        <Badge variant="warning">İptal edildi</Badge>
                      )}
                      {l.revealStudentId ? (
                        <Badge variant="outline">Öğrenci no açık</Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {l.viewCount} görüntülenme
                      {l.expiresAt
                        ? ` · ${new Date(l.expiresAt).toLocaleDateString("tr-TR")} tarihine kadar`
                        : " · süresiz"}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {state === "active" ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => copy(l.token)}>
                          {copied === l.token ? (
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <Link2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {copied === l.token ? "Kopyalandı" : "Kopyala"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm("Bu bağlantı iptal edilsin mi? Erişimi olan herkes belgeyi göremez olur.")) return;
                            startTransition(async () => {
                              await revokeShareLink(l.id);
                              router.refresh();
                            });
                          }}
                        >
                          <Ban className="mr-1.5 h-3.5 w-3.5" />
                          İptal et
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
