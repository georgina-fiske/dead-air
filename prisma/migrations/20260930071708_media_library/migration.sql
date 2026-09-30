/*
  Warnings:

  - You are about to drop the column `coverImage` on the `Release` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Release" DROP COLUMN "coverImage",
ADD COLUMN     "coverId" TEXT;

-- CreateTable
CREATE TABLE "MediaImage" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "MediaImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
