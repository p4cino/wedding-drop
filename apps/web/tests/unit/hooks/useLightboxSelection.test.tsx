// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";
import { useLightboxSelection } from "@/hooks/useLightboxSelection";

const list = (...ids: string[]) => ids.map((id) => ({ id }));

function setup(initial: { id: string }[]) {
	return renderHook(({ items }) => useLightboxSelection(items), {
		initialProps: { items: initial },
		wrapper: StrictMode,
	});
}

describe("useLightboxSelection", () => {
	it("jest zamknięty na starcie i otwiera element po indeksie", () => {
		const { result } = setup(list("a", "b", "c"));
		expect(result.current.index).toBeNull();
		act(() => result.current.open(1));
		expect(result.current.index).toBe(1);
	});

	it("nowy element na początku listy nie przesuwa oglądanego materiału", () => {
		const { result, rerender } = setup(list("a", "b"));
		act(() => result.current.open(1)); // b
		rerender({ items: list("n", "a", "b") });
		expect(result.current.index).toBe(2); // wciąż b
	});

	it("duplikat zdarzenia (ta sama lista) nie zmienia podglądu", () => {
		const { result, rerender } = setup(list("a", "b"));
		act(() => result.current.open(0));
		rerender({ items: list("a", "b") });
		expect(result.current.index).toBe(0);
	});

	it("usunięcie oglądanego elementu w środku przechodzi na następnego (dokładnie o jedno miejsce, także w StrictMode)", () => {
		const { result, rerender } = setup(list("a", "b", "c"));
		act(() => result.current.open(1)); // b
		rerender({ items: list("a", "c") });
		expect(result.current.index).toBe(1); // c
	});

	it("usunięcie oglądanego ostatniego elementu przechodzi na poprzedniego", () => {
		const { result, rerender } = setup(list("a", "b", "c"));
		act(() => result.current.open(2)); // c
		rerender({ items: list("a", "b") });
		expect(result.current.index).toBe(1); // b
	});

	it("usunięcie elementu przed oglądanym nie zmienia oglądanego materiału", () => {
		const { result, rerender } = setup(list("a", "b", "c"));
		act(() => result.current.open(2)); // c
		rerender({ items: list("b", "c") });
		expect(result.current.index).toBe(1); // c
	});

	it("usunięcie jedynego elementu zamyka lightbox", () => {
		const { result, rerender } = setup(list("a"));
		act(() => result.current.open(0));
		rerender({ items: [] });
		expect(result.current.index).toBeNull();
	});

	it("close zamyka, a navigate przechodzi na wskazany indeks; open poza zakresem jest ignorowane", () => {
		const { result } = setup(list("a", "b"));
		act(() => result.current.open(0));
		act(() => result.current.navigate(1));
		expect(result.current.index).toBe(1);
		act(() => result.current.open(9));
		expect(result.current.index).toBe(1);
		act(() => result.current.close());
		expect(result.current.index).toBeNull();
	});
});
