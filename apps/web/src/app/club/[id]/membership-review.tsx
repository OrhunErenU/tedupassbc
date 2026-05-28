"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveMembership, rejectMembership } from "@/lib/actions/clubs";

export function MembershipReview({ clubId, userId }: { clubId: string; userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex shrink-0 gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(async () => { await approveMembership(userId, clubId); router.refresh(); })}
      >
        Onayla
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => { await rejectMembership(userId, clubId); router.refresh(); })}
      >
        Reddet
      </Button>
    </div>
  );
}
