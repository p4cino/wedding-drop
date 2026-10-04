ALTER TABLE "galleries" ADD COLUMN "guest_password" text;--> statement-breakpoint
ALTER TABLE "galleries" ADD COLUMN "is_approval_queue_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "galleries" ADD COLUMN "allow_guest_uploads" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "galleries" ADD COLUMN "allow_guest_viewing" boolean DEFAULT true NOT NULL;