"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveClub, rejectClub, revokeClubApproval } from "@/lib/actions/sks";
import type { ActionResult } from "@/lib/action-result";

/**
 * Bekleyen başvuru için onayla/reddet.
 *
 * "Reddet" yalnızca geçmişi olmayan bekleyen başvuruyu siler; etkinlik yapmış
 * bir kulüpte sunucu reddeder çünkü silme katılım kayıtlarını da götürür.
 */
export function ApproveClubButtons({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.refresh();
      } catch {
        setError("İşlem tamamlanamadı.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => approveClub(clubId))}>
          Onayla
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Başvuru reddedilsin mi? Kulüp kaydı silinir.")) return;
            run(() => rejectClub(clubId));
          }}
        >
          Reddet
        </Button>
      </div>
      {error ? <p className="max-w-xs text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/** Onaylı kulüp için: geçmişe dokunmadan onayı geri alma. */
export function RevokeClubButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Kulübün onayı geri alınsın mı? Yeni etkinlik oluşturamaz; geçmiş etkinlik, katılım ve rozetler korunur."
            )
          )
            return;
          setError(null);
          startTransition(async () => {
            try {
              const res = await revokeClubApproval(clubId);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              router.refresh();
            } catch {
              setError("İşlem tamamlanamadı.");
            }
          });
        }}
      >
        Onayı geri al
      </Button>
      {error ? <p className="max-w-xs text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
