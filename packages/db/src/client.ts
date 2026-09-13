import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
	process.env.DATABASE_URL ||
	"postgres://wedding:wedding_secret@localhost:5432/wedding_drop";

// Klient zoptymalizowany pod małą pamięć RAM (max 10 połączeń w puli wystarczy na N100)
export const client = postgres(connectionString, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
});

export const db = drizzle(client, { schema });

function getMigrationsFolder(): string {
	const currentDir =
		typeof __dirname !== "undefined" ? __dirname : process.cwd();
	const candidates = [
		path.resolve(currentDir, "../migrations"),
		path.resolve(currentDir, "../../packages/db/migrations"),
		path.resolve(process.cwd(), "packages/db/migrations"),
		path.resolve(process.cwd(), "migrations"),
	];

	for (const candidate of candidates) {
		if (
			fs.existsSync(/*turbopackIgnore: true*/ candidate) &&
			fs.existsSync(path.join(/*turbopackIgnore: true*/ candidate, "meta"))
		) {
			return candidate;
		}
	}
	return path.resolve(process.cwd(), "packages/db/migrations");
}

/**
 * Automatyczna inicjalizacja tabel za pomocą migracji Drizzle ORM
 * i domyślnego administratora.
 * Zapewnia działanie od razu po `docker compose up` bez ręcznego uruchamiania migracji!
 */
export async function initDatabase() {
	try {
		const migrationsFolder = getMigrationsFolder();
		console.log(
			`[DB] Uruchamianie migracji Drizzle z folderu: ${migrationsFolder}`,
		);
		await migrate(db, { migrationsFolder });
		console.log("[DB] Migracje Drizzle zakończone sukcesem.");

		// Utworzenie domyślnego admina, jeśli tabela jest pusta
		const existingAdmins = await client`SELECT count(*) FROM admins`;
		if (parseInt(existingAdmins[0].count, 10) === 0) {
			const defaultAdminPass = process.env.ADMIN_PASSWORD || "admin123";
			const hash = await bcrypt.hash(defaultAdminPass, 10);
			await client`
				INSERT INTO admins (username, password_hash)
				VALUES ('admin', ${hash})
			`;
			console.log(
				`[DB] Utworzono domyślnego administratora: login='admin', hasło='${defaultAdminPass}'`,
			);
		}

		console.log("[DB] Baza danych PostgreSQL zainicjalizowana pomyślnie.");
	} catch (err) {
		console.error("[DB] Błąd podczas inicjalizacji bazy danych:", err);
	}
}
