import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-muted/30 py-16">
      <div className="container-tight">
        <Link href="/"><Logo /></Link>
        <Card className="mt-8">
          <CardContent className="p-10 text-center">
            <h1 className="text-2xl font-semibold">Rozet bulunamadı</h1>
            <p className="mt-2 text-muted-foreground">
              Bu link geçersiz veya rozet silinmiş olabilir.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Ana sayfaya dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
