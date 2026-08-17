-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('ENQUIRY', 'QUOTATION');

-- DropIndex
DROP INDEX "Enquiry_status_idx";

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "type" "EnquiryType" NOT NULL DEFAULT 'ENQUIRY';

-- CreateIndex
CREATE INDEX "Enquiry_type_status_idx" ON "Enquiry"("type", "status");
