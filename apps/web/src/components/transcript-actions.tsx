"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Link2, Check } from "lucide-react";

/**
 * Transkript üstündeki eylem çubuğu. Yazdırma tarayıcının kendi diyaloğunu
 * açar — oradan "PDF olarak kaydet" seçilerek resmî belge dosyaya alınır.
 * Yazdırma çıktısında bu çubuk görünmez (print:hidden).
 */
export function TranscriptActions({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano erişimi yoksa sessizce geç — bağlantı zaten belgenin altında yazılı.
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Yazdır / PDF indir
      </Button>
      <Button variant="outline" onClick={copyLink}>
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />}
        {copied ? "Bağlantı kopyalandı" : "Paylaşım bağlantısını kopyala"}
      </Button>
    </div>
  );
}
