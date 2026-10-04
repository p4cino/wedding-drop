import crypto from "node:crypto";

const PREFIX = "scrypt";
const KEY_LEN = 32;

/**
 * Haszuje hasło gościa przez scrypt z losową solą (format: scrypt$salt$hash).
 */
export function hashGuestPassword(password: string): string {
	const salt = crypto.randomBytes(16);
	const hash = crypto.scryptSync(password, salt, KEY_LEN);
	return `${PREFIX}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Porównuje hasło z zapisem w DB. Wpisy sprzed wprowadzenia haszowania
 * (zwykły tekst) są nadal obsługiwane – wtedy `needsRehash` = true.
 */
export function verifyGuestPassword(
	password: string,
	stored: string,
): { valid: boolean; needsRehash: boolean } {
	const parts = stored.split("$");
	if (parts.length === 3 && parts[0] === PREFIX) {
		const expected = Buffer.from(parts[2], "hex");
		const actual = crypto.scryptSync(
			password,
			Buffer.from(parts[1], "hex"),
			expected.length,
		);
		return {
			valid: crypto.timingSafeEqual(actual, expected),
			needsRehash: false,
		};
	}

	// Legacy: hasło zapisane jawnie – porównanie w stałym czasie na wynikach scrypt
	// (losowa sól wyrównuje długości; wpis i tak zostanie przehaszowany po logowaniu)
	const salt = crypto.randomBytes(16);
	const a = crypto.scryptSync(password, salt, KEY_LEN);
	const b = crypto.scryptSync(stored, salt, KEY_LEN);
	const valid = crypto.timingSafeEqual(a, b);
	return { valid, needsRehash: valid };
}
