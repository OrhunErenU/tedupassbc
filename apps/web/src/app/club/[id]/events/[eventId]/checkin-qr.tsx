"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { SLICE_MS } from "@/lib/checkin-code";

/**
 * Canlı check-in QR'ı.
 *
 * Kod 30 saniyede bir döndüğü için görüntü ekranda yenilenmek zorunda:
 * ekran görüntüsü ya da çıktı alınmış bir QR bir dakika içinde işlemez olur.
 * Bu yüzden burada indirme düğmesi yok — QR canlı gösterilmeli.
 */
export function CheckinQr({ eventId, windowState }: { eventId: string; windowState: "before" | "open" | "after" }) {
  const [tick, setTick] = useState(() => Date.now());
  const [remaining, setRemaining] = useState(SLICE_MS);

  useEffect(() => {
    // Dilim sınırına hizala, sonra her dilimde bir yenile.
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(() => {
      setTick(Date.now());
      interval = setInterval(() => setTick(Date.now()), SLICE_MS);
    }, SLICE_MS - (Date.now() % SLICE_MS));

    const countdown = setInterval(() => {
      setRemaining(SLICE_MS - (Date.now() % SLICE_MS));
    }, 250);

    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
      clearInterval(countdown);
    };
  }, []);

  const seconds = Math.ceil(remaining / 1000);
  const pct = (remaining / SLICE_MS) * 100;

  return (
    <div>
      <div className="relative rounded-xl border border-border bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/events/${eventId}/qr?t=${tick}`}
          alt="Check-in QR kodu"
          className="aspect-square w-full"
        />
        {windowState !== "open" ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/85 p-4 text-center">
            <span className="text-sm font-medium">
              {windowState === "before"
                ? "Check-in henüz açılmadı"
                : "Check-in süresi doldu"}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Kod {seconds} sn sonra yenilenir</span>
          <Badge variant="outline">30 sn&apos;lik kod</Badge>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-tedu transition-[width] duration-200 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        QR&apos;ı ekranda canlı göster. Kod 30 saniyede bir değiştiği için ekran görüntüsü veya
        çıktı işe yaramaz — etkinliğe gelmeyen biri başkasının gönderdiği kodla check-in yapamaz.
      </p>
    </div>
  );
}
