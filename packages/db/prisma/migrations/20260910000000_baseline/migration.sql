-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'CLUB_ADMIN', 'SKS_ADMIN');

-- CreateEnum
CREATE TYPE "ClubMemberRole" AS ENUM ('PRESIDENT', 'BOARD', 'MEMBER');

-- CreateEnum
CREATE TYPE "ClubMemberStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "BadgeRole" AS ENUM ('ATTENDEE', 'ORGANIZER', 'SPEAKER', 'MENTOR', 'VOLUNTEER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "teduEmail" TEXT NOT NULL,
    "name" TEXT,
    "studentId" TEXT,
    "walletAddress" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "avatarUrl" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "approvedBySks" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "role" "ClubMemberRole" NOT NULL DEFAULT 'MEMBER',
    "title" TEXT,
    "status" "ClubMemberStatus" NOT NULL DEFAULT 'APPROVED',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("userId","clubId")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "qrSecret" TEXT NOT NULL,
    "badgeImageUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeTemplate" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roleType" "BadgeRole" NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "metadataUri" TEXT,

    CONSTRAINT "BadgeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "BadgeRole" NOT NULL DEFAULT 'ATTENDEE',

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "badgeTemplateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenId" TEXT,
    "txHash" TEXT,
    "mintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_teduEmail_key" ON "User"("teduEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Event_qrSecret_key" ON "Event"("qrSecret");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeTemplate_eventId_roleType_key" ON "BadgeTemplate"("eventId", "roleType");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_eventId_userId_key" ON "Attendance"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_tokenId_key" ON "Badge"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_txHash_key" ON "Badge"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_badgeTemplateId_userId_key" ON "Badge"("badgeTemplateId", "userId");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeTemplate" ADD CONSTRAINT "BadgeTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_badgeTemplateId_fkey" FOREIGN KEY ("badgeTemplateId") REFERENCES "BadgeTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

