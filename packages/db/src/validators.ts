import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
	admins,
	cardSettings,
	galleries,
	galleryGdriveExports,
	mediaItems,
} from "./schema";

// --- Podstawowe schematy generowane z tabel Drizzle ---
export const insertGallerySchema = createInsertSchema(galleries);
export const selectGallerySchema = createSelectSchema(galleries);

export const insertCardSettingsSchema = createInsertSchema(cardSettings);
export const selectCardSettingsSchema = createSelectSchema(cardSettings);

export const insertMediaItemSchema = createInsertSchema(mediaItems);
export const selectMediaItemSchema = createSelectSchema(mediaItems);

export const insertAdminSchema = createInsertSchema(admins);
export const selectAdminSchema = createSelectSchema(admins);

export const insertGalleryGdriveExportSchema =
	createInsertSchema(galleryGdriveExports);
export const selectGalleryGdriveExportSchema =
	createSelectSchema(galleryGdriveExports);

// --- DTO i Walidatory Biznesowe ---

/**
 * Walidacja logowania administratora
 */
export const adminLoginDto = z.object({
	username: z.string().trim().min(1, "Nazwa użytkownika jest wymagana"),
	password: z.string().min(1, "Hasło jest wymagane"),
});
export type AdminLoginInput = z.infer<typeof adminLoginDto>;

/**
 * Walidacja logowania właściciela galerii
 */
export const ownerLoginDto = z.object({
	password: z.string().min(1, "Hasło jest wymagane"),
});
export type OwnerLoginInput = z.infer<typeof ownerLoginDto>;

/**
 * Walidacja tworzenia nowej galerii ślubnej przez administratora
 */
export const createGalleryDto = z.object({
	coupleNames: z
		.string()
		.trim()
		.min(2, "Imiona Pary Młodej są wymagane (min. 2 znaki)")
		.max(100, "Imiona Pary Młodej nie mogą przekraczać 100 znaków"),
	weddingDate: z
		.string()
		.regex(
			/^\d{4}-\d{2}-\d{2}$/,
			"Data wesela musi być w poprawnym formacie RRRR-MM-DD",
		),
	ownerEmail: z.string().trim().email("Niepoprawny format adresu e-mail"),
	ownerPassword: z.string().min(1, "Hasło jest wymagane"),
	customSlug: z
		.string()
		.trim()
		.toLowerCase()
		.regex(
			/^[a-z0-9_-]+$/,
			"Slug może zawierać wyłącznie małe litery, cyfry, myślniki i podkreślenia",
		)
		.optional()
		.or(z.literal("")),
	accessPin: z
		.string()
		.trim()
		.regex(/^\d{4,8}$/, "PIN musi składać się z 4 do 8 cyfr")
		.optional()
		.or(z.literal(""))
		.nullable(),
	maxStorageGb: z.coerce
		.number()
		.min(0, "Limit pamięci nie może być ujemny")
		.default(0),
});
export type CreateGalleryInput = z.infer<typeof createGalleryDto>;

/**
 * Walidacja edycji ustawień wizytówki / galerii
 */
export const updateCardSettingsDto = z.object({
	headline: z
		.string()
		.trim()
		.min(1, "Nagłówek nie może być pusty")
		.max(120, "Nagłówek nie może przekraczać 120 znaków")
		.optional(),
	subheadline: z
		.string()
		.trim()
		.max(250, "Podtytuł nie może przekraczać 250 znaków")
		.optional(),
	primaryColor: z
		.string()
		.regex(
			/^#[0-9A-Fa-f]{6}$/,
			"Kolor główny musi być poprawnym kodem HEX (#RRGGBB)",
		)
		.optional(),
	accentColor: z
		.string()
		.regex(
			/^#[0-9A-Fa-f]{6}$/,
			"Kolor akcentu musi być poprawnym kodem HEX (#RRGGBB)",
		)
		.optional(),
	customInstructions: z
		.string()
		.max(500, "Instrukcje nie mogą przekraczać 500 znaków")
		.optional(),
});
export type UpdateCardSettingsInput = z.infer<typeof updateCardSettingsDto>;

/**
 * Walidacja metadanych przesyłanych protokołem TUS
 */
export const tusUploadMetadataDto = z.object({
	gallerySlug: z
		.string()
		.trim()
		.min(1, "Brak wymaganego parametru gallerySlug w metadanych")
		.regex(
			/^[a-z0-9_-]+$/,
			"Niepoprawny format parametru gallerySlug w metadanych",
		),
	uploaderName: z
		.string()
		.trim()
		.max(60, "Podpis gościa nie może przekraczać 60 znaków")
		.optional()
		.default("Gość weselny"),
	originalName: z
		.string()
		.trim()
		.max(255, "Nazwa pliku jest zbyt długa")
		.optional()
		.default("plik"),
	fileType: z.string().trim().optional().default("image/jpeg"),
});
export type TusUploadMetadataInput = z.infer<typeof tusUploadMetadataDto>;
