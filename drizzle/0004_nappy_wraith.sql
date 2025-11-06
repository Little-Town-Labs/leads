CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_user_unique" UNIQUE("clerk_org_id","clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "current_usage" SET DEFAULT '{"quizCompletionsThisMonth":0,"aiWorkflowsThisMonth":0,"lastResetDate":"2025-11-06T12:13:41.304Z"}'::jsonb;--> statement-breakpoint
CREATE INDEX "org_members_clerk_org_id_idx" ON "organization_members" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE INDEX "org_members_clerk_user_id_idx" ON "organization_members" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_clerk_user_id_idx" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");