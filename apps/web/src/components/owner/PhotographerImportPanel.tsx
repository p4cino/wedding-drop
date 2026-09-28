"use client";

import {
	AlertCircle,
	Camera,
	CheckCircle2,
	Image as ImageIcon,
	Loader2,
	Upload,
	Video,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useRef, useState } from "react";
import * as tus from "tus-js-client";

interface PhotographerImportPanelProps {
	gallerySlug: string;
	ownerToken: string;
	onImportSuccess?: () => void;
}

interface ImportingFile {
	id: string;
	file: File;
	progress: number;
	status: "pending" | "uploading" | "completed" | "error";
	error?: string;
}

/**
 * Uproszczony wariant UploaderDrawer.tsx dla masowego importu materiałów
 * profesjonalnego fotografa/kamerzysty przez właściciela galerii.
 * Reużywa identyczną konfigurację tus.Upload (endpoint, chunkSize, retryDelays),
 * różniącą się tylko dodatkowymi metadanymi (source, ownerToken) i brakiem pola podpisu gościa.
 * Import przechodzi przez dokładnie tę samą, ograniczoną kolejkę przetwarzania (p-queue concurrency: 2)
 * co uploady gości - patrz packages/media/src/media-processor.ts.
 */
export function PhotographerImportPanel({
	gallerySlug,
	ownerToken,
	onImportSuccess,
}: PhotographerImportPanelProps) {
	const t = useTranslations("OwnerPanel");
	const [files, setFiles] = useState<ImportingFile[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [justFinished, setJustFinished] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const completedCount = files.filter((f) => f.status === "completed").length;

	const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files?.length) return;
		setJustFinished(false);
		const selected = Array.from(e.target.files).map((f) => ({
			id: Math.random().toString(36).substring(2, 9),
			file: f,
			progress: 0,
			status: "pending" as const,
		}));
		setFiles((prev) => [...prev, ...selected]);
		e.target.value = "";
	};

	const removeFile = (id: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== id));
	};

	const startImport = async () => {
		if (files.length === 0 || !ownerToken) return;
		setIsUploading(true);
		setJustFinished(false);

		for (let i = 0; i < files.length; i++) {
			const item = files[i];
			if (item.status === "completed") continue;

			await new Promise<void>((resolve) => {
				const tusEndpoint =
					typeof window !== "undefined"
						? `${window.location.origin}/api/upload/tus`
						: "/api/upload/tus";

				const upload = new tus.Upload(item.file, {
					endpoint: tusEndpoint,
					retryDelays: [0, 1000, 3000, 5000],
					chunkSize: 5 * 1024 * 1024,
					metadata: {
						gallerySlug,
						originalName: item.file.name,
						fileType: item.file.type,
						source: "photographer",
						ownerToken,
					},
					onError: (error) => {
						console.error(
							`Błąd importu pliku fotografa ${item.file.name}:`,
							error,
						);
						setFiles((prev) =>
							prev.map((f) =>
								f.id === item.id
									? { ...f, status: "error", error: t("importError") }
									: f,
							),
						);
						resolve();
					},
					onProgress: (bytesUploaded, bytesTotal) => {
						const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
						setFiles((prev) =>
							prev.map((f) =>
								f.id === item.id
									? { ...f, progress: percentage, status: "uploading" }
									: f,
							),
						);
					},
					onSuccess: () => {
						setFiles((prev) =>
							prev.map((f) =>
								f.id === item.id
									? { ...f, progress: 100, status: "completed" }
									: f,
							),
						);
						resolve();
					},
				});

				upload.start();
			});
		}

		setIsUploading(false);
		setJustFinished(true);
		onImportSuccess?.();
	};

	const resetPanel = () => {
		setFiles([]);
		setJustFinished(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
					<Camera className="w-5 h-5" aria-hidden="true" />
				</div>
				<div>
					<h3 className="font-serif-luxury text-lg font-bold text-slate-900">
						{t("importTitle")}
					</h3>
					<p className="text-xs text-slate-500">{t("importSubtitle")}</p>
				</div>
			</div>

			<button
				type="button"
				disabled={isUploading}
				onClick={() => fileInputRef.current?.click()}
				aria-label={t("importDropzoneTitle")}
				className="w-full border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-2xl p-5 text-center cursor-pointer transition group focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*,video/*"
					onChange={handleFilesSelected}
					className="hidden"
				/>
				<div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition">
					<Upload className="w-5 h-5" aria-hidden="true" />
				</div>
				<p className="text-sm font-semibold text-slate-800">
					{t("importDropzoneTitle")}
				</p>
				<p className="text-xs text-slate-500 mt-1">{t("importDropzoneHint")}</p>
			</button>

			{justFinished && files.length > 0 && (
				<p
					className="text-sm text-emerald-600 font-semibold text-center"
					aria-live="polite"
				>
					{t("importAllUploaded", { count: completedCount })}
				</p>
			)}

			{files.length > 0 && (
				<div className="space-y-2.5">
					<div
						className="flex justify-between items-center text-xs text-slate-500 px-1"
						aria-live="polite"
					>
						<span>{t("importSelectedCount", { count: files.length })}</span>
						{!isUploading && (
							<button
								type="button"
								onClick={resetPanel}
								className="text-slate-400 hover:text-red-500 font-medium"
							>
								{t("importClearAll")}
							</button>
						)}
					</div>

					<div className="max-h-48 overflow-y-auto space-y-2 pr-1">
						{files.map((item) => {
							const isVid = item.file.type.startsWith("video");
							return (
								<div
									key={item.id}
									className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
								>
									<div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
										{isVid ? (
											<Video className="w-4 h-4" aria-hidden="true" />
										) : (
											<ImageIcon className="w-4 h-4" aria-hidden="true" />
										)}
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex justify-between items-center mb-1">
											<p className="truncate font-medium text-slate-800">
												{item.file.name}
											</p>
											<span className="text-slate-400 shrink-0 ml-2">
												{(item.file.size / (1024 * 1024)).toFixed(1)} MB
											</span>
										</div>

										<div
											role="progressbar"
											aria-valuenow={item.progress}
											aria-valuemin={0}
											aria-valuemax={100}
											aria-label={t("importProgressAria", {
												name: item.file.name,
											})}
											className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"
										>
											<div
												className={`h-full transition-all duration-300 ${
													item.status === "completed"
														? "bg-emerald-500"
														: item.status === "error"
															? "bg-red-500"
															: "bg-amber-500"
												}`}
												style={{ width: `${item.progress}%` }}
											/>
										</div>
										{item.status === "error" && (
											<p className="text-red-500 mt-1">{item.error}</p>
										)}
									</div>

									<div className="shrink-0">
										{item.status === "completed" && (
											<CheckCircle2
												className="w-5 h-5 text-emerald-500"
												aria-hidden="true"
											/>
										)}
										{item.status === "error" && (
											<AlertCircle
												className="w-5 h-5 text-red-500"
												aria-hidden="true"
											/>
										)}
										{item.status === "uploading" && (
											<Loader2
												className="w-4 h-4 animate-spin text-amber-600"
												aria-hidden="true"
											/>
										)}
										{item.status === "pending" && !isUploading && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													removeFile(item.id);
												}}
												aria-label={t("importRemoveFileTitle", {
													name: item.file.name,
												})}
												title={t("importRemoveFileTitle", {
													name: item.file.name,
												})}
												className="p-1 hover:text-red-500 text-slate-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded-md"
											>
												<X className="w-4 h-4" aria-hidden="true" />
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>

					<button
						type="button"
						onClick={startImport}
						disabled={files.length === 0 || isUploading || !ownerToken}
						className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-2xl font-semibold shadow-lg shadow-amber-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
					>
						{isUploading ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
								{t("importUploadingBtn")}
							</>
						) : (
							<>
								<Upload className="w-5 h-5" aria-hidden="true" />
								{t("importSubmitBtn", { count: files.length })}
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
