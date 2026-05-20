# @tedu-pass/contracts

ERC-5192 (Soulbound) NFT contract for TEDU Pass badges.

## Komutlar

```bash
pnpm --filter @tedu-pass/contracts compile
pnpm --filter @tedu-pass/contracts test
pnpm --filter @tedu-pass/contracts deploy:base-sepolia
```

Deploy etmek için `.env.local` içinde `SERVER_WALLET_PRIVATE_KEY` ve `BASE_SEPOLIA_RPC_URL` olmalı. Deploy sonrası çıkan adresi `TEDU_PASS_CONTRACT_ADDRESS` olarak kaydet.
