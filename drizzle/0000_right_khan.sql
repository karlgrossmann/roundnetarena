CREATE TABLE "block_pause" (
	"block_id" text NOT NULL,
	"player_id" text NOT NULL,
	"league_id" text NOT NULL,
	"reason" text NOT NULL,
	CONSTRAINT "block_pause_block_id_player_id_pk" PRIMARY KEY("block_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "game_block" (
	"block_id" text PRIMARY KEY NOT NULL,
	"seq" bigserial NOT NULL,
	"league_id" text NOT NULL,
	"committed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "block_league_uq" UNIQUE("block_id","league_id")
);
--> statement-breakpoint
CREATE TABLE "game_participation" (
	"game_id" text NOT NULL,
	"player_id" text NOT NULL,
	"league_id" text NOT NULL,
	"team" char(1) NOT NULL,
	"slot" smallint NOT NULL,
	"rating_snapshot_id" text NOT NULL,
	CONSTRAINT "game_participation_game_id_player_id_pk" PRIMARY KEY("game_id","player_id"),
	CONSTRAINT "participation_seat_uq" UNIQUE("game_id","team","slot"),
	CONSTRAINT "participation_slot" CHECK ("game_participation"."slot" in (1, 2))
);
--> statement-breakpoint
CREATE TABLE "game" (
	"game_id" text PRIMARY KEY NOT NULL,
	"block_id" text NOT NULL,
	"league_id" text NOT NULL,
	"local_idx" integer NOT NULL,
	"status" text NOT NULL,
	"points_a" integer,
	"points_b" integer,
	"importance" double precision DEFAULT 1.5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"played_at" timestamp with time zone,
	CONSTRAINT "game_league_uq" UNIQUE("game_id","league_id"),
	CONSTRAINT "game_court_uq" UNIQUE("block_id","local_idx"),
	CONSTRAINT "game_local_idx_positive" CHECK ("game"."local_idx" > 0),
	CONSTRAINT "game_points_iff_played" CHECK (("game"."status" = 'played') = ("game"."points_a" is not null and "game"."points_b" is not null)),
	CONSTRAINT "game_points_valid" CHECK ("game"."points_a" is null or ("game"."points_a" >= 0 and "game"."points_b" >= 0 and "game"."points_a" <> "game"."points_b"))
);
--> statement-breakpoint
CREATE TABLE "league_settings" (
	"league_id" text PRIMARY KEY NOT NULL,
	"matching_algorithm" text DEFAULT 'default' NOT NULL,
	"higher_rating_weight" double precision DEFAULT 2 NOT NULL,
	"pause_mode" text DEFAULT 'random' NOT NULL,
	"initial_rating" integer DEFAULT 1500 NOT NULL,
	"initial_rd" integer DEFAULT 125 NOT NULL,
	"table_columns" text[] NOT NULL,
	"table_sort_by" text NOT NULL,
	"table_coloring" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league" (
	"league_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "player_pool_member" (
	"league_id" text NOT NULL,
	"player_id" text NOT NULL,
	"status" text NOT NULL,
	"fixed_team_key" text,
	CONSTRAINT "player_pool_member_league_id_player_id_pk" PRIMARY KEY("league_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "player_pool" (
	"league_id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player" (
	"player_id" text PRIMARY KEY NOT NULL,
	"league_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"marked_as_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_league_uq" UNIQUE("player_id","league_id")
);
--> statement-breakpoint
CREATE TABLE "rating_snapshot" (
	"rating_snapshot_id" text PRIMARY KEY NOT NULL,
	"seq" bigserial NOT NULL,
	"player_id" text NOT NULL,
	"league_id" text NOT NULL,
	"game_id" text,
	"rating" integer NOT NULL,
	"rd" double precision NOT NULL,
	"vol" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshot_player_game_uq" UNIQUE("player_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "block_pause" ADD CONSTRAINT "block_pause_block_id_league_id_game_block_block_id_league_id_fk" FOREIGN KEY ("block_id","league_id") REFERENCES "public"."game_block"("block_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_pause" ADD CONSTRAINT "block_pause_player_id_league_id_player_player_id_league_id_fk" FOREIGN KEY ("player_id","league_id") REFERENCES "public"."player"("player_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_block" ADD CONSTRAINT "game_block_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_participation" ADD CONSTRAINT "game_participation_rating_snapshot_id_rating_snapshot_rating_snapshot_id_fk" FOREIGN KEY ("rating_snapshot_id") REFERENCES "public"."rating_snapshot"("rating_snapshot_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_participation" ADD CONSTRAINT "game_participation_game_id_league_id_game_game_id_league_id_fk" FOREIGN KEY ("game_id","league_id") REFERENCES "public"."game"("game_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_participation" ADD CONSTRAINT "game_participation_player_id_league_id_player_player_id_league_id_fk" FOREIGN KEY ("player_id","league_id") REFERENCES "public"."player"("player_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_block_id_league_id_game_block_block_id_league_id_fk" FOREIGN KEY ("block_id","league_id") REFERENCES "public"."game_block"("block_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_settings" ADD CONSTRAINT "league_settings_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_pool_member" ADD CONSTRAINT "player_pool_member_league_id_player_pool_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."player_pool"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_pool_member" ADD CONSTRAINT "player_pool_member_player_id_league_id_player_player_id_league_id_fk" FOREIGN KEY ("player_id","league_id") REFERENCES "public"."player"("player_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_pool" ADD CONSTRAINT "player_pool_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_snapshot" ADD CONSTRAINT "rating_snapshot_player_id_league_id_player_player_id_league_id_fk" FOREIGN KEY ("player_id","league_id") REFERENCES "public"."player"("player_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_snapshot" ADD CONSTRAINT "rating_snapshot_game_id_league_id_game_game_id_league_id_fk" FOREIGN KEY ("game_id","league_id") REFERENCES "public"."game"("game_id","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_recent_idx" ON "game_block" USING btree ("league_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "block_one_active_uq" ON "game_block" USING btree ("league_id") WHERE not "game_block"."committed";--> statement-breakpoint
CREATE INDEX "participation_player_idx" ON "game_participation" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "pool_fixed_team_idx" ON "player_pool_member" USING btree ("league_id","fixed_team_key") WHERE "player_pool_member"."fixed_team_key" is not null;--> statement-breakpoint
CREATE INDEX "player_active_idx" ON "player" USING btree ("league_id") WHERE not "player"."marked_as_deleted";--> statement-breakpoint
CREATE UNIQUE INDEX "snapshot_initial_uq" ON "rating_snapshot" USING btree ("player_id") WHERE "rating_snapshot"."game_id" is null;--> statement-breakpoint
CREATE INDEX "snapshot_latest_idx" ON "rating_snapshot" USING btree ("player_id","seq" DESC NULLS LAST);