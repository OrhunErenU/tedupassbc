-- DropIndex
DROP INDEX "Badge_txHash_key";

-- CreateIndex
CREATE INDEX "Badge_txHash_idx" ON "Badge"("txHash");

