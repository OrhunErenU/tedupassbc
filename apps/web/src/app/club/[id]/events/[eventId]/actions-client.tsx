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
                try {
                  const res = await closeEvent(eventId);
                  if (!res.ok) {
                    setMsg(res.error);
                    return;
                  }
                  setMsg("Etkinlik kapatıldı.");
                  router.refresh();
                } catch {
                  setMsg("Etkinlik kapatılamadı.");
                }
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
                  if (!res.ok) {
                    setMsg(res.error);
                    return;
                  }
                  const r = res.data;
                  const waiting =
                    r.queued > 0
                      ? ` ${r.queued} rozet, sahibi ilk girişini yapıp cüzdanı oluşana kadar kuyrukta.`
                      : "";
                  if (!r.onChain) {
                    setMsg(
                      `${r.queued} rozet kuyruğa alındı — zincir yapılandırılmadığı için henüz basılmadı.`
                    );
                  } else if (r.minted === 0) {
                    setMsg(`Basılacak yeni rozet yok.${waiting}`);
                  } else {
                    const partial =
                      r.missingTokenIds > 0
                        ? ` (${r.missingTokenIds} rozetin token ID'si makbuzdan okunamadı)`
                        : "";
                    setMsg(`${r.minted} rozet zincire basıldı${partial}.${waiting}`);
                  }
                  router.refresh();
                } catch {
                  setMsg("Rozetler basılamadı.");
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
