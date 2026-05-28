"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import { fileToResizedDataUrl } from "@/lib/image";

type Initial = {
  name: string;
  username: string;
  studentId: string;
  title: string;
  bio: string;
  avatarUrl: string;
  isPublic: boolean;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToResizedDataUrl(file, 384, 0.85);
      setState((s) => ({ ...s, avatarUrl: url }));
    } catch {
      setMsg({ kind: "err", text: "Fotoğraf yüklenemedi." });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      try {
        await updateProfile({
          name: state.name || null,
          username: state.username || null,
          studentId: state.studentId || null,
          title: state.title || null,
          bio: state.bio || null,
          avatarUrl: state.avatarUrl || null,
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
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {state.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
              {(state.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avatar">Profil fotoğrafı</Label>
          <Input id="avatar" type="file" accept="image/*" onChange={onPickAvatar} />
          {state.avatarUrl ? (
            <button type="button" onClick={() => setState((s) => ({ ...s, avatarUrl: "" }))} className="text-xs text-destructive">
              Fotoğrafı kaldır
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">İsim</Label>
        <Input id="name" value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} placeholder="Ad Soyad" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Başlık</Label>
        <Input
          id="title"
          value={state.title}
          onChange={(e) => setState({ ...state, title: e.target.value })}
          placeholder="Bilgisayar Mühendisliği '26 · Blockchain Topluluğu"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Hakkımda</Label>
        <Textarea
          id="bio"
          rows={3}
          value={state.bio}
          onChange={(e) => setState({ ...state, bio: e.target.value })}
          placeholder="Kısa tanıtım — ilgi alanların, hedeflerin."
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
        <Input id="studentId" value={state.studentId} onChange={(e) => setState({ ...state, studentId: e.target.value })} placeholder="20220XXX" />
      </div>

      <label className="flex items-center gap-3 rounded-md border border-border p-3">
        <input type="checkbox" checked={state.isPublic} onChange={(e) => setState({ ...state, isPublic: e.target.checked })} />
        <div className="text-sm">
          <div className="font-medium">Profilim public olsun</div>
          <div className="text-xs text-muted-foreground">
            İsmin, başlığın, doğrulanmış görevlerin ve rozetlerin /u/{state.username || "kullanici-adi"} linkinde görünür.
          </div>
        </div>
      </label>

      {msg ? (
        <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>{msg.text}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
