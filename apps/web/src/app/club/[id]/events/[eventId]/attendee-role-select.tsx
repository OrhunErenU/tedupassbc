"use client";

import { useTransition } from "react";
import { setAttendanceRole } from "@/lib/actions/clubs";

const ROLES = ["ATTENDEE", "ORGANIZER", "SPEAKER", "MENTOR", "VOLUNTEER"] as const;

export function AttendeeRoleSelect({
  attendanceId,
  current
}: {
  attendanceId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      disabled={pending}
      defaultValue={current}
      onChange={(e) =>
        startTransition(() =>
          setAttendanceRole({ attendanceId, role: e.target.value as (typeof ROLES)[number] })
        )
      }
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
