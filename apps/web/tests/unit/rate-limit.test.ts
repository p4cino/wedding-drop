import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	_clearRateLimitsForTests,
	getClientIp,
	peekRateLimit,
	recordRateLimitHit,
	resetRateLimit,
	tooManyRequests,
} from "@/lib/rate-limit";

const opts = { max: 3, windowMs: 1000 };

describe("rate-limit", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		_clearRateLimitsForTests();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("blokuje po przekroczeniu limitu i zwraca retryAfter", () => {
		for (let i = 0; i < 3; i++) {
			expect(recordRateLimitHit("b", "k", opts).ok).toBe(true);
		}
		const peek = peekRateLimit("b", "k", opts);
		expect(peek.ok).toBe(false);
		expect(peek.retryAfter).toBe(1);
		expect(recordRateLimitHit("b", "k", opts).ok).toBe(false);
	});

	it("okno wygasa", () => {
		for (let i = 0; i < 4; i++) recordRateLimitHit("b", "k", opts);
		vi.advanceTimersByTime(1001);
		expect(peekRateLimit("b", "k", opts).ok).toBe(true);
		expect(recordRateLimitHit("b", "k", opts).ok).toBe(true);
	});

	it("klucze i kubełki są niezależne, reset czyści licznik", () => {
		for (let i = 0; i < 3; i++) recordRateLimitHit("b", "a", opts);
		expect(peekRateLimit("b", "a", opts).ok).toBe(false);
		expect(peekRateLimit("b", "other", opts).ok).toBe(true);
		expect(peekRateLimit("c", "a", opts).ok).toBe(true);
		resetRateLimit("b", "a");
		expect(peekRateLimit("b", "a", opts).ok).toBe(true);
	});

	it("ogranicza liczbę przechowywanych kluczy", () => {
		const big = { max: 5, windowMs: 60_000 };
		for (let i = 0; i < 10_050; i++) recordRateLimitHit("b", `k${i}`, big);
		// najstarszy klucz został wyparty (licznik wyzerowany), najnowszy nadal liczony
		const one = { max: 1, windowMs: 60_000 };
		expect(peekRateLimit("b", "k0", one).ok).toBe(true);
		expect(peekRateLimit("b", "k10049", one).ok).toBe(false);
	});

	it("getClientIp preferuje pierwszy wpis X-Forwarded-For", () => {
		const h = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
		expect(getClientIp(h, "9.9.9.9")).toBe("1.2.3.4");
		expect(getClientIp(new Headers(), "9.9.9.9")).toBe("9.9.9.9");
		expect(getClientIp(new Headers())).toBe("unknown");
	});

	it("tooManyRequests zwraca 429 z Retry-After", () => {
		const res = tooManyRequests(42);
		expect(res.status).toBe(429);
		expect(res.headers.get("Retry-After")).toBe("42");
	});
});
