CREATE TABLE "organization_public_view" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"credential_version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_public_view_password_when_enabled" CHECK (not "organization_public_view"."enabled" or "organization_public_view"."password_hash" is not null),
	CONSTRAINT "organization_public_view_credential_version_non_negative" CHECK ("organization_public_view"."credential_version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "organization_audit_log" DROP CONSTRAINT "organization_audit_log_event_type";--> statement-breakpoint
ALTER TABLE "organization_public_view" ADD CONSTRAINT "organization_public_view_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "better_auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_audit_log" ADD CONSTRAINT "organization_audit_log_event_type" CHECK ("organization_audit_log"."event_type" in ('organization.member_role_changed', 'organization.ownership_changed', 'organization.member_removed', 'organization.invitation_created', 'organization.invitation_resent', 'organization.invitation_revoked', 'organization.invitation_accepted', 'organization.join_link_created', 'organization.join_link_revoked', 'organization.join_link_accepted', 'organization.public_view_enabled', 'organization.public_view_disabled', 'organization.public_view_password_changed', 'organization.archived'));