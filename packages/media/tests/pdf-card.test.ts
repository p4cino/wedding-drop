import { describe, expect, it } from "vitest";
import { generateWeddingCardPdf, sanitizeForPdf } from "../src/pdf-card.js";

describe("pdf-card service", () => {
	describe("sanitizeForPdf", () => {
		it("powinien prawidłowo zamieniać polskie znaki diakrytyczne na odpowiedniki ASCII", () => {
			const input = "Zażółć gęślą jaźń ZAŻÓŁĆ GĘŚLĄ JAŹŃ";
			const expected = "Zazolc gesla jazn ZAZOLC GESLA JAZN";
			expect(sanitizeForPdf(input)).toBe(expected);
		});

		it("powinien zwracać pusty ciąg dla pustych lub null wartości", () => {
			expect(sanitizeForPdf("")).toBe("");
			expect(sanitizeForPdf(null as unknown as string)).toBe("");
			expect(sanitizeForPdf(undefined as unknown as string)).toBe("");
		});

		it("nie powinien modyfikować tekstu zawierającego wyłącznie standardowe znaki", () => {
			const clean = "Kasia and Tomek 2026";
			expect(sanitizeForPdf(clean)).toBe(clean);
		});
	});

	describe("generateWeddingCardPdf", () => {
		it("powinien wygenerować poprawny plik PDF A6 ze wszystkimi polami", async () => {
			const pdfBytes = await generateWeddingCardPdf({
				coupleNames: "Katarzyna & Tomasz",
				weddingDate: "12.09.2026",
				targetUrl: "https://example.com/g/kasia-i-tomek",
				headline: "Podziel się wspomnieniami!",
				instructions: "1. Krok pierwszy\n\n2. Krok drugi", // Pusta linia w instrukcji
				primaryColorHex: "#1E293B",
				accentColorHex: "#D4AF37",
			});

			expect(pdfBytes).toBeInstanceOf(Uint8Array);
			expect(pdfBytes.length).toBeGreaterThan(1000);

			const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
			expect(header).toBe("%PDF-");
		});

		it("powinien poprawnie obsłużyć domyślne i brakujące wartości oraz 3-znakowe kolory hex", async () => {
			const pdfBytes = await generateWeddingCardPdf({
				coupleNames:
					"Bardzo Długa Nazwa Pary Młodej Z Wieloma Znakami Diakrytycznymi Łukasz i Małgorzata",
				weddingDate: "01.01.2027",
				targetUrl: "https://example.com/g/lukasz-i-malgorzata",
				primaryColorHex: "#123",
				accentColorHex: "#abc",
			});

			expect(pdfBytes).toBeInstanceOf(Uint8Array);
			expect(pdfBytes.length).toBeGreaterThan(1000);
			const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
			expect(header).toBe("%PDF-");
		});

		it("powinien poprawnie obsłużyć adres URL z localhost lub nieprawidłowy URL w stopce", async () => {
			const pdfBytesLocalhost = await generateWeddingCardPdf({
				coupleNames: "Magda i Piotr",
				weddingDate: "15.08.2026",
				targetUrl: "http://localhost:3000/g/magda-i-piotr",
			});
			expect(pdfBytesLocalhost).toBeInstanceOf(Uint8Array);

			const pdfBytesInvalidUrl = await generateWeddingCardPdf({
				coupleNames: "Magda i Piotr",
				weddingDate: "15.08.2026",
				targetUrl: "niepoprawny-adres-url",
			});
			expect(pdfBytesInvalidUrl).toBeInstanceOf(Uint8Array);
		});
	});
});
