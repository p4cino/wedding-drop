// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CardCustomizerPage from "@/app/[locale]/g/[slug]/card/page";

const toDataURL = vi.fn();

vi.mock("qrcode", () => ({
	default: { toDataURL: (...args: unknown[]) => toDataURL(...args) },
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "kasia" }) }));
vi.mock("@/i18n/routing", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status });

const gallery = {
	id: "g1",
	slug: "kasia",
	coupleNames: "Kasia i Tomek",
	weddingDate: "12.09.2026",
	isActive: true,
	allowGuestDownloads: true,
	allowVideos: true,
	cardSettings: {
		headline: "Witajcie",
		primaryColor: "#112233",
		accentColor: "#445566",
	},
};

describe("CardCustomizerPage", () => {
	beforeEach(() => {
		toDataURL.mockResolvedValue("data:image/png;base64,QR");
		vi.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => vi.unstubAllGlobals());

	it("dla nieistniejącej galerii (404) pokazuje ekran 'nie znaleziono' bez podglądu i przycisków PDF", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 404)));
		render(<CardCustomizerPage />);
		expect(await screen.findByText("notFoundTitle")).toBeInTheDocument();
		expect(document.getElementById("printable-card")).toBeNull();
		expect(screen.queryByLabelText("downloadAria")).not.toBeInTheDocument();
	});

	it("błąd sieci pokazuje stan błędu z ponowieniem, a nie 'nie znaleziono'", async () => {
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new Error("offline"))
			.mockResolvedValueOnce(json(gallery));
		vi.stubGlobal("fetch", fetchMock);
		render(<CardCustomizerPage />);
		expect(await screen.findByText("loadError")).toBeInTheDocument();
		expect(screen.queryByText("notFoundTitle")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "retryBtn" }));
		expect(await screen.findByText("Kasia i Tomek")).toBeInTheDocument();
	});

	it("dla istniejącej galerii pokazuje podgląd z danymi, QR i link PDF zbudowany z URLSearchParams", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(gallery)));
		render(<CardCustomizerPage />);
		expect(await screen.findByText("Kasia i Tomek")).toBeInTheDocument();
		expect(await screen.findByRole("img")).toHaveAttribute(
			"src",
			"data:image/png;base64,QR",
		);

		const link = screen.getByLabelText("downloadAria") as HTMLAnchorElement;
		const url = new URL(link.href, "http://localhost");
		expect(url.pathname).toBe("/api/gallery/kasia/card/pdf");
		expect(url.searchParams.get("primaryColor")).toBe("#112233");
		expect(url.searchParams.get("accentColor")).toBe("#445566");
		expect(url.searchParams.get("headline")).toBe("Witajcie");
		expect(toDataURL.mock.calls[0][0]).toBe(
			`${window.location.origin}/g/kasia`,
		);
	});

	it("błąd generowania QR pokazuje komunikat zamiast nieobsłużonego odrzucenia", async () => {
		toDataURL.mockRejectedValue(new Error("qr"));
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(gallery)));
		render(<CardCustomizerPage />);
		await screen.findByText("Kasia i Tomek");
		expect(await screen.findByText("qrError")).toBeInTheDocument();
	});

	it("szybka zmiana koloru: starszy wynik QR nie nadpisuje nowszego", async () => {
		const resolvers: Array<(v: string) => void> = [];
		toDataURL.mockImplementation(
			() => new Promise<string>((resolve) => resolvers.push(resolve)),
		);
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(gallery)));
		render(<CardCustomizerPage />);
		await screen.findByText("Kasia i Tomek");
		await waitFor(() => expect(resolvers.length).toBeGreaterThanOrEqual(1));
		const before = resolvers.length;

		// Zmiana motywu => drugie generowanie
		fireEvent.click(screen.getAllByRole("button", { name: /paletteAria/ })[0]);
		await waitFor(() => expect(resolvers.length).toBeGreaterThan(before));

		// Nowszy kończy się pierwszy, starszy później
		resolvers[resolvers.length - 1]("data:NEW");
		await waitFor(() =>
			expect(screen.getByRole("img")).toHaveAttribute("src", "data:NEW"),
		);
		resolvers[0]("data:OLD");
		await Promise.resolve();
		expect(screen.getByRole("img")).toHaveAttribute("src", "data:NEW");
	});
});
