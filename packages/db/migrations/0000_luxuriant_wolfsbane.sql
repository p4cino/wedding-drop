CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "card_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"headline" text DEFAULT 'Podziel się wspomnieniami!' NOT NULL,
	"subheadline" text DEFAULT 'Zeskanuj kod QR aparatem w telefonie i dodaj swoje zdjęcia z naszego wesela' NOT NULL,
	"primary_color" text DEFAULT '#1E293B' NOT NULL,
	"accent_color" text DEFAULT '#D4AF37' NOT NULL,
	"paper_size" text DEFAULT 'A6' NOT NULL,
	"custom_instructions" text DEFAULT '1. Otwórz aparat w telefonie
2. Skieruj obiektyw na kod QR
3. Wrzucaj zdjęcia bez rejestracji i aplikacji!',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"couple_names" text NOT NULL,
	"wedding_date" text NOT NULL,
	"owner_email" text NOT NULL,
	"owner_password_hash" text NOT NULL,
	"access_pin" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"allow_guest_downloads" boolean DEFAULT true NOT NULL,
	"allow_videos" boolean DEFAULT true NOT NULL,
	"max_storage_bytes" bigint DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"gdrive_refresh_token" text,
	"gdrive_account_email" text,
	"gdrive_root_folder_id" text,
	"gdrive_photos_folder_id" text,
	"gdrive_videos_folder_id" text,
	"gdrive_hidden_folder_id" text,
	"gdrive_export_status" text DEFAULT 'idle' NOT NULL,
	"gdrive_export_progress" jsonb,
	"gdrive_exported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"uploader_name" text DEFAULT 'Gość weselny' NOT NULL,
	"file_type" text NOT NULL,
	"mime_type" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_size" bigint NOT NULL,
	"storage_path" text NOT NULL,
	"thumb_path" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"status" text DEFAULT 'ready' NOT NULL,
	"gdrive_file_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_settings" ADD CONSTRAINT "card_settings_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_items_gallery_status_created" ON "media_items" USING btree ("gallery_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_media_items_gallery_size" ON "media_items" USING btree ("gallery_id","file_size");