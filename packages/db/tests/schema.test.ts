import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as dbExports from "../src/index";
import { admins, cardSettings, galleries, mediaItems } from "../src/schema";

describe("Database Schema Definitions", () => {
	it("powinien poprawnie eksportować wszystkie tabele i obiekty z index", () => {
		expect(dbExports.galleries).toBeDefined();
		expect(dbExports.cardSettings).toBeDefined();
		expect(dbExports.mediaItems).toBeDefined();
		expect(dbExports.admins).toBeDefined();
		expect(dbExports.client).toBeDefined();
		expect(dbExports.db).toBeDefined();
		expect(dbExports.initDatabase).toBeDefined();
	});

	it("powinien definiować tabelę galleries ze wszystkimi wymaganymi kolumnami", () => {
		const cols = getTableColumns(galleries);
		expect(cols.id).toBeDefined();
		expect(cols.slug).toBeDefined();
		expect(cols.coupleNames).toBeDefined();
		expect(cols.weddingDate).toBeDefined();
		expect(cols.ownerEmail).toBeDefined();
		expect(cols.ownerPasswordHash).toBeDefined();
		expect(cols.accessPin).toBeDefined();
		expect(cols.isActive).toBeDefined();
		expect(cols.allowGuestDownloads).toBeDefined();
		expect(cols.allowVideos).toBeDefined();
		expect(cols.maxStorageBytes).toBeDefined();
		expect(cols.expiresAt).toBeDefined();
		expect(cols.gdriveRefreshToken).toBeDefined();
		expect(cols.gdriveAccountEmail).toBeDefined();
		expect(cols.gdriveRootFolderId).toBeDefined();
		expect(cols.gdrivePhotosFolderId).toBeDefined();
		expect(cols.gdriveVideosFolderId).toBeDefined();
		expect(cols.gdriveHiddenFolderId).toBeDefined();
		expect(cols.gdriveExportStatus).toBeDefined();
		expect(cols.gdriveExportProgress).toBeDefined();
		expect(cols.gdriveExportedAt).toBeDefined();
		expect(cols.createdAt).toBeDefined();
		expect(cols.updatedAt).toBeDefined();

		expect(cols.isActive.default).toBe(true);
		expect(cols.allowGuestDownloads.default).toBe(true);
		expect(cols.allowVideos.default).toBe(true);
		expect(cols.maxStorageBytes.default).toBe(0);
		expect(cols.gdriveExportStatus.default).toBe("idle");
	});

	it("powinien definiować tabelę cardSettings z domyślnymi stylami papeterii A6", () => {
		const cols = getTableColumns(cardSettings);
		expect(cols.id).toBeDefined();
		expect(cols.galleryId).toBeDefined();
		expect(cols.headline).toBeDefined();
		expect(cols.subheadline).toBeDefined();
		expect(cols.primaryColor).toBeDefined();
		expect(cols.accentColor).toBeDefined();
		expect(cols.paperSize).toBeDefined();
		expect(cols.customInstructions).toBeDefined();
		expect(cols.createdAt).toBeDefined();

		expect(cols.headline.default).toBe("Podziel się wspomnieniami!");
		expect(cols.primaryColor.default).toBe("#1E293B");
		expect(cols.accentColor.default).toBe("#D4AF37");
		expect(cols.paperSize.default).toBe("A6");
	});

	it("powinien definiować tabelę mediaItems z kolumnami dla pipeline mediów", () => {
		const cols = getTableColumns(mediaItems);
		expect(cols.id).toBeDefined();
		expect(cols.galleryId).toBeDefined();
		expect(cols.uploaderName).toBeDefined();
		expect(cols.fileType).toBeDefined();
		expect(cols.mimeType).toBeDefined();
		expect(cols.originalFileName).toBeDefined();
		expect(cols.fileSize).toBeDefined();
		expect(cols.storagePath).toBeDefined();
		expect(cols.thumbPath).toBeDefined();
		expect(cols.width).toBeDefined();
		expect(cols.height).toBeDefined();
		expect(cols.duration).toBeDefined();
		expect(cols.status).toBeDefined();
		expect(cols.gdriveFileId).toBeDefined();
		expect(cols.createdAt).toBeDefined();

		expect(cols.uploaderName.default).toBe("Gość weselny");
		expect(cols.status.default).toBe("ready");
	});

	it("powinien definiować tabelę admins dla konta administratora", () => {
		const cols = getTableColumns(admins);
		expect(cols.id).toBeDefined();
		expect(cols.username).toBeDefined();
		expect(cols.passwordHash).toBeDefined();
		expect(cols.createdAt).toBeDefined();
	});

	it("powinien poprawnie ewaluować relacje kluczy obcych (foreign keys)", () => {
		// Drizzle inline foreign keys store foreign table reference getters
		const inlineFksSymbol = Object.getOwnPropertySymbols(cardSettings).find(
			(s) => s.description === "drizzle:PgInlineForeignKeys",
		);
		if (inlineFksSymbol) {
			const fks = (cardSettings as unknown as Record<symbol, unknown[]>)[
				inlineFksSymbol
			];
			for (const fk of fks || []) {
				const foreignTable = (
					fk as { reference?: () => { foreignTable?: unknown } }
				)?.reference?.();
				expect(foreignTable).toBeDefined();
			}
		}

		const mediaFksSymbol = Object.getOwnPropertySymbols(mediaItems).find(
			(s) => s.description === "drizzle:PgInlineForeignKeys",
		);
		if (mediaFksSymbol) {
			const fks = (mediaItems as unknown as Record<symbol, unknown[]>)[
				mediaFksSymbol
			];
			for (const fk of fks || []) {
				const foreignTable = (
					fk as { reference?: () => { foreignTable?: unknown } }
				)?.reference?.();
				expect(foreignTable).toBeDefined();
			}
		}
	});
});
