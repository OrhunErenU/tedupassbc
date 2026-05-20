"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClub } from "@/lib/actions/clubs";

export default function NewClubPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const f = new FormData(e.currentTarget);
      const res = await createClub({
        name: String(f.get("name") ?? ""),
        description: String(f.get("description") ?? "") || undefined
      });
      router.push(`/club/${res.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Hata");
      setBusy(false);
    }
  }

  return (
    <DashboardShell role="Kulüp Yöneticisi" title="Yeni kulüp">
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kulüp bilgileri</CardTitle>
            <Badge variant="warning">SKS onayı gerekir</Badge>
          </div>
          <CardDescription>
            Oluşturulan kulüp önce SKS dashboard'unda onay kuyruğuna düşer. Onaydan sonra etkinlik
            oluşturabilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kulüp adı</Label>
              <Input id="name" name="name" required minLength={3} placeholder="TEDÜ Blockchain Topluluğu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" name="description" rows={4} placeholder="Kulübünüzün amacı ve faaliyetleri" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Oluşturuluyor..." : "Kulübü oluştur"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>İptal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
