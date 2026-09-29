"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveEvent } from "@/lib/live-gallery";

interface GalleryEventHandlers {
	onEvent: (event: LiveEvent) => void;
	/** Wołane po ponownym nawiązaniu połączenia po wcześniejszym błędzie. */
	onReconnect?: () => void;
}

/**
 * Jedyne miejsce tworzące `EventSource` na `/api/gallery/[slug]/live`.
 * Zwraca flagę `isLive`; błędne ramki JSON (np. ping) są pomijane.
 */
export function useGalleryEvents(
	slug: string | undefined,
	handlers: GalleryEventHandlers,
): boolean {
	const [isLive, setIsLive] = useState(false);
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

	useEffect(() => {
		if (!slug) return;
		const source = new EventSource(`/api/gallery/${slug}/live`);
		let hadError = false;

		source.onopen = () => {
			setIsLive(true);
			if (hadError) {
				hadError = false;
				handlersRef.current.onReconnect?.();
			}
		};

		source.onmessage = (e) => {
			let event: LiveEvent;
			try {
				event = JSON.parse(e.data);
			} catch {
				return;
			}
			handlersRef.current.onEvent(event);
		};

		source.onerror = () => {
			hadError = true;
			setIsLive(false);
		};

		return () => {
			source.close();
		};
	}, [slug]);

	return isLive;
}
