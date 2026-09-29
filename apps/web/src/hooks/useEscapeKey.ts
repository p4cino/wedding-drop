"use client";

import { useEffect, useRef } from "react";

/** Wywołuje `onEscape` po naciśnięciu Escape, dopóki `isActive` jest prawdziwe. */
export function useEscapeKey(isActive: boolean, onEscape: () => void) {
	const handlerRef = useRef(onEscape);
	handlerRef.current = onEscape;

	useEffect(() => {
		if (!isActive) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				handlerRef.current();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isActive]);
}
