/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referralCode` to the `User` table without a default value. This is not possible if the table is not empty.

*/

-- Create ReferralStatus enum if it does not already exist
DO $$
BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Add REFERRAL to WalletTransactionType if it does not already exist
ALTER TYPE "WalletTransactionType"
ADD VALUE IF NOT EXISTS 'REFERRAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

-- Give existing users unique referral codes
UPDATE "User"
SET "referralCode" = 'ADV' || "id"
WHERE "referralCode" IS NULL;

-- Make referralCode required after existing users have been populated
ALTER TABLE "User"
ALTER COLUMN "referralCode" SET NOT NULL;

-- CreateTable
CREATE TABLE "Referral" (
    "id" SERIAL NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "referredUserId" INTEGER NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardAmount" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "rewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "Referral_rewardPaid_idx" ON "Referral"("rewardPaid");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
