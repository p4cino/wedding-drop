export interface OwnerApiResult<T = unknown> {
	ok: boolean;
	/** Kod HTTP; `0` przy błędzie sieci. */
	status: number;
	data: T | null;
}

/**
 * Jedyne miejsce dokładające token właściciela do żądań panelu (nagłówek
 * `x-owner-token`). Nie rzuca wyjątków — błąd sieci zwraca `{ ok: false, status: 0 }`,
 * żeby wywołujący mógł pokazać komunikat zamiast połykać błąd.
 */
export async function ownerRequest<T = unknown>(
	token: string,
	method: string,
	url: string,
	body?: unknown,
): Promise<OwnerApiResult<T>> {
	const headers: Record<string, string> = {};
	if (token) headers["x-owner-token"] = token;
	if (body !== undefined) headers["Content-Type"] = "application/json";
	try {
		const res = await fetch(url, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		let data: T | null = null;
		try {
			data = (await res.json()) as T;
		} catch {
			// Odpowiedź bez treści JSON
		}
		return { ok: res.ok, status: res.status, data };
	} catch (err) {
		console.error("Błąd żądania panelu właściciela:", err);
		return { ok: false, status: 0, data: null };
	}
}
