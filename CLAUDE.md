# TEDU Pass — Project Brief for Claude Code

## What this project is

TEDU Pass is a digital achievement passport for TED University students. It records non-academic accomplishments (club event attendance, organizer roles, volunteering, certificates, speaker appearances, mentorships) as verifiable, non-transferable digital badges on a blockchain. The system is built to be sold to / adopted by TED University as institutional infrastructure, with future licensing potential to other private Turkish universities (Bilkent, Koç, Sabancı, etc.).

This is **not** an academic transcript system. It does not touch GPA, courses, official student records, or anything regulated by YÖK / Student Affairs. It only handles the extracurricular layer that currently has no digital record anywhere.

## Why it exists

A TEDU student spends 4 years organizing events, leading clubs, attending workshops — and graduates with nothing but a Word-document CV to prove it. Employers can't verify claims. Erasmus committees can't trust them. The university itself doesn't know which club is genuinely active when deciding budget allocations. Club leadership turnover wipes institutional memory every year. TEDU Pass closes this gap with a permanent, verifiable, tamper-proof record owned by the student.

## Who uses it (the three roles in MVP)

**Student** — Logs in with TEDU email. Sees their badge wallet, profile, share link. Scans QR at events to check in and receive badges automatically. Can make their profile public for employers/scholarship committees.

**Club / Community admin** — A club president or board member from a registered TEDU community. Creates events, generates check-in QR codes, assigns roles to participants (Attendee, Organizer, Speaker, Mentor, Volunteer), issues badges after the event. Sees their club's analytics.

**SKS (Student Affairs) dashboard** — University staff. Sees all clubs' activity at a glance: events held, real attendance numbers, most active students, club engagement rankings. Approves new clubs onto the system. Uses this data for budget allocation decisions. This dashboard is the **main selling point to the university administration** — build it well.

**Public verification page** (no login) — A `/verify/{badge_id}` route where anyone with a link can confirm a badge is authentic without creating an account. This is what employers and scholarship committees use.

## Tech stack (decided — do not deviate without asking)

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **PWA:** next-pwa or Serwist for installability + offline shell
- **Backend:** Next.js API routes (no separate backend service for MVP)
- **Database:** PostgreSQL via Prisma ORM (host: Railway or Supabase)
- **Auth:** TEDU email login (custodial). Use Clerk or Auth.js with email magic links restricted to `@tedu.edu.tr` domain. Wallets are generated server-side per user — students never see seed phrases or install MetaMask.
- **Wallet abstraction:** Privy.io or Magic.link (custodial, email-based). Recommend Privy for better DX.
- **Blockchain:** Base Sepolia (testnet) for MVP, Base mainnet for production. Gas is negligible. Use Soulbound NFTs (ERC-5192).
- **Smart contracts:** Solidity + Hardhat. One main `TEDUPassBadge.sol` contract (ERC-5192 compliant, non-transferable).
- **Web3 libs:** viem + wagmi for any client-side reads. Server-side minting via viem with a server wallet.
- **QR:** `qrcode` (generation) + `html5-qrcode` or `@yudiel/react-qr-scanner` (scanning)
- **Hosting:** Vercel (frontend + API), Railway (Postgres)

### Why these choices

- **Custodial wallet (Privy + email):** Students will not install MetaMask. Period. This is the #1 reason similar projects fail. Privy creates an embedded wallet automatically on first email login. We retain the option to let advanced users export their wallet later.
- **Base over Polygon:** Lower fees, better dev tooling in 2026, and Coinbase ecosystem helps with future grant story. Polygon is also acceptable if there's a specific reason.
- **Soulbound (ERC-5192):** Badges must be non-transferable. A student cannot sell or gift their "Organizer of ETH Ankara 2026" badge to someone else.
- **Off-chain personal data, on-chain hashes only:** KVKK (Turkish GDPR) compliance. Names, student IDs, emails stay in Postgres. Only badge metadata hashes and ownership go on-chain.

## Data model (high level)

- `User` — id, teduEmail, name, studentId, walletAddress (Privy-generated), role (student/club_admin/sks_admin), createdAt
- `Club` — id, name, description, logoUrl, approvedBySks (bool), createdBy (userId)
- `ClubMember` — userId, clubId, role (president/board/member)
- `Event` — id, clubId, title, description, date, location, qrSecret, status (draft/active/closed)
- `BadgeTemplate` — id, eventId, roleType (attendee/organizer/speaker/mentor/volunteer), name, imageUrl, metadataUri
- `Badge` — id, badgeTemplateId, userId, tokenId (on-chain), txHash, mintedAt
- `Attendance` — eventId, userId, checkedInAt, role

