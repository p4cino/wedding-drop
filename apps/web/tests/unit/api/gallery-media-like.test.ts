import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postLike } from "@/app/api/gallery/[slug]/media/[id]/like/route";
import { generateGuestToken } from "@/lib/auth";
import {
	_clearRateLimitsForTests,
	AUTH_FAILURE_LIMIT,
	peekRateLimit,
	recordRateLimitHit,
} from "@/lib/rate-limit";

const notifyMediaLikedMock = vi.fn();

vi.mock("@wedding-drop/media", () => ({
	sseBus: {
		notifyMediaLiked: (...args: unknown[]) => notifyMediaLikedMock(...args),
	},
}));

let mockGalleries: Array<Record<string, unknown>> = [];
let mockUpdatedRows: Array<{ id: string; likesCount: number }> = [];
let lastSetArg: Record<string, unknown> | null = null;
let dbShouldThrow = false;

vi.mock("@wedding-drop/db", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(() => {
							if (dbShouldThrow) return Promise.reject(new Error("DB error"));
							return Promise.resolve(mockGalleries);
						}),
					})),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn((arg: Record<string, unknown>) => {
					lastSetArg = arg;
					return {
						where: vi.fn(() => ({
							returning: vi.fn(() => {
								if (dbShouldThrow) return Promise.reject(new Error("DB error"));
								return Promise.resolve(mockUpdatedRows);
							}),
						})),
					};
				}),
			})),
		},
	};
});

describe("POST /api/gallery/[slug]/media/[id]/like", () => {
	const slug = "kasia-i-tomek";
	const mediaId = "media-1";

	beforeEach(() => {
		vi.clearAllMocks();
		_clearRateLimitsForTests();
		dbShouldThrow = false;
		lastSetArg = null;
		mockGalleries = [
			{
				id: "gal-1",
				slug,
				isActive: true,
				allowGuestViewing: true,
				guestPassword: null,
			},
		];
		mockUpdatedRows = [{ id: mediaId, likesCount: 5 }];
	});

	it("zwraca 404, gdy galeria nie istnieje", async () => {
		mockGalleries = [];
		const req = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			},
		);

		const res = await postLike(req, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(res.status).toBe(404);
		expect(notifyMediaLikedMock).not.toHaveBeenCalled();
	});

	it("zwraca 403, gdy galeria jest nieaktywna (isActive: false)", async () => {
		mockGalleries[0].isActive = false;
		const req = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			},
		);

		const res = await postLike(req, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(res.status).toBe(403);
		expect(notifyMediaLikedMock).not.toHaveBeenCalled();
	});

	it("zwraca 403, gdy podgląd galerii przez gości jest wyłączony (allowGuestViewing: false)", async () => {
		mockGalleries[0].allowGuestViewing = false;
		const req = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			},
		);

		const res = await postLike(req, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(res.status).toBe(403);
		expect(notifyMediaLikedMock).not.toHaveBeenCalled();
	});

	it("zwraca 401 w galerii chronionej hasłem gościa bez ważnego ciasteczka sesji i 200 z ciasteczkiem", async () => {
		mockGalleries[0].guestPassword = "secret-guest-password";

		const unauthReq = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			},
		);
		const unauthRes = await postLike(unauthReq, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(unauthRes.status).toBe(401);
		expect(notifyMediaLikedMock).not.toHaveBeenCalled();

		const guestCookie = generateGuestToken(slug, "secret-guest-password");
		const authReq = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				headers: { cookie: `wd_guest_${slug}=${guestCookie}` },
				body: JSON.stringify({ action: "like" }),
			},
		);
		const authRes = await postLike(authReq, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(authRes.status).toBe(200);
	});

	it("zwraca 400 przy nieprawidłowym ładunku JSON lub nieobsługiwanej akcji", async () => {
		const invalidReq = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "superlike" }),
			},
		);
		const res = await postLike(invalidReq, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(res.status).toBe(400);
		expect(notifyMediaLikedMock).not.toHaveBeenCalled();
	});

	it("zwraca 404 i nie emituje SSE, gdy materiał nie istnieje lub ma status hidden/pending/deleted", async () => {
		mockUpdatedRows = [];
		const req = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/hidden-item/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			},
		);

		const res = await postLike(req, {
			params: Promise.resolve({ slug, id: "hidden-item" }),
		});
		expect(res.status).toBe(404);
		expect(notifyMediaLikedMock).not.toHaveBeenCalled();
	});

	it("zwiększa licznik dla action=like, zmniejsza z GREATEST(0, ...) dla action=unlike i emituje SSE media-liked", async () => {
		mockUpdatedRows = [{ id: mediaId, likesCount: 1 }];
		const likeReq = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			},
		);
		const likeRes = await postLike(likeReq, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(likeRes.status).toBe(200);
		expect(await likeRes.json()).toEqual({ id: mediaId, likesCount: 1 });
		expect(lastSetArg?.likesCount).toBeDefined();
		expect(notifyMediaLikedMock).toHaveBeenCalledWith(slug, {
			mediaId,
			likesCount: 1,
		});

		mockUpdatedRows = [{ id: mediaId, likesCount: 0 }];
		const unlikeReq = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "unlike" }),
			},
		);
		const unlikeRes = await postLike(unlikeReq, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(unlikeRes.status).toBe(200);
		expect(await unlikeRes.json()).toEqual({ id: mediaId, likesCount: 0 });
		expect(notifyMediaLikedMock).toHaveBeenLastCalledWith(slug, {
			mediaId,
			likesCount: 0,
		});
	});

	it("ogranicza nadużycia (429 po 60 żądaniach/min) w publicStore bez naruszania blokad w authStore", async () => {
		for (let i = 0; i < AUTH_FAILURE_LIMIT.max; i++) {
			recordRateLimitHit("owner-login", `10.0.0.5:${slug}`, AUTH_FAILURE_LIMIT);
		}
		expect(
			peekRateLimit("owner-login", `10.0.0.5:${slug}`, AUTH_FAILURE_LIMIT).ok,
		).toBe(false);

		const makeLikeReq = () =>
			postLike(
				new NextRequest(
					`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
					{
						method: "POST",
						headers: { "x-forwarded-for": "10.0.0.5" },
						body: JSON.stringify({ action: "like" }),
					},
				),
				{ params: Promise.resolve({ slug, id: mediaId }) },
			);

		for (let i = 0; i < 60; i++) {
			expect((await makeLikeReq()).status).toBe(200);
		}
		const throttled = await makeLikeReq();
		expect(throttled.status).toBe(429);
		expect(throttled.headers.get("Retry-After")).toBeTruthy();

		// Blokada logowania w authStore pozostaje nienaruszona
		expect(
			peekRateLimit("owner-login", `10.0.0.5:${slug}`, AUTH_FAILURE_LIMIT).ok,
		).toBe(false);
	});

	it("zwraca 500 przy nieoczekiwanym błędzie bazy danych", async () => {
		dbShouldThrow = true;
		vi.spyOn(console, "error").mockImplementation(() => {});
		const req = new NextRequest(
			`http://localhost/api/gallery/${slug}/media/${mediaId}/like`,
			{
				method: "POST",
				body: JSON.stringify({ action: "like" }),
			},
		);
		const res = await postLike(req, {
			params: Promise.resolve({ slug, id: mediaId }),
		});
		expect(res.status).toBe(500);
	});
});
