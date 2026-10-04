import fs from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".svg": "image/svg+xml",
};

export async function handleBrandingFileRequest(
	req: IncomingMessage,
	res: ServerResponse,
	dataDir: string,
): Promise<boolean> {
	if (!req.url || !req.url.startsWith("/branding-file/")) {
		return false;
	}

	const urlWithoutQuery = req.url.split("?")[0];
	const parts = urlWithoutQuery.split("/");
	// Oczekujemy: ["", "branding-file", "slug", "filename"]
	if (parts.length < 4) {
		res.writeHead(400, { "Content-Type": "text/plain" });
		res.end("Bad Request");
		return true;
	}

	const slug = parts[2].toLowerCase().replace(/[^a-z0-9_-]/g, "");
	const filename = parts[3].toLowerCase().replace(/[^a-z0-9._-]/g, "");

	if (!slug || !filename) {
		res.writeHead(400, { "Content-Type": "text/plain" });
		res.end("Bad Request");
		return true;
	}

	const safeDataDir = path.resolve(dataDir);
	const targetPath = path.resolve(
		safeDataDir,
		"galleries",
		slug,
		"branding",
		filename,
	);

	if (!targetPath.startsWith(safeDataDir)) {
		res.writeHead(403, { "Content-Type": "text/plain" });
		res.end("Forbidden - Path Traversal Detected");
		return true;
	}

	try {
		const fileStat = await stat(targetPath);
		if (!fileStat.isFile()) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found");
			return true;
		}

		const ext = path.extname(targetPath).toLowerCase();
		const mimeType = MIME_TYPES[ext] || "application/octet-stream";
		res.writeHead(200, {
			"Content-Type": mimeType,
			"Content-Length": fileStat.size,
			"Cache-Control": "public, max-age=31536000, immutable",
		});

		const stream = fs.createReadStream(targetPath);
		stream.pipe(res);
	} catch (err: any) {
		if (err.code === "ENOENT") {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found");
		} else {
			console.error("[BrandingHandler] Błąd podczas serwowania:", err);
			res.writeHead(500, { "Content-Type": "text/plain" });
			res.end("Internal Server Error");
		}
	}

	return true;
}
