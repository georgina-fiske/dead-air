-- AlterTable
ALTER TABLE "PressRelease" ADD COLUMN     "links" JSONB,
ADD COLUMN     "photo1Alt" TEXT,
ADD COLUMN     "photo1Credit" TEXT,
ADD COLUMN     "photo1Id" TEXT,
ADD COLUMN     "photo2Alt" TEXT,
ADD COLUMN     "photo2Credit" TEXT,
ADD COLUMN     "photo2Id" TEXT,
ADD COLUMN     "spotlight" TEXT,
ADD COLUMN     "story1" TEXT,
ADD COLUMN     "story2" TEXT,
ADD COLUMN     "structured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trivia" JSONB;

-- CreateTable
CREATE TABLE "PressIcon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PressIcon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PressIcon_name_key" ON "PressIcon"("name");

-- AddForeignKey
ALTER TABLE "PressRelease" ADD CONSTRAINT "PressRelease_photo1Id_fkey" FOREIGN KEY ("photo1Id") REFERENCES "MediaImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressRelease" ADD CONSTRAINT "PressRelease_photo2Id_fkey" FOREIGN KEY ("photo2Id") REFERENCES "MediaImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
