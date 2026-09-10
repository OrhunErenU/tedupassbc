-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "checkinClosesAt" TIMESTAMP(3),
ADD COLUMN     "checkinOpensAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CheckinAttempt" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckinAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckinAttempt_eventId_userId_createdAt_idx" ON "CheckinAttempt"("eventId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckinAttempt_ip_createdAt_idx" ON "CheckinAttempt"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "CheckinAttempt_createdAt_idx" ON "CheckinAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "CheckinAttempt" ADD CONSTRAINT "CheckinAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

