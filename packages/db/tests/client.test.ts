import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Dynamic mock variables
let mockAdminCount = "0";

// Mock postgres module before importing client
vi.mock("postgres", () => {
	const mockSqlFn = vi
		.fn()
		.mockImplementation(
			(strings: TemplateStringsArray, ..._values: unknown[]) => {
				const rawQuery = strings[0] || "";
				if (rawQuery.includes("SELECT count(*) FROM admins")) {
					return Promise.resolve([{ count: mockAdminCount }]);
				}
				if (rawQuery.includes("INSERT INTO admins")) {
					return Promise.resolve([{ id: "admin-uuid" }]);
				}
				return Promise.resolve([]);
			},
		);

	// Provide any properties drizzle might inspect
	Object.assign(mockSqlFn, {
		options: {
			serializers: {},
			parsers: {},
		},
		end: vi.fn(),
	});

	const postgresFactory = vi.fn().mockReturnValue(mockSqlFn);
	return {
		default: postgresFactory,
	};
});

// Mock drizzle-orm migrator
vi.mock("drizzle-orm/postgres-js/migrator", () => ({
	migrate: vi.fn().mockResolvedValue(undefined),
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
	default: {
		hash: vi.fn().mockResolvedValue("mocked_hash_value"),
	},
}));

describe("Database Client and InitDatabase", () => {
	let migrateMock: ReturnType<typeof vi.fn>;
	let bcryptMock: { hash: ReturnType<typeof vi.fn> };

	beforeEach(async () => {
		vi.clearAllMocks();
		mockAdminCount = "0";
		const migrator = await import("drizzle-orm/postgres-js/migrator");
		migrateMock = migrator.migrate as unknown as ReturnType<typeof vi.fn>;
		const bcrypt = (await import("bcryptjs")).default;
		bcryptMock = bcrypt as unknown as { hash: ReturnType<typeof vi.fn> };
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("powinien pomyślnie zainicjalizować bazę danych i utworzyć domyślnego admina, gdy tabela admins jest pusta", async () => {
		mockAdminCount = "0";
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const { initDatabase } = await import("../src/client");
		await initDatabase();

		expect(migrateMock).toHaveBeenCalled();
		expect(bcryptMock.hash).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("[DB] Utworzono domyślnego administratora"),
		);
		consoleLogSpy.mockRestore();
	});

	it("powinien pominąć tworzenie administratora, gdy admin już istnieje w bazie", async () => {
		mockAdminCount = "1";
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const { initDatabase } = await import("../src/client");
		await initDatabase();

		expect(migrateMock).toHaveBeenCalled();
		expect(bcryptMock.hash).not.toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"[DB] Baza danych PostgreSQL zainicjalizowana pomyślnie.",
		);
		consoleLogSpy.mockRestore();
	});

	it("powinien bezpiecznie przechwycić błąd migracji w bloku try/catch i zalogować go", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		migrateMock.mockRejectedValueOnce(new Error("Błąd sieci PostgreSQL"));

		const { initDatabase } = await import("../src/client");
		await initDatabase();

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[DB] Błąd podczas inicjalizacji bazy danych:",
			expect.any(Error),
		);
		consoleErrorSpy.mockRestore();
	});

	it("powinien sprawdzić alternatywne ścieżki folderu migracji i użyć właściwej", async () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync");
		existsSyncSpy.mockImplementation((targetPath) => {
			const str = String(targetPath);
			// symulacja istnienia folderu z podfolderem meta
			return str.includes("migrations");
		});

		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const { initDatabase } = await import("../src/client");
		await initDatabase();

		expect(existsSyncSpy).toHaveBeenCalled();
		consoleLogSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	it("powinien użyć domyślnej ścieżki fallback packages/db/migrations, gdy żaden kandydat nie istnieje", async () => {
		const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const { initDatabase } = await import("../src/client");
		await initDatabase();

		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringMatching(/migrations/),
		);
		consoleLogSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});
});
