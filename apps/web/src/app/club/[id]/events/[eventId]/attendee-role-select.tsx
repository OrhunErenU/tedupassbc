"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAttendanceRole } from "@/lib/actions/clubs";
import { BADGE_ROLES, BADGE_ROLE_LABEL } from "@/lib/roles";

export function AttendeeRoleSelect({
  attendanceId,
  current
}: {
  attendanceId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);

  function change(next: string) {
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await setAttendanceRole({
          attendanceId,
          role: next as (typeof BADGE_ROLES)[number]
        });
        if (!res.ok) {
          // Put the select back: the role on the server is still the old one.
          setValue(previous);
          setError(res.error);
          return;
        }
        router.refresh();
      } catch {
        setValue(previous);
        setError("Rol değiştirilemedi.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        aria-label="Katılım rolü"
        disabled={pending}
        value={value}
        onChange={(e) => change(e.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        {BADGE_ROLES.map((r) => (
          <option key={r} value={r}>
            {BADGE_ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {error ? <p className="max-w-[12rem] text-right text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
