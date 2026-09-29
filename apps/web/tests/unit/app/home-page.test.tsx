// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/[locale]/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/i18n/routing", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

describe("HomePage — wejście do galerii po slugu", () => {
	beforeEach(() => push.mockClear());

	const submit = (value: string) => {
		render(<HomePage />);
		fireEvent.change(screen.getByLabelText("inputLabel"), {
			target: { value },
		});
		fireEvent.click(screen.getByRole("button", { name: /submitBtn/ }));
	};

	it("sanityzuje slug przed nawigacją", () => {
		submit("  Kasia & Tomek!  ");
		expect(push).toHaveBeenCalledWith("/g/kasiatomek");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("puste pole nie nawiguje do /g/ i pokazuje komunikat walidacji", () => {
		submit("   ");
		expect(push).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toHaveTextContent("slugInvalid");
	});

	it("same niedozwolone znaki też nie nawigują, a edycja pola czyści komunikat", () => {
		submit("!!! ???");
		expect(push).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("inputLabel"), {
			target: { value: "ok" },
		});
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
