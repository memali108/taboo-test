-- Contact gains the same `isSeed` flag Attempt already carries, so rows created by an
-- automated test run can be excluded from admin stats and never sent to GoHighLevel.
ALTER TABLE "Contact" ADD COLUMN "isSeed" BOOLEAN NOT NULL DEFAULT false;

-- Both are filtered on constantly once the admin dashboard exists.
CREATE INDEX "Contact_isSeed_idx" ON "Contact"("isSeed");
CREATE INDEX "Attempt_isSeed_idx" ON "Attempt"("isSeed");
