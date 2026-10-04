CREATE TABLE "gallery_branding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"logo_path" text,
	"background_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_branding_gallery_id_unique" UNIQUE("gallery_id")
);
--> statement-breakpoint
ALTER TABLE "gallery_branding" ADD CONSTRAINT "gallery_branding_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;