// Single source of truth for badge role labels. The wallet art, the SVG used in
// tokenURI images, the transcript and the club panel all read from here so a
// student never sees a raw enum like "ORGANIZER" in Turkish UI copy.

export const BADGE_ROLES = ["ATTENDEE", "ORGANIZER", "SPEAKER", "MENTOR", "VOLUNTEER"] as const;

export type BadgeRoleKey = (typeof BADGE_ROLES)[number];

export const BADGE_ROLE_LABEL: Record<BadgeRoleKey, string> = {
  ATTENDEE: "Katılımcı",
  ORGANIZER: "Organizatör",
  SPEAKER: "Konuşmacı",
  MENTOR: "Mentor",
  VOLUNTEER: "Gönüllü"
};

export function badgeRoleLabel(role: string): string {
  return BADGE_ROLE_LABEL[role as BadgeRoleKey] ?? role;
}
