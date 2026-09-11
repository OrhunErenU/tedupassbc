import { chainStatus } from "@/lib/chain";
import { AlertTriangle } from "lucide-react";

/**
 * Zincir yapılandırılmamışken panelde açık uyarı.
 *
 * Eskiden eksik yapılandırma sessizce "kuyruğa alındı" olarak geçiyordu; bir
 * kulüp koca bir etkinliği rozetler basılıyor sanarak yürütebilirdi. Rozet
 * basabilen her ekran bu uyarıyı gösterir.
 */
export function ChainStatusBanner() {
  const status = chainStatus();
  if (status.configured) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
      <div className="text-sm">
        <p className="font-medium text-amber-900">
          Zincir yapılandırılmamış — rozetler blockchain&apos;e yazılmıyor.
        </p>
        <p className="mt-1 text-amber-900/80">
          Rozetler veritabanında kuyrukta tutulur ve doğrulama sayfası zincir kaydı gösteremez.
          Yapılandırma tamamlanınca &quot;Rozetleri bas&quot; ile kuyruktakiler zincire yazılır.
        </p>
        <p className="mt-1.5 font-mono text-xs text-amber-900/70">
          Eksik: {status.missing.join(", ") || "kontrat kurulumu"}
        </p>
      </div>
    </div>
  );
}
