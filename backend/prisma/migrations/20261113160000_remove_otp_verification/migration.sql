-- Remove only legacy OTP-related data structures and user verification flags.
-- No account, order, catalog, or other application data is deleted.
DROP INDEX IF EXISTS "VerificationChallenge_email_phone_channel_consumedAt_idx";
DROP INDEX IF EXISTS "VerificationChallenge_expiresAt_idx";
DROP TABLE IF EXISTS "VerificationChallenge";
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerified";
DROP TYPE IF EXISTS "OtpChannel";
