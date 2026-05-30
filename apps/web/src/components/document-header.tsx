import { Guilloche } from "@/components/security-pattern";
import { cn } from "@/lib/utils";

/**
 * Dashboard "document header" strip — visually ties any dashboard surface to the
 * landing's passport / credential aesthetic. A deep color band with a guilloché
 * watermark and a monospace serial line that reads like an official document header.
 */
export function DocumentHeader({
  serial,
  caption,
  title,
  subtitle,
  variant = "red",
  className
}: {
  serial: string;
  caption: string;
  title: string;
  subtitle?: string;
  variant?: "red" | "violet" | "green" | "blue" | "console";
  className?: string;
}) {
  const bg: Record<string, string> = {
    red: "linear-gradient(125deg, #A60D26 0%, #C8102E 50%, #7C3AED 130%)",
    violet: "linear-gradient(125deg, #4C1D95 0%, #7C3AED 60%, #C8102E 130%)",
    green: "linear-gradient(125deg, #064E3B 0%, #0F9D6B 60%, #2563EB 130%)",
    blue: "linear-gradient(125deg, #1E3A8A 0%, #2563EB 60%, #7C3AED 130%)",
    console: "linear-gradient(125deg, #1A1A18 0%, #2E2E2C 60%, #1A1A18 130%)"
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl text-white",
        className
      )}
      style={{ background: bg[variant] }}
    >
      <Guilloche className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 text-white/20" count={28} />
      <Guilloche className="pointer-events-none absolute -left-24 -bottom-32 h-72 w-72 text-white/12" count={22} />
      <div className="relative flex flex-col gap-1.5 px-7 py-6 sm:px-9 sm:py-7">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
            {caption}
          </span>
          <span className="font-mono text-[11px] text-white/55">/{serial}</span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-xl text-sm text-white/75">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
