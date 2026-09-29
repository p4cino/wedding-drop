/** Metadane galerii zwracane przez publiczne `GET /api/gallery/[slug]`. */
export interface GalleryData {
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
}

export interface MediaItemData {
	id: string;
	uploaderName: string;
	source?: "guest" | "photographer";
	fileType: "image" | "video";
	mimeType: string;
	originalFileName: string;
	thumbUrl: string;
	rawUrl: string;
	createdAt: string;
}

export interface WishItemData {
	id: string;
	guestName: string | null;
	message: string;
	createdAt: string;
}
