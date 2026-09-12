import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getGallery } from "@/app/api/gallery/[slug]/route";
import { GET as getMedia } from "@/app/api/gallery/[slug]/media/route";
import { GET as getPdf } from "@/app/api/gallery/[slug]/card/pdf/route";
import { GET as getZip } from "@/app/api/gallery/[slug]/zip/route";
import { GET as getLive } from "@/app/api/gallery/[slug]/live/route";
import { NextRequest } from "next/server";
import { sseBus } from "@/lib/sse-bus";
import fs from "node:fs";

let mockExists = true;
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(() => mockExists),
  },
  existsSync: vi.fn(() => mockExists),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn((pwd: string) => Promise.resolve(pwd === "sekret123")),
    hash: vi.fn(() => Promise.resolve("hashed")),
  },
}));

vi.mock("archiver", () => {
  const zipArchiveMock = vi.fn().mockImplementation(function (this: any) {
    return {
      pipe: vi.fn(),
      file: vi.fn(),
      finalize: vi.fn(),
      on: vi.fn(),
    };
  });
  return {
    ZipArchive: zipArchiveMock,
    default: zipArchiveMock,
  };
});

let mockGalleries: any[] = [
  {
    id: "gal-1",
    slug: "kasia-i-tomek",
    coupleNames: "Kasia & Tomek",
    weddingDate: "2026-09-12",
    ownerPasswordHash: "hashed",
    isActive: true,
    allowGuestDownloads: true,
    allowVideos: true,
    accessPin: null,
  },
];

let mockCards: any[] = [
  {
    id: "card-1",
    galleryId: "gal-1",
    headline: "Wspomnienia z wesela",
    primaryColor: "#1E293B",
    accentColor: "#D4AF37",
  },
];

let mockMedia: any[] = [
  {
    id: "m-1",
    galleryId: "gal-1",
    uploaderName: "Gość",
    fileType: "image",
    mimeType: "image/jpeg",
    originalFileName: "zabawa.jpg",
    fileSize: 1024,
    storagePath: "galleries/kasia-i-tomek/raw/1.jpg",
    thumbPath: "galleries/kasia-i-tomek/thumbs/1.webp",
    status: "ready",
    createdAt: new Date().toISOString(),
  },
];

let dbShouldThrow = false;

vi.mock("@/db", () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => {
          if (dbShouldThrow) throw new Error("DB Error");
          return {
            where: vi.fn(() => {
              if (dbShouldThrow) throw new Error("DB Error");
              return {
                limit: vi.fn().mockImplementation(() => {
                  if (dbShouldThrow) return Promise.reject(new Error("DB Error"));
                  return Promise.resolve(mockGalleries);
                }),
                orderBy: vi.fn().mockResolvedValue(mockMedia),
                then: (resolve: any) => resolve(mockMedia),
              };
            }),
          };
        }),
      })),
    },
  };
});