## MVP scope (build in this order)

1. **Auth + onboarding:** TEDU email magic link login → Privy wallet auto-creation → user profile setup
2. **Smart contract:** Deploy ERC-5192 SBT contract to Base Sepolia. Single `mint(to, tokenURI)` callable only by server wallet (Ownable).
3. **Club admin panel:** Create club (pending SKS approval) → create event → generate check-in QR
4. **Event check-in flow:** Student scans QR → backend records attendance → after event closes, club admin clicks "mint badges" → all attendees receive their SBT
5. **Student wallet page:** Grid view of badges, public/private toggle, share link `/u/{username}`
6. **Public verify page:** `/verify/{badgeId}` — shows badge image, event details, holder name (if profile public), on-chain tx link
7. **SKS dashboard:** Approve clubs queue, all-clubs analytics, top students leaderboard, event volume charts
8. **PWA polish:** manifest, service worker, install prompt, offline fallback for wallet page

## Non-goals for MVP (explicitly out of scope)

- GPA, transcripts, course grades — never
- Cross-university federation — TEDU only for now
- Mobile-native app (React Native) — PWA is enough
- DAO governance, token economics, marketplace
- Multi-language UI — Turkish first, English later
- Email notifications — skip for MVP, add later
- Bulk CSV import of historical events — manual entry only in MVP

## Branding direction (suggestion, refine later)

- **Name:** TEDU Pass (working title — could become "TEDU Chain" or "TEDU ID" after stakeholder feedback)
- **Primary color:** TEDU's official red `#C8102E` — keep brand alignment
- **Vibe:** Clean, institutional, trustworthy. NOT crypto-bro. The word "blockchain" should appear minimally in student-facing UI. Use "verifiable digital certificate" in admin-facing pitch materials.
- **Typography:** Inter or similar humanist sans

## First real-world deployment

ETH Ankara 2026 (May 23-24, 2026) hackathon. Participants receive their first TEDU Pass badge on-chain. This is both the live demo and the marketing moment for university administration.

## Repository structure (suggested)

```
tedu-pass/
├── apps/
│   └── web/                 # Next.js app (frontend + API routes)
├── contracts/               # Hardhat project, TEDUPassBadge.sol
├── packages/
│   └── db/                  # Prisma schema + client
├── docs/
│   ├── architecture.md
│   └── pitch-deck-outline.md
├── .env.example
├── package.json             # pnpm workspace root
└── README.md
```

## Environment variables needed

```
DATABASE_URL=
NEXTAUTH_SECRET=             # or Clerk keys
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=
BASE_SEPOLIA_RPC_URL=
SERVER_WALLET_PRIVATE_KEY=   # for minting, keep in vault
TEDU_PASS_CONTRACT_ADDRESS=
NEXT_PUBLIC_APP_URL=
```

## What to build first (concrete first session)

1. Initialize pnpm workspace + Next.js 14 app with TypeScript + Tailwind + shadcn/ui
2. Set up Prisma with the schema above (Postgres on Railway)
3. Build landing page (`/`) in Turkish: hero, three role cards (student/club/SKS), how-it-works, ETH Ankara mention, login CTA
4. Auth flow with Privy email login restricted to `@tedu.edu.tr`
5. Stub dashboard routes: `/student`, `/club/[id]`, `/sks` — empty for now, just protected

Stop after step 5 and ask for review before continuing.

## Working principles

- Turkish-first UI copy. English in code/comments.
- Mobile-first responsive. The student flow happens on phones.
- Server actions over API routes when possible (Next.js 14 pattern).
- Always check KVKK implications before storing or displaying personal data.
- When in doubt about UX, optimize for the student — they are the largest user group and the least technical.
- No fake/placeholder badge images in production. Each badge has real metadata pinned to IPFS (use Pinata or web3.storage).

## Contact / context

- Project lead: Orhun Eren Uluağaçlı (TEDÜ Blockchain Topluluğu founder)
- Pilot event: ETH Ankara 2026 (May 23-24, 2026)
- Long-term goal: License model to other private Turkish universities after TEDU pilot proves out
