"use client";

import { type RefObject, useEffect } from "react";

const FOCUSABLE_SELECTOR =
	'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Trzyma fokus klawiatury wewnątrz okna modalnego: przy aktywacji zapamiętuje
 * dotychczasowy fokus i przenosi go do okna, Tab/Shift+Tab zapętlają się w oknie,
 * a po dezaktywacji fokus wraca na element, który otworzył okno. Lista elementów
 * jest liczona przy każdym Tab, więc działa z dynamiczną zawartością.
 */
export function useFocusTrap(
	containerRef: RefObject<HTMLElement | null>,
	isActive: boolean,
) {
	useEffect(() => {
		if (!isActive) return;
		const previouslyFocused = document.activeElement as HTMLElement | null;
		const container = containerRef.current;
		const first = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
		(first ?? container)?.focus();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Tab" || !containerRef.current) return;
			const focusables = Array.from(
				containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			);
			if (focusables.length === 0) return;

			const firstElement = focusables[0];
			const lastElement = focusables[focusables.length - 1];
			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault();
				lastElement.focus();
			} else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault();
				firstElement.focus();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			previouslyFocused?.focus();
		};
	}, [isActive, containerRef]);
}
