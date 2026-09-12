import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { initDatabase } from "@wedding-drop/db";
import { initTusServer, recoverInterruptedExports } from "@wedding-drop/media";
import dotenv from "dotenv";
import next from "next";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

const app = next({ dev, hostname, port });
const nextHandler = app.getRequestHandler();

async function bootstrap() {
	// 1. Upewnienie się o istnieniu katalogów danych
	fs.mkdirSync(path.join(dataDir, "galleries"), { recursive: true });
	fs.mkdirSync(path.join(dataDir, "tus_temp"), { recursive: true });

	// 2. Inicjalizacja bazy danych PostgreSQL
	await initDatabase();

	// 2b. Startup Recovery dla przerwanych zadań eksportu Google Drive
	await recoverInterruptedExports();

	// 3. Przygotowanie serwera TUS
	const tusServer = initTusServer(dataDir);

	// 4. Przygotowanie Next.js
	await app.prepare();

	// 5. Utworzenie serwera HTTP
	const server = createServer((req, res) => {
		const url = req.url || "/";

		// A. Obsługa wznawialnego protokołu TUS
		if (url.startsWith("/api/upload/tus")) {
			return tusServer.handle(req, res);
		}

		// B. Bezpośrednie, wydajne serwowanie miniaturek i plików z wolumenu danych
		// Ścieżka URL: /media-file/:path*
		if (url.startsWith("/media-file/")) {
			const relativePath = decodeURIComponent(
				url.replace(/^\/media-file\//, "").split("?")[0],
			);
			// Ścisłe zabezpieczenie przed Directory Traversal
			const resolvedDataDir = path.resolve(dataDir);
			const fullPath = path.resolve(dataDir, relativePath);

			if (!fullPath.startsWith(resolvedDataDir + path.sep)) {
				res.statusCode = 403;
				return res.end("Dostęp zablokowany");
			}

			if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
				const ext = path.extname(fullPath).toLowerCase();
				let contentType = "application/octet-stream";
				if (ext === ".webp") contentType = "image/webp";
				else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
				else if (ext === ".png") contentType = "image/png";
				else if (ext === ".mp4") contentType = "video/mp4";
				else if (ext === ".mov") contentType = "video/quicktime";

				res.setHeader("Content-Type", contentType);
				res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

				// Obsługa Byte-Range dla odtwarzaczy wideo na telefonach (iOS/Android)
				const stat = fs.statSync(fullPath);
				const range = req.headers.range;

				if (range) {
					const parts = range.replace(/bytes=/, "").split("-");
					const start = Number.parseInt(parts[0], 10);
					const end = parts[1] ? Number.parseInt(parts[1], 10) : stat.size - 1;
					const chunksize = end - start + 1;
					const file = fs.createReadStream(fullPath, { start, end });

					res.writeHead(206, {
						"Content-Range": `bytes ${start}-${end}/${stat.size}`,
						"Accept-Ranges": "bytes",
						"Content-Length": chunksize,
						"Content-Type": contentType,
					});
					return file.pipe(res);
				}

				res.setHeader("Content-Length", stat.size);
				return fs.createReadStream(fullPath).pipe(res);
			}

			res.statusCode = 404;
			return res.end("Plik nie został znaleziony");
		}

		// C. Domyślny routing Next.js (App Router, API routes, Server Actions)
		return nextHandler(req, res);
	});

	server.listen(port, hostname, () => {
		console.log(
			`> Serwer WeddingDrop działa pod adresem: http://${hostname}:${port}`,
		);
		console.log(`> Folder przechowywania danych: ${dataDir}`);
	});
}

bootstrap().catch((err) => {
	console.error("Błąd krytyczny startu aplikacji:", err);
	process.exit(1);
});
