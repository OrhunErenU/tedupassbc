import { cn } from "@/lib/utils";

/**
 * Guilloché security-engraving motif — the fine rosette line-work used on banknotes,
 * passports and certificates. Used as a faint background watermark to make TEDU Pass
 * feel like an official credential document rather than a generic SaaS card grid.
 */
export function Guilloche({
  className,
  stroke = "currentColor",
  count = 30
}: {
  className?: string;
  stroke?: string;
  count?: number;
}) {
  const rings = Array.from({ length: count });
  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("h-full w-full", className)}
      fill="none"
      aria-hidden="true"
    >
      <g stroke={stroke} strokeWidth="0.4">
        {rings.map((_, i) => (
          <ellipse
            key={i}
            cx="200"
            cy="200"
            rx="190"
            ry="74"
            transform={`rotate(${(360 / count) * i} 200 200)`}
          />
        ))}
      </g>
      <g stroke={stroke} strokeWidth="0.4" opacity="0.7">
        {rings.map((_, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={30 + i * 5.2}
          />
        ))}
      </g>
    </svg>
  );
}

/** Hairline blueprint grid — engineering-paper backdrop for section bands. */
export function GridField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--foreground)/0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse at center, black, transparent 78%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 78%)"
      }}
    />
  );
}
