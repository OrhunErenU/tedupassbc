import Link from "next/link";
import { Guilloche } from "@/components/security-pattern";
import { LogoMark } from "@/components/logo";
import { ROLE_LABEL_TR, CLUB_ROLE_LABEL_TR, type Transcript } from "@/lib/transcript";
import { ShieldCheck } from "lucide-react";

/**
 * Resmî Etkinlik Katılım Transkripti.
 *
 * Aynı belge iki yerde görünür: öğrencinin kendi sayfası (/student/transkript)
 * ve paylaşılabilir doğrulama bağlantısı (/transkript/[id]). Yazdırma için
 * optimize edilmiştir — tarayıcıdan "PDF olarak kaydet" ile resmî belge çıkar.
 */

function fmtDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function TranscriptDocument({ data, verifyUrl }: { data: Transcript; verifyUrl: string }) {
  const { user, totals } = data;
  const displayName = user.name ?? user.teduEmail.split("@")[0];

  return (
    <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card print:max-w-none print:rounded-none print:border-0">
      {/* Belge başlığı — pasaport bandı */}
      <header
        className="relative overflow-hidden px-8 py-7 text-white print:py-5"
        style={{ background: "linear-gradient(125deg, #A60D26 0%, #C8102E 55%, #7C3AED 130%)" }}
      >
        <Guilloche className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 text-white/20" count={30} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9 text-white" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/75">
                TED Üniversitesi · TEDU Pass
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                Etkinlik Katılım Transkripti
              </h1>
            </div>
          </div>
          <div className="shrink-0 text-right font-mono text-[10px] leading-relaxed text-white/75">
            <div>BELGE NO</div>
            <div className="text-white">{data.serial}</div>
            <div className="mt-1.5">DÜZENLEME</div>
            <div className="text-white">{fmtDate(data.issuedAt)}</div>
          </div>
        </div>
      </header>

      {/* Öğrenci künyesi */}
      <section className="grid gap-6 border-b border-border px-8 py-6 sm:grid-cols-[auto_1fr]">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{displayName}</h2>
          {user.title ? <p className="text-sm text-muted-foreground">{user.title}</p> : null}
          <dl className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <Field label="Kurum e-postası" value={user.teduEmail} />
            <Field label="Öğrenci numarası" value={user.studentId ?? "—"} />
          </dl>
        </div>
      </section>

      {/* Özet */}
      <section className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
        <Stat label="Toplam katılım" value={totals.events} />
        <Stat label="Doğrulanmış görev" value={totals.roles} />
        <Stat label="Farklı topluluk" value={totals.clubs} />
        <Stat label="Basılan rozet" value={totals.badges} />
      </section>

      {/* Doğrulanmış topluluk görevleri */}
      {data.roles.length > 0 ? (
        <section className="border-b border-border px-8 py-6">
          <h3 className="eyebrow">Doğrulanmış topluluk görevleri</h3>
          <ul className="mt-3 divide-y divide-border">
            {data.roles.map((r, i) => (
              <li key={`${r.clubName}-${i}`} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.clubName}</div>
                  <div className="text-xs text-muted-foreground">
                    {CLUB_ROLE_LABEL_TR[r.role] ?? r.role}
                    {r.title ? ` · ${r.title}` : ""}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> topluluk onaylı
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Dönem dönem katılım dökümü */}
      <section className="px-8 py-6">
        <h3 className="eyebrow">Dönem bazlı katılım dökümü</h3>

        {data.groups.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Bu öğrenci için henüz kayıtlı etkinlik katılımı bulunmuyor.
          </p>
        ) : (
          data.groups.map((g) => (
            <div key={g.term.id} className="mt-5 break-inside-avoid">
              <div className="flex items-baseline justify-between border-b border-border pb-1.5">
                <h4 className="text-sm font-semibold">{g.term.label}</h4>
                <span className="font-mono text-xs text-muted-foreground">{g.rows.length} katılım</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">Tarih</th>
                    <th className="font-medium">Etkinlik</th>
                    <th className="font-medium">Topluluk</th>
                    <th className="font-medium">Rol</th>
                    <th className="font-medium">Kayıt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {g.rows.map((r) => (
                    <tr key={r.attendanceId} className="break-inside-avoid align-top">
                      <td className="whitespace-nowrap py-2 font-mono text-xs text-muted-foreground">
                        {fmtDate(r.date)}
                      </td>
                      <td className="py-2 pr-3 font-medium">{r.eventTitle}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.clubName}</td>
                      <td className="py-2 pr-3">{ROLE_LABEL_TR[r.role] ?? r.role}</td>
                      <td className="py-2">
                        {r.badgeId ? (
                          <Link
                            href={`/verify/${r.badgeId}`}
                            className="font-mono text-xs text-tedu hover:underline print:text-foreground print:no-underline"
                          >
                            /{r.badgeId.slice(-8).toUpperCase()}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">beklemede</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {/* Belge altbilgisi — doğrulama */}
      <footer className="border-t border-border bg-secondary/60 px-8 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Bu belge dijital olarak doğrulanabilir.</p>
            <p className="mt-1">
              Her satır, etkinlik anında QR ile alınmış check-in kaydına dayanır ve elle
              düzenlenemez. Belgenin güncel halini aşağıdaki adresten teyit edebilirsiniz.
            </p>
            <p className="mt-2 break-all font-mono text-[11px] text-foreground">{verifyUrl}</p>
          </div>
          <div className="text-right font-mono text-[10px] leading-relaxed text-muted-foreground">
            <div>TEDU PASS</div>
            <div>{data.serial}</div>
            <div>{fmtDate(data.issuedAt)}</div>
          </div>
        </div>
      </footer>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="min-w-0 truncate font-medium">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
