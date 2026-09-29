// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "@/app/[locale]/admin/page";

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
	weddingDate: "2026-09-12",
	ownerEmail: "k@t.pl",
	isActive: true,
	totalFiles: 3,
	totalBytes: 3 * 1024 * 1024,
	createdAt: "2026-09-01",
};

interface Routes {
	list?: () => Response;
	create?: () => Response;
	remove?: () => Response;
}

function installFetch(routes: Routes = {}) {
	const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
		const method = init?.method ?? "GET";
		if (url === "/api/admin/auth")
			return json({ success: true, adminToken: "admin_tok" });
		if (url === "/api/admin/galleries" && method === "GET")
			return routes.list?.() ?? json({ galleries: [gallery] });
		if (url === "/api/admin/galleries" && method === "POST")
			return (
				routes.create?.() ??
				json({
					gallery: {
						...gallery,
						id: "g2",
						slug: "nowa",
						coupleNames: "Nowa Para",
					},
				})
			);
		if (url === "/api/admin/galleries/g1" && method === "DELETE")
			return routes.remove?.() ?? json({ success: true });
		throw new Error(`nieoczekiwane ${method} ${url}`);
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

async function login() {
	fireEvent.change(screen.getByLabelText("passwordLabel"), {
		target: { value: "haslo" },
	});
	fireEvent.click(screen.getByRole("button", { name: "loginBtn" }));
	await screen.findByText("navTitle");
}

describe("AdminDashboardPage", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
	});
	afterEach(() => vi.unstubAllGlobals());

	it("po zalogowaniu pokazuje statystyki i tabelę galerii z tokenem w nagłówku", async () => {
		const fetchMock = installFetch();
		render(<AdminDashboardPage />);
		await login();

		expect(await screen.findByText("Kasia i Tomek")).toBeInTheDocument();
		expect(screen.getAllByText("3.0 MB")).toHaveLength(2); // kafelek statystyk + wiersz tabeli
		const listCall = fetchMock.mock.calls.find(
			(c) => c[0] === "/api/admin/galleries",
		);
		expect(listCall?.[1]?.headers).toMatchObject({
			"x-admin-token": "admin_tok",
		});
	});

	it("wygasły token (401) wraca do logowania z komunikatem, a nie do pustej tabeli", async () => {
		installFetch({ list: () => json({ error: "Brak" }, 401) });
		render(<AdminDashboardPage />);
		await login();

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"sessionExpired",
		);
		expect(screen.getByLabelText("passwordLabel")).toBeInTheDocument();
		expect(screen.queryByText("navTitle")).not.toBeInTheDocument();
	});

	it("błąd pobrania listy (500) pokazuje komunikat i nie wylogowuje", async () => {
		installFetch({ list: () => json({}, 500) });
		render(<AdminDashboardPage />);
		await login();
		expect(await screen.findByRole("alert")).toHaveTextContent("loadError");
	});

	it("usuwa galerię po potwierdzeniu, a błąd usuwania pokazuje komunikat i zostawia wiersz", async () => {
		installFetch({ remove: () => json({}, 500) });
		render(<AdminDashboardPage />);
		await login();
		await screen.findByText("Kasia i Tomek");

		fireEvent.click(
			screen.getByRole("button", { name: /actionDelete \(kasia\)/ }),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent("deleteError");
		expect(screen.getByText("Kasia i Tomek")).toBeInTheDocument();

		installFetch();
		fireEvent.click(
			screen.getByRole("button", { name: /actionDelete \(kasia\)/ }),
		);
		await waitFor(() =>
			expect(screen.queryByText("Kasia i Tomek")).not.toBeInTheDocument(),
		);
	});

	it("nie usuwa, gdy użytkownik nie potwierdzi", async () => {
		const fetchMock = installFetch();
		vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
		render(<AdminDashboardPage />);
		await login();
		await screen.findByText("Kasia i Tomek");
		fireEvent.click(
			screen.getByRole("button", { name: /actionDelete \(kasia\)/ }),
		);
		expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(
			false,
		);
	});

	it("modal: nieudane utworzenie zostawia modal z danymi i błędem inline; sukces pokazuje linki", async () => {
		let fail = true;
		installFetch({
			create: () =>
				fail
					? json({ error: "Slug zajęty" }, 409)
					: json({
							gallery: {
								...gallery,
								id: "g2",
								slug: "nowa",
								coupleNames: "Nowa Para",
							},
						}),
		});
		render(<AdminDashboardPage />);
		await login();
		fireEvent.click(
			await screen.findByRole("button", { name: /newWeddingBtn/ }),
		);

		fireEvent.change(screen.getByLabelText("formCouple"), {
			target: { value: "Nowa Para" },
		});
		fireEvent.change(screen.getByLabelText("formEmail"), {
			target: { value: "n@p.pl" },
		});
		fireEvent.change(screen.getByLabelText("formPassword"), {
			target: { value: "sekret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: "formSubmit" }));

		expect(await screen.findByText("Slug zajęty")).toBeInTheDocument();
		expect(screen.getByLabelText("formCouple")).toHaveValue("Nowa Para");

		fail = false;
		fireEvent.click(screen.getByRole("button", { name: "formSubmit" }));
		expect(await screen.findByText("modalSuccess")).toBeInTheDocument();
		expect(
			screen
				.getAllByRole("link")
				.some((a) => a.getAttribute("href") === "/owner/nowa"),
		).toBe(true);

		fireEvent.click(screen.getByRole("button", { name: "modalCloseBtn" }));
		expect(screen.queryByText("modalSuccess")).not.toBeInTheDocument();
	});

	it("modal: błąd sieci i walidacja formularza pokazują komunikaty inline; Escape zamyka modal", async () => {
		installFetch({
			create: () => {
				throw new Error("offline");
			},
		});
		render(<AdminDashboardPage />);
		await login();
		fireEvent.click(
			await screen.findByRole("button", { name: /newWeddingBtn/ }),
		);

		// Walidacja: hasło zbyt krótkie
		fireEvent.change(screen.getByLabelText("formCouple"), {
			target: { value: "Para" },
		});
		fireEvent.change(screen.getByLabelText("formEmail"), {
			target: { value: "n@p.pl" },
		});
		fireEvent.change(screen.getByLabelText("formPassword"), {
			target: { value: "1" },
		});
		fireEvent.click(screen.getByRole("button", { name: "formSubmit" }));
		expect(await screen.findByRole("alert")).toBeInTheDocument();

		fireEvent.keyDown(window, { key: "Escape" });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
