import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "TEDU Pass — Dijital Başarı Pasaportu",
  description:
    "TED Üniversitesi öğrencileri için doğrulanabilir, devredilemez dijital rozet sistemi.",
  applicationName: "TEDU Pass",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TEDU Pass",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#C8102E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
