import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as adminLogout } from "@/app/api/admin/auth/logout/route";
import { POST as adminLogin } from "@/app/api/admin/auth/route";
import { GET as getLive } from "@/app/api/gallery/[slug]/live/route";
import { GET as getMedia } from "@/app/api/gallery/[slug]/media/route";
import { GET as getGallery } from "@/app/api/gallery/[slug]/route";
import { POST as ownerLogin } from "@/app/api/owner/[slug]/auth/route";
import { DELETE as ownerLogout } from "@/app/api/owner/[slug]/session/route";
import {
	generateAdminToken,
	generateGuestToken,
	generateOwnerToken,
	verifyAdminToken,
	verifyOwnerToken,
} from "@/lib/auth";
import { _clearRateLimitsForTests } from "@/lib/rate-limit";

vi.mock("@node-rs/bcrypt", () => ({
	compare: vi.fn((pwd: string) => Promise.resolve(pwd === "poprawne")),
	hash: vi.fn(() => Promise.resolve("hashed")),
}));

let mockAdmins: Record<string, unknown>[] = [];
let mockGalleries: Record<string, unknown>[] = [];

import { admins, galleries } from "@wedding-drop/db";

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: vi.fn((table) => {
					const data =
						table === admins
							? mockAdmins
							: table === galleries
								? mockGalleries
								: [];
					const result = {
						limit: vi.fn(() => Promise.resolve(data)),
						orderBy: vi.fn().mockResolvedValue(data),
						// biome-ignore lint/suspicious/noThenProperty: Drizzle thenable mock
						then: (resolve: (v: unknown) => unknown) => resolve(data),
					};
					return {
						where: vi.fn(() => result),
						leftJoin: vi.fn(() => ({
							where: vi.fn(() => ({
								limit: vi.fn(() =>
									Promise.resolve(
										data.map((g) => ({ gallery: g, gdrive: null })),
									),
								),
							})),
						})),
					};
				}),
			})),
		},
	};
});

vi.mock("@/lib/owner-panel-payload", () => ({
	buildOwnerPanelPayload: vi.fn().mockResolvedValue({ success: true }),
}));

const slug = "kasia-i-tomek";
const ctx = { params: Promise.resolve({ slug }) };

const jsonReq = (
	url: string,
	body: unknown,
	headers: Record<string, string> = {},
) =>
	new NextRequest(url, {
		method: "POST",
		body: JSON.stringify(body),
		headers: { "x-forwarded-for": "198.51.100.1", ...headers },
	});

beforeEach(() => {
	vi.clearAllMocks();
	_clearRateLimitsForTests();
	mockAdmins = [{ username: "admin", passwordHash: "$2b$10$x" }];
	mockGalleries = [
		{
			id: "gal-1",
			slug,
			coupleNames: "Kasia & Tomek",
			ownerPasswordHash: "$2b$10$y",
			isActive: true,
			allowGuestViewing: true,
			guestPassword: null,
		},
	];
});

describe("Logowanie administratora", () => {
	it("zwraca identyczny błąd dla nieistniejącego użytkownika i błędnego hasła", async () => {
		const url = "http://localhost/api/admin/auth";
		mockAdmins = [];
		const unknown = await adminLogin(
			jsonReq(url, { username: "nikt", password: "zle" }),
		);
		mockAdmins = [{ username: "admin", passwordHash: "$2b$10$x" }];
		const wrongPwd = await adminLogin(
			jsonReq(url, { username: "admin", password: "zle" }),
		);
		expect(unknown.status).toBe(401);
		expect(wrongPwd.status).toBe(401);
		expect(await unknown.json()).toEqual(await wrongPwd.json());
	});

	it("nie loguje nieistniejącego użytkownika nawet przy 'poprawnym' haśle", async () => {
		mockAdmins = [];
		const res = await adminLogin(
			jsonReq("http://localhost/api/admin/auth", {
				username: "nikt",
				password: "poprawne",
			}),
		);
		expect(res.status).toBe(401);
	});

	it("po 10 błędnych próbach zwraca 429 także dla poprawnego hasła", async () => {
		const call = (password: string) =>
			adminLogin(
				jsonReq("http://localhost/api/admin/auth", {
					username: "admin",
					password,
				}),
			);
		for (let i = 0; i < 10; i++) expect((await call("zle")).status).toBe(401);
		const res = await call("poprawne");
		expect(res.status).toBe(429);
		expect(res.headers.get("Retry-After")).toBeTruthy();
	});

	it("poprawne logowanie zwraca token i zeruje licznik", async () => {
		const call = (password: string) =>
			adminLogin(
				jsonReq("http://localhost/api/admin/auth", {
					username: "admin",
					password,
				}),
			);
		for (let i = 0; i < 5; i++) await call("zle");
		const ok = await call("poprawne");
		expect(ok.status).toBe(200);
		expect(verifyAdminToken((await ok.json()).adminToken)).toBe(true);
		for (let i = 0; i < 10; i++) expect((await call("zle")).status).toBe(401);
	});
});

