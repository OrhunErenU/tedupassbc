/**
 * CSV uretimi - Excel uyumlu.
 *
 * Iki kritik ayrinti var:
 *  1) UTF-8 BOM: Excel (Windows) BOM olmadan dosyayi ANSI sanip Turkce
 *     karakterleri bozar - "Ogrenci Isleri" yerine "Ã–ÄŸrenci" gorunur.
 *  2) Ayirici olarak noktali virgul: Turkce Windows yerel ayarinda Excel'in
 *     varsayilan liste ayiricisi ";" oldugu icin virgullu dosya tek sutuna duser.
 */

const SEP = ";";

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toLocaleDateString("tr-TR");
  const s = String(v);
  // Ayirici, tirnak veya satir sonu iceren hucreler tirnaklanir.
  if (s.includes(SEP) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(SEP)];
  for (const r of rows) lines.push(r.map(cell).join(SEP));
  // BOM + CRLF: Excel'in beklediği bicim.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Tarayiciya indirme olarak donen CSV yaniti. */
export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
