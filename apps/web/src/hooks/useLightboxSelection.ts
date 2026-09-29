"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Stan otwartego lightboxa śledzony po `id` elementu, a nie po pozycji na liście —
 * dodanie/ukrycie innych elementów na żywo nie przesuwa oglądanego materiału.
 * Gdy oglądany element zniknie, lightbox przechodzi na sąsiada zajmującego to samo
 * miejsce (a jeśli to był ostatni — na poprzedni), a przy pustej liście zamyka się.
 */
export function useLightboxSelection<T extends { id: string }>(items: T[]) {
	const [openId, setOpenId] = useState<string | null>(null);
	const lastIndexRef = useRef(-1);

	const foundIndex = openId
		? items.findIndex((item) => item.id === openId)
		: -1;

	useEffect(() => {
		if (openId === null) return;
		if (foundIndex !== -1) {
			lastIndexRef.current = foundIndex;
			return;
		}
		const neighbor = items[Math.min(lastIndexRef.current, items.length - 1)];
		setOpenId(neighbor?.id ?? null);
	}, [openId, foundIndex, items]);

	const open = useCallback(
		(index: number) => {
			const item = items[index];
			if (!item) return;
			lastIndexRef.current = index;
			setOpenId(item.id);
		},
		[items],
	);

	const close = useCallback(() => setOpenId(null), []);

	return {
		/** Indeks oglądanego elementu w bieżącej liście albo `null`, gdy lightbox jest zamknięty. */
		index: foundIndex === -1 ? null : foundIndex,
		open,
		close,
		navigate: open,
	};
}
