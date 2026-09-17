"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

/**
 * Transkript üstündeki eylem çubuğu. Yazdırma tarayıcının kendi diyaloğunu
 * açar — oradan "PDF olarak kaydet" seçilerek resmî belge dosyaya alınır.
 * Yazdırma çıktısında bu çubuk görünmez (print:hidden).
 *
 * Paylaşım artık burada değil: bağlantı üretme/iptal işlemleri, jetonları
 * yöneten <ShareLinks> bileşeninde.
 */
export function TranscriptActions() {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Yazdır / PDF indir
      </Button>
    </div>
  );
}
