import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/logo";
import { BadgeArt } from "@/components/badge-art";
import { OnChainRecord } from "@/components/onchain-record";
import { Guilloche, GridField } from "@/components/security-pattern";
import { QrCode, ShieldCheck, Trophy, Users, Building2, ArrowRight, Sparkles } from "lucide-react";

const roles = [
  {
    no: "01",
    icon: Users,
    title: "Öğrenci",
    description:
      "Etkinliklere QR ile check-in yap, rozetlerini tek cüzdanda topla, profilini işverenlerle paylaş.",
    href: "/student",
    cta: "Öğrenci paneli",
    surface: "bg-tint-sky",
    iconBg: "bg-role-attendee"
  },
  {
    no: "02",
    icon: Sparkles,
    title: "Kulüp Yöneticisi",
    description:
      "Etkinlik oluştur, check-in QR'ı üret, katılımcılara organizatör / konuşmacı / gönüllü rozetleri bas.",
    href: "/club",
    cta: "Kulüp paneli",
    surface: "bg-tint-lavender",
    iconBg: "bg-role-mentor"
  },
  {
    no: "03",
    icon: Building2,
    title: "SKS Yetkilisi",
    description:
      "Kulüpleri onayla, üniversite genelinde katılım istatistiklerini gör, bütçe kararlarını veriyle ver.",
    href: "/sks",
    cta: "SKS dashboard",
    surface: "bg-tint-mint",
    iconBg: "bg-role-volunteer"
  }
];

