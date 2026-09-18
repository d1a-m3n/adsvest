-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "membershipExpiresAt" TIMESTAMP(3),
ADD COLUMN     "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN     "paystackCustomerCode" TEXT,
ADD COLUMN     "paystackSubscriptionCode" TEXT;
