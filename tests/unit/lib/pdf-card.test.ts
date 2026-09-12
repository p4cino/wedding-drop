import { describe, it, expect } from "vitest";
import { sanitizeForPdf, generateWeddingCardPdf } from "@/lib/pdf-card";

describe("pdf-card service", () => {
  describe("sanitizeForPdf", () => {
    it("powinien prawidłowo zamieniać polskie znaki diakrytyczne na odpowiedniki ASCII", () => {
      const input = "Zażółć gęślą jaźń ZAŻÓŁĆ GĘŚLĄ JAŹŃ";
      const expected = "Zazolc gesla jazn ZAZOLC GESLA JAZN";
      expect(sanitizeForPdf(input)).toBe(expected);
    });

    it("powinien zwracać pusty ciąg dla pustych lub null wartości", () => {
      expect(sanitizeForPdf("")).toBe("");
      expect(sanitizeForPdf(null as any)).toBe("");
      expect(sanitizeForPdf(undefined as any)).toBe("");
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
        instructions: "1. Krok pierwszy\n2. Krok drugi",
        primaryColorHex: "#1E293B",
        accentColorHex: "#D4AF37",
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      // Nagłówek każdego pliku PDF to %PDF- (bajty: 0x25, 0x50, 0x44, 0x46, 0x2D)
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
      expect(header).toBe("%PDF-");
    });

    it("powinien poprawnie obsłużyć domyślne i brakujące wartości", async () => {
      const pdfBytes = await generateWeddingCardPdf({
        coupleNames: "Bardzo Długa Nazwa Pary Młodej Z Wieloma Znakami Diakrytycznymi Łukasz i Małgorzata",
        weddingDate: "01.01.2027",
        targetUrl: "https://example.com/g/lukasz-i-malgorzata",
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
      expect(header).toBe("%PDF-");
    });
  });
});
