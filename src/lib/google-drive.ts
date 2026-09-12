import { google } from "googleapis";
import crypto from "node:crypto";
import fs from "node:fs";

export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

/**
 * Zwraca klienta OAuth2 na podstawie zmiennych środowiskowych
 */
export function getOAuth2Client(customRedirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const domain = (process.env.APP_DOMAIN || "http://localhost:3000").replace(/\/$/, "");
  const redirectUri =
    customRedirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${domain}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Brak konfiguracji Google OAuth. Ustaw GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET w .env"
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Sprawdza czy integracja z Google OAuth jest w ogóle skonfigurowana w instancji
 */
export function isGoogleDriveConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Tworzy podpisany kryptograficznie parametr state (ochrona przed CSRF)
 */
export function generateSignedState(gallerySlug: string): string {
  const secret = process.env.ADMIN_PASSWORD || "wedding-drop-secret-key-123";
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = JSON.stringify({ slug: gallerySlug, ts: timestamp, nonce });
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const stateObj = { payload: Buffer.from(payload).toString("base64url"), hmac };
  return Buffer.from(JSON.stringify(stateObj)).toString("base64url");
}

/**
 * Weryfikuje podpisany stan state z callbacku Google OAuth (max 15 minut ważności)
 */
export function verifySignedState(stateStr: string): { slug: string } | null {
  try {
    const secret = process.env.ADMIN_PASSWORD || "wedding-drop-secret-key-123";
    const raw = Buffer.from(stateStr, "base64url").toString("utf8");
    const { payload, hmac } = JSON.parse(raw);
    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(Buffer.from(payload, "base64url").toString("utf8"))
      .digest("hex");

    const hmacBuf = Buffer.from(hmac, "hex");
    const expectedBuf = Buffer.from(expectedHmac, "hex");
    if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const age = Date.now() - data.ts;
    // Ważność: 15 minut (900 000 ms)
    if (age < 0 || age > 15 * 60 * 1000) {
      return null;
    }

    return { slug: data.slug };
  } catch (e) {
    console.error("Błąd weryfikacji Google state:", e);
    return null;
  }
}

/**
 * Tworzy URL do autoryzacji w Google z wymuszeniem offline refresh_token
 */
export function getGoogleAuthUrl(gallerySlug: string, customRedirectUri?: string): string {
  const oauth2Client = getOAuth2Client(customRedirectUri);
  const state = generateSignedState(gallerySlug);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Wymusza pobranie refresh_token nawet przy ponownej autoryzacji
    scope: [DRIVE_FILE_SCOPE, USERINFO_EMAIL_SCOPE],
    state,
  });
}

/**
 * Wymienia kod autoryzacyjny na tokeny i pobiera adres e-mail konta Google
 */
export async function exchangeCodeForTokens(code: string, customRedirectUri?: string) {
  const oauth2Client = getOAuth2Client(customRedirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  let email: string | null = null;
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    email = userInfo.data.email || null;
  } catch (err) {
    console.warn("Nie udało się pobrać e-maila konta Google:", err);
  }

  return { tokens, email };
}

/**
 * Pobiera autoryzowanego klienta Google Drive dla danej galerii za pomocą refresh_token
 */
export function getDriveClientForGallery(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Sprawdza dostępne miejsce na koncie Google (Pre-flight Quota Check)
 */
export async function checkStorageQuota(drive: ReturnType<typeof google.drive>): Promise<{
  limitBytes: number;
  usageBytes: number;
  freeBytes: number;
}> {
  try {
    const res = await drive.about.get({ fields: "storageQuota" });
    const quota = res.data.storageQuota;
    if (!quota) {
      return { limitBytes: Infinity, usageBytes: 0, freeBytes: Infinity };
    }

    const limit = quota.limit ? parseInt(quota.limit, 10) : Infinity;
    const usage = quota.usage ? parseInt(quota.usage, 10) : 0;
    const free = limit === Infinity ? Infinity : Math.max(0, limit - usage);

    return { limitBytes: limit, usageBytes: usage, freeBytes: free };
  } catch (e) {
    console.warn("Nie można pobrać quota z Google Drive:", e);
    return { limitBytes: Infinity, usageBytes: 0, freeBytes: Infinity };
  }
}

/**
 * Zapewnia, że folder o danej nazwie istnieje wewnątrz nadrzędnego katalogu.
 * Zapobiega tworzeniu duplikatów folderów przy ponownym eksporcie!
 */
export async function ensureDriveFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentId?: string
): Promise<string> {
  const sanitizedName = folderName.replace(/['"\\]/g, "");
  let query = `name = '${sanitizedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  // Sprawdzamy czy folder już istnieje
  const listRes = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id!;
  }

  // Tworzymy nowy folder
  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });

  if (!createRes.data.id) {
    throw new Error(`Nie udało się utworzyć folderu '${folderName}' na Dysku Google`);
  }

  return createRes.data.id;
}

/**
 * Przesyła pojedynczy plik z dysku serwera na Dysk Google ze strumieniem i exponential backoff
 */
export async function uploadFileToDrive(
  drive: ReturnType<typeof google.drive>,
  localFilePath: string,
  fileName: string,
  mimeType: string,
  targetFolderId: string,
  maxRetries = 3
): Promise<string> {
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const fileStream = fs.createReadStream(localFilePath);

      const res = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [targetFolderId],
        },
        media: {
          mimeType,
          body: fileStream,
        },
        fields: "id, name, size",
      });

      if (!res.data.id) {
        throw new Error(`Brak ID w odpowiedzi Google Drive dla pliku ${fileName}`);
      }

      return res.data.id;
    } catch (err: any) {
      console.error(`Błąd przesyłania pliku ${fileName} (próba ${attempt}/${maxRetries}):`, err?.message || err);

      // Sprawdzenie czy błąd to przekroczenie limitu miejsca
      if (err?.code === 403 && err?.message?.includes("storageQuotaExceeded")) {
        throw new Error("Brak miejsca na Twoim koncie Google Drive (storageQuotaExceeded)");
      }

      // Jeśli to ostatnia próba, rzuć błąd dalej
      if (attempt >= maxRetries) {
        throw err;
      }

      // Exponential backoff: 2s, 4s, 8s...
      const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error(`Niepowodzenie przesyłania pliku ${fileName} po ${maxRetries} próbach`);
}
