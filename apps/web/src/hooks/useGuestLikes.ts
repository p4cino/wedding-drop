"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItemData } from "@/lib/gallery-types";
import { getLikedMediaIds, setMediaLiked } from "@/lib/guest-likes";

interface UseGuestLikesOptions {
	slug: string | undefined;
	items: MediaItemData[];
	updateMediaLikes?: (mediaId: string, likesCount: number) => void;
}

/**
 * Zarządza lokalnym stanem polubień w `localStorage` (`wd_likes_${slug}`) oraz
 * wysyła reakcje do API z optymistyczną aktualizacją i atomowym rollbackiem
 * w przypadku błędu HTTP (np. 429/403/404/500) lub sieciowego.
 */
export function useGuestLikes({
	slug,
	items,
	updateMediaLikes,
}: UseGuestLikesOptions) {
	const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());

	const slugRef = useRef(slug);
	slugRef.current = slug;
	const likedIdsRef = useRef(likedIds);
	likedIdsRef.current = likedIds;
	const itemsRef = useRef(items);
	itemsRef.current = items;
	const updateMediaLikesRef = useRef(updateMediaLikes);
	updateMediaLikesRef.current = updateMediaLikes;

	useEffect(() => {
		const next = slug ? getLikedMediaIds(slug) : new Set<string>();
		likedIdsRef.current = next;
		setLikedIds(next);
	}, [slug]);

	const toggleLike = useCallback(async (mediaId: string) => {
		const currentSlug = slugRef.current;
		if (!currentSlug) return;

		const wasLiked = likedIdsRef.current.has(mediaId);
		const action = wasLiked ? "unlike" : "like";
		const targetItem = itemsRef.current.find((i) => i.id === mediaId);
		const previousLikes = targetItem?.likesCount ?? 0;
		const optimisticLikes = wasLiked
			? Math.max(0, previousLikes - 1)
			: previousLikes + 1;

		const nextLiked = setMediaLiked(currentSlug, mediaId, !wasLiked);
		likedIdsRef.current = nextLiked;
		setLikedIds(new Set(nextLiked));
		updateMediaLikesRef.current?.(mediaId, optimisticLikes);

		const rollback = () => {
			const reverted = setMediaLiked(currentSlug, mediaId, wasLiked);
			likedIdsRef.current = reverted;
			setLikedIds(new Set(reverted));
			updateMediaLikesRef.current?.(mediaId, previousLikes);
		};

		try {
			const res = await fetch(
				`/api/gallery/${currentSlug}/media/${mediaId}/like`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action }),
				},
			);
			if (!res.ok) {
				rollback();
				return;
			}
			const data = (await res.json()) as {
				id?: string;
				likesCount?: number;
			};
			if (typeof data.likesCount === "number") {
				updateMediaLikesRef.current?.(mediaId, data.likesCount);
			}
		} catch (err) {
			console.error("Błąd aktualizacji polubienia:", err);
			rollback();
		}
	}, []);

	return { likedIds, toggleLike };
}
