import { describe, expect, it } from "vitest";
import {
	adminLoginDto,
	createGalleryDto,
	insertCardSettingsSchema,
	insertGallerySchema,
	insertMediaItemSchema,
	ownerLoginDto,
	selectGallerySchema,
	tusUploadMetadataDto,
	updateCardSettingsDto,
} from "../src/validators";

describe("Validators - Drizzle Generated Schemas", () => {
	it("powinien poprawnie eksportować wygenerowane schematy Drizzle-Zod", () => {
		expect(insertGallerySchema).toBeDefined();
		expect(selectGallerySchema).toBeDefined();
		expect(insertCardSettingsSchema).toBeDefined();
		expect(insertMediaItemSchema).toBeDefined();
	});
});

describe("Validators - adminLoginDto", () => {
	it("akceptuje poprawne dane logowania administratora", () => {
		const result = adminLoginDto.safeParse({
			username: "admin",
			password: "secretpassword",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.username).toBe("admin");
			expect(result.data.password).toBe("secretpassword");
		}
	});

	it("odrzuca puste dane administratora", () => {
		const result = adminLoginDto.safeParse({
			username: "   ",
			password: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.length).toBeGreaterThanOrEqual(1);
		}
	});
});

describe("Validators - ownerLoginDto", () => {
	it("akceptuje niepuste hasło", () => {
		const result = ownerLoginDto.safeParse({ password: "myweddingpass" });
		expect(result.success).toBe(true);
	});

	it("odrzuca puste hasło", () => {
		const result = ownerLoginDto.safeParse({ password: "" });
		expect(result.success).toBe(false);
	});
});

describe("Validators - createGalleryDto", () => {
	const validPayload = {
		coupleNames: "Kasia & Tomek",
		weddingDate: "2026-08-15",
		ownerEmail: "kasia@example.com",
		ownerPassword: "securepassword123",
		customSlug: "kasia-tomek-2026",
		accessPin: "1234",
		maxStorageGb: 10,
	};

	it("akceptuje w pełni poprawny formularz nowej galerii", () => {
		const result = createGalleryDto.safeParse(validPayload);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.customSlug).toBe("kasia-tomek-2026");
			expect(result.data.maxStorageGb).toBe(10);
		}
	});

	it("akceptuje opcjonalny pusty slug i brak PIN-u", () => {
		const result = createGalleryDto.safeParse({
			...validPayload,
			customSlug: "",
			accessPin: null,
		});
		expect(result.success).toBe(true);
	});

	it("odrzuca nieprawidłowy format e-mail", () => {
		const result = createGalleryDto.safeParse({
			...validPayload,
			ownerEmail: "nie-email",
		});
		expect(result.success).toBe(false);
	});

	it("odrzuca niepoprawny format daty wesela", () => {
		const result = createGalleryDto.safeParse({
			...validPayload,
			weddingDate: "15-08-2026", // zły format, wymagany RRRR-MM-DD
		});
		expect(result.success).toBe(false);
	});

	it("odrzuca niedozwolone znaki w slugu (zgodnie z regułą z AGENTS.md)", () => {
		const result = createGalleryDto.safeParse({
			...validPayload,
			customSlug: "kasia&tomek/wesele",
		});
		expect(result.success).toBe(false);
	});

	it("odrzuca puste hasło właściciela", () => {
		const result = createGalleryDto.safeParse({
			...validPayload,
			ownerPassword: "",
		});
		expect(result.success).toBe(false);
	});

	it("odrzuca ujemną pojemność dyskową", () => {
		const result = createGalleryDto.safeParse({
			...validPayload,
			maxStorageGb: -5,
		});
		expect(result.success).toBe(false);
	});
});

describe("Validators - updateCardSettingsDto", () => {
	it("akceptuje prawidłowe kody HEX dla kolorów", () => {
		const result = updateCardSettingsDto.safeParse({
			headline: "Wspomnienia z wesela",
			primaryColor: "#1E293B",
			accentColor: "#D4AF37",
		});
		expect(result.success).toBe(true);
	});

	it("odrzuca niepoprawne formaty HEX", () => {
		const result = updateCardSettingsDto.safeParse({
			primaryColor: "blue",
		});
		expect(result.success).toBe(false);
	});
});

describe("Validators - tusUploadMetadataDto", () => {
	it("akceptuje poprawne metadane TUS i stosuje wartości domyślne", () => {
		const result = tusUploadMetadataDto.safeParse({
			gallerySlug: "ania-i-michal",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.gallerySlug).toBe("ania-i-michal");
			expect(result.data.uploaderName).toBe("Gość weselny");
			expect(result.data.originalName).toBe("plik");
			expect(result.data.fileType).toBe("image/jpeg");
		}
	});

	it("odrzuca metadane bez gallerySlug", () => {
		const result = tusUploadMetadataDto.safeParse({});
		expect(result.success).toBe(false);
	});

	it("odrzuca gallerySlug zawierający znaki specjalne lub spacje", () => {
		const result = tusUploadMetadataDto.safeParse({
			gallerySlug: "wesele ania michal",
		});
		expect(result.success).toBe(false);
	});
});
