ALTER TABLE "league" DROP CONSTRAINT "league_name_unique";--> statement-breakpoint
ALTER TABLE "league" ADD COLUMN "organization_id" uuid;--> statement-breakpoint

-- Paket 12 hat neu angelegte Vereine bereits über diese Übergangstabelle mit ihrer
-- Standardliga verbunden. Diese eindeutige Zuordnung hat beim Backfill Vorrang.
UPDATE "league" AS "league"
SET "organization_id" = "onboarding"."organization_id"
FROM "organization_onboarding" AS "onboarding"
WHERE "onboarding"."league_id" = "league"."league_id";--> statement-breakpoint

-- Für eine ältere Einzelinstallation ohne Verein wird genau ein deterministischer
-- Bestandsverein angelegt. Gibt es bereits mindestens einen Verein, gewinnt der
-- zeitlich erste (mit ID als stabilem Tie-Breaker).
INSERT INTO "better_auth"."organization" (
  "id",
  "name",
  "slug",
  "created_at"
)
SELECT
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Roundnet-Verein',
  'roundnet-verein',
  timestamp '2026-01-01 00:00:00'
WHERE EXISTS (
  SELECT 1 FROM "league" WHERE "organization_id" IS NULL
)
AND NOT EXISTS (
  SELECT 1 FROM "better_auth"."organization"
);--> statement-breakpoint

INSERT INTO "better_auth"."member" (
  "id",
  "organization_id",
  "user_id",
  "role",
  "created_at"
)
SELECT
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  "user"."id",
  'owner',
  timestamp '2026-01-01 00:00:00'
FROM "better_auth"."user" AS "user"
WHERE EXISTS (
  SELECT 1
  FROM "better_auth"."organization"
  WHERE "id" = '00000000-0000-4000-8000-000000000001'::uuid
)
AND NOT EXISTS (
  SELECT 1
  FROM "better_auth"."member"
  WHERE "organization_id" = '00000000-0000-4000-8000-000000000001'::uuid
)
ORDER BY "user"."created_at", "user"."id"
LIMIT 1;--> statement-breakpoint

UPDATE "league"
SET "organization_id" = (
  SELECT "id"
  FROM "better_auth"."organization"
  ORDER BY "created_at", "id"
  LIMIT 1
)
WHERE "organization_id" IS NULL;--> statement-breakpoint

ALTER TABLE "league" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "league" ADD CONSTRAINT "league_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "better_auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "league_organization_idx" ON "league" USING btree ("organization_id","created_at");--> statement-breakpoint
ALTER TABLE "league" ADD CONSTRAINT "league_organization_name_uq" UNIQUE("organization_id","name");--> statement-breakpoint

ALTER TABLE "organization_onboarding" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "organization_onboarding" CASCADE;
