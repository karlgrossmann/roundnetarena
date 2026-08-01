UPDATE "organization_audit_log"
SET
	"event_type" = CASE "event_type"
		WHEN 'organization_join_link.created' THEN 'organization.join_link_created'
		WHEN 'organization_join_link.revoked' THEN 'organization.join_link_revoked'
		WHEN 'organization_join_link.accepted' THEN 'organization.join_link_accepted'
		ELSE "event_type"
	END,
	"target_type" = CASE "target_type"
		WHEN 'organization_join_link' THEN 'join_link'
		ELSE "target_type"
	END,
	"metadata" = coalesce("metadata", '{}'::jsonb);--> statement-breakpoint
DROP INDEX "organization_audit_log_organization_idx";--> statement-breakpoint
ALTER TABLE "organization_audit_log" ALTER COLUMN "target_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_audit_log" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "organization_audit_log" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "organization_audit_log_organization_idx" ON "organization_audit_log" USING btree ("organization_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "organization_audit_log" ADD CONSTRAINT "organization_audit_log_event_type" CHECK ("organization_audit_log"."event_type" in ('organization.member_role_changed', 'organization.ownership_changed', 'organization.member_removed', 'organization.invitation_created', 'organization.invitation_resent', 'organization.invitation_revoked', 'organization.invitation_accepted', 'organization.join_link_created', 'organization.join_link_revoked', 'organization.join_link_accepted', 'organization.archived'));--> statement-breakpoint
ALTER TABLE "organization_audit_log" ADD CONSTRAINT "organization_audit_log_target_type" CHECK ("organization_audit_log"."target_type" in ('organization', 'member', 'invitation', 'join_link'));--> statement-breakpoint
ALTER TABLE "organization_audit_log" ADD CONSTRAINT "organization_audit_log_metadata_object" CHECK (jsonb_typeof("organization_audit_log"."metadata") = 'object');
