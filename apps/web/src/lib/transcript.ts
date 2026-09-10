import { prisma } from "@tedu-pass/db";
import { termPartsForDate, buildTerm, type Term } from "@/lib/term";
import { BADGE_ROLE_LABEL } from "@/lib/roles";

/**
 * Etkinlik Katılım Transkripti verisi.
 *
 * Kaynak Attendance kaydıdır (QR ile yapılan check-in) — rozet değil. Rozet
 * etkinlik kapandıktan sonra basılır; transkript ise katılımın kendisini
 * gösterir ve rozeti basılmış satırları ayrıca işaretler.
 */

export type TranscriptRow = {
  attendanceId: string;
  date: Date;
  eventTitle: string;
  clubName: string;
  location: string | null;
  role: string;
  /** Rozet basıldıysa doğrulama sayfasına gitmek için */
  badgeId: string | null;
};

export type TranscriptTermGroup = {
  term: Term;
  rows: TranscriptRow[];
};

export type TranscriptRole = {
  clubName: string;
  role: string;
  title: string | null;
  joinedAt: Date;
};

export type Transcript = {
  user: {
    id: string;
    name: string | null;
    teduEmail: string;
    studentId: string | null;
    title: string | null;
    avatarUrl: string | null;
  };
  /** Belge numarası — kullanıcı kimliğinden türetilir, kalıcıdır. */
  serial: string;
  issuedAt: Date;
  groups: TranscriptTermGroup[];
  roles: TranscriptRole[];
  totals: {
    events: number;
    badges: number;
    clubs: number;
    roles: number;
    terms: number;
  };
};

export const ROLE_LABEL_TR: Record<string, string> = BADGE_ROLE_LABEL;

export const CLUB_ROLE_LABEL_TR: Record<string, string> = {
  PRESIDENT: "Başkan",
  BOARD: "Yönetim Kurulu",
  MEMBER: "Üye"
};

export function transcriptSerial(userId: string): string {
  return `TEDU-PASS/${userId.slice(-8).toUpperCase()}`;
}

export async function getTranscript(userId: string): Promise<Transcript | null> {
  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        teduEmail: true,
        studentId: true,
        title: true,
        avatarUrl: true
      }
    })
    .catch(() => null);

  if (!user) return null;

  const [attendances, memberships, badges] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId },
      include: { event: { include: { club: { select: { name: true } } } } },
      orderBy: { event: { date: "desc" } }
    }),
    prisma.clubMember.findMany({
      where: { userId, status: "APPROVED" },
      include: { club: { select: { name: true } } },
      orderBy: { joinedAt: "desc" }
    }),
    prisma.badge.findMany({
      where: { userId },
      select: { id: true, badgeTemplate: { select: { eventId: true } } }
    })
  ]);

  // Etkinlik -> rozet eşlemesi, satırlara doğrulama bağlantısı koyabilmek için.
  const badgeByEvent = new Map<string, string>();
  for (const b of badges) badgeByEvent.set(b.badgeTemplate.eventId, b.id);

  const byTerm = new Map<string, TranscriptTermGroup>();
  for (const a of attendances) {
    const { academicYear, kind } = termPartsForDate(a.event.date);
    const term = buildTerm(academicYear, kind);
    let g = byTerm.get(term.id);
    if (!g) {
      g = { term, rows: [] };
      byTerm.set(term.id, g);
    }
    g.rows.push({
      attendanceId: a.id,
      date: a.event.date,
      eventTitle: a.event.title,
      clubName: a.event.club.name,
      location: a.event.location,
      role: a.role,
      badgeId: badgeByEvent.get(a.eventId) ?? null
    });
  }

  const groups = [...byTerm.values()].sort(
    (x, y) => y.term.start.getTime() - x.term.start.getTime()
  );

  const clubNames = new Set(attendances.map((a) => a.event.club.name));

  return {
    user,
    serial: transcriptSerial(user.id),
    issuedAt: new Date(),
    groups,
    roles: memberships.map((m) => ({
      clubName: m.club.name,
      role: m.role,
      title: m.title,
      joinedAt: m.joinedAt
    })),
    totals: {
      events: attendances.length,
      badges: badges.length,
      clubs: clubNames.size,
      roles: memberships.length,
      terms: groups.length
    }
  };
}
