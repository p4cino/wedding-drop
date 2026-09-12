import { describe, expect, it } from "vitest";
import * as dbModule from "../src/index";

describe("Database Index Module Exports", () => {
	it("powinien eksportować wszystkie elementy z client i schema", () => {
		expect(dbModule.client).toBeDefined();
		expect(dbModule.db).toBeDefined();
		expect(dbModule.initDatabase).toBeTypeOf("function");
		expect(dbModule.galleries).toBeDefined();
		expect(dbModule.cardSettings).toBeDefined();
		expect(dbModule.mediaItems).toBeDefined();
		expect(dbModule.admins).toBeDefined();
	});
});
