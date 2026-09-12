import { describe, it, expect, vi } from "vitest";
import { initTusServer } from "@/lib/tus-server";
import { EVENTS } from "@tus/server";
import path from "node:path";
import os from "node:os";
import { scheduleMediaProcessing } from "@/lib/media-processor";

vi.mock("@/lib/media-processor", () => ({
  scheduleMediaProcessing: vi.fn(),
}));

describe("tus-server configuration", () => {
  const tempDir = path.join(os.tmpdir(), "wedding-drop-test-tus");

  it("powinien pomyślnie zainicjalizować instancję serwera TUS i wygenerować unikalną nazwę", () => {
    const server = initTusServer(tempDir);
    expect(server).toBeDefined();
    expect(server.options.path).toBe("/api/upload/tus");
    expect(server.options.relativeLocation).toBe(true);
    expect(server.options.respectForwardedHeaders).toBe(true);

    const namingFn = server.options.namingFunction;
    expect(namingFn).toBeDefined();
    if (namingFn) {
      const generatedName = namingFn({} as any);
      expect(generatedName).toMatch(/^upload_\d+_[a-z0-9]+$/);
    }
  });

  it("onUploadCreate powinien rzucać błąd 400, gdy brak gallerySlug w metadanych", async () => {
    const server = initTusServer(tempDir);
    const onUploadCreate = server.options.onUploadCreate;
    expect(onUploadCreate).toBeDefined();

    if (onUploadCreate) {
      await expect(
        onUploadCreate({} as any, { metadata: {} } as any)
      ).rejects.toEqual({
        status_code: 400,
        body: "Błąd: Brak wymaganego parametru gallerySlug w metadanych.",
      });

      await expect(
        onUploadCreate({} as any, {} as any)
      ).rejects.toEqual({
        status_code: 400,
        body: "Błąd: Brak wymaganego parametru gallerySlug w metadanych.",
      });
    }
  });

  it("onUploadCreate powinien akceptować upload z obecnym gallerySlug", async () => {
    const server = initTusServer(tempDir);
    const onUploadCreate = server.options.onUploadCreate;

    if (onUploadCreate) {
      const res = await onUploadCreate(
        {} as any,
        { metadata: { gallerySlug: "kasia-i-tomek" } } as any
      );
      expect(res).toEqual({ metadata: { gallerySlug: "kasia-i-tomek" } });
    }
  });

  it("powinien obsłużyć zdarzenie POST_FINISH i wywołać scheduleMediaProcessing", async () => {
    const server = initTusServer(tempDir);

    const mockUpload = {
      id: "upl-123",
      size: 1024,
      metadata: {
        gallerySlug: "kasia-i-tomek",
        uploaderName: "Kasia",
        originalName: "film.mp4",
        fileType: "video/mp4",
      },
    };

    (server as any).emit(EVENTS.POST_FINISH, {} as any, {} as any, mockUpload as any);
    expect(scheduleMediaProcessing).toHaveBeenCalled();
  });

  it("powinien pominąć przetwarzanie w POST_FINISH, gdy brak gallerySlug", async () => {
    const server = initTusServer(tempDir);
    vi.clearAllMocks();

    const mockUpload = {
      id: "upl-999",
      size: 1024,
      metadata: {},
    };

    (server as any).emit(EVENTS.POST_FINISH, {} as any, {} as any, mockUpload as any);
    expect(scheduleMediaProcessing).not.toHaveBeenCalled();
  });
});