describe("Gallery API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExists = true;
    dbShouldThrow = false;
    mockGalleries = [
      {
        id: "gal-1",
        slug: "kasia-i-tomek",
        coupleNames: "Kasia & Tomek",
        weddingDate: "2026-09-12",
        isActive: true,
        allowGuestDownloads: true,
        allowVideos: true,
        accessPin: null,
      },
    ];
    mockMedia = [
      {
        id: "m-1",
        galleryId: "gal-1",
        uploaderName: "Gość",
        fileType: "image",
        mimeType: "image/jpeg",
        originalFileName: "zabawa.jpg",
        fileSize: 1024,
        storagePath: "galleries/kasia-i-tomek/raw/1.jpg",
        thumbPath: "galleries/kasia-i-tomek/thumbs/1.webp",
        status: "ready",
        createdAt: new Date().toISOString(),
      },
    ];
  });

  describe("GET /api/gallery/[slug]", () => {
    it("powinien zwrócić metadane galerii dla istniejącego sluga", async () => {
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek");
      const res = await getGallery(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.slug).toBe("kasia-i-tomek");
      expect(data.coupleNames).toBe("Kasia & Tomek");
    });

    it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
      mockGalleries = [];
      const req = new NextRequest("http://localhost/api/gallery/nie-istnieje");
      const res = await getGallery(req, { params: Promise.resolve({ slug: "nie-istnieje" }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Galeria nie istnieje");
    });

    it("powinien zwrócić 500 w przypadku błędu serwera", async () => {
      dbShouldThrow = true;
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek");
      const res = await getGallery(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/gallery/[slug]/media", () => {
    it("powinien zwrócić listę mediów z prawidłowymi URL-ami", async () => {
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/media");
      const res = await getMedia(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.media).toBeDefined();
      expect(data.media.length).toBeGreaterThan(0);
      expect(data.media[0].thumbUrl).toContain("/media-file/");
    });

    it("powinien odrzucić includeHidden=true bez autoryzacji", async () => {
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true");
      const res = await getMedia(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Brak uprawnień do przeglądania ukrytych materiałów");
    });

    it("powinien obsłużyć parametr includeHidden=true z poprawnym hasłem", async () => {
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/media?includeHidden=true&password=sekret123");
      const res = await getMedia(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.media).toBeDefined();
    });

    it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
      mockGalleries = [];
      const req = new NextRequest("http://localhost/api/gallery/brak/media");
      const res = await getMedia(req, { params: Promise.resolve({ slug: "brak" }) });

      expect(res.status).toBe(404);
    });

    it("powinien zwrócić 500 w razie błędu", async () => {
      dbShouldThrow = true;
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/media");
      const res = await getMedia(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/gallery/[slug]/card/pdf", () => {
    it("powinien zwrócić nagłówek application/pdf", async () => {
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/card/pdf");
      const res = await getPdf(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toContain("karteczka-stol-kasia-i-tomek.pdf");
    });

    it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
      mockGalleries = [];
      const req = new NextRequest("http://localhost/api/gallery/brak/card/pdf");
      const res = await getPdf(req, { params: Promise.resolve({ slug: "brak" }) });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/gallery/[slug]/zip", () => {
    it("powinien zwrócić strumień ZIP application/zip", async () => {
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/zip");
      const res = await getZip(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/zip");
      expect(res.headers.get("Content-Disposition")).toContain("galeria-kasia-i-tomek");
    });

    it("powinien zablokować pobieranie ZIP, gdy allowGuestDownloads=false bez hasła", async () => {
      mockGalleries[0].allowGuestDownloads = false;
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/zip");
      const res = await getZip(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(403);
    });

    it("powinien zezwolić na pobranie ZIP, gdy allowGuestDownloads=false z poprawnym hasłem właściciela", async () => {
      mockGalleries[0].allowGuestDownloads = false;
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/zip?password=sekret123");
      const res = await getZip(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/zip");
    });

    it("powinien zwrócić 404, gdy galeria nie istnieje", async () => {
      mockGalleries = [];
      const req = new NextRequest("http://localhost/api/gallery/brak/zip");
      const res = await getZip(req, { params: Promise.resolve({ slug: "brak" }) });

      expect(res.status).toBe(404);
    });

    it("powinien zwrócić 400, gdy brak zdjęć w galerii", async () => {
      mockMedia = [];
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/zip");
      const res = await getZip(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(400);
    });

    it("powinien zwrócić 404, gdy pliki fizyczne nie istnieją na dysku", async () => {
      mockExists = false;
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/zip");
      const res = await getZip(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Pliki fizyczne nie zostały znalezione na dysku" });
    });
  });

  describe("GET /api/gallery/[slug]/live", () => {
    it("powinien otworzyć strumień text/event-stream i obsługiwać powiadomienia oraz rozłączenie", async () => {
      const abortController = new AbortController();
      const req = new NextRequest("http://localhost/api/gallery/kasia-i-tomek/live", {
        signal: abortController.signal,
      });

      const res = await getLive(req, { params: Promise.resolve({ slug: "kasia-i-tomek" }) });
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");

      const reader = res.body?.getReader();
      expect(reader).toBeDefined();

      if (reader) {
        // 1. Pierwszy chunk - connected
        const { value: chunk1 } = await reader.read();
        const text1 = new TextDecoder().decode(chunk1);
        expect(text1).toContain('"type":"connected"');

        // 2. Emisja zdarzenia sseBus
        sseBus.notifyNewMedia("kasia-i-tomek", {
          id: "new-sse-media",
          uploaderName: "Kuzyn Paweł",
          fileType: "image",
          mimeType: "image/jpeg",
          originalFileName: "taniec.jpg",
          fileSize: 2048,
          thumbPath: "galleries/kasia-i-tomek/thumbs/t.webp",
          storagePath: "galleries/kasia-i-tomek/raw/t.jpg",
          createdAt: new Date().toISOString(),
        });

        const { value: chunk2 } = await reader.read();
        const text2 = new TextDecoder().decode(chunk2);
        expect(text2).toContain('"type":"new-media"');
        expect(text2).toContain("Kuzyn Paweł");

        // 3. Rozłączenie - trigger abort
        abortController.abort();
      }
    });
  });
});