const steps = [
  { icon: ShieldCheck, t: "TEDÜ e-postanla giriş yap", d: "Cüzdan kurulumu yok — Privy ile arka planda otomatik oluşturulur." },
  { icon: QrCode, t: "Etkinlikte QR'ı tara", d: "Katılım kaydın anında işlenir, rolün (katılımcı / organizatör) atanır." },
  { icon: Trophy, t: "Rozetin cüzdanına düşer", d: "Devredilemez (Soulbound) NFT olarak Base ağına yazılır." },
  { icon: ShieldCheck, t: "Paylaş ve doğrulat", d: "İşveren /verify bağlantısıyla gerçekliğini saniyeler içinde görür." }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="TEDU Pass">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link href="#nasil-calisir" className="transition-colors hover:text-foreground">Nasıl çalışır</Link>
            <Link href="#roller" className="transition-colors hover:text-foreground">Roller</Link>
            <Link href="/takvim" className="transition-colors hover:text-foreground">Takvim</Link>
          </nav>
          <Button asChild variant="outline" size="sm">
            <Link href="/student">Panele git</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <GridField />
        <Guilloche className="pointer-events-none absolute -right-32 -top-24 h-[560px] w-[560px] text-tedu/[0.07]" count={34} />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(200,16,46,0.14), rgba(124,58,237,0.08) 45%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-[-8%] h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(224,138,30,0.12), transparent 70%)" }}
        />
      <section className="container relative grid gap-14 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="animate-fade-up">
          <p className="eyebrow flex items-center gap-2">
            <span className="dot bg-tedu" />
            TEDÜ Blockchain Topluluğu
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.02em] md:text-[56px]">
            Üniversitede yaptığın her şey,{" "}
            <span className="text-tedu">doğrulanabilir</span> bir kayıt olsun.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            TEDU Pass; kulüp etkinlikleri, organizatörlük, konuşmacılık ve gönüllülük
            başarılarını devredilemez dijital rozetlere dönüştürür. Mezuniyetten sonra
            bile senindir, sahteciliğe karşı doğrulanabilir.
          </p>
          <div className="mt-8 max-w-md space-y-3">
            <LoginForm />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="dot bg-emerald-500" />
                <code className="rounded bg-muted px-1.5 py-0.5">@tedu.edu.tr</code> girişi
              </span>
              <span>·</span>
              <span>KVKK uyumlu</span>
              <span>·</span>
              <span>Base ağı</span>
            </div>
          </div>
        </div>

        {/* Hero proof: a credential + its on-chain record */}
        <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Örnek rozet</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Doğrulandı
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
            <BadgeArt role="ORGANIZER" eventTitle="ETH Ankara 2026" clubName="TEDÜ Blockchain" date="24.05.2026" className="mx-auto max-w-[150px]" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">ETH Ankara 2026 · Organizatör</p>
              <p className="text-sm text-muted-foreground">TEDÜ Blockchain Topluluğu</p>
              <OnChainRecord
                className="mt-3"
                rows={[
                  { k: "token", v: "#1042", hl: true },
                  { k: "standart", v: "ERC-5192 (SBT)" },
                  { k: "tx", v: "0x9f3a…b27c" },
                  { k: "durum", v: "minted", ok: true }
                ]}
              />
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Institutional trust bar */}
      <section className="border-y border-border bg-secondary">
        <div className="container flex flex-col items-center gap-5 py-7 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <p className="max-w-md text-sm text-muted-foreground">
              <span className="font-medium text-foreground">TED Üniversitesi</span> için
              geliştirilen kurumsal başarı altyapısı — akademik kayıtlara dokunmaz, yalnızca
              ders dışı başarıyı kayıt altına alır.
            </p>
          </div>
          <div className="flex items-center gap-8 text-center">
            <div>
              <div className="text-2xl font-semibold tracking-tight">5</div>
              <div className="eyebrow mt-1">rozet rolü</div>
            </div>
            <div className="h-9 w-px bg-border" />
            <div>
              <div className="text-2xl font-semibold tracking-tight">100%</div>
              <div className="eyebrow mt-1">doğrulanabilir</div>
            </div>
            <div className="h-9 w-px bg-border" />
            <div>
              <div className="text-2xl font-semibold tracking-tight">0₺</div>
              <div className="eyebrow mt-1">öğrenci ücreti</div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roller" className="container py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Üç rol, tek sistem</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Öğrenci, kulüp ve üniversite — her biri için ayrı bir panel
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {roles.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1"
            >
              {/* Credential header band — role color + guilloché watermark + stamp */}
              <div className={`relative overflow-hidden ${r.iconBg} px-6 pb-7 pt-5 text-white`}>
                <Guilloche className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 text-white/25" count={26} />
                <div className="relative flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/75">
                    TEDU&nbsp;PASS
                  </span>
                  <span className="font-mono text-[11px] text-white/55">/{r.no}</span>
                </div>
                <span className="relative mt-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm">
                  <r.icon className="h-5 w-5" />
                </span>
              </div>
              {/* Document body */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-semibold tracking-tight">{r.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/65">{r.description}</p>
                <span className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-4 text-sm font-semibold">
                  {r.cta}
                  <ArrowRight className="h-4 w-4 text-foreground/50 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works — passport "journey": stamps connected by a travel line on a deep color band */}
      <section id="nasil-calisir" className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(125deg, #A60D26 0%, #C8102E 38%, #7C3AED 100%)" }}
        />
        <Guilloche className="pointer-events-none absolute -left-24 top-1/2 h-[460px] w-[460px] -translate-y-1/2 text-white/10" count={32} />
        <Guilloche className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 text-white/10" count={24} />
        <div className="container relative py-20 text-white md:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/65">Nasıl çalışır</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Dört damgada doğrulanabilir başarı
            </h2>
          </div>

          <ol className="relative mt-16 grid gap-12 md:grid-cols-4 md:gap-6">
            {/* travel line connecting the stamps */}
            <span
              aria-hidden
              className="absolute left-7 right-7 top-7 hidden border-t-2 border-dashed border-white/30 md:block"
            />
            {steps.map((s, i) => (
              <li key={s.t} className="relative">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/45 bg-white/10 backdrop-blur-sm">
                  <s.icon className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white font-mono text-[11px] font-semibold text-tedu">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-base font-semibold leading-snug">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TEDÜ Blockchain Topluluğu · TED Üniversitesi öğrenci topluluğu
          </p>
        </div>
      </footer>
    </main>
  );
}
