BEGIN;

-- Downgrade existing support roles and the retired demo support identity.
UPDATE "users"
SET "role" = 'BUYER'
WHERE "role"::text = 'SUPPORT'
   OR "email" = 'support@carenest.vn';

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'CAREGIVER');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole"
  USING ("role"::text::"UserRole");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'BUYER';

DROP TYPE "UserRole_old";

COMMIT;
