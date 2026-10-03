// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnerDashboardPage from "@/app/[locale]/owner/[slug]/page";

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "kasia" }) }));
vi.mock("@/i18n/routing", () => ({
	Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}));
vi.mock("tus-js-client", () => ({ Upload: class {} }));

class FakeEventSource {
	onopen: (() => void) | null = null;
	onmessage: ((e: { data: string }) => void) | null = null;
	onerror: (() => void) | null = null;
	close() {}
}

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status });

const panel = {
	success: true,
	gallery: {
		id: "g1",
		slug: "kasia",
		coupleNames: "Kasia i Tomek",
		hasGDrive: false,
	},
	stats: { totalFiles: 0, totalBytes: 0 },
	isGDriveConfigured: true,
	ownerToken: "owner_tok",
};

const media = {
	id: "m1",
	uploaderName: "Gość",
	fileType: "image",
	originalFileName: "foto.jpg",
	fileSize: 1024,
	thumbUrl: "#",
	rawUrl: "#",
	status: "ready",
	createdAt: "2026-09-12T12:00:00.000Z",
};

let statusPatchOk = true;

function installFetch({
	sessionStatus = 200,
}: {
	sessionStatus?: number;
} = {}) {
	const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
		if (url === "/api/owner/kasia/auth")
			return json({ ...panel, ownerToken: "owner_tok" });
		if (url === "/api/owner/kasia/session")
			return sessionStatus === 200
				? json(panel)
				: json({ error: "Brak autoryzacji" }, sessionStatus);
		if (url.startsWith("/api/gallery/kasia/media"))
			return json({ media: [media] });
		if (url.startsWith("/api/gallery/kasia/wishes"))
			return json({ wishes: [] });
		if (url.includes("/media/m1/status") && init?.method === "PATCH")
			return statusPatchOk
				? json({ success: true })
				: json({ error: "x" }, 500);
		throw new Error(`nieoczekiwane ${url}`);
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("OwnerDashboardPage — sesja i błędy", () => {
	beforeEach(() => {
		sessionStorage.clear();
		statusPatchOk = true;
		vi.stubGlobal("EventSource", FakeEventSource);
		vi.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => vi.unstubAllGlobals());

	it("po zalogowaniu w sessionStorage nie ma tokenu ani hasła", async () => {
		installFetch({ sessionStatus: 401 });
		render(<OwnerDashboardPage />);
		const loginBtn = await screen.findByRole("button", { name: "loginBtn" });
		fireEvent.change(screen.getByLabelText("pwdLabel"), {
			target: { value: "supersecret" },
		});
		fireEvent.click(loginBtn);

		await screen.findByText("Kasia i Tomek");
		expect(sessionStorage.getItem("owner_token_kasia")).toBeNull();
		expect(sessionStorage.getItem("owner_pwd_kasia")).toBeNull();
	});

	it("odtwarza sesję z ciasteczka bez pytania o hasło i sprząta stary klucz z hasłem", async () => {
		sessionStorage.setItem("owner_token_kasia", "owner_saved");
		sessionStorage.setItem("owner_pwd_kasia", "stare-haslo");
		const fetchMock = installFetch();
		render(<OwnerDashboardPage />);

		await screen.findByText("Kasia i Tomek");
		expect(
			fetchMock.mock.calls.some((c) => c[0] === "/api/owner/kasia/session"),
		).toBe(true);
		expect(
			fetchMock.mock.calls.some((c) => c[0] === "/api/owner/kasia/auth"),
		).toBe(false);
		expect(sessionStorage.getItem("owner_pwd_kasia")).toBeNull();
		expect(sessionStorage.getItem("owner_token_kasia")).toBeNull();
	});

	it("gdy sesja jest nieważna (401), pokazuje formularz logowania", async () => {
		sessionStorage.setItem("owner_token_kasia", "owner_expired");
		installFetch({ sessionStatus: 401 });
		render(<OwnerDashboardPage />);

		await waitFor(() =>
			expect(sessionStorage.getItem("owner_token_kasia")).toBeNull(),
		);
		expect(screen.getByLabelText("pwdLabel")).toBeInTheDocument();
	});

	it("nieudana zmiana statusu zdjęcia pokazuje komunikat błędu i nie zmienia listy", async () => {
		installFetch();
		statusPatchOk = false;
		render(<OwnerDashboardPage />);
		await screen.findByText("Kasia i Tomek");

		fireEvent.click(await screen.findByRole("button", { name: "hideAria" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("actionError");
	});
});
