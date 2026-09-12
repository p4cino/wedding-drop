import { describe, it, expect } from "vitest";
import { generateQrPngBuffer, generateQrSvg } from "@/lib/qr-generator";

describe("qr-generator service", () => {
  it("powinien wygenerować prawidłowy bufor PNG dla kodu QR", async () => {
    const url = "https://example.com/g/kasia-i-tomek";
    const buffer = await generateQrPngBuffer(url, {
      darkColor: "#1E293B",
      lightColor: "#FFFFFF",
      margin: 2,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    // Nagłówek PNG rozpoczyna się od bajtów 0x89 0x50 0x4E 0x47 (\x89PNG)
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it("powinien wygenerować poprawny wektor SVG dla kodu QR", async () => {
    const url = "https://example.com/g/kasia-i-tomek";
    const svg = await generateQrSvg(url, {
      darkColor: "#000000",
      margin: 1,
    });

    expect(typeof svg).toBe("string");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('viewBox="0 0');
  });

  it("powinien użyć domyślnych opcji, gdy nie zostaną przekazane", async () => {
    const url = "https://example.com/test";
    const buffer = await generateQrPngBuffer(url);
    expect(buffer).toBeInstanceOf(Buffer);

    const svg = await generateQrSvg(url);
    expect(svg).toContain("<svg");
  });
});
