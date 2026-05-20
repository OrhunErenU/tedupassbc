"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false }
);

export default function ScanPage() {
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "scanning" }
    | { kind: "success"; title: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleScan(value: string) {
    if (status.kind === "scanning") return;
    setStatus({ kind: "scanning" });
    try {
      const data = JSON.parse(value) as { e: string; s: string };
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: data.e, qrSecret: data.s })
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: json.error ?? "Check-in başarısız" });
      } else {
        setStatus({ kind: "success", title: json.eventTitle ?? "Etkinlik" });
      }
    } catch {
      setStatus({ kind: "error", message: "QR okunamadı" });
    }
  }

  return (
    <DashboardShell role="Öğrenci" title="QR Tara" description="Etkinlikteki check-in QR'ını tara — rozet daha sonra cüzdanına düşer.">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Kamera</CardTitle>
          <CardDescription>Kameraya izin vermen gerekir.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border bg-black/5">
            <Scanner
              onScan={(results) => results[0]?.rawValue && handleScan(results[0].rawValue)}
              onError={() => setStatus({ kind: "error", message: "Kamera hatası" })}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%" } }}
            />
          </div>
          <div className="mt-4 min-h-[3rem]">
            {status.kind === "success" ? (
              <div className="flex items-center gap-2">
                <Badge variant="success">Check-in başarılı</Badge>
                <span className="text-sm text-muted-foreground">{status.title}</span>
              </div>
            ) : status.kind === "error" ? (
              <Badge variant="warning">Hata: {status.message}</Badge>
            ) : status.kind === "scanning" ? (
              <Badge variant="outline">Doğrulanıyor...</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Kodu kameraya tut.</span>
            )}
          </div>
          {status.kind !== "idle" ? (
            <Button variant="outline" className="mt-4" onClick={() => setStatus({ kind: "idle" })}>
              Yeniden tara
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
