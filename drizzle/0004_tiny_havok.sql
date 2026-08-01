ALTER TABLE "player" ADD COLUMN "anonymized_key" text;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_anonymized_key_uq" UNIQUE("anonymized_key");