import * as tus from "tus-js-client";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunki - idealne przy słabym LTE
const RETRY_DELAYS = [0, 1000, 3000, 5000];

/** Limit rozmiaru pojedynczego pliku egzekwowany przez serwer TUS (1 GiB). */
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;

export type TusUploadResult = "completed" | "error" | "tooLarge";

/**
 * Jedyne miejsce konfigurujące klienta TUS (endpoint, chunk, retry). Postęp jest
 * raportowany tylko gdy wynosi 100%, wzrósł o >= 3 pkt proc. albo minęło > 100 ms
 * od poprzedniej aktualizacji — duże wideo nie zalewa Reacta re-renderami.
 */
export function uploadFileViaTus(
	file: File,
	metadata: Record<string, string>,
	onProgress?: (percentage: number) => void,
): Promise<TusUploadResult> {
	return new Promise((resolve) => {
		if (file.size > MAX_UPLOAD_BYTES) {
			resolve("tooLarge");
			return;
		}

		const endpoint =
			typeof window !== "undefined"
				? `${window.location.origin}/api/upload/tus`
				: "/api/upload/tus";

		let lastUpdateTime = 0;
		let lastPercentage = -1;

		const upload = new tus.Upload(file, {
			endpoint,
			retryDelays: RETRY_DELAYS,
			chunkSize: CHUNK_SIZE,
			metadata,
			onError: (error) => {
				console.error(`Błąd uploadu pliku ${file.name}:`, error);
				const status = (
					error as { originalResponse?: { getStatus?: () => number } }
				).originalResponse?.getStatus?.();
				resolve(status === 413 ? "tooLarge" : "error");
			},
			onProgress: (bytesUploaded, bytesTotal) => {
				const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
				const now = Date.now();
				if (
					percentage === 100 ||
					percentage - lastPercentage >= 3 ||
					now - lastUpdateTime > 100
				) {
					lastPercentage = percentage;
					lastUpdateTime = now;
					onProgress?.(percentage);
				}
			},
			onSuccess: () => resolve("completed"),
		});

		upload.start();
	});
}
