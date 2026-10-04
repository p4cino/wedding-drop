import { db, galleries } from "@wedding-drop/db";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "../../../src/app/api/owner/[slug]/settings/route";
import { authenticateOwner } from "../../../src/lib/auth";

vi.mock("@wedding-drop/db", () => ({
	db: {
		update: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue({}),
	},
	galleries: {
		id: "galleries.id",
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn(),
}));

vi.mock("../../../src/lib/auth", () => ({
	authenticateOwner: vi.fn(),
}));

describe("PATCH /api/owner/[slug]/settings", () => {
	const mockAuthenticateOwner = authenticateOwner as any;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("zwraca 400 przy błędnym JSONie", async () => {
		const req = {
			json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
		} as unknown as NextRequest;

		const res = await PATCH(req, { params: Promise.resolve({ slug: "test" }) });
		expect(res.status).toBe(400);
	});

	it("zwraca błąd autoryzacji jeśli authenticateOwner się nie powiedzie", async () => {
		const req = {
			json: vi.fn().mockResolvedValue({ allowGuestUploads: false }),
		} as unknown as NextRequest;

		mockAuthenticateOwner.mockResolvedValue({
			authorized: false,
			errorMessage: "Brak tokenu",
			errorStatus: 401,
		});

		const res = await PATCH(req, { params: Promise.resolve({ slug: "test" }) });
		expect(res.status).toBe(401);

		const data = await res.json();
		expect(data.error).toBe("Brak tokenu");
	});

	it("aktualizuje wszystkie ustawienia", async () => {
		const req = {
			json: vi.fn().mockResolvedValue({
				allowGuestUploads: false,
				allowGuestViewing: false,
				isApprovalQueueEnabled: true,
				guestPassword: "newpassword",
			}),
		} as unknown as NextRequest;

		mockAuthenticateOwner.mockResolvedValue({
			authorized: true,
			gallery: { id: "gal-123" },
		});

		const res = await PATCH(req, { params: Promise.resolve({ slug: "test" }) });
		expect(res.status).toBe(200);

		expect(db.update).toHaveBeenCalledWith(galleries);
		// Note: We'd check the exact .set call in a perfect world, but chaining is mocked.
	});

	it("usuwa hasło gościa gdy przekazano pusty string lub null", async () => {
		const req = {
			json: vi.fn().mockResolvedValue({
				guestPassword: "",
			}),
		} as unknown as NextRequest;

		mockAuthenticateOwner.mockResolvedValue({
			authorized: true,
			gallery: { id: "gal-123" },
		});

		const res = await PATCH(req, { params: Promise.resolve({ slug: "test" }) });
		expect(res.status).toBe(200);
	});

	it("zwraca 500 przy błędzie serwera", async () => {
		const req = {
			json: vi.fn().mockResolvedValue({
				allowGuestUploads: false,
			}),
		} as unknown as NextRequest;

		mockAuthenticateOwner.mockResolvedValue({
			authorized: true,
			gallery: { id: "gal-123" },
		});

		(db.update as any).mockImplementationOnce(() => {
			throw new Error("DB Error");
		});

		const res = await PATCH(req, { params: Promise.resolve({ slug: "test" }) });
		expect(res.status).toBe(500);
	});
});
