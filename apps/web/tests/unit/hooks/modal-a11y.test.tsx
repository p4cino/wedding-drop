// @vitest-environment jsdom

import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useSwipe } from "@/hooks/useSwipe";

describe("useEscapeKey", () => {
	it("wywołuje callback po Escape tylko gdy aktywny", () => {
		const onEscape = vi.fn();
		const { rerender } = renderHook(
			({ active }) => useEscapeKey(active, onEscape),
			{ initialProps: { active: true } },
		);
		fireEvent.keyDown(window, { key: "Escape" });
		fireEvent.keyDown(window, { key: "Enter" });
		expect(onEscape).toHaveBeenCalledTimes(1);

		rerender({ active: false });
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onEscape).toHaveBeenCalledTimes(1);
	});

	it("używa najnowszego callbacku bez ponownego podpinania", () => {
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = renderHook(({ cb }) => useEscapeKey(true, cb), {
			initialProps: { cb: first },
		});
		rerender({ cb: second });
		fireEvent.keyDown(window, { key: "Escape" });
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});
});

function Trap({ active }: { active: boolean }) {
	const ref = useRef<HTMLDivElement>(null);
	useFocusTrap(ref, active);
	return (
		<div ref={ref} tabIndex={-1} data-testid="dialog">
			<button type="button">pierwszy</button>
			<button type="button">środkowy</button>
			<button type="button">ostatni</button>
		</div>
	);
}

describe("useFocusTrap", () => {
	it("przenosi fokus do okna, zapętla Tab w obie strony i przywraca fokus po zamknięciu", () => {
		const opener = document.createElement("button");
		document.body.appendChild(opener);
		opener.focus();

		const { rerender } = render(<Trap active={true} />);
		const first = screen.getByText("pierwszy");
		const last = screen.getByText("ostatni");
		expect(document.activeElement).toBe(first);

		last.focus();
		fireEvent.keyDown(window, { key: "Tab" });
		expect(document.activeElement).toBe(first);

		fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
		expect(document.activeElement).toBe(last);

		rerender(<Trap active={false} />);
		expect(document.activeElement).toBe(opener);
		opener.remove();
	});

	it("nie przechwytuje Tab w środku listy ani innych klawiszy", () => {
		render(<Trap active={true} />);
		const middle = screen.getByText("środkowy");
		middle.focus();
		const event = new KeyboardEvent("keydown", {
			key: "Tab",
			cancelable: true,
		});
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		fireEvent.keyDown(window, { key: "a" });
		expect(document.activeElement).toBe(middle);
	});

	it("nic nie robi, gdy nieaktywny", () => {
		const outside = document.createElement("button");
		document.body.appendChild(outside);
		outside.focus();
		render(<Trap active={false} />);
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});
});

describe("useSwipe", () => {
	const touch = (x: number) =>
		({ targetTouches: [{ clientX: x }] }) as unknown as React.TouchEvent;

	it("rozpoznaje przesunięcie w lewo i w prawo powyżej progu", () => {
		const onSwipeLeft = vi.fn();
		const onSwipeRight = vi.fn();
		const { result } = renderHook(() =>
			useSwipe({ onSwipeLeft, onSwipeRight }),
		);

		result.current.onTouchStart(touch(200));
		result.current.onTouchMove(touch(100));
		result.current.onTouchEnd();
		expect(onSwipeLeft).toHaveBeenCalledTimes(1);

		result.current.onTouchStart(touch(100));
		result.current.onTouchMove(touch(200));
		result.current.onTouchEnd();
		expect(onSwipeRight).toHaveBeenCalledTimes(1);
	});

	it("ignoruje krótkie przesunięcia i dotknięcie bez ruchu", () => {
		const onSwipeLeft = vi.fn();
		const onSwipeRight = vi.fn();
		const { result } = renderHook(() =>
			useSwipe({ onSwipeLeft, onSwipeRight }),
		);

		result.current.onTouchStart(touch(100));
		result.current.onTouchMove(touch(70)); // 30 px < 45
		result.current.onTouchEnd();
		result.current.onTouchStart(touch(100));
		result.current.onTouchEnd();
		expect(onSwipeLeft).not.toHaveBeenCalled();
		expect(onSwipeRight).not.toHaveBeenCalled();
	});
});
