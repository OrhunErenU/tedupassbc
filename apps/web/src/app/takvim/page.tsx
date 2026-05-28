import Link from "next/link";
import { prisma, EventStatus } from "@tedu-pass/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { safeQuery } from "@/lib/safe-db";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Stable per-club accent so each club's events read as a colour-coded set.
const PALETTE = ["#C8102E", "#2563EB", "#0F9D6B", "#7C3AED", "#E08A1E", "#0EA5E9"];
function clubColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default async function CalendarPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const events = await safeQuery(
    () =>
      prisma.event.findMany({
        where: { date: { gte: new Date(monthStart.getTime() - 7 * DAY_MS) } },
        include: { club: { select: { id: true, name: true } } },
        orderBy: { date: "asc" }
      }),
    []
  );

  // Index events by day-of-month for the grid.
  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const k = ymd(new Date(e.date));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(e);
  }

  // Build the month grid (Mon-first).
  const firstWeekday = (monthStart.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Agenda: upcoming events (from today), grouped by day.
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now.getTime() - DAY_MS);
  const agenda = new Map<string, typeof events>();
  for (const e of upcoming) {
    const d = new Date(e.date);
    const k = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!agenda.has(k)) agenda.set(k, []);
    agenda.get(k)!.push(e);
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container-tight">
        <div className="flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Button asChild variant="outline" size="sm"><Link href="/student">Panele git</Link></Button>
        </div>

        <div className="mt-6">
          <p className="eyebrow">Etkinlik takvimi</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {MONTHS[now.getMonth()]} {now.getFullYear()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            TEDÜ topluluklarının güncel etkinlikleri. Yeni etkinlik girildikçe burada belirir.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Month grid */}
          <Card className="shadow-none">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{w}</div>
                ))}
                {cells.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} />;
                  const k = `${now.getFullYear()}-${now.getMonth()}-${d}`;
                  const dayEvents = byDay.get(k) ?? [];
                  const isToday = d === now.getDate();
                  return (
                    <div
                      key={k}
                      className={`min-h-[58px] rounded-md border p-1 text-left ${isToday ? "border-tedu/50 bg-accent/40" : "border-border"}`}
                    >
                      <div className={`text-xs ${isToday ? "font-semibold text-tedu" : "text-muted-foreground"}`}>{d}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {dayEvents.slice(0, 4).map((e) => (
                          <span
                            key={e.id}
                            title={`${e.club.name} — ${e.title}`}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: clubColor(e.club.id) }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Yaklaşan etkinlikler</CardTitle>
              <CardDescription>Bugünden itibaren.</CardDescription>
            </CardHeader>
            <CardContent>
              {agenda.size === 0 ? (
                <p className="text-sm text-muted-foreground">Yaklaşan etkinlik yok.</p>
              ) : (
                <div className="space-y-5">
                  {[...agenda.entries()].map(([day, evs]) => (
                    <div key={day}>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{day}</p>
                      <ul className="mt-2 space-y-2">
                        {evs.map((e) => (
                          <li key={e.id}>
                            <Link
                              href={`/club/${e.club.id}`}
                              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition hover:border-tedu/40 hover:shadow-sm"
                            >
                              <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: clubColor(e.club.id) }} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{e.title}</span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {e.club.name} · {new Date(e.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                  {e.location ? ` · ${e.location}` : ""}
                                </span>
                              </span>
                              {e.status === EventStatus.ACTIVE ? <Badge variant="success">aktif</Badge> : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
