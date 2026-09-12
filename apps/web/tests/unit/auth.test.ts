import { describe, expect, it } from "vitest";
import {
	generateAdminToken,
	generateOwnerToken,
	verifyAdminToken,
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

	it("powinien odrzucić token właściciela dla innego sluga", () => {
		const token = generateOwnerToken("kasia-i-tomek");
		expect(verifyOwnerToken(token, "inna-galeria")).toBe(false);
	});

	it("powinien odrzucić sfałszowany token właściciela", () => {
		const slug = "kasia-i-tomek";
		const token = generateOwnerToken(slug);
		const parts = token.split("_");
		parts[3] =
			"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		expect(verifyOwnerToken(parts.join("_"), slug)).toBe(false);
	});
});
