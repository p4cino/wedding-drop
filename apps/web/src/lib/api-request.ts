export interface ApiResult<T = unknown> {
	ok: boolean;
	/** Kod HTTP; `0` przy błędzie sieci. */
	status: number;
	data: T | null;
}

/**
 * Wspólna, nierzucająca wyjątków warstwa `fetch` dla chronionych paneli (właściciel, admin):
 * dokłada token w wskazanym nagłówku, serializuje body do JSON i zwraca wynik zamiast
 * wyjątku — błąd sieci to `{ ok: false, status: 0 }`.
 */
export async function authedRequest<T = unknown>(
	tokenHeader: string,
	token: string,
	method: string,
	url: string,
	body?: unknown,
): Promise<ApiResult<T>> {
	const headers: Record<string, string> = {};
	if (token) headers[tokenHeader] = token;
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
		console.error("Błąd żądania:", err);
		return { ok: false, status: 0, data: null };
	}
}
