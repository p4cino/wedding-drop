import crypto from "node:crypto";
import { promisify } from "node:util";
import { compare, hash } from "@node-rs/bcrypt";
import { verifyGuestPassword } from "./guest-password";

const BCRYPT_ROUNDS = 10;

export function isBcryptHash(value: string): boolean {
	return /^\$2[abxy]\$/.test(value);
}

/** Hashuje hasło gościa lub PIN galerii (bcrypt). */
export function hashSecret(plain: string): Promise<string> {
	return hash(plain, BCRYPT_ROUNDS);
}

const scryptAsync = promisify(crypto.scrypt) as (
	password: string,
	salt: Buffer,
	keylen: number,
) => Promise<Buffer>;

/**
 * Porównanie wartości legacy (plaintext) w stałym czasie: obie strony przechodzą przez scrypt
 * z tą samą losową solą (wyrównuje długości; wpis i tak zostanie przehaszowany po poprawnej weryfikacji).
 */
async function timingSafePlainEqual(a: string, b: string): Promise<boolean> {
	const salt = crypto.randomBytes(16);
	const [ha, hb] = await Promise.all([
		scryptAsync(a, salt, 32),
		scryptAsync(b, salt, 32),
	]);
	return crypto.timingSafeEqual(ha, hb);
}

/**
 * Weryfikuje hasło/PIN względem wartości z bazy.
 * Stare rekordy zapisane plaintextem są porównywane w stałym czasie, a wynik
 * `needsUpgrade: true` informuje wywołującego, że należy zapisać hash (lazy-upgrade).
 */
export async function verifySecret(
	stored: string,
	provided: string,
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
	if (isBcryptHash(stored)) {
		let valid = false;
		try {
			valid = await compare(provided, stored);
		} catch {
			valid = false;
		}
		return { valid, needsUpgrade: false };
	}
	// Hasła zapisane w formacie scrypt (wprowadzonym wcześniej w #62) pozostają ważne
	if (stored.startsWith("scrypt$")) {
		return {
			valid: verifyGuestPassword(provided, stored).valid,
			needsUpgrade: false,
		};
	}
	const valid = await timingSafePlainEqual(provided, stored);
	return { valid, needsUpgrade: valid };
}
