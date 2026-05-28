import { cn } from "@/lib/utils";

type Row = { k: string; v: string; ok?: boolean; hl?: boolean };

/**
 * The signature "verifiable record" device: a dark monospace console strip that
 * surfaces on-chain proof (token id, tx hash, contract, status). Reserved strictly
 * for verifiable data so "blockchain" is felt, not shouted.
 */
export function OnChainRecord({
  rows,
  title = "ON-CHAIN KAYIT",
  className
}: {
  rows: Row[];
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("onchain overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b border-[hsl(var(--console-border))] px-3.5 py-2">
        <span className="dot bg-[hsl(var(--console-accent))]" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--console-foreground)/0.7)]">
          {title}
        </span>
      </div>
      <dl className="grid gap-1.5 px-3.5 py-3">
        {rows.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between gap-4">
            <dt className="k shrink-0">{r.k}</dt>
            <dd className={cn("v truncate text-right", r.ok && "ok", r.hl && "hl")}>{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
