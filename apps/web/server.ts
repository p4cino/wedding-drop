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

		// B. Bezpośrednie serwowanie plików przeniesiono na poziom Caddy (patrz: Caddyfile)

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
