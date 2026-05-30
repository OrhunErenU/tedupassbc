"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/lib/actions/events";
import { fileToResizedDataUrl } from "@/lib/image";

export default function NewEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeImage, setBadgeImage] = useState<string | null>(null);

  async function onPickBadge(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBadgeImage(await fileToResizedDataUrl(file, 600, 0.85));
    } catch {
      setError("Rozet görseli yüklenemedi.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const ev = await createEvent({
        clubId: params.id,
        title: String(f.get("title") ?? ""),
        description: String(f.get("description") ?? "") || undefined,
        date: new Date(String(f.get("date"))).toISOString(),
        location: String(f.get("location") ?? "") || undefined,
        badgeImageUrl: badgeImage ?? undefined
      });
      router.push(`/club/${params.id}/events/${ev.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Hata");
      setBusy(false);
    }
  }

  return (
    <DashboardShell role="Kulüp Yöneticisi" title="Yeni etkinlik">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Etkinlik bilgileri</CardTitle>
          <CardDescription>Oluşturulan etkinlik için check-in QR'ı otomatik üretilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input id="title" name="title" required minLength={3} placeholder="Web3 101 Atölyesi — Açılış" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" name="description" rows={4} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Tarih ve saat</Label>
                <Input id="date" name="date" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasyon</Label>
                <Input id="location" name="location" placeholder="D Blok Konferans Salonu" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">Rozet tasarımı (opsiyonel)</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                  {badgeImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={badgeImage} alt="Rozet önizleme" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-[10px] text-muted-foreground">Önizleme</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Input id="badge" type="file" accept="image/*" onChange={onPickBadge} />
                  <p className="text-xs text-muted-foreground">
                    Bu etkinliğe katılanların rozetinde bu tasarım görünür. Boş bırakırsan role göre
                    otomatik rozet üretilir.
                  </p>
                  {badgeImage ? (
                    <button type="button" onClick={() => setBadgeImage(null)} className="text-xs text-destructive">
                      Kaldır
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Oluşturuluyor..." : "Etkinlik oluştur"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>İptal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
