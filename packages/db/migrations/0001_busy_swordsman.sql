CREATE TABLE "gallery_gdrive_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"refresh_token" text,
	"account_email" text,
	"root_folder_id" text,
	"photos_folder_id" text,
	"videos_folder_id" text,
	"hidden_folder_id" text,
	"export_status" text DEFAULT 'idle' NOT NULL,
	"export_progress" jsonb,
	"exported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_gdrive_exports_gallery_id_unique" UNIQUE("gallery_id")
);
--> statement-breakpoint
ALTER TABLE "gallery_gdrive_exports" ADD CONSTRAINT "gallery_gdrive_exports_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_refresh_token";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_account_email";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_root_folder_id";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_photos_folder_id";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_videos_folder_id";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_hidden_folder_id";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_export_status";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_export_progress";--> statement-breakpoint
ALTER TABLE "galleries" DROP COLUMN "gdrive_exported_at";