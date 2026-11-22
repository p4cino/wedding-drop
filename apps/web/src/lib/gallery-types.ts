import type { QuestItem, QuestsConfig } from "@wedding-drop/db";

export type { QuestItem, QuestsConfig };

/** Metadane galerii zwracane przez publiczne `GET /api/gallery/[slug]`. */
export interface GalleryData {
	/** Galeria jest chroniona hasłem gościa. */
	hasPassword?: boolean;
	id: string;
	slug: string;
	coupleNames: string;
	weddingDate: string;
	isActive: boolean;
	allowGuestDownloads: boolean;
	allowVideos: boolean;
	// Kolory motywu wesela (zawsze zwracane przez API, z domyślnymi wartościami
	// generatora winietek A6) — używane m.in. do ramki zdjęcia z photobooth.
	primaryColor?: string;
	accentColor?: string;
	cardSettings?: {
		headline?: string | null;
		customInstructions?: string | null;
		primaryColor?: string | null;
		accentColor?: string | null;
	} | null;
	branding?: {
		logoPath: string | null;
		backgroundPath: string | null;
	} | null;
	questsConfig?: QuestsConfig | null;
	allowGuestViewing: boolean;
	allowGuestUploads: boolean;
	isApprovalQueueEnabled: boolean;
}

export interface MediaItemData {
	id: string;
	uploaderName: string;
	source?: "guest" | "photographer";
	fileType: "image" | "video" | "audio";
	mediaType?: "photo" | "video" | "audio";
	mimeType: string;
	originalFileName: string;
	thumbUrl: string;
	rawUrl: string;
	createdAt: string;
	likesCount?: number;
	caption?: string | null;
	questId?: string | null;
}

export interface WishItemData {
	id: string;
	guestName: string | null;
	message: string;
	createdAt: string;
}