describe("Wylogowanie", () => {
	it("administrator: token po wylogowaniu jest odrzucany", async () => {
		const token = generateAdminToken("admin");
		const res = await adminLogout(
			new NextRequest("http://localhost/api/admin/auth/logout", {
				method: "POST",
				headers: { "x-admin-token": token },
			}),
		);
		expect(res.status).toBe(200);
		expect(verifyAdminToken(token)).toBe(false);
	});

	it("administrator: wylogowanie bez poprawnego tokenu to 401", async () => {
		const res = await adminLogout(
			new NextRequest("http://localhost/api/admin/auth/logout", {
				method: "POST",
			}),
		);
		expect(res.status).toBe(401);
	});

	it("właściciel: token z nagłówka i z ciasteczka są unieważniane", async () => {
		const headerToken = generateOwnerToken(slug);
		const cookieToken = generateOwnerToken(slug);
		const res = await ownerLogout(
			new NextRequest(`http://localhost/api/owner/${slug}/session`, {
				method: "DELETE",
				headers: {
					"x-owner-token": headerToken,
					cookie: `wd_owner_${slug}=${cookieToken}`,
				},
			}),
			ctx,
		);
		expect(res.status).toBe(200);
		expect(verifyOwnerToken(headerToken, slug)).toBe(false);
		expect(verifyOwnerToken(cookieToken, slug)).toBe(false);
	});
});

describe("Logowanie właściciela", () => {
	it("429 po 10 błędnych hasłach, niezależnie per galeria", async () => {
		const call = (password: string, s = slug) =>
			ownerLogin(
				jsonReq(`http://localhost/api/owner/${s}/auth`, { password }),
				{ params: Promise.resolve({ slug: s }) },
			);
		for (let i = 0; i < 10; i++) expect((await call("zle")).status).toBe(401);
		expect((await call("poprawne")).status).toBe(429);
		// inna galeria z tego samego IP nie jest zablokowana
		expect((await call("poprawne", "inna")).status).toBe(200);
	});
});

describe("Galeria chroniona hasłem gościa", () => {
	beforeEach(() => {
		mockGalleries[0].guestPassword = "$2b$10$hash";
	});
	const cookie = () => ({
		cookie: `wd_guest_${slug}=${generateGuestToken(slug)}`,
	});

	it("GET /media bez sesji → 401, z sesją → 200", async () => {
		const url = `http://localhost/api/gallery/${slug}/media`;
		expect((await getMedia(new NextRequest(url), ctx)).status).toBe(401);
		expect(
			(await getMedia(new NextRequest(url, { headers: cookie() }), ctx)).status,
		).toBe(200);
	});

	it("GET /live bez sesji → 401", async () => {
		const res = await getLive(
			new NextRequest(`http://localhost/api/gallery/${slug}/live`),
			ctx,
		);
		expect(res.status).toBe(401);
	});

	it("GET /media z tokenem właściciela przechodzi", async () => {
		const res = await getMedia(
			new NextRequest(`http://localhost/api/gallery/${slug}/media`, {
				headers: { "x-owner-token": generateOwnerToken(slug) },
			}),
			ctx,
		);
		expect(res.status).toBe(200);
	});

	it("GET metadanych bez sesji zwraca tylko minimalne pola", async () => {
		const res = await getGallery(
			new NextRequest(`http://localhost/api/gallery/${slug}`),
			ctx,
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.hasPassword).toBe(true);
		expect(data).not.toHaveProperty("id");
		expect(data).not.toHaveProperty("cardSettings");
		expect(data.coupleNames).toBe("Kasia & Tomek");
	});

	it("GET metadanych z sesją zwraca pełne dane", async () => {
		const res = await getGallery(
			new NextRequest(`http://localhost/api/gallery/${slug}`, {
				headers: cookie(),
			}),
			ctx,
		);
		const data = await res.json();
		expect(data.id).toBe("gal-1");
		expect(data.hasPassword).toBe(true);
	});

	it("galeria bez hasła nadal publiczna", async () => {
		mockGalleries[0].guestPassword = null;
		const res = await getMedia(
			new NextRequest(`http://localhost/api/gallery/${slug}/media`),
			ctx,
		);
		expect(res.status).toBe(200);
	});
});
