import type {
	GalleryData,
	MediaItemData,
	WishItemData,
} from "@/lib/gallery-types";

export type GalleryFetchResult =
	| { status: "ready"; gallery: GalleryData }
	| { status: "notFound" }
	| { status: "error" };

/** Pobiera publiczne metadane galerii; rozróżnia 404 od błędu sieci/serwera. */
export async function fetchGalleryData(
	slug: string,
): Promise<GalleryFetchResult> {
	try {
		const res = await fetch(`/api/gallery/${slug}`);
		if (res.status === 404) return { status: "notFound" };
		if (!res.ok) return { status: "error" };
		return { status: "ready", gallery: (await res.json()) as GalleryData };
	} catch (err) {
		console.error("Błąd ładowania galerii:", err);
		return { status: "error" };
	}
}

/** Publiczna lista mediów (API filtruje status "ready" bez poświadczeń). */
export async function fetchGalleryMedia(
	slug: string,
): Promise<MediaItemData[] | null> {
	try {
		const res = await fetch(`/api/gallery/${slug}/media`);
		if (!res.ok) return null;
		return ((await res.json()).media as MediaItemData[]) || [];
	} catch {
		return null;
	}
}

/** Publiczna lista życzeń (API filtruje status "ready" bez poświadczeń). */
export async function fetchGalleryWishes(
	slug: string,
): Promise<WishItemData[] | null> {
	try {
		const res = await fetch(`/api/gallery/${slug}/wishes`);
		if (!res.ok) return null;
		return ((await res.json()).wishes as WishItemData[]) || [];
	} catch {
		return null;
	}
}
