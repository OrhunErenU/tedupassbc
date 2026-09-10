import { prisma } from "@tedu-pass/db";
import { safeQuery } from "@/lib/safe-db";
import { termDateFilter, type Term } from "@/lib/term";

/**
 * SKS raporları — dönem bazlı.
 *
 * Tüm raporlar tek bir etkinlik sorgusundan türetilir: etkinlik + katılım
 * kayıtları çekilir, toplulaştırma JS tarafında yapılır. Bu, kulüp/öğrenci/
 * etkinlik kırılımlarının aynı veriden ve birbiriyle tutarlı üretilmesini
 * sağlar (rapor satırları toplamda birbirini tutar).
 */

export type EventRow = {
  id: string;
  title: string;
  clubName: string;
  date: Date;
  location: string | null;
  status: string;
  attendeeCount: number;
  organizerCount: number;
  badgeCount: number;
};

export type ClubRow = {
  id: string;
  name: string;
  approved: boolean;
  eventCount: number;
  attendanceCount: number;
  uniqueParticipants: number;
  memberCount: number;
};

export type StudentRow = {
  id: string;
  name: string | null;
  teduEmail: string;
  studentId: string | null;
  eventCount: number;
  badgeCount: number;
  clubCount: number;
};

export type ReportBundle = {
  term: Term | null;
  events: EventRow[];
  clubs: ClubRow[];
  students: StudentRow[];
  totals: {
    events: number;
    attendances: number;
    activeClubs: number;
    participants: number;
  };
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Taslak",
  ACTIVE: "Aktif",
  CLOSED: "Tamamlandı"
};

export function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s;
}

export async function getReportBundle(term: Term | null): Promise<ReportBundle> {
  const dateFilter = termDateFilter(term);

  const events = await safeQuery(
    () =>
      prisma.event.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        include: {
          club: { select: { id: true, name: true, approvedBySks: true } },
          attendances: {
            select: {
              role: true,
              user: {
                select: { id: true, name: true, teduEmail: true, studentId: true }
              }
            }
          },
          badgeTemplates: { select: { _count: { select: { badges: true } } } }
        },
        orderBy: { date: "desc" }
      }),
    []
  );

  const memberCounts = await safeQuery(
    () =>
      prisma.clubMember.groupBy({
        by: ["clubId"],
        where: { status: "APPROVED" },
        _count: { userId: true }
      }),
    [] as { clubId: string; _count: { userId: number } }[]
  );
  const membersByClub = new Map(memberCounts.map((m) => [m.clubId, m._count.userId]));

  // --- Etkinlik kırılımı ---
  const eventRows: EventRow[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    clubName: e.club.name,
    date: e.date,
    location: e.location,
    status: e.status,
    attendeeCount: e.attendances.length,
    organizerCount: e.attendances.filter((a) => a.role !== "ATTENDEE").length,
    badgeCount: e.badgeTemplates.reduce((s, t) => s + t._count.badges, 0)
  }));

  // --- Kulüp kırılımı ---
  const clubAgg = new Map<
    string,
    { id: string; name: string; approved: boolean; events: number; attendances: number; users: Set<string> }
  >();
  for (const e of events) {
    let c = clubAgg.get(e.club.id);
    if (!c) {
      c = {
        id: e.club.id,
        name: e.club.name,
        approved: e.club.approvedBySks,
        events: 0,
        attendances: 0,
        users: new Set()
      };
      clubAgg.set(e.club.id, c);
    }
    c.events += 1;
    c.attendances += e.attendances.length;
    for (const a of e.attendances) c.users.add(a.user.id);
  }
  const clubs: ClubRow[] = [...clubAgg.values()]
    .map((c) => ({
      id: c.id,
      name: c.name,
      approved: c.approved,
      eventCount: c.events,
      attendanceCount: c.attendances,
      uniqueParticipants: c.users.size,
      memberCount: membersByClub.get(c.id) ?? 0
    }))
    .sort((a, b) => b.attendanceCount - a.attendanceCount);

  // --- Öğrenci kırılımı ---
  const studentAgg = new Map<
    string,
    {
      id: string;
      name: string | null;
      teduEmail: string;
      studentId: string | null;
      events: number;
      clubs: Set<string>;
    }
  >();
  for (const e of events) {
    for (const a of e.attendances) {
      let s = studentAgg.get(a.user.id);
      if (!s) {
        s = {
          id: a.user.id,
          name: a.user.name,
          teduEmail: a.user.teduEmail,
          studentId: a.user.studentId,
          events: 0,
          clubs: new Set()
        };
        studentAgg.set(a.user.id, s);
      }
      s.events += 1;
      s.clubs.add(e.club.id);
    }
  }

  // Rozet sayıları yalnızca dönemdeki etkinlikler için sayılır.
  const eventIds = events.map((e) => e.id);
  const badges = eventIds.length
    ? await safeQuery(
        () =>
          prisma.badge.findMany({
            where: { badgeTemplate: { eventId: { in: eventIds } } },
            select: { userId: true }
          }),
        []
      )
    : [];
  const badgeByUser = new Map<string, number>();
  for (const b of badges) badgeByUser.set(b.userId, (badgeByUser.get(b.userId) ?? 0) + 1);

  const students: StudentRow[] = [...studentAgg.values()]
    .map((s) => ({
      id: s.id,
      name: s.name,
      teduEmail: s.teduEmail,
      studentId: s.studentId,
      eventCount: s.events,
      badgeCount: badgeByUser.get(s.id) ?? 0,
      clubCount: s.clubs.size
    }))
    .sort((a, b) => b.eventCount - a.eventCount);

  return {
    term,
    events: eventRows,
    clubs,
    students,
    totals: {
      events: eventRows.length,
      attendances: eventRows.reduce((s, e) => s + e.attendeeCount, 0),
      activeClubs: clubs.length,
      participants: studentAgg.size
    }
  };
}
