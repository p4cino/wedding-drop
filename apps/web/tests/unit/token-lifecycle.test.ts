import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	_resetRevokedTokensForTests,
	generateAdminToken,
	generateGuestToken,
	generateOwnerToken,
	hasGuestAccess,
	revokeToken,
	verifyAdminToken,
	verifyGuestCookieHeader,
	verifyOwnerToken,
} from "@/lib/auth";

describe("Token lifecycle", () => {
	beforeEach(() => {
		_resetRevokedTokensForTests();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("tokeny zawierają unikalny jti", () => {
		const a = generateAdminToken("admin");
		const b = generateAdminToken("admin");
		expect(a.split("_")).toHaveLength(5);
		expect(a.split("_")[2]).not.toBe(b.split("_")[2]);
	});

	it("odrzuca token w starym formacie (bez jti)", () => {
		expect(verifyAdminToken("admin_1700000000000_YWRtaW4=_deadbeef")).toBe(
			false,
		);
		expect(
			verifyOwnerToken("owner_1700000000000_c2x1Zw==_deadbeef", "slug"),
		).toBe(false);
	});

	it("token administratora wygasa po 8 godzinach", () => {
		vi.useFakeTimers();
		const token = generateAdminToken("admin");
		vi.advanceTimersByTime(8 * 60 * 60 * 1000 - 1000);
		expect(verifyAdminToken(token)).toBe(true);
		vi.advanceTimersByTime(2000);
		expect(verifyAdminToken(token)).toBe(false);
	});

	it("token właściciela jest ważny 7 dni", () => {
		vi.useFakeTimers();
		const token = generateOwnerToken("slug");
		vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 - 1000);
		expect(verifyOwnerToken(token, "slug")).toBe(true);
		vi.advanceTimersByTime(2000);
		expect(verifyOwnerToken(token, "slug")).toBe(false);
	});

	it("unieważniony token administratora jest odrzucany", () => {
		const token = generateAdminToken("admin");
		expect(revokeToken(token)).toBe(true);
		expect(verifyAdminToken(token)).toBe(false);
		// inny token nadal działa
		expect(verifyAdminToken(generateAdminToken("admin"))).toBe(true);
	});

	it("unieważniony token właściciela jest odrzucany", () => {
		const token = generateOwnerToken("slug");
		expect(revokeToken(token)).toBe(true);
		expect(verifyOwnerToken(token, "slug")).toBe(false);
	});

	it("revokeToken zwraca false dla niepoprawnego tokenu", () => {
		expect(revokeToken("owner_bad")).toBe(false);
		expect(revokeToken(null)).toBe(false);
		expect(revokeToken(`${generateAdminToken("a")}x`)).toBe(false);
	});

	it("zmiana jti unieważnia podpis", () => {
		const parts = generateAdminToken("admin").split("_");
		parts[2] = "0".repeat(32);
		expect(verifyAdminToken(parts.join("_"))).toBe(false);
	});
});

describe("hasGuestAccess / verifyGuestCookieHeader", () => {
	const slug = "kasia-i-tomek";

	it("galeria bez hasła jest dostępna", () => {
		expect(hasGuestAccess(new Request("http://x/"), slug, null)).toBe(true);
	});

	it("galeria z hasłem bez ciasteczka jest niedostępna", () => {
		expect(hasGuestAccess(new Request("http://x/"), slug, "hash")).toBe(false);
	});

	it("ciasteczko gościa daje dostęp, cudze nie", () => {
		const ok = new Request("http://x/", {
			headers: { cookie: `wd_guest_${slug}=${generateGuestToken(slug)}` },
		});
		expect(hasGuestAccess(ok, slug, "hash")).toBe(true);
		const other = new Request("http://x/", {
			headers: { cookie: `wd_guest_${slug}=${generateGuestToken("inna")}` },
		});
		expect(hasGuestAccess(other, slug, "hash")).toBe(false);
	});

	it("token właściciela lub admina daje dostęp", () => {
		const owner = new Request("http://x/", {
			headers: { "x-owner-token": generateOwnerToken(slug) },
		});
		expect(hasGuestAccess(owner, slug, "hash")).toBe(true);
		const admin = new Request("http://x/", {
			headers: { "x-admin-token": generateAdminToken("admin") },
		});
		expect(hasGuestAccess(admin, slug, "hash")).toBe(true);
	});

	it("verifyGuestCookieHeader obsługuje surowy nagłówek Cookie", () => {
		const header = `a=b; wd_guest_${slug}=${generateGuestToken(slug)}`;
		expect(verifyGuestCookieHeader(slug, header)).toBe(true);
		expect(verifyGuestCookieHeader(slug, undefined)).toBe(false);
		expect(verifyGuestCookieHeader(slug, "wd_guest_x=%E0%A4%A")).toBe(false);
	});
});
