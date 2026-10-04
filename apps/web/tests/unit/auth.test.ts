import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import {
	clearOwnerSessionCookie,
	generateAdminToken,
	generateGuestToken,
	generateOwnerToken,
	guestSessionCookieName,
	ownerSessionCookieName,
	readGuestToken,
	readOwnerToken,
	setGuestSessionCookie,
	setOwnerSessionCookie,
	verifyAdminToken,
	verifyGuestToken,
	verifyOwnerCredentialsForTus,
	verifyOwnerToken,
} from "@/lib/auth";

describe("Auth HMAC Tokens", () => {
	it("powinien poprawnie wygenerować i zweryfikować token administratora", () => {
		const token = generateAdminToken("admin");
		expect(token.startsWith("admin_")).toBe(true);
		expect(verifyAdminToken(token)).toBe(true);
	});

	it("powinien odrzucić sfałszowany token administratora", () => {
		const token = generateAdminToken("admin");
		const tampered = `${token}bad`;
		expect(verifyAdminToken(tampered)).toBe(false);
	});

	it("powinien poprawnie wygenerować i zweryfikować token właściciela galerii", () => {
		const slug = "kasia-i-tomek";
		const token = generateOwnerToken(slug);
		expect(token.startsWith("owner_")).toBe(true);
		expect(verifyOwnerToken(token, slug)).toBe(true);
	});

	it("powinien odrzucić token właściciela dla innej galerii", () => {
		const token = generateOwnerToken("kasia-i-tomek");
		expect(verifyOwnerToken(token, "inna-para")).toBe(false);
	});

	it("powinien odrzucić sfałszowany token właściciela", () => {
		const slug = "kasia-i-tomek";
		const token = generateOwnerToken(slug);
		const parts = token.split("_");
		parts[3] =
			"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		expect(verifyOwnerToken(parts.join("_"), slug)).toBe(false);
	});

	it("powinien uniemożliwić eskalację uprawnień przez zamianę prefiksu owner_ na admin_ (Token Prefix Swap)", () => {
		const username = "admin";
		const ownerTokenForAdminSlug = generateOwnerToken(username);
		// Próba zamiany prefiksu owner_ na admin_
		const forgedAdminToken = ownerTokenForAdminSlug.replace(
			/^owner_/,
			"admin_",
		);
		expect(verifyAdminToken(forgedAdminToken)).toBe(false);
	});

	it("powinien uniemożliwić użycie tokenu admin_ jako tokenu właściciela", () => {
		const adminToken = generateAdminToken("kasia-i-tomek");
		const forgedOwnerToken = adminToken.replace(/^admin_/, "owner_");
		expect(verifyOwnerToken(forgedOwnerToken, "kasia-i-tomek")).toBe(false);
	});

	it("powinien poprawnie wygenerować i zweryfikować token gościa", () => {
		const slug = "kasia-i-tomek";
		const token = generateGuestToken(slug);
		expect(token.startsWith("guest_")).toBe(true);
		expect(verifyGuestToken(token, slug)).toBe(true);
	});

	it("powinien odrzucić token gościa dla innej galerii", () => {
		const token = generateGuestToken("kasia-i-tomek");
		expect(verifyGuestToken(token, "inna-para")).toBe(false);
	});

	it("powinien odrzucić sfałszowany token gościa", () => {
		const slug = "kasia-i-tomek";
		const token = generateGuestToken(slug);
		const parts = token.split("_");
		parts[3] =
			"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		expect(verifyGuestToken(parts.join("_"), slug)).toBe(false);
	});
});

describe("verifyOwnerCredentialsForTus (adapter wstrzykiwany do packages/media)", () => {
	it("powinien zaakceptować poprawny token właściciela dla danego sluga galerii", () => {
		const slug = "kasia-i-tomek";
		const token = generateOwnerToken(slug);
		expect(verifyOwnerCredentialsForTus(slug, token)).toBe(true);
	});

	it("powinien odrzucić brak tokenu", () => {
		expect(verifyOwnerCredentialsForTus("kasia-i-tomek", undefined)).toBe(
			false,
		);
	});

	it("powinien odrzucić token wygenerowany dla innej galerii", () => {
		const token = generateOwnerToken("kasia-i-tomek");
		expect(verifyOwnerCredentialsForTus("inna-galeria", token)).toBe(false);
	});

	it("powinien odrzucić sfałszowany token", () => {
		const token = generateOwnerToken("kasia-i-tomek");
		expect(verifyOwnerCredentialsForTus("kasia-i-tomek", `${token}bad`)).toBe(
			false,
		);
	});
});

