-- CreateEnum
CREATE TYPE "ArchiveDocType" AS ENUM ('INVOICE', 'CHALLAN');

-- CreateTable
CREATE TABLE "DocumentArchive" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "challanId" TEXT,
    "docType" "ArchiveDocType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "driveUrl" TEXT,
    "folderPath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentArchive_orderId_idx" ON "DocumentArchive"("orderId");

-- CreateIndex
CREATE INDEX "DocumentArchive_challanId_idx" ON "DocumentArchive"("challanId");

-- AddForeignKey
ALTER TABLE "DocumentArchive" ADD CONSTRAINT "DocumentArchive_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
