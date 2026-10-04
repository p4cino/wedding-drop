import { describe, expect, it } from "vitest";
import { hashSecret, isBcryptHash, verifySecret } from "@/lib/credential";

describe("credential", () => {
	it("hashSecret zwraca hash bcrypt, a verifySecret go weryfikuje", async () => {
		const h = await hashSecret("tajne123");
		expect(isBcryptHash(h)).toBe(true);
		expect(h).not.toContain("tajne123");
		expect(await verifySecret(h, "tajne123")).toEqual({
			valid: true,
			needsUpgrade: false,
		});
		expect((await verifySecret(h, "zle")).valid).toBe(false);
	});

	it("stara wartość plaintext: poprawna → needsUpgrade, błędna → nie", async () => {
		expect(await verifySecret("4321", "4321")).toEqual({
			valid: true,
			needsUpgrade: true,
		});
		expect(await verifySecret("4321", "0000")).toEqual({
			valid: false,
			needsUpgrade: false,
		});
	});

	it("nie myli plaintextu przypominającego hash z hashem bcrypt", async () => {
		expect(isBcryptHash("haslo")).toBe(false);
		expect(isBcryptHash("$2b$10$abc")).toBe(true);
	});
});
