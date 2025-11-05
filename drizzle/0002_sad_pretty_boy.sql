CREATE TABLE "email_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"lead_id" uuid,
	"sequence_id" uuid,
	"email_type" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp,
	"scheduled_at" timestamp,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"tier" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"delay_days" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"lead_id" uuid NOT NULL,
	"readiness_score" integer NOT NULL,
	"qualification_score" integer,
	"total_points" integer NOT NULL,
	"max_possible_points" integer NOT NULL,
	"tier" text NOT NULL,
	"scoring_breakdown" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lead_scores_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"question_number" integer NOT NULL,
	"question_type" text NOT NULL,
	"question_text" text NOT NULL,
	"question_subtext" text,
	"options" jsonb,
	"scoring_weight" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"placeholder" text,
	"min_selections" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"lead_id" uuid,
	"question_id" uuid,
	"question_number" integer NOT NULL,
	"answer" jsonb NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_sequence_id_email_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."email_sequences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_sends_org_id_idx" ON "email_sends" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "email_sends_lead_id_idx" ON "email_sends" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "email_sends_status_idx" ON "email_sends" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_sequences_org_id_idx" ON "email_sequences" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "email_sequences_tier_idx" ON "email_sequences" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "lead_scores_org_id_idx" ON "lead_scores" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "lead_scores_lead_id_idx" ON "lead_scores" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_scores_tier_idx" ON "lead_scores" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "lead_scores_readiness_idx" ON "lead_scores" USING btree ("readiness_score");--> statement-breakpoint
CREATE INDEX "quiz_questions_org_id_idx" ON "quiz_questions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_number_idx" ON "quiz_questions" USING btree ("question_number");--> statement-breakpoint
CREATE INDEX "quiz_responses_lead_id_idx" ON "quiz_responses" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "quiz_responses_question_id_idx" ON "quiz_responses" USING btree ("question_id");