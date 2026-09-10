import { NextRequest } from "next/server";
import { UserRole } from "@tedu-pass/db";
import { getSessionUser } from "@/lib/auth";
import { getReportBundle, statusLabel } from "@/lib/reports";
import { parseTerm, currentTerm } from "@/lib/term";
import { toCsv, csvResponse } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SKS rapor indirme — CSV (Excel uyumlu).
 *
 *   /api/sks/rapor/kulupler?donem=2025-guz
 *   /api/sks/rapor/ogrenciler?donem=2025-guz
 *   /api/sks/rapor/etkinlikler?donem=tum
 *
 * Yalnızca SKS yöneticileri erişebilir; rapor kişisel veri içerdiği için
 * yetki kontrolü uç noktada tekrar yapılır (sayfa guard'ına güvenilmez).
 */

const KINDS = ["kulupler", "ogrenciler", "etkinlikler"] as const;
type Kind = (typeof KINDS)[number];

export async function GET(req: NextRequest, { params }: { params: { kind: string } }) {
  const user = await getSessionUser().catch(() => null);
  if (!user || user.role !== UserRole.SKS_ADMIN) {
    return new Response("Bu raporu indirme yetkiniz yok.", { status: 403 });
  }

  const kind = params.kind as Kind;
  if (!KINDS.includes(kind)) {
    return new Response("Bilinmeyen rapor türü.", { status: 404 });
  }

  const donemParam = req.nextUrl.searchParams.get("donem");
  // "tum" => tüm zamanlar; parametre yoksa içinde bulunulan dönem.
  const term = donemParam === "tum" ? null : (parseTerm(donemParam) ?? currentTerm());
  const data = await getReportBundle(term);

  const scope = term ? term.id : "tum-zamanlar";
  const stamp = new Date().toISOString().slice(0, 10);

  if (kind === "kulupler") {
    const csv = toCsv(
      ["Kulüp", "SKS onaylı", "Etkinlik sayısı", "Toplam katılım", "Farklı katılımcı", "Üye sayısı"],
      data.clubs.map((c) => [
        c.name,
        c.approved ? "Evet" : "Hayır",
        c.eventCount,
        c.attendanceCount,
        c.uniqueParticipants,
        c.memberCount
      ])
    );
    return csvResponse(`tedu-pass-kulup-raporu-${scope}-${stamp}.csv`, csv);
  }

  if (kind === "ogrenciler") {
    const csv = toCsv(
      ["Ad Soyad", "Öğrenci numarası", "E-posta", "Katıldığı etkinlik", "Rozet", "Farklı topluluk"],
      data.students.map((s) => [
        s.name ?? "",
        s.studentId ?? "",
        s.teduEmail,
        s.eventCount,
        s.badgeCount,
        s.clubCount
      ])
    );
    return csvResponse(`tedu-pass-ogrenci-raporu-${scope}-${stamp}.csv`, csv);
  }

  const csv = toCsv(
    ["Tarih", "Etkinlik", "Kulüp", "Yer", "Durum", "Katılım", "Görevli", "Rozet"],
    data.events.map((e) => [
      e.date,
      e.title,
      e.clubName,
      e.location ?? "",
      statusLabel(e.status),
      e.attendeeCount,
      e.organizerCount,
      e.badgeCount
    ])
  );
  return csvResponse(`tedu-pass-etkinlik-raporu-${scope}-${stamp}.csv`, csv);
}
