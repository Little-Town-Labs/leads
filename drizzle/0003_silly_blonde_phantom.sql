CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"subdomain" text NOT NULL,
	"custom_domain" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"branding" jsonb DEFAULT '{"primaryColor":"#3B82F6","secondaryColor":"#10B981"}'::jsonb NOT NULL,
	"landing_page" jsonb NOT NULL,
	"settings" jsonb DEFAULT '{"enableAiResearch":true,"qualificationThreshold":60}'::jsonb NOT NULL,
	"subscription_tier" text DEFAULT 'starter' NOT NULL,
	"subscription_status" text DEFAULT 'active' NOT NULL,
	"usage_limits" jsonb NOT NULL,
	"current_usage" jsonb DEFAULT '{"quizCompletionsThisMonth":0,"aiWorkflowsThisMonth":0,"lastResetDate":"2025-11-05T23:01:00.468Z"}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "tenants_subdomain_idx" ON "tenants" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "tenants_clerk_org_id_idx" ON "tenants" USING btree ("clerk_org_id");