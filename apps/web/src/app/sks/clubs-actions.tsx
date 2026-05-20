"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveClub, rejectClub } from "@/lib/actions/sks";

export function ApproveClubButtons({ clubId }: { clubId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => approveClub(clubId))}
      >
        Onayla
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(() => rejectClub(clubId))}
      >
        Reddet
      </Button>
    </div>
  );
}
