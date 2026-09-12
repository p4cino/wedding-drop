import { EventEmitter } from "node:events";

class SSEBus extends EventEmitter {
	constructor() {
		super();
		this.setMaxListeners(0); // 0 = bez sztucznego limitu liczby słuchaczy dla dużych wesel
	}

	notifyNewMedia(gallerySlug: string, mediaItem: unknown) {
		this.emit(`new-media:${gallerySlug}`, mediaItem);
	}

	notifyMediaUpdated(
		gallerySlug: string,
		update: { mediaId: string; status: string },
	) {
		this.emit(`media-updated:${gallerySlug}`, update);
	}

	notifyGDriveProgress(gallerySlug: string, progress: unknown) {
		this.emit(`gdrive-progress:${gallerySlug}`, progress);
	}
}

declare global {
	var __wedding_sse_bus__: SSEBus | undefined;
}

if (!globalThis.__wedding_sse_bus__) {
	globalThis.__wedding_sse_bus__ = new SSEBus();
}

export const sseBus: SSEBus = globalThis.__wedding_sse_bus__;
