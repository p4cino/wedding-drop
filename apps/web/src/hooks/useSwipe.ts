"use client";

import type React from "react";
import { useRef } from "react";

interface SwipeOptions {
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	/** Minimalny dystans w pikselach uznawany za przesunięcie. */
	threshold?: number;
}

/** Wykrywa poziome przesunięcie palcem; zwraca handlery do wpięcia w element. */
export function useSwipe({
	onSwipeLeft,
	onSwipeRight,
	threshold = 45,
}: SwipeOptions) {
	const startX = useRef<number | null>(null);
	const endX = useRef<number | null>(null);

	return {
		onTouchStart: (e: React.TouchEvent) => {
			startX.current = e.targetTouches[0].clientX;
			endX.current = null;
		},
		onTouchMove: (e: React.TouchEvent) => {
			endX.current = e.targetTouches[0].clientX;
		},
		onTouchEnd: () => {
			if (startX.current !== null && endX.current !== null) {
				const diff = startX.current - endX.current;
				if (diff > threshold) onSwipeLeft();
				else if (diff < -threshold) onSwipeRight();
			}
			startX.current = null;
			endX.current = null;
		},
	};
}
