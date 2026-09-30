-- AlterTable
ALTER TABLE "PageView" ADD COLUMN     "region" TEXT,
ADD COLUMN     "weekHash" TEXT;

-- CreateIndex
CREATE INDEX "PageView_contentType_contentId_at_idx" ON "PageView"("contentType", "contentId", "at");
