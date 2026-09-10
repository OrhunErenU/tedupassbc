/**
 * Akademik dönem (Güz / Bahar / Yaz) yardımcıları.
 *
 * Üniversite raporlaması takvim yılına değil akademik döneme göre yapılır:
 * SKS "2025-2026 Güz dönemi raporu" ister, "2025 raporu" değil. Dönem bilgisi
 * veritabanında tutulmaz — etkinlik tarihinden türetilir, böylece şema
 * değişmeden geçmiş veri de doğru dönemlere düşer.
 *
 * Dönem sınırları (TR yükseköğretim takvimi):
 *   Güz   : 1 Eylül   – 31 Ocak    (akademik yıl başlangıç yılı)
 *   Bahar : 1 Şubat   – 30 Haziran
 *   Yaz   : 1 Temmuz  – 31 Ağustos
 */

export type TermKind = "guz" | "bahar" | "yaz";

export type Term = {
  /** URL'de kullanılan kimlik, ör. "2025-guz" */
  id: string;
  /** İnsan okunur etiket, ör. "2025-2026 Güz" */
  label: string;
  kind: TermKind;
  /** Akademik yılın başlangıç yılı (2025-2026 için 2025) */
  academicYear: number;
  start: Date;
  end: Date;
};

const KIND_LABEL: Record<TermKind, string> = {
  guz: "Güz",
  bahar: "Bahar",
  yaz: "Yaz"
};

/** Bir tarihin hangi akademik yıl + döneme düştüğünü bulur. */
export function termPartsForDate(d: Date): { academicYear: number; kind: TermKind } {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0 = Ocak

  if (m >= 8) return { academicYear: y, kind: "guz" }; // Eylül–Aralık
  if (m === 0) return { academicYear: y - 1, kind: "guz" }; // Ocak → önceki güzün devamı
  if (m >= 1 && m <= 5) return { academicYear: y - 1, kind: "bahar" }; // Şubat–Haziran
  return { academicYear: y - 1, kind: "yaz" }; // Temmuz–Ağustos
}

export function buildTerm(academicYear: number, kind: TermKind): Term {
  let start: Date;
  let end: Date;

  if (kind === "guz") {
    start = new Date(academicYear, 8, 1); // 1 Eylül
    end = new Date(academicYear + 1, 1, 1); // 1 Şubat (hariç)
  } else if (kind === "bahar") {
    start = new Date(academicYear + 1, 1, 1); // 1 Şubat
    end = new Date(academicYear + 1, 6, 1); // 1 Temmuz (hariç)
  } else {
    start = new Date(academicYear + 1, 6, 1); // 1 Temmuz
    end = new Date(academicYear + 1, 8, 1); // 1 Eylül (hariç)
  }

  return {
    id: `${academicYear}-${kind}`,
    label: `${academicYear}-${academicYear + 1} ${KIND_LABEL[kind]}`,
    kind,
    academicYear,
    start,
    end
  };
}

export function currentTerm(now: Date = new Date()): Term {
  const { academicYear, kind } = termPartsForDate(now);
  return buildTerm(academicYear, kind);
}

/** Kimlikten dönemi çözer; geçersizse null. */
export function parseTerm(id: string | undefined | null): Term | null {
  if (!id) return null;
  const m = /^(\d{4})-(guz|bahar|yaz)$/.exec(id);
  if (!m) return null;
  return buildTerm(Number(m[1]), m[2] as TermKind);
}

/**
 * Filtre menüsü için dönem listesi — içinde bulunulan dönemden geriye doğru.
 * Yaz dönemleri çoğu zaman boş olduğu için varsayılan listede yer almaz.
 */
export function recentTerms(count = 6, now: Date = new Date()): Term[] {
  const cur = termPartsForDate(now);
  const out: Term[] = [];
  let year = cur.academicYear;
  let kind: TermKind = cur.kind === "yaz" ? "bahar" : cur.kind;

  while (out.length < count) {
    out.push(buildTerm(year, kind));
    if (kind === "bahar") {
      kind = "guz";
    } else {
      kind = "bahar";
      year -= 1;
    }
  }
  return out;
}

/** Prisma `where` için tarih aralığı; dönem yoksa (tüm zamanlar) undefined. */
export function termDateFilter(term: Term | null) {
  if (!term) return undefined;
  return { gte: term.start, lt: term.end };
}
