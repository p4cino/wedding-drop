import { describe, it, expect, vi, beforeEach } from "vitest";
import { mediaQueue, scheduleMediaProcessing, ProcessTask } from "@/lib/media-processor";
import { sseBus } from "@/lib/sse-bus";
import fsPromises from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import sharp from "sharp";

let mockGalleryResult: any[] = [{ id: "mock-gal-id" }];

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockImplementation(() => Promise.resolve(mockGalleryResult)),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: "mock-media-id" }]),
      })),
    })),
  },
}));

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
  mkdir: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
  },
  existsSync: vi.fn().mockReturnValue(true),
}));

let mockSpawnExitCode = 0;
let mockSpawnError: Error | null = null;

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => {
    const listeners: Record<string, ((...args: any[]) => void)[]> = {};
    const proc = {
      kill: vi.fn(),
      on: (event: string, cb: (...args: any[]) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
        if (event === "close") {
          setTimeout(() => {
            if (mockSpawnError) {
              const errCbs = listeners["error"] || [];
              errCbs.forEach((fn) => fn(mockSpawnError));
            } else {
              cb(mockSpawnExitCode);
            }
          }, 5);
        }
        return proc;
      },
    };
    return proc;
  }),
}));

vi.mock("sharp", () => {
  const sharpMock = vi.fn(() => ({
    rotate: vi.fn().mockReturnThis(),
    metadata: vi.fn().mockResolvedValue({ width: 1920, height: 1080 }),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue({ size: 12345 }),
  }));
  return { default: sharpMock };
});

vi.mock("@/lib/sse-bus", () => ({
  sseBus: {
    notifyNewMedia: vi.fn(),
  },
}));

describe("media-processor service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGalleryResult = [{ id: "mock-gal-id" }];
    mockSpawnExitCode = 0;
    mockSpawnError = null;
  });

  it("powinien mieć skonfigurowaną kolejkę z limitem concurrency = 2 dla Intel N100", () => {
    expect(mediaQueue).toBeDefined();
    expect(mediaQueue.concurrency).toBe(2);
  });

  it("powinien pomyślnie przetworzyć zdjęcie, wygenerować miniaturę i powiadomić przez SSE", async () => {
    const task: ProcessTask = {
      uploadId: "upl-img-1",
      tempFilePath: "/tmp/fake-file.jpg",
      gallerySlug: "kasia-i-tomek",
      uploaderName: "Gość",
      originalName: "foto.jpg",
      fileType: "image",
      mimeType: "image/jpeg",
      fileSize: 5000,
      dataDir: "/tmp/data",
    };

    await scheduleMediaProcessing(task);

    expect(fsPromises.mkdir).toHaveBeenCalled();
    expect(fsPromises.rename).toHaveBeenCalled();
    expect(sharp).toHaveBeenCalled();
    expect(sseBus.notifyNewMedia).toHaveBeenCalledWith("kasia-i-tomek", expect.objectContaining({ id: "mock-media-id" }));
  });

  it("powinien obsłużyć błąd, gdy galeria nie istnieje w bazie", async () => {
    mockGalleryResult = [];
    const task: ProcessTask = {
      uploadId: "upl-img-missing",
      tempFilePath: "/tmp/fake-file.jpg",
      gallerySlug: "nieistniejaca",
      uploaderName: "Gość",
      originalName: "foto.jpg",
      fileType: "image",
      mimeType: "image/jpeg",
      fileSize: 5000,
      dataDir: "/tmp/data",
    };

    await scheduleMediaProcessing(task);
    expect(fsPromises.unlink).toHaveBeenCalledWith("/tmp/fake-file.jpg");
    expect(sseBus.notifyNewMedia).not.toHaveBeenCalled();
  });

  it("powinien pomyślnie przetworzyć wideo używając FFmpeg", async () => {
    const task: ProcessTask = {
      uploadId: "upl-vid-1",
      tempFilePath: "/tmp/fake-video.mp4",
      gallerySlug: "kasia-i-tomek",
      uploaderName: "Kamerzysta",
      originalName: "taniec.mp4",
      fileType: "video",
      mimeType: "video/mp4",
      fileSize: 20000000,
      dataDir: "/tmp/data",
    };

    await scheduleMediaProcessing(task);
    expect(spawn).toHaveBeenCalledWith("ffmpeg", expect.arrayContaining(["-i", expect.stringContaining("upl-vid-1.mp4")]));
    expect(sseBus.notifyNewMedia).toHaveBeenCalled();
  });

  it("powinien obsłużyć błąd FFmpeg podczas generowania miniatury wideo i kontynuować zapis", async () => {
    mockSpawnExitCode = 1;
    const task: ProcessTask = {
      uploadId: "upl-vid-err",
      tempFilePath: "/tmp/fake-video.mp4",
      gallerySlug: "kasia-i-tomek",
      uploaderName: "Kamerzysta",
      originalName: "toast.mp4",
      fileType: "video",
      mimeType: "video/mp4",
      fileSize: 1000000,
      dataDir: "/tmp/data",
    };

    await scheduleMediaProcessing(task);
    expect(spawn).toHaveBeenCalled();
    expect(sseBus.notifyNewMedia).toHaveBeenCalled();
  });

  it("powinien obsłużyć zdarzenie error procesu potomnego FFmpeg", async () => {
    mockSpawnError = new Error("FFmpeg not found");
    const task: ProcessTask = {
      uploadId: "upl-vid-spawn-err",
      tempFilePath: "/tmp/fake-video.mp4",
      gallerySlug: "kasia-i-tomek",
      uploaderName: "Kamerzysta",
      originalName: "oczepiny.mp4",
      fileType: "video",
      mimeType: "video/mp4",
      fileSize: 1000000,
      dataDir: "/tmp/data",
    };

    await scheduleMediaProcessing(task);
    expect(sseBus.notifyNewMedia).toHaveBeenCalled();
  });
});
