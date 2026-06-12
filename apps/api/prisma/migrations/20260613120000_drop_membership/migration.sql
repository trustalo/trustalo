-- People replaced Membership. Drop the now-unused Membership table + its enums,
-- and repoint DirectorySyncConfig.defaultRole from MembershipRole to PersonRole
-- (PersonRole is a superset, so an in-place cast via text preserves existing
-- values — unlike a DROP/ADD COLUMN which would reset them to the default).

-- Repoint defaultRole MembershipRole -> PersonRole, preserving data.
ALTER TABLE "DirectorySyncConfig" ALTER COLUMN "defaultRole" DROP DEFAULT;
ALTER TABLE "DirectorySyncConfig"
  ALTER COLUMN "defaultRole" TYPE "PersonRole" USING ("defaultRole"::text::"PersonRole");
ALTER TABLE "DirectorySyncConfig" ALTER COLUMN "defaultRole" SET DEFAULT 'viewer';

-- Drop the Membership table (its FKs + indexes go with it) and its now-unused enums.
DROP TABLE "Membership";

DROP TYPE "MembershipRole";
DROP TYPE "MembershipStatus";
