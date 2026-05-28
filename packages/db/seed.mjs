// TEDU Pass — demo seed. Idempotent: clears and repopulates demo rows.
// Run: node --env-file=.env seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOMAIN = "tedu.edu.tr";
const email = (slug) => `${slug}@${DOMAIN}`;

async function main() {
  console.log("Seeding TEDU Pass demo data…");

  // --- Users -------------------------------------------------------------
  const sks = await prisma.user.upsert({
    where: { teduEmail: email("sks.ogrenciisleri") },
    update: { role: "SKS_ADMIN", name: "SKS — Öğrenci İşleri" },
    create: { teduEmail: email("sks.ogrenciisleri"), name: "SKS — Öğrenci İşleri", role: "SKS_ADMIN" }
  });

  const studentSpecs = [
    ["elif.yilmaz", "Elif Yılmaz", true, "elifyilmaz"],
    ["mert.demir", "Mert Demir", true, "mertdemir"],
    ["zeynep.kaya", "Zeynep Kaya", true, "zeynepkaya"],
    ["can.aydin", "Can Aydın", false, null],
    ["ada.sahin", "Ada Şahin", true, "adasahin"],
    ["deniz.arslan", "Deniz Arslan", false, null],
    ["ege.celik", "Ege Çelik", true, "egecelik"],
    ["naz.ozturk", "Naz Öztürk", true, "nazozturk"],
    ["kerem.dogan", "Kerem Doğan", false, null],
    ["irem.koc", "İrem Koç", true, "iremkoc"]
  ];
  const students = [];
  for (const [slug, name, isPublic, username] of studentSpecs) {
    const u = await prisma.user.upsert({
      where: { teduEmail: email(slug) },
      update: { name, isPublic, username },
      create: {
        teduEmail: email(slug),
        name,
        isPublic,
        username,
        role: "STUDENT",
        walletAddress: randomWallet()
      }
    });
    students.push(u);
  }

  // Club presidents (also students by role, but lead clubs)
  const presidentSpecs = [
    ["orhun.uluagacli", "Orhun Eren Uluağaçlı", "orhun"],
    ["selin.acar", "Selin Acar", "selinacar"],
    ["baris.yildiz", "Barış Yıldız", "barisyildiz"]
  ];
  const presidents = [];
  for (const [slug, name, username] of presidentSpecs) {
    const u = await prisma.user.upsert({
      where: { teduEmail: email(slug) },
      update: { name, username, role: "CLUB_ADMIN" },
      create: {
        teduEmail: email(slug),
        name,
        username,
        role: "CLUB_ADMIN",
        isPublic: true,
        walletAddress: randomWallet()
      }
    });
    presidents.push(u);
  }

  // --- Clubs -------------------------------------------------------------
  const clubSpecs = [
    ["TEDÜ Blockchain Topluluğu", "Web3, akıllı kontratlar ve merkeziyetsiz teknolojiler üzerine çalışan öğrenci topluluğu.", true, presidents[0]],
    ["TEDÜ ACM — Bilgisayar Topluluğu", "Yazılım, algoritma ve kariyer etkinlikleri düzenleyen topluluk.", true, presidents[1]],
    ["TEDÜ Girişimcilik Kulübü", "Startup, ürün ve girişimcilik kültürünü yayan kulüp.", true, presidents[2]],
    ["TEDÜ Fotoğrafçılık Kulübü", "Atölyeler ve sergilerle görsel kültürü besleyen kulüp.", false, presidents[1]]
  ];
  const clubs = [];
  for (const [name, description, approved, owner] of clubSpecs) {
    const club = await prisma.club.upsert({
      where: { name },
      update: { description, approvedBySks: approved, createdById: owner.id },
      create: { name, description, approvedBySks: approved, createdById: owner.id }
    });
    await prisma.clubMember.upsert({
      where: { userId_clubId: { userId: owner.id, clubId: club.id } },
      update: { role: "PRESIDENT" },
      create: { userId: owner.id, clubId: club.id, role: "PRESIDENT" }
    });
    clubs.push(club);
  }

  // --- Profiles (CV headline/bio) ---------------------------------------
  await prisma.user.update({
    where: { id: students[0].id },
    data: { title: "Bilgisayar Mühendisliği '26 · Blockchain Topluluğu", bio: "Web3 ve akıllı kontratlara ilgili; hackathon organizasyonlarında aktif." }
  });
  await prisma.user.update({
    where: { id: students[1].id },
    data: { title: "Endüstri Mühendisliği '25", bio: "Girişimcilik ve ürün yönetimi alanlarında çalışıyorum." }
  });

  // --- Memberships (verified roles + one pending claim) -----------------
  const memberSpecs = [
    [students[0], clubs[0], "BOARD", "Etkinlik Koordinatörü", "APPROVED"],
    [students[1], clubs[2], "MEMBER", "Pazarlama Ekibi", "APPROVED"],
    [students[4], clubs[1], "BOARD", "Yazılım Sorumlusu", "APPROVED"],
    // Pending claim — shows up in the club panel's approval queue:
    [students[2], clubs[0], "MEMBER", "Gönüllü", "PENDING"]
  ];
  for (const [u, club, role, title, status] of memberSpecs) {
    await prisma.clubMember.upsert({
      where: { userId_clubId: { userId: u.id, clubId: club.id } },
      update: { role, title, status },
      create: { userId: u.id, clubId: club.id, role, title, status }
    });
  }

  // --- Events ------------------------------------------------------------
  // [club, title, daysFromNow, status, location]
  const eventSpecs = [
    [clubs[0], "ETH Ankara 2026 Hackathon", -3, "CLOSED", "TED Üniversitesi, B Blok"],
    [clubs[0], "Web3 101: Cüzdandan Akıllı Kontrata", -20, "CLOSED", "D-201"],
    [clubs[0], "Soulbound NFT Atölyesi", 10, "ACTIVE", "Kütüphane Seminer Salonu"],
    [clubs[1], "Algoritma Maratonu", -12, "CLOSED", "Bilgisayar Lab 3"],
    [clubs[1], "Kariyer Gecesi: Yazılımda İlk İş", 6, "ACTIVE", "Konferans Salonu"],
    [clubs[2], "Startup Pitch Günü", -8, "CLOSED", "Girişim Merkezi"]
  ];

  const created = [];
  for (const [club, title, days, status, location] of eventSpecs) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    // Recreate event cleanly by title+club (FK-safe: drop its badges first, since
    // Badge -> BadgeTemplate is Restrict). Only touches this demo event.
    const existing = await prisma.event.findFirst({
      where: { clubId: club.id, title },
      include: { badgeTemplates: { select: { id: true } } }
    });
    if (existing) {
      const tplIds = existing.badgeTemplates.map((t) => t.id);
      if (tplIds.length) await prisma.badge.deleteMany({ where: { badgeTemplateId: { in: tplIds } } });
      await prisma.event.delete({ where: { id: existing.id } });
    }
    const ev = await prisma.event.create({
      data: {
        clubId: club.id,
        title,
        description: `${club.name} tarafından düzenlenen etkinlik.`,
        date,
        location,
        qrSecret: randomHex(16),
        status,
        badgeTemplates: {
          create: [
            { roleType: "ATTENDEE", name: `${title} — Katılımcı` },
            { roleType: "ORGANIZER", name: `${title} — Organizatör` },
            { roleType: "SPEAKER", name: `${title} — Konuşmacı` }
          ]
        }
      },
      include: { badgeTemplates: true }
    });
    created.push(ev);
  }

  // --- Attendances + badges for CLOSED events ---------------------------
  const pool = [...students, ...presidents];
  let badgeCount = 0;
  for (const ev of created) {
    const isClosed = ev.status === "CLOSED";
    const attendeeCount = 4 + Math.floor(Math.random() * 5);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, attendeeCount);
    for (let i = 0; i < shuffled.length; i++) {
      const u = shuffled[i];
      const role = i === 0 ? "ORGANIZER" : i === 1 ? "SPEAKER" : "ATTENDEE";
      await prisma.attendance.upsert({
        where: { eventId_userId: { eventId: ev.id, userId: u.id } },
        update: { role },
        create: { eventId: ev.id, userId: u.id, role }
      });
      if (isClosed) {
        const template =
          ev.badgeTemplates.find((t) => t.roleType === role) ??
          ev.badgeTemplates.find((t) => t.roleType === "ATTENDEE");
        if (template) {
          // No fabricated on-chain fields — badges are honestly "queued" until a
          // real mint runs (contract deployed + gas). Nothing mock here.
          await prisma.badge.upsert({
            where: { badgeTemplateId_userId: { badgeTemplateId: template.id, userId: u.id } },
            update: {},
            create: { badgeTemplateId: template.id, userId: u.id }
          });
          badgeCount++;
        }
      }
    }
  }

  const counts = {
    users: await prisma.user.count(),
    clubs: await prisma.club.count(),
    events: await prisma.event.count(),
    attendances: await prisma.attendance.count(),
    badges: await prisma.badge.count()
  };
  console.log("Done:", counts);
  console.log("\nDemo logins (dev cookie sets via /api/auth/dev?email=...):");
  console.log("  SKS:      ", sks.teduEmail);
  console.log("  Club lead:", presidents[0].teduEmail);
  console.log("  Student:  ", students[0].teduEmail);
}

function randomHex(bytes) {
  const chars = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < bytes * 2; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}
function randomWallet() {
  return randomHex(20);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
