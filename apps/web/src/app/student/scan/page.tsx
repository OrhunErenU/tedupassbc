"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SwitchCamera } from "lucide-react";

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

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Enumerate cameras (labels populate once permission is granted).
  async function refreshDevices() {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "videoinput"));
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
  }, []);

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
      if (!res.ok) setStatus({ kind: "error", message: json.error ?? "Check-in başarısız" });
      else setStatus({ kind: "success", title: json.eventTitle ?? "Etkinlik" });
    } catch {
      setStatus({ kind: "error", message: "QR okunamadı" });
    }
  }

  // deviceId takes precedence; otherwise use the facing mode (mobile front/back).
  const constraints: MediaTrackConstraints = deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode };
  // Force the camera stream to restart when the selection changes.
  const scannerKey = deviceId || facingMode;

  return (
    <DashboardShell role="Öğrenci" title="QR Tara" description="Etkinlikteki check-in QR'ını tara — rozet daha sonra cüzdanına düşer.">
      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Kamera</CardTitle>
              <CardDescription>Kameraya izin vermen gerekir.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeviceId("");
                setFacingMode((f) => (f === "environment" ? "user" : "environment"));
              }}
              title="Ön/arka kamera"
            >
              <SwitchCamera className="h-4 w-4" />
              Çevir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {devices.length > 1 ? (
            <div className="mb-3 space-y-1.5">
              <Label htmlFor="cam">Kamera seç</Label>
              <select
                id="cam"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Otomatik ({facingMode === "environment" ? "arka" : "ön"})</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Kamera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-border bg-black/5">
            <Scanner
              key={scannerKey}
              onScan={(results) => results[0]?.rawValue && handleScan(results[0].rawValue)}
              onError={() => setStatus({ kind: "error", message: "Kamera hatası" })}
              constraints={constraints}
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
            <Button variant="outline" className="mt-4" onClick={() => { setStatus({ kind: "idle" }); refreshDevices(); }}>
              Yeniden tara
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
