DROP INDEX "snapshot_initial_uq";--> statement-breakpoint
ALTER TABLE "rating_snapshot" ADD COLUMN "manual" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "snapshot_initial_uq" ON "rating_snapshot" USING btree ("player_id") WHERE "rating_snapshot"."game_id" is null and not "rating_snapshot"."manual";--> statement-breakpoint
ALTER TABLE "rating_snapshot" ADD CONSTRAINT "snapshot_manual_without_game" CHECK (not "rating_snapshot"."manual" or "rating_snapshot"."game_id" is null);