describe("Owner Session Cookie Helpers", () => {
	it("generuje poprawną nazwę ciasteczka dla galerii", () => {
		expect(ownerSessionCookieName("kasia-i-tomek")).toBe(
			"wd_owner_kasia-i-tomek",
		);
	});

	it("ustawia ciasteczko sesji z poprawnymi atrybutami (development)", () => {
		const origEnv = process.env.NODE_ENV;
		try {
			(process.env as Record<string, string | undefined>).NODE_ENV =
				"development";
			const res = NextResponse.json({ ok: true });
			setOwnerSessionCookie(res, "kasia-i-tomek", "test-token");
			const cookie = res.cookies.get("wd_owner_kasia-i-tomek");
			expect(cookie).toBeDefined();
			expect(cookie?.value).toBe("test-token");
			expect(cookie?.httpOnly).toBe(true);
			expect(cookie?.sameSite).toBe("strict");
			expect(cookie?.path).toBe("/api");
			expect(cookie?.maxAge).toBe(7 * 24 * 60 * 60);
			expect(cookie?.secure).toBe(false);
		} finally {
			(process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
		}
	});

	it("ustawia atrybut secure w produkcji", () => {
		const origEnv = process.env.NODE_ENV;
		try {
			(process.env as Record<string, string | undefined>).NODE_ENV =
				"production";
			const res = NextResponse.json({ ok: true });
			setOwnerSessionCookie(res, "kasia-i-tomek", "test-token");
			const cookie = res.cookies.get("wd_owner_kasia-i-tomek");
			expect(cookie?.secure).toBe(true);
		} finally {
			(process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
		}
	});

	it("czyści ciasteczko sesji ustawiając maxAge na 0", () => {
		const res = NextResponse.json({ ok: true });
		clearOwnerSessionCookie(res, "kasia-i-tomek");
		const cookie = res.cookies.get("wd_owner_kasia-i-tomek");
		expect(cookie).toBeDefined();
		expect(cookie?.value).toBe("");
		expect(cookie?.maxAge).toBe(0);
		expect(cookie?.path).toBe("/api");
		expect(cookie?.httpOnly).toBe(true);
		expect(cookie?.sameSite).toBe("strict");
	});
});

describe("Guest Session Cookie Helpers", () => {
	it("generuje poprawną nazwę ciasteczka dla gościa", () => {
		expect(guestSessionCookieName("kasia-i-tomek")).toBe(
			"wd_guest_kasia-i-tomek",
		);
	});

	it("ustawia ciasteczko sesji z poprawnymi atrybutami (development)", () => {
		const origEnv = process.env.NODE_ENV;
		try {
			(process.env as Record<string, string | undefined>).NODE_ENV =
				"development";
			const res = NextResponse.json({ ok: true });
			setGuestSessionCookie(res, "kasia-i-tomek", "test-token");
			const cookie = res.cookies.get("wd_guest_kasia-i-tomek");
			expect(cookie).toBeDefined();
			expect(cookie?.value).toBe("test-token");
			expect(cookie?.httpOnly).toBe(true);
			expect(cookie?.sameSite).toBe("strict");
			expect(cookie?.path).toBe("/");
			expect(cookie?.maxAge).toBe(7 * 24 * 60 * 60);
			expect(cookie?.secure).toBe(false);
		} finally {
			(process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
		}
	});

	it("ustawia atrybut secure w produkcji dla sesji gościa", () => {
		const origEnv = process.env.NODE_ENV;
		try {
			(process.env as Record<string, string | undefined>).NODE_ENV =
				"production";
			const res = NextResponse.json({ ok: true });
			setGuestSessionCookie(res, "kasia-i-tomek", "test-token");
			const cookie = res.cookies.get("wd_guest_kasia-i-tomek");
			expect(cookie?.secure).toBe(true);
		} finally {
			(process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
		}
	});
});

describe("readOwnerToken", () => {
	const slug = "kasia-i-tomek";
	const token = generateOwnerToken(slug);

	it("odczytuje token z nagłówka x-owner-token", () => {
		const req = new Request("http://localhost/api/owner/kasia-i-tomek/media", {
			method: "GET",
			headers: { "x-owner-token": token },
		});
		expect(readOwnerToken(req, slug)).toBe(token);
	});

	it("odczytuje token z nagłówka Authorization: Bearer", () => {
		const req = new Request("http://localhost/api/owner/kasia-i-tomek/media", {
			method: "GET",
			headers: { authorization: `Bearer ${token}` },
		});
		expect(readOwnerToken(req, slug)).toBe(token);
	});

	it("odczytuje token z ciasteczka sesji dla metod GET i HEAD", () => {
		const reqGet = new Request(
			"http://localhost/api/owner/kasia-i-tomek/media",
			{
				method: "GET",
				headers: { cookie: `wd_owner_kasia-i-tomek=${token}` },
			},
		);
		expect(readOwnerToken(reqGet, slug)).toBe(token);

		const reqHead = new Request(
			"http://localhost/api/owner/kasia-i-tomek/media",
			{
				method: "HEAD",
				headers: { cookie: `wd_owner_kasia-i-tomek=${token}` },
			},
		);
		expect(readOwnerToken(reqHead, slug)).toBe(token);
	});

	it("odrzuca ciasteczko innej galerii", () => {
		const otherToken = generateOwnerToken("inna-galeria");
		const req = new Request("http://localhost/api/owner/kasia-i-tomek/media", {
			method: "GET",
			headers: { cookie: `wd_owner_inna-galeria=${otherToken}` },
		});
		expect(readOwnerToken(req, slug)).toBeNull();
	});

	it("NIE autoryzuje mutacji (POST, PATCH, DELETE) wyłącznie przez ciasteczko (wymaga nagłówka)", () => {
		for (const method of ["DELETE", "PATCH", "POST", "PUT"]) {
			const req = new Request(
				"http://localhost/api/owner/kasia-i-tomek/media/1",
				{
					method,
					headers: { cookie: `wd_owner_kasia-i-tomek=${token}` },
				},
			);
			expect(readOwnerToken(req, slug)).toBeNull();
		}
	});

	it("całkowicie ignoruje token w query stringu (?token=)", () => {
		const req = new Request(
			`http://localhost/api/owner/kasia-i-tomek/media?token=${token}`,
			{
				method: "GET",
			},
		);
		expect(readOwnerToken(req, slug)).toBeNull();
	});
});
