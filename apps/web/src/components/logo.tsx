import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * TEDU Pass brand lockup: the official TED Üniversitesi crest paired with the
 * "Pass" product wordmark, signalling the system is institutional infrastructure
 * rather than a standalone crypto product.
 */
export function Logo({
  className,
  showWordmark = true,
  tagline = true
}: {
  className?: string;
  showWordmark?: boolean;
  tagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">
            TEDU <span className="text-tedu">Pass</span>
          </span>
          {tagline ? (
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Doğrulanabilir Başarı Pasaportu
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/tedu-emblem.png"
      alt="TED Üniversitesi"
      width={64}
      height={64}
      priority
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
