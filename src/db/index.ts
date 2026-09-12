import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgres://wedding:wedding_secret@localhost:5432/wedding_drop";

// Klient zoptymalizowany pod małą pamięć RAM (max 10 połączeń w puli wystarczy na N100)
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

/**
 * Automatyczna inicjalizacja tabel i domyślnego administratora.
 * Zapewnia działanie od razu po `docker compose up` bez ręcznego uruchamiania migracji!
 */
export async function initDatabase() {
  try {
    await client.unsafe(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS galleries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT NOT NULL UNIQUE,
        couple_names TEXT NOT NULL,
        wedding_date TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        owner_password_hash TEXT NOT NULL,
        access_pin TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        allow_guest_downloads BOOLEAN NOT NULL DEFAULT true,
        allow_videos BOOLEAN NOT NULL DEFAULT true,
        max_storage_bytes BIGINT NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS card_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
        headline TEXT NOT NULL DEFAULT 'Podziel się wspomnieniami!',
        subheadline TEXT NOT NULL DEFAULT 'Zeskanuj kod QR aparatem w telefonie i dodaj swoje zdjęcia z naszego wesela',
        primary_color TEXT NOT NULL DEFAULT '#1E293B',
        accent_color TEXT NOT NULL DEFAULT '#D4AF37',
        paper_size TEXT NOT NULL DEFAULT 'A6',
        custom_instructions TEXT DEFAULT '1. Otwórz aparat w telefonie\n2. Skieruj obiektyw na kod QR\n3. Wrzucaj zdjęcia bez rejestracji i aplikacji!',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
        uploader_name TEXT NOT NULL DEFAULT 'Gość weselny',
        file_type TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        original_file_name TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        storage_path TEXT NOT NULL,
        thumb_path TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        duration INTEGER,
        status TEXT NOT NULL DEFAULT 'ready',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_media_items_gallery_status_created ON media_items(gallery_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_media_items_gallery_size ON media_items(gallery_id, file_size);
    `);

    // Utworzenie domyślnego admina, jeśli tabela jest pusta
    const existingAdmins = await client`SELECT count(*) FROM admins`;
    if (parseInt(existingAdmins[0].count, 10) === 0) {
      const defaultAdminPass = process.env.ADMIN_PASSWORD || "admin123";
      const hash = await bcrypt.hash(defaultAdminPass, 10);
      await client`
        INSERT INTO admins (username, password_hash)
        VALUES ('admin', ${hash})
      `;
      console.log(`[DB] Utworzono domyślnego administratora: login='admin', hasło='${defaultAdminPass}'`);
    }

    console.log("[DB] Baza danych PostgreSQL zainicjalizowana pomyślnie.");
  } catch (err) {
    console.error("[DB] Błąd podczas inicjalizacji bazy danych:", err);
  }
}
