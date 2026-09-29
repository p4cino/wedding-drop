/**
 * Wspólny mock `tus-js-client` dla testów komponentów uploadu. Użycie:
 *
 *   vi.mock("tus-js-client", async () =>
 *     (await import("../../helpers/tus-mock")).createTusMock(),
 *   );
 *
 * Zachowaniem steruje obiekt `tusMock` (importowany statycznie w teście).
 */
interface TusMockOptions {
	metadata?: Record<string, string>;
	onError: (err: Error) => void;
	onProgress: (bytesUploaded: number, bytesTotal: number) => void;
	onSuccess: () => void;
}

export const tusMock = {
	/** Wszystkie uploady kończą się błędem. */
	failAll: false,
	/** Uploady plików o tych nazwach (`originalName`) kończą się błędem. */
	failNames: new Set<string>(),
	/** Nie kończy uploadu automatycznie — zakończenie przez `pendingFinish()`. */
	defer: false,
	pendingFinish: null as (() => void) | null,
	/** Metadane przekazane do kolejnych uploadów. */
	metadata: [] as Record<string, string>[],
	reset() {
		this.failAll = false;
		this.failNames = new Set();
		this.defer = false;
		this.pendingFinish = null;
		this.metadata = [];
	},
};

export function createTusMock() {
	class MockUpload {
		options: TusMockOptions;
		constructor(_file: unknown, options: TusMockOptions) {
			this.options = options;
		}
		start() {
			const metadata = this.options.metadata ?? {};
			tusMock.metadata.push(metadata);
			const name = metadata.originalName ?? "";
			const fail =
				tusMock.failAll || (name.length > 0 && tusMock.failNames.has(name));
			const finish = () => {
				if (fail) {
					this.options.onError(new Error("Błąd sieci"));
				} else {
					this.options.onProgress(50, 100);
					this.options.onSuccess();
				}
			};
			if (tusMock.defer) {
				tusMock.pendingFinish = finish;
			} else {
				finish();
			}
		}
	}
	return { Upload: MockUpload };
}
