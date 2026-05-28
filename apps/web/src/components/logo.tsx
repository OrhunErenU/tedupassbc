import { cn } from "@/lib/utils";

/**
 * TEDU Pass brand lockup: a TEDÜ emblem (red tile with the university lettermark)
 * paired with the "Pass" wordmark. The emblem doubles as a soulbound seal —
 * the small notch + ring evoke an official, tamper-proof stamp.
 */
export function Logo({
  className,
  showWordmark = true
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <LogoMark className="h-8 w-8" />
      {showWordmark ? (
        <span className="text-[15px] leading-none">
          TEDÜ<span className="font-normal text-muted-foreground"> · </span>
          <span className="text-tedu">Pass</span>
        </span>
      ) : null}
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="tedu-seal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E11332" />
            <stop offset="100%" stopColor="#A60D26" />
          </linearGradient>
        </defs>
        {/* Seal tile */}
        <rect x="1.5" y="1.5" width="37" height="37" rx="10" fill="url(#tedu-seal)" />
        <rect
          x="1.5"
          y="1.5"
          width="37"
          height="37"
          rx="10"
          fill="none"
          stroke="white"
          strokeOpacity="0.22"
          strokeWidth="1.2"
        />
        {/* Soulbound notch ring */}
        <circle cx="20" cy="20" r="13.5" fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="1" />
        {/* TEDÜ lettermark */}
        <text
          x="20"
          y="19.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-sans, Inter, system-ui, sans-serif)"
          fontSize="12.5"
          fontWeight="800"
          letterSpacing="-0.5"
          fill="white"
        >
          TED
        </text>
        {/* Verified tick baseline */}
        <path
          d="M14 27.5l3.2 3.2L26 22"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
        />
      </svg>
    </span>
  );
}
