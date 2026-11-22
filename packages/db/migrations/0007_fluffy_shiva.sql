ALTER TABLE "galleries" ADD COLUMN "quests_config" jsonb;--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "likes_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "caption" text;--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "quest_id" text;