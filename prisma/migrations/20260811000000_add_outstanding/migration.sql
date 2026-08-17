-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CHEQUE', 'NEFT_RTGS_UPI', 'CASH');

-- CreateEnum
CREATE TYPE "OutstandingStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'SETTLED');

-- CreateTable
CREATE TABLE "Outstanding" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3),
    "company" TEXT NOT NULL,
    "contactName" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "OutstandingStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outstanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutstandingPayment" (
    "id" TEXT NOT NULL,
    "outstandingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "mode" "PaymentMode" NOT NULL DEFAULT 'CHEQUE',
    "referenceNo" TEXT,
    "bankName" TEXT,
    "branch" TEXT,
    "chequeDate" TIMESTAMP(3),
    "note" TEXT,
    "receivedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutstandingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Outstanding_orderId_key" ON "Outstanding"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Outstanding_invoiceNumber_key" ON "Outstanding"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Outstanding_company_idx" ON "Outstanding"("company");

-- CreateIndex
CREATE INDEX "Outstanding_city_idx" ON "Outstanding"("city");

-- CreateIndex
CREATE INDEX "Outstanding_status_idx" ON "Outstanding"("status");

-- CreateIndex
CREATE INDEX "OutstandingPayment_outstandingId_idx" ON "OutstandingPayment"("outstandingId");

-- AddForeignKey
ALTER TABLE "Outstanding" ADD CONSTRAINT "Outstanding_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutstandingPayment" ADD CONSTRAINT "OutstandingPayment_outstandingId_fkey" FOREIGN KEY ("outstandingId") REFERENCES "Outstanding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
