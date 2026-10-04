ALTER TABLE "media_items" ADD COLUMN "media_type" text DEFAULT 'photo' NOT NULL;--> statement-breakpoint
UPDATE "media_items" SET "media_type" = 'video' WHERE "file_type" = 'video';
