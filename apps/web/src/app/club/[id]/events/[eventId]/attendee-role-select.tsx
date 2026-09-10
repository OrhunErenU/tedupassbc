"use client";

import { useTransition } from "react";
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
  return (
    <select
      aria-label="Katılım rolü"
      disabled={pending}
      defaultValue={current}
      onChange={(e) =>
        startTransition(async () => {
          await setAttendanceRole({
            attendanceId,
            role: e.target.value as (typeof BADGE_ROLES)[number]
          });
          router.refresh();
        })
      }
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {BADGE_ROLES.map((r) => (
        <option key={r} value={r}>
          {BADGE_ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}
