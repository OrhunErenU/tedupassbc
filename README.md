# TEDU Pass

> TED Üniversitesi öğrencileri için doğrulanabilir dijital başarı pasaportu.

TEDU Pass, TED Üniversitesi öğrencilerinin kulüp etkinliklerine katılım, organizatörlük, gönüllülük, sertifika ve mentorluk gibi akademik olmayan başarılarını blockchain üzerinde devredilemez dijital rozetler olarak kaydeden sistemdir. Öğrenci mezun olduktan sonra bile rozetler korunur, sahteciliğe karşı güvenlidir ve tek tıkla doğrulanabilir.

## Özellikler

- **TEDÜ e-posta ile giriş** — Cüzdan kurulumu yok, MetaMask yok
- **QR ile check-in** — Etkinliğe gelince telefondan tara, rozet otomatik düşer
- **Üç panel:** Öğrenci cüzdanı, kulüp yönetim paneli, SKS dashboard
- **Public doğrulama** — İşveren `/verify/{id}` linkinden rozetin gerçek olduğunu görür
- **PWA** — Telefona uygulama gibi kurulur
- **KVKK uyumlu** — Kişisel veri zincire gitmez

## Kullanıcı Rolleri

| Rol | Ne yapar |
|------|---------|
| Öğrenci | Etkinliğe katılır, rozetlerini görür, profilini paylaşır |
| Kulüp Yöneticisi | Etkinlik oluşturur, QR üretir, rozet basar |
| SKS Yetkilisi | Kulüpleri onaylar, üniversite çapında istatistik görür |

## Teknik Yığın

Next.js 14 · TypeScript · Tailwind · Prisma · PostgreSQL · Privy (custodial wallet) · Solidity (ERC-5192 SBT) · Base · viem/wagmi

## Hızlı Başlangıç

```bash
pnpm install
cp .env.example .env.local
pnpm prisma migrate dev
pnpm dev
```

Detaylı geliştirici dokümantasyonu için `CLAUDE.md` dosyasına bakın.

## Yol Haritası

- [x] Proje brief'i ve mimari
- [ ] MVP: Auth + kulüp paneli + öğrenci cüzdanı + SKS dashboard
- [ ] ETH Ankara 2026 canlı deployment (Mayıs 2026)
- [ ] TEDÜ kurumsal entegrasyon
- [ ] Diğer üniversitelere lisanslama

## Lisans

Henüz belirlenmedi — TEDÜ ile lisans modeli görüşülecek.

## Ekip

TEDÜ Blockchain Topluluğu — TED Üniversitesi öğrenci topluluğu.
