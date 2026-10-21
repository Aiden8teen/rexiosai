-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "coverMessageEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "rejectionReasonEn" TEXT;

-- AlterTable
ALTER TABLE "ProblemPrivateDetails" ADD COLUMN     "notesEn" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN     "firstNameEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "institutionMajorEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastNameEn" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "SeedContentRevision" (
    "id" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedContentRevision_pkey" PRIMARY KEY ("id")
);
