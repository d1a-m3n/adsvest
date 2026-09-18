/*
  Warnings:

  - The values [AFFILIATE] on the enum `OpportunityType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OpportunityType_new" AS ENUM ('TASK', 'SOCIAL', 'APP', 'OTHER');
ALTER TABLE "Opportunity" ALTER COLUMN "type" TYPE "OpportunityType_new" USING ("type"::text::"OpportunityType_new");
ALTER TYPE "OpportunityType" RENAME TO "OpportunityType_old";
ALTER TYPE "OpportunityType_new" RENAME TO "OpportunityType";
DROP TYPE "public"."OpportunityType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Opportunity" ALTER COLUMN "currency" SET DEFAULT 'NGN';
