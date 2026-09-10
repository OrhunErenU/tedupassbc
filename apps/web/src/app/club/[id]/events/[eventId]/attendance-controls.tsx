"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAttendanceByEmail, removeAttendance } from "@/lib/actions/clubs";
import { BADGE_ROLES, BADGE_ROLE_LABEL } from "@/lib/roles";

/** Desk-side manual check-in for people the QR flow missed. */
export function AddAttendeeForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof BADGE_ROLES)[number]>("ATTENDEE");
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await addAttendanceByEmail({ eventId, email, role });
        setEmail("");
        setMsg({
          text: res.isNew
            ? `${res.email} eklendi — ilk girişinde rozeti cüzdanına düşer.`
            : `${res.name ?? res.email} eklendi.`,
          error: false
        });
        router.refresh();
      } catch (err: any) {
        setMsg({ text: err?.message ?? "Eklenemedi.", error: true });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ogrenci@tedu.edu.tr"
          aria-label="TEDÜ e-posta adresi"
          className="sm:flex-1"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof BADGE_ROLES)[number])}
          aria-label="Katılım rolü"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {BADGE_ROLES.map((r) => (
            <option key={r} value={r}>
              {BADGE_ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" disabled={pending || !email}>
          {pending ? "Ekleniyor..." : "Ekle"}
        </Button>
      </div>
      {msg ? (
        <p className={`text-xs ${msg.error ? "text-destructive" : "text-muted-foreground"}`}>
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}

export function RemoveAttendeeButton({
  attendanceId,
  name
}: {
  attendanceId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      type="button"
      title={error ?? `${name} kaydını sil`}
      aria-label={`${name} kaydını sil`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`${name} bu etkinlikten silinsin mi?`)) return;
        setError(null);
        startTransition(async () => {
          try {
            await removeAttendance(attendanceId);
            router.refresh();
          } catch (err: any) {
            setError(err?.message ?? "Silinemedi.");
          }
        });
      }}
      className={`rounded-md px-1.5 py-1 text-xs transition ${
        error ? "text-destructive" : "text-muted-foreground hover:text-destructive"
      }`}
    >
      {error ? "!" : "✕"}
    </button>
  );
}
