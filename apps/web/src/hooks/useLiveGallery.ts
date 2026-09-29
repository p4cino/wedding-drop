"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useGalleryEvents } from "@/hooks/useGalleryEvents";
import {
	fetchGalleryData,
	fetchGalleryMedia,
	fetchGalleryWishes,
} from "@/lib/gallery-api";
import type { GalleryData, WishItemData } from "@/lib/gallery-types";
import {
	galleryReducer,
	initialLiveGalleryState,
	type LiveEvent,
} from "@/lib/live-gallery";

export type LiveGalleryStatus = "loading" | "ready" | "notFound" | "error";

interface UseLiveGalleryOptions {
	/** Limit liczby elementów (np. kolejka widoku TV). */
	maxItems?: number;
	/** Czy pobierać i śledzić życzenia (domyślnie tak). */
	withWishes?: boolean;
	/** Podgląd surowych zdarzeń SSE (np. reset slajdu w widoku TV). */
	onEvent?: (event: LiveEvent) => void;
}

const BACKOFF_MS = [0, 1000, 2500, 5000];

/**
 * Wspólny stan publicznej galerii (metadane, media, życzenia) zasilany SSE.
 * Ponowne pobranie następuje po wznowieniu połączenia SSE oraz na żądanie.
 */
export function useLiveGallery(
	slug: string | undefined,
	{ maxItems, withWishes = true, onEvent }: UseLiveGalleryOptions = {},
) {
	const [gallery, setGallery] = useState<GalleryData | null>(null);
	const [status, setStatus] = useState<LiveGalleryStatus>("loading");
	const [state, dispatch] = useReducer(galleryReducer, initialLiveGalleryState);
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const readyRef = useRef(false);

	const refetch = useCallback(async () => {
		if (!slug) return;
		const result = await fetchGalleryData(slug);
		if (result.status !== "ready") {
			// Ciche odświeżenie nie może zamienić działającej galerii w błąd
			if (!readyRef.current) setStatus(result.status);
			return;
		}
		const [items, wishes] = await Promise.all([
			fetchGalleryMedia(slug),
			withWishes ? fetchGalleryWishes(slug) : Promise.resolve(null),
		]);
		setGallery(result.gallery);
		dispatch({
			type: "loaded",
			items: items ?? undefined,
			wishes: wishes ?? undefined,
			maxItems,
		});
		readyRef.current = true;
		setStatus("ready");
	}, [slug, maxItems, withWishes]);

	const clearTimers = useCallback(() => {
		for (const timer of timers.current) clearTimeout(timer);
		timers.current = [];
	}, []);

	/** Seria pobrań po uploadzie (miniatury/wideo przetwarzane asynchronicznie). */
	const refetchWithBackoff = useCallback(() => {
		clearTimers();
		timers.current = BACKOFF_MS.map((delay) => setTimeout(refetch, delay));
	}, [refetch, clearTimers]);

	useEffect(() => {
		readyRef.current = false;
		setStatus("loading");
		refetch();
		return clearTimers;
	}, [refetch, clearTimers]);

	const isLive = useGalleryEvents(slug, {
		onEvent: (event) => {
			dispatch({ type: "event", event, maxItems });
			onEvent?.(event);
		},
		onReconnect: refetch,
	});

	const addWish = useCallback(
		(wish: WishItemData) => dispatch({ type: "wish-added", wish }),
		[],
	);

	return {
		gallery,
		items: state.items,
		wishes: state.wishes,
		status,
		isLive,
		refetch,
		refetchWithBackoff,
		addWish,
	};
}
