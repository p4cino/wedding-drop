import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { db, galleries, mediaItems } from "@wedding-drop/db";
import { eq, or } from "drizzle-orm";
import {
	ownerSessionCookieName,
	verifyAdminToken,
	verifyOwnerToken,
} from "./auth";

const MIME_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
	".mp4": "video/mp4",
	".mov": "video/quicktime",
	".webm": "video/webm",
	".svg": "image/svg+xml",
};

function checkIsAuthorizedForHidden(
	req: IncomingMessage,
	gallerySlug?: string,
): boolean {
	const adminToken = req.headers["x-admin-token"] as string | undefined;
	if (adminToken && verifyAdminToken(adminToken)) return true;

	if (!gallerySlug) return false;

	const ownerToken = req.headers["x-owner-token"] as string | undefined;
	if (ownerToken && verifyOwnerToken(ownerToken, gallerySlug)) return true;

	const authHeader = req.headers.authorization;
	if (authHeader && /^Bearer\s+/i.test(authHeader)) {
		const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
		if (verifyAdminToken(bearerToken)) return true;
		if (verifyOwnerToken(bearerToken, gallerySlug)) return true;
	}

	const cookieHeader = req.headers.cookie;
	if (cookieHeader) {
		const cookieName = ownerSessionCookieName(gallerySlug);
		const match = cookieHeader.match(
			new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`),
		);
		if (match && verifyOwnerToken(decodeURIComponent(match[1]), gallerySlug)) {
			return true;
		}
	}

	return false;
}

export async function handleMediaFileRequest(
	req: IncomingMessage,
	res: ServerResponse,
	dataDir: string,
): Promise<boolean> {
	const rawUrl = req.url || "/";
	if (!rawUrl.startsWith("/media-file/")) {
		return false;
	}

	// 1. Sanityzacja i ochrona przed Path Traversal
	const urlWithoutPrefix = rawUrl.slice("/media-file/".length);
	// Usuwamy ewentualny query string
	const cleanUrlPath = urlWithoutPrefix.split("?")[0];

	let decodedRelativePath: string;
	try {
		decodedRelativePath = decodeURIComponent(cleanUrlPath);
	} catch {
		res.writeHead(400, { "Content-Type": "text/plain" });
		res.end("Bad Request: Invalid encoding");
		return true;
	}

	// Blokada null bytes oraz sekwencji ".."
	if (
		decodedRelativePath.includes("\0") ||
		decodedRelativePath.includes("..")
	) {
		res.writeHead(403, { "Content-Type": "text/plain" });
		res.end("Forbidden: Path traversal detected");
		return true;
	}

	const resolvedDataDir = path.resolve(dataDir);
	const targetFullPath = path.resolve(resolvedDataDir, decodedRelativePath);

	// Bezwzględne upewnienie się, że ścieżka leży wewnątrz dataDir
	if (
		!targetFullPath.startsWith(resolvedDataDir + path.sep) &&
		targetFullPath !== resolvedDataDir
	) {
		res.writeHead(403, { "Content-Type": "text/plain" });
		res.end("Forbidden: Access outside data sandbox");
		return true;
	}

	// 2. Sprawdzenie istnienia pliku na dysku
	let stat: fs.Stats;
	try {
		stat = fs.statSync(targetFullPath);
		if (!stat.isFile()) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found");
			return true;
		}
	} catch {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not Found");
		return true;
	}

	// 3. Sprawdzenie statusu w bazie danych
	// Konwersja ścieżki do separatorów POSIX (tak jak zapisano w bazie)
	const relativeToData = path.relative(resolvedDataDir, targetFullPath);
	const posixRelative = relativeToData.split(path.sep).join("/");

	try {
		const matchingItems = await db
			.select({
				status: mediaItems.status,
				gallerySlug: galleries.slug,
			})
			.from(mediaItems)
			.innerJoin(galleries, eq(mediaItems.galleryId, galleries.id))
			.where(
				or(
					eq(mediaItems.storagePath, posixRelative),
					eq(mediaItems.thumbPath, posixRelative),
				),
			)
			.limit(1);

		if (matchingItems.length > 0) {
			const item = matchingItems[0];
			if (item.status === "deleted") {
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("Not Found");
				return true;
			}
			if (item.status === "hidden") {
				const isAuthorized = checkIsAuthorizedForHidden(req, item.gallerySlug);
				if (!isAuthorized) {
					res.writeHead(403, { "Content-Type": "text/plain" });
					res.end("Forbidden: Hidden media requires authorization");
					return true;
				}
			}
		}
	} catch (err) {
		console.error("[MediaFileHandler] Błąd sprawdzania statusu DB:", err);
		// W przypadku błędu bazy danych nie ujawniamy potencjalnie ukrytych plików
		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end("Internal Server Error");
		return true;
	}

	// 4. Obsługa streamingu i Byte-Range
	const ext = path.extname(targetFullPath).toLowerCase();
	const contentType = MIME_TYPES[ext] || "application/octet-stream";
	const fileSize = stat.size;
	const range = req.headers.range;

	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

		if (
			Number.isNaN(start) ||
			Number.isNaN(end) ||
			start >= fileSize ||
			end >= fileSize ||
			start > end
		) {
			res.writeHead(416, {
				"Content-Range": `bytes */${fileSize}`,
				"Content-Type": "text/plain",
			});
			res.end("Requested Range Not Satisfiable");
			return true;
		}

		const chunkSize = end - start + 1;
		const stream = fs.createReadStream(targetFullPath, { start, end });
		stream.on("error", (err) => {
			console.error("[MediaFileHandler] Stream error:", err);
			if (!res.headersSent) {
				res.writeHead(500, { "Content-Type": "text/plain" });
			}
			res.end();
		});

		res.writeHead(206, {
			"Content-Range": `bytes ${start}-${end}/${fileSize}`,
			"Accept-Ranges": "bytes",
			"Content-Length": chunkSize,
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=31536000, immutable",
			"X-Content-Type-Options": "nosniff",
		});

		stream.pipe(res);
		return true;
	}

	res.writeHead(200, {
		"Content-Length": fileSize,
		"Accept-Ranges": "bytes",
		"Content-Type": contentType,
		"Cache-Control": "public, max-age=31536000, immutable",
		"X-Content-Type-Options": "nosniff",
	});

	const stream = fs.createReadStream(targetFullPath);
	stream.on("error", (err) => {
		console.error("[MediaFileHandler] Stream error:", err);
		if (!res.headersSent) {
			res.writeHead(500, { "Content-Type": "text/plain" });
		}
		res.end();
	});
	stream.pipe(res);
	return true;
}
