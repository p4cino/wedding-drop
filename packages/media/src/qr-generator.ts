import QRCode from "qrcode";

export interface QrOptions {
	darkColor?: string;
	lightColor?: string;
	margin?: number;
}

export async function generateQrPngBuffer(
	url: string,
	options: QrOptions = {},
): Promise<Buffer> {
	return await QRCode.toBuffer(url, {
		type: "png",
		width: 1024, // Wysoka rozdzielczość 300 DPI dla druku
		margin: options.margin ?? 2,
		color: {
			dark: options.darkColor || "#1E293B",
			light: options.lightColor || "#FFFFFF",
		},
		errorCorrectionLevel: "H",
	});
}

export async function generateQrSvg(
	url: string,
	options: QrOptions = {},
): Promise<string> {
	return await QRCode.toString(url, {
		type: "svg",
		margin: options.margin ?? 2,
		color: {
			dark: options.darkColor || "#1E293B",
			light: options.lightColor || "#FFFFFF",
		},
		errorCorrectionLevel: "H",
	});
}
