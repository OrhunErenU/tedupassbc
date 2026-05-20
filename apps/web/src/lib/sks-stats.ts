import { prisma, EventStatus } from "@tedu-pass/db";
import { safeQuery } from "@/lib/safe-db";

export type SksSummary = {
  totalClubs: number;
  pendingClubs: number;
  activeEvents: number;
  monthEvents: number;
  totalAttendances: number;
  totalBadges: number;
  pendingClubsList: { id: string; name: string; createdAt: Date; description: string | null }[];
  topStudents: { id: string; name: string | null; teduEmail: string; badgeCount: number }[];
  topClubs: { id: string; name: string; eventCount: number; attendanceCount: number }[];
};

export async function getSksSummary(): Promise<SksSummary> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalClubs, pendingClubs, activeEvents, monthEvents, totalAttendances, totalBadges] =
    await Promise.all([
      safeQuery(() => prisma.club.count(), 0),
      safeQuery(() => prisma.club.count({ where: { approvedBySks: false } }), 0),
      safeQuery(() => prisma.event.count({ where: { status: EventStatus.ACTIVE } }), 0),
      safeQuery(() => prisma.event.count({ where: { date: { gte: startOfMonth } } }), 0),
      safeQuery(() => prisma.attendance.count(), 0),
      safeQuery(() => prisma.badge.count(), 0)
    ]);

  const pendingClubsList = await safeQuery(
    () =>
      prisma.club.findMany({
        where: { approvedBySks: false },
        select: { id: true, name: true, createdAt: true, description: true },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
    []
  );

  const topStudentsRaw = await safeQuery(
    () =>
      prisma.user.findMany({
        where: { role: "STUDENT" },
        select: {
          id: true,
          name: true,
          teduEmail: true,
          _count: { select: { badges: true } }
        },
        orderBy: { badges: { _count: "desc" } },
        take: 10
      }),
    []
  );
  const topStudents = topStudentsRaw
    .map((u) => ({ id: u.id, name: u.name, teduEmail: u.teduEmail, badgeCount: u._count.badges }))
    .filter((u) => u.badgeCount > 0);

  const topClubsRaw = await safeQuery(
    () =>
      prisma.club.findMany({
        where: { approvedBySks: true },
        select: {
          id: true,
          name: true,
          _count: { select: { events: true } },
          events: { select: { _count: { select: { attendances: true } } } }
        },
        take: 50
      }),
    []
  );
  const topClubs = topClubsRaw
    .map((c) => ({
      id: c.id,
      name: c.name,
      eventCount: c._count.events,
      attendanceCount: c.events.reduce((s, e) => s + e._count.attendances, 0)
    }))
    .sort((a, b) => b.attendanceCount - a.attendanceCount)
    .slice(0, 10);

  return {
    totalClubs,
    pendingClubs,
    activeEvents,
    monthEvents,
    totalAttendances,
    totalBadges,
    pendingClubsList,
    topStudents,
    topClubs
  };
}
