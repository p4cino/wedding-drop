import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const galleries = pgTable("galleries", {
	id: uuid("id").defaultRandom().primaryKey(),
	slug: text("slug").notNull().unique(),
	coupleNames: text("couple_names").notNull(),
	weddingDate: text("wedding_date").notNull(),
	ownerEmail: text("owner_email").notNull(),
	ownerPasswordHash: text("owner_password_hash").notNull(),
	accessPin: text("access_pin"),
	isActive: boolean("is_active").notNull().default(true),
	allowGuestDownloads: boolean("allow_guest_downloads").notNull().default(true),
	allowVideos: boolean("allow_videos").notNull().default(true),
	maxStorageBytes: bigint("max_storage_bytes", { mode: "number" })
		.notNull()
		.default(0), // 0 = bez limitu
	expiresAt: timestamp("expires_at", { withTimezone: true }),
	// Integracja z Google Drive
	gdriveRefreshToken: text("gdrive_refresh_token"),
	gdriveAccountEmail: text("gdrive_account_email"),
	gdriveRootFolderId: text("gdrive_root_folder_id"),
	gdrivePhotosFolderId: text("gdrive_photos_folder_id"),
	gdriveVideosFolderId: text("gdrive_videos_folder_id"),
	gdriveHiddenFolderId: text("gdrive_hidden_folder_id"),
	gdriveExportStatus: text("gdrive_export_status").notNull().default("idle"), // 'idle' | 'running' | 'completed' | 'failed' | 'interrupted'
	gdriveExportProgress: jsonb("gdrive_export_progress").$type<{
		processedFiles: number;
		totalFiles: number;
		processedBytes: number;
		totalBytes: number;
		currentFile?: string | null;
		error?: string | null;
	}>(),
	gdriveExportedAt: timestamp("gdrive_exported_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const cardSettings = pgTable("card_settings", {
	id: uuid("id").defaultRandom().primaryKey(),
	galleryId: uuid("gallery_id")
		.notNull()
		.references(() => galleries.id, { onDelete: "cascade" }),
	headline: text("headline").notNull().default("Podziel się wspomnieniami!"),
	subheadline: text("subheadline")
		.notNull()
		.default(
			"Zeskanuj kod QR aparatem w telefonie i dodaj swoje zdjęcia z naszego wesela",
		),
	primaryColor: text("primary_color").notNull().default("#1E293B"),
	accentColor: text("accent_color").notNull().default("#D4AF37"),
	paperSize: text("paper_size").notNull().default("A6"),
	customInstructions: text("custom_instructions").default(
		"1. Otwórz aparat w telefonie\n2. Skieruj obiektyw na kod QR\n3. Wrzucaj zdjęcia bez rejestracji i aplikacji!",
	),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const mediaItems = pgTable(
	"media_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		galleryId: uuid("gallery_id")
			.notNull()
			.references(() => galleries.id, { onDelete: "cascade" }),
		uploaderName: text("uploader_name").notNull().default("Gość weselny"),
		fileType: text("file_type").notNull(), // 'image' | 'video'
		mimeType: text("mime_type").notNull(),
		originalFileName: text("original_file_name").notNull(),
		fileSize: bigint("file_size", { mode: "number" }).notNull(),
		storagePath: text("storage_path").notNull(),
		thumbPath: text("thumb_path").notNull(),
		width: integer("width"),
		height: integer("height"),
		duration: integer("duration"),
		status: text("status").notNull().default("ready"), // 'ready' | 'hidden' | 'deleted'
		gdriveFileId: text("gdrive_file_id"), // ID pliku na Google Drive dla celów idempotentności
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("idx_media_items_gallery_status_created").on(
			table.galleryId,
			table.status,
			table.createdAt,
		),
		index("idx_media_items_gallery_size").on(table.galleryId, table.fileSize),
	],
);

export const admins = pgTable("admins", {
	id: uuid("id").defaultRandom().primaryKey(),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export type Gallery = typeof galleries.$inferSelect;
export type NewGallery = typeof galleries.$inferInsert;
export type CardSetting = typeof cardSettings.$inferSelect;
export type MediaItem = typeof mediaItems.$inferSelect;
export type NewMediaItem = typeof mediaItems.$inferInsert;
