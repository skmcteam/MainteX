-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Calibration" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PMPlan" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
