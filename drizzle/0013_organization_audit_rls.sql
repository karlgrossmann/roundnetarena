ALTER TABLE "organization_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization_audit_log" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "organization_audit_log_owner_select"
ON "organization_audit_log"
FOR SELECT
USING (
	EXISTS (
		SELECT 1
		FROM "better_auth"."member"
		WHERE
			"member"."organization_id" = "organization_audit_log"."organization_id"
			AND "member"."user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid
			AND "member"."role" = 'owner'
	)
);--> statement-breakpoint
CREATE POLICY "organization_audit_log_member_insert"
ON "organization_audit_log"
FOR INSERT
WITH CHECK (
	"actor_user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid
	AND EXISTS (
		SELECT 1
		FROM "better_auth"."member"
		WHERE
			"member"."organization_id" = "organization_audit_log"."organization_id"
			AND "member"."user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid
	)
);--> statement-breakpoint
COMMENT ON TABLE "organization_audit_log" IS
'Append-only security audit. RLS also applies to the table owner. Application roles may SELECT as organization owner and INSERT as the acting member; UPDATE and DELETE have no policies.';
