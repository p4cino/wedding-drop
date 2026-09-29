"use client";

import { useCallback, useEffect, useState } from "react";
import { useOwnerApi } from "@/hooks/useOwnerApi";
import {
	gdriveDisconnectedUpdate,
	gdriveStateFromPanel,
	gdriveUpdateFromPoll,
	gdriveUpdateFromSse,
	initialGDriveState,
} from "@/lib/gdrive-state";
import type {
	GDriveSseProgress,
	GDriveState,
	OwnerPanelData,
} from "@/lib/owner-types";

const POLL_INTERVAL_MS = 3000;

export type ExportStartResult =
	| { ok: true }
	| { ok: false; network: boolean; message?: string };

/**
 * Stan Google Drive panelu właściciela: jeden obiekt aktualizowany atomowo
 * z trzech źródeł (logowanie/sesja, SSE, polling) oraz akcje odłączenia i eksportu.
 */
export function useGDriveExport(slug: string, ownerToken: string) {
	const request = useOwnerApi(ownerToken);
	const [state, setState] = useState<GDriveState>(initialGDriveState);

	const applyServerState = useCallback((update: Partial<GDriveState>) => {
		setState((prev) => ({ ...prev, ...update }));
	}, []);

	const loadFromPanel = useCallback((data: OwnerPanelData) => {
		setState(gdriveStateFromPanel(data));
	}, []);

	const applySseProgress = useCallback(
		(progress: GDriveSseProgress | undefined) => {
			applyServerState(gdriveUpdateFromSse(progress));
		},
		[applyServerState],
	);

	// Fallbackowe odpytywanie statusu eksportu, gdy jest 'running' (SSE może zawieść)
	const isRunning = state.status === "running";
	useEffect(() => {
		if (!ownerToken || !isRunning) return;
		const interval = setInterval(async () => {
			const res = await request<Parameters<typeof gdriveUpdateFromPoll>[0]>(
				"GET",
				`/api/owner/${slug}/gdrive`,
			);
			if (res.ok && res.data) applyServerState(gdriveUpdateFromPoll(res.data));
		}, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [ownerToken, isRunning, slug, request, applyServerState]);

	const disconnect = useCallback(async (): Promise<boolean> => {
		const res = await request("DELETE", `/api/owner/${slug}/gdrive`);
		if (res.ok) applyServerState(gdriveDisconnectedUpdate);
		return res.ok;
	}, [request, slug, applyServerState]);

	/** Uruchamia eksport Google Drive (opcjonalnie razem z ukrytymi zdjęciami). */
	const startExport = useCallback(
		async (includeHidden: boolean): Promise<ExportStartResult> => {
			const res = await request<{ error?: string }>(
				"POST",
				`/api/owner/${slug}/gdrive/export`,
				{ includeHidden },
			);
			if (res.status === 0) return { ok: false, network: true };
			if (!res.ok)
				return { ok: false, network: false, message: res.data?.error };
			applyServerState({ status: "running" });
			return { ok: true };
		},
		[request, slug, applyServerState],
	);

	return {
		state,
		loadFromPanel,
		applySseProgress,
		disconnect,
		startExport,
	};
}
