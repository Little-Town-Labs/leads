CREATE TABLE "knowledge_base_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"doc_id" uuid,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" text,
	"token_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"content_type" text NOT NULL,
	"metadata" jsonb,
	"embedding" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "current_usage" SET DEFAULT '{"quizCompletionsThisMonth":0,"aiWorkflowsThisMonth":0,"lastResetDate":"2025-11-06T12:53:33.305Z"}'::jsonb;--> statement-breakpoint
ALTER TABLE "knowledge_base_chunks" ADD CONSTRAINT "knowledge_base_chunks_doc_id_knowledge_base_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."knowledge_base_docs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kb_chunks_org_id_idx" ON "knowledge_base_chunks" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "kb_chunks_doc_id_idx" ON "knowledge_base_chunks" USING btree ("doc_id");--> statement-breakpoint
CREATE INDEX "kb_docs_org_id_idx" ON "knowledge_base_docs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "kb_docs_content_type_idx" ON "knowledge_base_docs" USING btree ("content_type");