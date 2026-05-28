import { cn } from "@/lib/utils";

export type BadgeRoleKey = "ATTENDEE" | "ORGANIZER" | "SPEAKER" | "MENTOR" | "VOLUNTEER";

const ROLE_LABEL: Record<BadgeRoleKey, string> = {
  ATTENDEE: "Katılımcı",
  ORGANIZER: "Organizatör",
  SPEAKER: "Konuşmacı",
  MENTOR: "Mentor",
  VOLUNTEER: "Gönüllü"
};

// Each role gets its own gradient + glyph so a wallet of badges reads as a varied,
// collectible set rather than identical tiles.
const ROLE_THEME: Record<
  BadgeRoleKey,
  { from: string; to: string; ring: string; glyph: string }
> = {
  ORGANIZER: { from: "#E11332", to: "#820A1E", ring: "#FF9AAB", glyph: "M3 7h18M3 12h18M3 17h12" },
  SPEAKER: { from: "#F59E0B", to: "#B45309", ring: "#FCD78A", glyph: "M12 3v12m0 0a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM6 12a6 6 0 0012 0M8 21h8" },
  MENTOR: { from: "#7C3AED", to: "#4C1D95", ring: "#C4A8F5", glyph: "M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9-2.9.9-5.5-4-3.9 5.5-.8z" },
  VOLUNTEER: { from: "#10B981", to: "#065F46", ring: "#86EFC8", glyph: "M12 21s-7-4.3-9.3-9.2C1.2 8.4 3 5 6.4 5 8.5 5 10 6.3 12 8.6 14 6.3 15.5 5 17.6 5 21 5 22.8 8.4 21.3 11.8 19 16.7 12 21 12 21z" },
  ATTENDEE: { from: "#2563EB", to: "#1E3A8A", ring: "#9DBDFB", glyph: "M5 13l4 4L19 7" }
};

export function roleLabel(role: string) {
  return ROLE_LABEL[role as BadgeRoleKey] ?? role;
}

/**
 * Certificate-style soulbound badge artwork. Deterministic per role; carries the
 * event + club context and a guilloché-like seal so it feels like an official credential.
 */
export function BadgeArt({
  role,
  eventTitle,
  clubName,
  date,
  className
}: {
  role: string;
  eventTitle: string;
  clubName?: string;
  date?: string;
  className?: string;
}) {
  const theme = ROLE_THEME[(role as BadgeRoleKey)] ?? ROLE_THEME.ATTENDEE;
  const uid = `${role}-${eventTitle}`.replace(/[^a-z0-9]/gi, "").slice(0, 24);

  return (
    <div className={cn("aspect-square w-full", className)}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${roleLabel(role)} — ${eventTitle}`}>
        <defs>
          <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
          <radialGradient id={`r-${uid}`} cx="0.3" cy="0.2" r="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="200" height="200" rx="20" fill={`url(#g-${uid})`} />
        <rect width="200" height="200" rx="20" fill={`url(#r-${uid})`} />

        {/* Guilloché seal rings */}
        <circle cx="100" cy="100" r="74" fill="none" stroke="#fff" strokeOpacity="0.10" strokeWidth="1" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="2 4" />

        {/* Role glyph in a frosted disc */}
        <circle cx="100" cy="74" r="30" fill="#ffffff" fillOpacity="0.14" />
        <g transform="translate(82,56) scale(1.5)" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={theme.glyph} />
        </g>

        {/* Role label */}
        <text x="100" y="128" textAnchor="middle" fill="#fff" fillOpacity="0.85" fontSize="9" fontWeight="700" letterSpacing="2" style={{ textTransform: "uppercase" }}>
          {roleLabel(role)}
        </text>

        {/* Event title (clamped) */}
        <text x="100" y="146" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
          {clamp(eventTitle, 22)}
        </text>

        {/* Club + date footer */}
        <text x="100" y="166" textAnchor="middle" fill="#fff" fillOpacity="0.75" fontSize="8.5">
          {clamp(clubName ?? "TEDÜ", 26)}
        </text>
        {date ? (
          <text x="100" y="180" textAnchor="middle" fill="#fff" fillOpacity="0.6" fontSize="7.5" letterSpacing="1">
            {date}
          </text>
        ) : null}

        <rect x="1" y="1" width="198" height="198" rx="20" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

function clamp(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
