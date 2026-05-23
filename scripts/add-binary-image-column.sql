-- Add binary_image column to internship_company (safe to run multiple times)
ALTER TABLE "internship_company"
  ADD COLUMN IF NOT EXISTS "binary_image" BYTEA;
