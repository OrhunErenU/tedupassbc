# TEDU Pass — Kontratlar

`TEDUPassBadge.sol`: ERC-5192 uyumlu, devredilemez (soulbound) rozet NFT'si.
Sadece sahibi (sunucu cüzdanı) mint edebilir.

## Kurulum

```bash
pnpm install
pnpm --filter @tedu-pass/contracts compile
pnpm --filter @tedu-pass/contracts test
```

## Base Sepolia'ya deploy

Deploy, fonlu bir cüzdan gerektirir — bu adım repoda otomatik yapılamaz.

1. Bir cüzdan anahtarı üret ve `.env.local` içine yaz:

   ```
   SERVER_WALLET_PRIVATE_KEY=0x...
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   ```

2. Adresi bir Base Sepolia musluğundan fonla
   (<https://www.alchemy.com/faucets/base-sepolia>). Deploy + ilk mintler için
   0.01 ETH fazlasıyla yeter.

3. Deploy et:

   ```bash
   pnpm --filter @tedu-pass/contracts deploy:base-sepolia
   ```

   Betik bakiyeyi önceden kontrol eder, deploy sonrası `owner()` ile deploy
   edenin aynı adres olduğunu doğrular (bunlar ayrışırsa her mint revert eder)
   ve yazılacak ortam değişkenlerini basar.

4. Basılan `TEDU_PASS_CONTRACT_ADDRESS` değerini hem `.env.local` hem de Vercel
   proje ortamına ekle. `SERVER_WALLET_PRIVATE_KEY` aynı anahtar olmalı —
   kontratın sahibi odur.

5. (Opsiyonel) Basescan doğrulaması:

   ```bash
   pnpm --filter @tedu-pass/contracts verify <adres> <owner-adresi>
   ```

## Yerel geliştirme

Yerel Hardhat düğümünün chainId'si Base Sepolia ile aynı (84532), böylece web
uygulaması hiç değiştirilmeden yerel zincire bağlanabilir:

```bash
pnpm --filter @tedu-pass/contracts exec hardhat node
pnpm --filter @tedu-pass/contracts exec hardhat run scripts/deploy.ts --network localhost
```

Sonra `BASE_SEPOLIA_RPC_URL=http://127.0.0.1:8545` ve basılan kontrat adresiyle
uygulamayı çalıştır.

## Zincir kapalıyken ne olur

`SERVER_WALLET_PRIVATE_KEY` veya `TEDU_PASS_CONTRACT_ADDRESS` eksikse uygulama
çalışmaya devam eder ama rozetler zincire yazılmaz: veritabanında kuyrukta
tutulur, kulüp ve SKS panellerinde açık bir uyarı görünür, doğrulama sayfası
"zincir kapalı" der. Yapılandırma tamamlandığında "Rozetleri bas" kuyruktakileri
zincire yazar.
