import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { generateQrPngBuffer } from "./qr-generator";

export interface CardPdfParams {
	coupleNames: string;
	weddingDate: string;
	targetUrl: string;
	headline?: string | null;
	subheadline?: string | null;
	instructions?: string | null;
	primaryColorHex?: string | null;
	accentColorHex?: string | null;
}

function hexToRgb(hex: string) {
	let cleaned = hex.replace("#", "");
	if (cleaned.length === 3) {
		cleaned = cleaned
			.split("")
			.map((c) => c + c)
			.join("");
	}
	const num = parseInt(cleaned, 16);
	return {
		r: ((num >> 16) & 255) / 255,
		g: ((num >> 8) & 255) / 255,
		b: (num & 255) / 255,
	};
}

export function sanitizeForPdf(text: string): string {
	if (!text) return "";
	const map: Record<string, string> = {
		ą: "a",
		Ą: "A",
		ć: "c",
		Ć: "C",
		ę: "e",
		Ę: "E",
		ł: "l",
		Ł: "L",
		ń: "n",
		Ń: "N",
		ó: "o",
		Ó: "O",
		ś: "s",
		Ś: "S",
		ź: "z",
		Ź: "Z",
		ż: "z",
		Ż: "Z",
	};
	return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (c) => map[c] || c);
}

export async function generateWeddingCardPdf(
	params: CardPdfParams,
): Promise<Uint8Array> {
	// Format A6: 105 mm x 148 mm w punktach PDF (297.64 pt x 419.53 pt)
	const width = 297.64;
	const height = 419.53;

	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([width, height]);

	// Czcionki standardowe
	const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
	const fontSerifItalic = await pdfDoc.embedFont(
		StandardFonts.TimesRomanItalic,
	);
	const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const primaryRgb = hexToRgb(params.primaryColorHex || "#1E293B");
	const accentRgb = hexToRgb(params.accentColorHex || "#D4AF37");

	// 1. Zewnętrzna ozdobna ramka (złoty akcent)
	page.drawRectangle({
		x: 14,
		y: 14,
		width: width - 28,
		height: height - 28,
		borderColor: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
		borderWidth: 1.5,
	});

	// 2. Wewnętrzna subtelna ramka
	page.drawRectangle({
		x: 17,
		y: 17,
		width: width - 34,
		height: height - 34,
		borderColor: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
		borderWidth: 0.5,
	});

	// Narożne ozdobne punkty w rogach ramki
	const corners = [
		{ x: 17, y: 17 },
		{ x: width - 17, y: 17 },
		{ x: 17, y: height - 17 },
		{ x: width - 17, y: height - 17 },
	];
	for (const c of corners) {
		page.drawCircle({
			x: c.x,
			y: c.y,
			size: 2,
			color: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
		});
	}

	// 3. Imiona Pary Młodej
	const titleText = sanitizeForPdf(params.coupleNames || "Katarzyna & Tomasz");
	let titleSize = 19;
	let titleWidth = fontSerifBold.widthOfTextAtSize(titleText, titleSize);
	// Dopasowanie rozmiaru w razie długich imion
	while (titleWidth > width - 50 && titleSize > 12) {
		titleSize -= 1;
		titleWidth = fontSerifBold.widthOfTextAtSize(titleText, titleSize);
	}

	page.drawText(titleText, {
		x: (width - titleWidth) / 2,
		y: height - 50,
		size: titleSize,
		font: fontSerifBold,
		color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
	});

	// 4. Data ślubu
	const dateText = sanitizeForPdf(params.weddingDate || "12.09.2026");
	const dateSize = 10;
	const dateWidth = fontSerifItalic.widthOfTextAtSize(dateText, dateSize);
	page.drawText(dateText, {
		x: (width - dateWidth) / 2,
		y: height - 68,
		size: dateSize,
		font: fontSerifItalic,
		color: rgb(accentRgb.r, accentRgb.g, accentRgb.b),
	});

	// 5. Kod QR (wysoka rozdzielczość, wyśrodkowany)
	const qrBuffer = await generateQrPngBuffer(params.targetUrl, {
		darkColor: params.primaryColorHex || "#1E293B",
	});
	const qrImage = await pdfDoc.embedPng(qrBuffer);
	const qrSize = 155;
	const qrX = (width - qrSize) / 2;
	const qrY = (height - qrSize) / 2 - 10;

	page.drawImage(qrImage, {
		x: qrX,
		y: qrY,
		width: qrSize,
		height: qrSize,
	});

	// 6. Nagłówek i podtytuł nad/pod kodem
	const headline = sanitizeForPdf(
		params.headline || "Podziel się wspomnieniami!",
	);
	const headSize = 12;
	const headWidth = fontSansBold.widthOfTextAtSize(headline, headSize);
	page.drawText(headline, {
		x: (width - headWidth) / 2,
		y: qrY - 22,
		size: headSize,
		font: fontSansBold,
		color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
	});

	// 7. Instrukcja dla gości
	const instructionLines = (
		params.instructions ||
		"1. Otwórz aparat w telefonie\n2. Skieruj obiektyw na kod QR\n3. Dodawaj zdjęcia bez instalowania aplikacji!"
	).split("\n");

	let currentY = qrY - 40;
	for (const line of instructionLines) {
		if (!line.trim()) continue;
		const cleanLine = sanitizeForPdf(line.trim());
		const lineWidth = fontSans.widthOfTextAtSize(cleanLine, 8.5);
		page.drawText(cleanLine, {
			x: (width - lineWidth) / 2,
			y: currentY,
			size: 8.5,
			font: fontSans,
			color: rgb(0.35, 0.35, 0.35),
		});
		currentY -= 13;
	}

	// 8. Mała elegancka stopka na dole
	let footerText = "WeddingDrop • Zeskanuj kod QR i dodaj wspomnienia";
	try {
		if (params.targetUrl) {
			const parsed = new URL(params.targetUrl);
			if (parsed.host && !parsed.host.includes("localhost")) {
				footerText = parsed.host;
			}
		}
	} catch {}
	const footerWidth = fontSans.widthOfTextAtSize(footerText, 7);
	page.drawText(footerText, {
		x: (width - footerWidth) / 2,
		y: 22,
		size: 7,
		font: fontSans,
		color: rgb(0.65, 0.65, 0.65),
	});

	return await pdfDoc.save();
}
