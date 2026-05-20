"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { closeEvent, mintBadgesForEvent } from "@/lib/actions/events";

export function EventActions({ eventId, status }: { eventId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksiyonlar</CardTitle>
        <CardDescription>Etkinlik bittiğinde önce kapat, sonra rozetleri bas.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {status === "ACTIVE" ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await closeEvent(eventId);
                setMsg("Etkinlik kapatıldı.");
                router.refresh();
              })
            }
          >
            Etkinliği kapat
          </Button>
        ) : null}
        {status === "CLOSED" ? (
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const res = await mintBadgesForEvent(eventId);
                  setMsg(
                    res.onChain
                      ? `${res.minted} rozet zincire basıldı (${res.queued} bekliyor).`
                      : `${res.queued} rozet kuyruğa alındı (zincir devre dışı).`
                  );
                  router.refresh();
                } catch (err: any) {
                  setMsg(err?.message ?? "Hata");
                }
              })
            }
          >
            Rozetleri bas
          </Button>
        ) : null}
        {msg ? <p className="basis-full text-sm text-muted-foreground">{msg}</p> : null}
      </CardContent>
    </Card>
  );
}
