// Server-side SVG generator for badge NFT images. Mirrors the visual language of
// the <BadgeArt> React component so the on-chain tokenURI image matches the in-app art.

type Theme = { from: string; to: string; glyph: string };

const ROLE_LABEL: Record<string, string> = {
  ATTENDEE: "Katılımcı",
  ORGANIZER: "Organizatör",
  SPEAKER: "Konuşmacı",
  MENTOR: "Mentor",
  VOLUNTEER: "Gönüllü"
};

const ROLE_THEME: Record<string, Theme> = {
  ORGANIZER: { from: "#E11332", to: "#820A1E", glyph: "M3 7h18M3 12h18M3 17h12" },
  SPEAKER: { from: "#F59E0B", to: "#B45309", glyph: "M12 3v12m0 0a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM6 12a6 6 0 0012 0M8 21h8" },
  MENTOR: { from: "#7C3AED", to: "#4C1D95", glyph: "M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9-2.9.9-5.5-4-3.9 5.5-.8z" },
  VOLUNTEER: { from: "#10B981", to: "#065F46", glyph: "M12 21s-7-4.3-9.3-9.2C1.2 8.4 3 5 6.4 5 8.5 5 10 6.3 12 8.6 14 6.3 15.5 5 17.6 5 21 5 22.8 8.4 21.3 11.8 19 16.7 12 21 12 21z" },
  ATTENDEE: { from: "#2563EB", to: "#1E3A8A", glyph: "M5 13l4 4L19 7" }
};

function esc(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;" }[c]!));
}
function clamp(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function badgeSvg(opts: {
  role: string;
  eventTitle: string;
  clubName?: string;
  date?: string;
}): string {
  const theme = ROLE_THEME[opts.role] ?? ROLE_THEME.ATTENDEE;
  const label = ROLE_LABEL[opts.role] ?? opts.role;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="600" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.from}"/><stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
    <radialGradient id="r" cx="0.3" cy="0.2" r="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.28"/><stop offset="55%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#g)"/>
  <rect width="200" height="200" rx="20" fill="url(#r)"/>
  <circle cx="100" cy="100" r="74" fill="none" stroke="#fff" stroke-opacity="0.10"/>
  <circle cx="100" cy="100" r="62" fill="none" stroke="#fff" stroke-opacity="0.14" stroke-dasharray="2 4"/>
  <circle cx="100" cy="74" r="30" fill="#fff" fill-opacity="0.14"/>
  <g transform="translate(82,56) scale(1.5)" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${theme.glyph}"/></g>
  <text x="100" y="128" text-anchor="middle" fill="#fff" fill-opacity="0.85" font-family="Inter,system-ui,sans-serif" font-size="9" font-weight="700" letter-spacing="2">${esc(label.toUpperCase())}</text>
  <text x="100" y="146" text-anchor="middle" fill="#fff" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700">${esc(clamp(opts.eventTitle, 22))}</text>
  <text x="100" y="166" text-anchor="middle" fill="#fff" fill-opacity="0.75" font-family="Inter,system-ui,sans-serif" font-size="8.5">${esc(clamp(opts.clubName ?? "TEDÜ", 26))}</text>
  ${opts.date ? `<text x="100" y="180" text-anchor="middle" fill="#fff" fill-opacity="0.6" font-family="Inter,system-ui,sans-serif" font-size="7.5" letter-spacing="1">${esc(opts.date)}</text>` : ""}
  <rect x="1" y="1" width="198" height="198" rx="20" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="1.4"/>
</svg>`;
}
