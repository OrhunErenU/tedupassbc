import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-tedu text-white">
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/20" />
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span>
        TEDU<span className="text-tedu">Pass</span>
      </span>
    </span>
  );
}
