// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OwnerStatsGrid } from "@/components/owner/OwnerStatsGrid";

describe("OwnerStatsGrid Component", () => {
	it("powinien prawidłowo wyrenderować statystyki i obsłużyć kliknięcie odświeżenia", () => {
		const onRefreshMock = vi.fn();

		render(
			<OwnerStatsGrid
				imagesCount={42}
				videosCount={5}
				totalBytes={128.5 * 1024 * 1024}
				onRefresh={onRefreshMock}
			/>,
		);

		expect(screen.getByText("42")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
		// Mock tłumaczeń zwraca sam klucz; rozmiar przekazywany jest jako sformatowane MB
		expect(screen.getByText("storageUnit")).toBeInTheDocument();
		expect(screen.getByText("statusActive")).toBeInTheDocument();

		const refreshBtn = screen.getByTitle("refreshBtn");
		fireEvent.click(refreshBtn);
		expect(onRefreshMock).toHaveBeenCalledTimes(1);
	});
});
