CREATE TABLE "organization_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"event_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_join_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"role" text DEFAULT 'manager' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"max_uses" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_join_link_token_hash_uq" UNIQUE("token_hash"),
	CONSTRAINT "organization_join_link_standard_role" CHECK ("organization_join_link"."role" = 'manager'),
	CONSTRAINT "organization_join_link_max_uses_positive" CHECK ("organization_join_link"."max_uses" > 0),
	CONSTRAINT "organization_join_link_used_count_valid" CHECK ("organization_join_link"."used_count" >= 0 and "organization_join_link"."used_count" <= "organization_join_link"."max_uses")
);
--> statement-breakpoint
ALTER TABLE "organization_audit_log" ADD CONSTRAINT "organization_audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "better_auth"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_audit_log" ADD CONSTRAINT "organization_audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "better_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_join_link" ADD CONSTRAINT "organization_join_link_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "better_auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_join_link" ADD CONSTRAINT "organization_join_link_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "better_auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_audit_log_organization_idx" ON "organization_audit_log" USING btree ("organization_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "organization_join_link_organization_idx" ON "organization_join_link" USING btree ("organization_id","created_at");--> statement-breakpoint
ALTER TABLE "better_auth"."member" ADD CONSTRAINT "member_organization_user_uq" UNIQUE("organization_id","user_id");