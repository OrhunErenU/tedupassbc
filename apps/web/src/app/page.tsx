import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { QrCode, ShieldCheck, Sparkles, Trophy, Users, Building2 } from "lucide-react";

const roles = [
  {
    icon: Users,
    title: "Öğrenci",
    description:
      "Etkinliklere QR ile check-in yap, rozetlerini cüzdanında topla, profilini işverenlerle paylaş.",
    href: "/student",
    cta: "Öğrenci paneli"
  },
  {
    icon: Sparkles,
    title: "Kulüp Yöneticisi",
    description:
      "Etkinlik oluştur, check-in QR'ı üret, katılımcılara organizatör/konuşmacı/gönüllü rozetleri bas.",
    href: "/club",
    cta: "Kulüp paneli"
  },
  {
    icon: Building2,
    title: "SKS Yetkilisi",
    description:
      "Kulüpleri onayla, üniversite genelinde katılım ve etkinlik istatistiklerini gör, bütçe kararlarında veriyi kullan.",
    href: "/sks",
    cta: "SKS dashboard"
  }
];

const steps = [
  { icon: ShieldCheck, t: "TEDÜ e-postanla giriş yap", d: "Cüzdan kurulumu yok — Privy ile otomatik oluşturulur." },
  { icon: QrCode, t: "Etkinlikte QR'ı tara", d: "Katılım kaydın anında backend'e işlenir." },
  { icon: Trophy, t: "Rozetin cüzdanına düşer", d: "Devredilemez (Soulbound) NFT olarak Base ağında." },
  { icon: Sparkles, t: "Paylaş ve doğrulat", d: "İşveren /verify/{id} ile gerçekliğini saniyeler içinde görür." }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link href="#nasil-calisir" className="hover:text-foreground">Nasıl çalışır</Link>
            <Link href="#roller" className="hover:text-foreground">Roller</Link>
            <Link href="#etkinlik" className="hover:text-foreground">ETH Ankara 2026</Link>
          </nav>
          <Button asChild variant="outline" size="sm">
            <Link href="/student">Panele git</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="animate-fade-up">
            <Badge variant="accent" className="px-3 py-1">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-tedu" />
              TEDÜ Blockchain Topluluğu
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Üniversitede yaptığın her şey,{" "}
              <span className="bg-gradient-to-r from-tedu to-tedu-700 bg-clip-text text-transparent">
                doğrulanabilir bir kayıt
              </span>{" "}
              olsun.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              TEDU Pass; kulüp etkinlikleri, organizatörlük, konuşmacılık, mentorluk ve gönüllülük
              başarılarını blockchain üzerinde devredilemez dijital rozetlere dönüştürür. Mezun
              olduktan sonra bile sahiplenirsin, sahteciliğe karşı güvenlidir.
            </p>
            <div className="mt-8 space-y-4">
              <LoginForm />
              <Button asChild variant="ghost">
                <Link href="#nasil-calisir">Nasıl çalışır →</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Sadece <code className="rounded bg-muted px-1.5 py-0.5">@tedu.edu.tr</code> e-posta adresleri ile giriş yapılır · KVKK uyumlu
            </p>
          </div>

          {/* Hero showcase: a sample badge wallet */}
          <Card className="relative overflow-hidden border-border shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Cüzdanım</CardTitle>
                <Badge variant="success">3 rozet</Badge>
              </div>
              <CardDescription>orhun.eren@tedu.edu.tr · Base Sepolia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { t: "ETH Ankara", r: "Organizatör", c: "from-tedu to-tedu-700" },
                  { t: "Web3 101", r: "Konuşmacı", c: "from-amber-500 to-orange-600" },
                  { t: "Hackathon", r: "Katılımcı", c: "from-emerald-500 to-emerald-700" }
                ].map((b) => (
                  <div key={b.t} className="group relative">
                    <div className={`aspect-square rounded-xl bg-gradient-to-br ${b.c} p-3 text-white shadow-sm transition group-hover:scale-[1.02]`}>
                      <Trophy className="h-5 w-5 opacity-90" />
                      <div className="mt-7 text-[10px] font-medium uppercase tracking-wider opacity-80">{b.r}</div>
                      <div className="text-xs font-semibold leading-tight">{b.t}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Örnek görünüm — gerçek rozetlerin etkinliğe katıldıkça düşer.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Roles */}
      <section id="roller" className="border-t border-border/60 bg-muted/40">
        <div className="container py-20">
          <div className="max-w-2xl">
            <Badge variant="outline">Üç rol, tek sistem</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Öğrenci, kulüp ve üniversite — her biri için ayrı bir panel
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roles.map((r) => (
              <Link key={r.title} href={r.href} className="group">
                <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-tedu/40 group-hover:shadow-md">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <r.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-3">{r.title}</CardTitle>
                    <CardDescription>{r.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="inline-flex items-center text-sm font-medium text-tedu">
                      {r.cta} →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="nasil-calisir" className="container py-20">
        <div className="max-w-2xl">
          <Badge variant="outline">Nasıl çalışır</Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Dört adımda doğrulanabilir başarı
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tedu text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <s.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-3 text-base">{s.t}</CardTitle>
                  <CardDescription>{s.d}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Event */}
      <section id="etkinlik" className="border-t border-border/60 bg-muted/40">
        <div className="container py-20">
          <Card className="overflow-hidden border-tedu/30">
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div className="p-8 md:p-10">
                <Badge variant="accent">İlk canlı deployment</Badge>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  ETH Ankara 2026 — 23–24 Mayıs
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Katılımcılar ilk TEDU Pass rozetlerini bu hackathon'da on-chain alacak. Hem canlı
                  demo hem de üniversite yönetimine sunum anı.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/student">Hemen başla</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/sks">SKS sunumu</Link>
                  </Button>
                </div>
              </div>
              <div className="relative hidden h-full min-h-[220px] bg-gradient-to-br from-tedu via-tedu-600 to-tedu-700 md:block">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="text-xs uppercase tracking-wider opacity-80">ETH Ankara</div>
                  <div className="text-3xl font-bold">2026</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <Logo className="text-foreground" />
          <p>© {new Date().getFullYear()} TEDÜ Blockchain Topluluğu · TED Üniversitesi öğrenci topluluğu</p>
        </div>
      </footer>
    </main>
  );
}
