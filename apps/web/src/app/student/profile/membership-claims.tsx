"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { claimMembership, removeMembership } from "@/lib/actions/profile";

type Membership = {
  clubId: string;
  clubName: string;
  role: string;
  title: string | null;
  status: string;
};

const ROLE_LABEL: Record<string, string> = {
  PRESIDENT: "Başkan",
  BOARD: "Yönetim Kurulu",
  MEMBER: "Üye"
};

export function MembershipClaims({
  clubs,
  memberships
}: {
  clubs: { id: string; name: string }[];
  memberships: Membership[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clubId, setClubId] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clubId) {
      setError("Bir topluluk seç.");
      return;
    }
    startTransition(async () => {
      try {
        await claimMembership({ clubId, role: role as any, title: title || undefined });
        setTitle("");
        setClubId("");
        setRole("MEMBER");
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Hata");
      }
    });
  }

  return (
    <div className="space-y-5">
      {memberships.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {memberships.map((m) => (
            <li key={m.clubId} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{m.clubName}</span>
                  {m.status === "APPROVED" ? (
                    <Badge variant="success">doğrulandı</Badge>
                  ) : (
                    <Badge variant="warning">onay bekliyor</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ROLE_LABEL[m.role] ?? m.role}
                  {m.title ? ` · ${m.title}` : ""}
                </div>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => { await removeMembership(m.clubId); router.refresh(); })}
                className="shrink-0 text-xs text-destructive hover:underline"
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Henüz bir topluluk görevi eklemedin.</p>
      )}

      <form onSubmit={add} className="space-y-3 rounded-lg border border-dashed border-border p-3">
        <p className="text-sm font-medium">Görev ekle</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="club">Topluluk</Label>
            <select
              id="club"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Seç…</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Rol</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="MEMBER">Üye</option>
              <option value="BOARD">Yönetim Kurulu</option>
              <option value="PRESIDENT">Başkan</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taskTitle">Görev / pozisyon (opsiyonel)</Label>
          <Input
            id="taskTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Etkinlik Koordinatörü, Sosyal Medya Sorumlusu…"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Ekleniyor…" : "Görevi ekle (onaya gönder)"}
        </Button>
      </form>
    </div>
  );
}
