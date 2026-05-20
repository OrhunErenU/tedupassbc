"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile";

export function ProfileForm({
  initial
}: {
  initial: { name: string; username: string; studentId: string; isPublic: boolean };
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      try {
        await updateProfile({
          name: state.name || null,
          username: state.username || null,
          studentId: state.studentId || null,
          isPublic: state.isPublic
        });
        setMsg({ kind: "ok", text: "Kaydedildi." });
        router.refresh();
      } catch (err: any) {
        setMsg({ kind: "err", text: err?.message ?? "Hata" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">İsim</Label>
        <Input
          id="name"
          value={state.name}
          onChange={(e) => setState({ ...state, name: e.target.value })}
          placeholder="Ad Soyad"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Kullanıcı adı</Label>
        <Input
          id="username"
          value={state.username}
          onChange={(e) => setState({ ...state, username: e.target.value.toLowerCase() })}
          placeholder="orhun-eren"
          pattern="[a-z0-9_-]+"
        />
        <p className="text-xs text-muted-foreground">
          Public profil URL'inde kullanılır: <code>/u/kullanici-adi</code>
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="studentId">Öğrenci numarası</Label>
        <Input
          id="studentId"
          value={state.studentId}
          onChange={(e) => setState({ ...state, studentId: e.target.value })}
          placeholder="20220XXX"
        />
      </div>
      <label className="flex items-center gap-3 rounded-md border border-border p-3">
        <input
          type="checkbox"
          checked={state.isPublic}
          onChange={(e) => setState({ ...state, isPublic: e.target.checked })}
        />
        <div className="text-sm">
          <div className="font-medium">Profilim public olsun</div>
          <div className="text-xs text-muted-foreground">
            İsmin ve rozetlerin /u/{state.username || "kullanici-adi"} linkinde görünür.
          </div>
        </div>
      </label>
      {msg ? (
        <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>
          {msg.text}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
