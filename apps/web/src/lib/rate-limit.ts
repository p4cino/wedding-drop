/**
 * Prosty limiter w pamięci procesu (stałe okno, bez zależności).
 * Store jest singletonem na `globalThis`, bo TUS (dist/server.js) i route handlery Next.js
 * to osobne moduły - bez tego miałyby osobne liczniki (jak w sse-bus).
 */

export interface RateLimitOptions {
	max: number;
	windowMs: number;
}

export interface RateLimitResult {
	ok: boolean;
	/** Sekundy do końca okna (tylko gdy `ok === false`). */
	retryAfter: number;
}

interface Entry {
	count: number;
	resetAt: number;
}

const MAX_KEYS = 10_000;

/** Limity prób (porażek) uwierzytelnienia: 10 na 15 minut. */
export const AUTH_FAILURE_LIMIT: RateLimitOptions = {
	max: 10,
	windowMs: 15 * 60 * 1000,
};

/** Limity żądań anonimowych modyfikujących dane: 30 na minutę. */
export const ANON_WRITE_LIMIT: RateLimitOptions = {
	max: 30,
	windowMs: 60 * 1000,
};

/**
 * Tworzenie uploadów TUS przez gości: luźniejszy limit (300/min na IP i galerię), bo wiele osób
 * na weselu dzieli jeden adres (NAT/Wi-Fi sali), a ochronę przed nadużyciem zapewnia `maxSize` 1 GiB
 * oraz limit pojemności galerii.
 */
export const TUS_CREATE_LIMIT: RateLimitOptions = {
	max: 300,
	windowMs: 60 * 1000,
};

type Store = Map<string, Entry>;

const globalKey = Symbol.for("wedding-drop.rate-limit-store");

function getStore(): Store {
	const g = globalThis as unknown as Record<symbol, Store | undefined>;
	let store = g[globalKey];
	if (!store) {
		store = new Map();
		g[globalKey] = store;
		const timer = setInterval(() => prune(store as Store, Date.now()), 60_000);
		timer.unref?.();
	}
	return store;
}

function prune(store: Store, now: number): void {
	for (const [key, entry] of store) {
		if (entry.resetAt <= now) store.delete(key);
	}
	// Twarda granica pamięci: wypieramy najstarsze wpisy (kolejność wstawiania)
	while (store.size > MAX_KEYS) {
		const oldest = store.keys().next().value;
		if (oldest === undefined) break;
		store.delete(oldest);
	}
}

function compose(bucket: string, key: string): string {
	return `${bucket}\u0000${key}`;
}

function toResult(
	entry: Entry | undefined,
	opts: RateLimitOptions,
	now: number,
): RateLimitResult {
	if (!entry || entry.resetAt <= now || entry.count < opts.max) {
		return { ok: true, retryAfter: 0 };
	}
	return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
}

/** Sprawdza limit bez zwiększania licznika (użyj przed kosztowną weryfikacją hasła). */
export function peekRateLimit(
	bucket: string,
	key: string,
	opts: RateLimitOptions,
): RateLimitResult {
	return toResult(getStore().get(compose(bucket, key)), opts, Date.now());
}

/** Zwiększa licznik (np. po nieudanej próbie) i zwraca stan limitu po zliczeniu. */
export function recordRateLimitHit(
	bucket: string,
	key: string,
	opts: RateLimitOptions,
): RateLimitResult {
	const store = getStore();
	const now = Date.now();
	const k = compose(bucket, key);
	let entry = store.get(k);
	if (!entry || entry.resetAt <= now) {
		if (store.size >= MAX_KEYS) prune(store, now);
		entry = { count: 0, resetAt: now + opts.windowMs };
		store.set(k, entry);
	}
	entry.count += 1;
	if (entry.count > opts.max) {
		return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
	}
	return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(bucket: string, key: string): void {
	getStore().delete(compose(bucket, key));
}

/** Tylko do testów. */
export function _clearRateLimitsForTests(): void {
	getStore().clear();
}

type HeaderGetter = { get(name: string): string | null | undefined };

/**
 * Adres klienta: pierwszy wpis `X-Forwarded-For` (ustawiany przez Caddy) lub adres gniazda.
 * Zakłada, że port aplikacji nie jest wystawiony poza reverse proxy.
 */
export function getClientIp(
	headers: HeaderGetter,
	socketAddr?: string,
): string {
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	return socketAddr || "unknown";
}

/** Odpowiedź 429 z `Retry-After`. */
export function tooManyRequests(retryAfter: number): Response {
	return Response.json(
		{ error: "Zbyt wiele prób. Spróbuj ponownie później." },
		{
			status: 429,
			headers: { "Retry-After": String(Math.max(1, retryAfter)) },
		},
	);
}
