import crypto from "node:crypto";
import { compare, hash } from "@node-rs/bcrypt";

const BCRYPT_ROUNDS = 10;

export function isBcryptHash(value: string): boolean {
	return /^\$2[abxy]\$/.test(value);
}

/** Hashuje hasło gościa lub PIN galerii (bcrypt). */
export function hashSecret(plain: string): Promise<string> {
	return hash(plain, BCRYPT_ROUNDS);
}

function timingSafePlainEqual(a: string, b: string): boolean {
	const ha = crypto.createHash("sha256").update(a, "utf-8").digest();
	const hb = crypto.createHash("sha256").update(b, "utf-8").digest();
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
	const valid = timingSafePlainEqual(provided, stored);
	return { valid, needsUpgrade: valid };
}
