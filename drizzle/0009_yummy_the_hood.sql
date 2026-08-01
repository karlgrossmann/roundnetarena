CREATE TABLE "organization_onboarding" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"league_id" text NOT NULL,
	"provisioned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_onboarding_league_id_unique" UNIQUE("league_id")
);
--> statement-breakpoint
ALTER TABLE "organization_onboarding" ADD CONSTRAINT "organization_onboarding_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "better_auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_onboarding" ADD CONSTRAINT "organization_onboarding_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_onboarding_league_idx" ON "organization_onboarding" USING btree ("league_id");