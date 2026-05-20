import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Çevrimdışı — TEDU Pass" };

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-muted/30 py-16">
      <div className="container-tight">
        <Link href="/">
          <Logo />
        </Link>
        <Card className="mt-8">
          <CardContent className="p-10 text-center">
            <h1 className="text-2xl font-semibold">Çevrimdışısın</h1>
            <p className="mt-2 text-muted-foreground">
              Cüzdanın ve daha önce ziyaret ettiğin sayfalar offline da çalışır. Bağlantı geldiğinde tekrar dene.
            </p>
            <Button asChild className="mt-6">
              <Link href="/student">Cüzdanım</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
