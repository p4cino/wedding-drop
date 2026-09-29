"use client";

import { useCallback, useRef, useState } from "react";
import { uploadFileViaTus } from "@/lib/tus-upload";

export interface UploadItem {
	id: string;
	file: File;
	progress: number;
	status: "pending" | "uploading" | "completed" | "error";
	error?: string;
}

/**
 * `idle` — kolejka gotowa (także po częściowym/całkowitym błędzie),
 * `uploading` — trwa sekwencyjna wysyłka,
 * `done` — wszystkie pliki ostatniej wysyłki zakończyły się sukcesem.
 */
export type UploadPhase = "idle" | "uploading" | "done";

interface UseUploadQueueOptions {
	/** Tekst błędu pokazywany przy nieudanym pliku (już przetłumaczony). */
	errorMessage: string;
	/** Wołane raz po zakończeniu wysyłki, tylko gdy co najmniej jeden plik się powiódł. */
	onFinished?: (result: { completed: number; failed: number }) => void;
}

let nextId = 0;
const createItem = (file: File): UploadItem => ({
	id: `upload-${++nextId}`,
	file,
	progress: 0,
	status: "pending",
});

/**
 * Kolejka uploadu TUS wspólna dla gościa i importu fotografa. Pliki są wysyłane
 * po kolei. Po zakończeniu udane pliki znikają z kolejki, a nieudane zostają
 * z komunikatem błędu (ponowna wysyłka pomija już wysłane).
 */
export function useUploadQueue({
	errorMessage,
	onFinished,
}: UseUploadQueueOptions) {
	const [items, setItems] = useState<UploadItem[]>([]);
	const [phase, setPhase] = useState<UploadPhase>("idle");
	const [completedCount, setCompletedCount] = useState(0);
	const itemsRef = useRef(items);
	itemsRef.current = items;
	const optionsRef = useRef({ errorMessage, onFinished });
	optionsRef.current = { errorMessage, onFinished };

	const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
		setItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, ...changes } : item)),
		);
	}, []);

	const addFiles = useCallback((files: File[]) => {
		setPhase((current) => (current === "done" ? "idle" : current));
		setItems((prev) => [...prev, ...files.map(createItem)]);
	}, []);

	const remove = useCallback((id: string) => {
		setItems((prev) => prev.filter((item) => item.id !== id));
	}, []);

	const clear = useCallback(() => {
		setItems([]);
		setPhase("idle");
	}, []);

	const start = useCallback(
		async (metadataFor: (file: File) => Record<string, string>) => {
			const queue = itemsRef.current.filter(
				(item) => item.status !== "completed",
			);
			if (queue.length === 0) return;
			setPhase("uploading");

			const failed = new Set<string>();
			let completed = 0;

			for (const item of queue) {
				patch(item.id, { status: "uploading", progress: 0, error: undefined });
				const result = await uploadFileViaTus(
					item.file,
					metadataFor(item.file),
					(progress) => patch(item.id, { progress, status: "uploading" }),
				);
				if (result === "completed") {
					completed++;
					patch(item.id, { status: "completed", progress: 100 });
				} else {
					failed.add(item.id);
					patch(item.id, {
						status: "error",
						error: optionsRef.current.errorMessage,
					});
				}
			}

			setItems((prev) => prev.filter((item) => failed.has(item.id)));
			setCompletedCount(completed);
			setPhase(failed.size === 0 && completed > 0 ? "done" : "idle");
			if (completed > 0) {
				optionsRef.current.onFinished?.({ completed, failed: failed.size });
			}
		},
		[patch],
	);

	return {
		items,
		phase,
		isUploading: phase === "uploading",
		/** Liczba plików wysłanych w ostatniej wysyłce. */
		completedCount,
		addFiles,
		remove,
		clear,
		start,
	};
}
