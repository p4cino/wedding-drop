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
import { useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import CameraCapture from "@/components/CameraCapture";

interface UploaderDrawerProps {
	gallerySlug: string;
	isOpen: boolean;
	onClose: () => void;
	onUploadSuccess?: () => void;
	// Kolory motywu wesela dla ramki zdjęcia z photobooth w przeglądarce (patrz `CameraCapture`).
	// Opcjonalne — komponent i tak posiada własne domyślne kolory generatora winietek.
	primaryColor?: string | null;
	accentColor?: string | null;
}

interface UploadingFile {
	id: string;
	file: File;
	progress: number;
	status: "pending" | "uploading" | "completed" | "error";
	error?: string;
	uploadInstance?: tus.Upload;
}

export default function UploaderDrawer({
	gallerySlug,
	isOpen,
	onClose,
	onUploadSuccess,
	primaryColor,
	accentColor,
}: UploaderDrawerProps) {
	const [uploaderName, setUploaderName] = useState("");
	const [files, setFiles] = useState<UploadingFile[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [justFinished, setJustFinished] = useState(false);
	const [isCameraMode, setIsCameraMode] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("GuestGallery");

	// `getUserMedia` niedostępny (starsza przeglądarka / brak bezpiecznego kontekstu)
	// -> opcja "Zrób zdjęcie" jest po prostu niedostępna, zwykły wybór pliku pozostaje jedyną opcją.
	const isCameraSupported =
		typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

	const resetQueue = () => {
		setFiles([]);
		setJustFinished(false);
		setIsCameraMode(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleClose = () => {
		if (isUploading) return;
		resetQueue();
		onClose();
	};

	// Zamknięcie (również z rodzica) nie może zostawić kolejki na kolejne otwarcie
	useEffect(() => {
		if (!isOpen) {
			setFiles([]);
			setJustFinished(false);
			setIsCameraMode(false);
		}
	}, [isOpen]);

	// Obsługa klawisza Escape
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isUploading) {
				e.preventDefault();
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, isUploading, onClose]);

	if (!isOpen) return null;

	const addFileToQueue = (file: File) => {
		setJustFinished(false);
		setFiles((prev) => [
			...prev,
			{
				id: Math.random().toString(36).substring(2, 9),
				file,
				progress: 0,
				status: "pending" as const,
			},
		]);
	};

	const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files?.length) return;
		for (const f of Array.from(e.target.files)) addFileToQueue(f);
		// Allow selecting the same file again later
		e.target.value = "";
	};

	// Zdjęcie zrobione w przeglądarce (`CameraCapture`) trafia do dokładnie tej
	// samej kolejki `files`/`startUpload` co plik wybrany ręcznie z dysku —
	// zero rozgałęzień w logice wysyłki TUS poniżej.
	const handleCameraCapture = (file: File) => {
		addFileToQueue(file);
		setIsCameraMode(false);
	};

	const removeFile = (id: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== id));
	};

	const startUpload = async () => {
		if (files.length === 0) return;
		setIsUploading(true);
		setJustFinished(false);

		const name = uploaderName.trim() || t("defaultUploaderName");
		const failedIds = new Set<string>();

		for (let i = 0; i < files.length; i++) {
			const item = files[i];
			if (item.status === "completed") continue;

			await new Promise<void>((resolve) => {
				const tusEndpoint =
					typeof window !== "undefined"
						? `${window.location.origin}/api/upload/tus`
						: "/api/upload/tus";

				let lastUpdateTime = 0;
				let lastPercentage = -1;

				const upload = new tus.Upload(item.file, {
					endpoint: tusEndpoint,
					retryDelays: [0, 1000, 3000, 5000],
					chunkSize: 5 * 1024 * 1024, // 5MB chunki - idealne przy słabym LTE
					metadata: {
						gallerySlug,
						uploaderName: name,
						originalName: item.file.name,
						fileType: item.file.type,
					},
					onError: (error) => {
						console.error(`Błąd uploadu pliku ${item.file.name}:`, error);
						failedIds.add(item.id);
						setFiles((prev) =>
							prev.map((f) =>
								f.id === item.id
									? { ...f, status: "error", error: t("uploadError") }
									: f,
							),
						);
						resolve();
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
							setFiles((prev) =>
								prev.map((f) =>
									f.id === item.id
										? { ...f, progress: percentage, status: "uploading" }
										: f,
								),
							);
						}
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

		if (failedIds.size > 0) {
			setFiles((prev) => prev.filter((f) => failedIds.has(f.id)));
		} else {
			setFiles([]);
			setJustFinished(true);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}

		onUploadSuccess?.();
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="uploader-drawer-title"
			aria-describedby="uploader-drawer-desc"
			className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
		>
			<div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
				{/* Nagłówek Drawer */}
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#FAF8F5]">
					<div>
						<h3
							id="uploader-drawer-title"
							className="font-serif-luxury text-xl font-bold text-slate-900"
						>
							{t("drawerTitle")}
						</h3>
						<p id="uploader-drawer-desc" className="text-xs text-slate-500">
							{t("drawerSubtitle")}
						</p>
					</div>
					<button
						type="button"
						onClick={handleClose}
						disabled={isUploading}
						aria-label={t("drawerCloseTitle")}
						title={t("drawerCloseTitle")}
						className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
					>
						<X className="w-5 h-5" aria-hidden="true" />
					</button>
				</div>

				{/* Zawartość */}
				<div className="p-6 overflow-y-auto space-y-5 flex-1">
					{/* Podpis gościa */}
					<div>
						<label
							htmlFor="uploader-name-input"
							className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
						>
							{t("signatureLabel")}
						</label>
						<input
							id="uploader-name-input"
							type="text"
							placeholder={t("signaturePlaceholder")}
							value={uploaderName}
							onChange={(e) => setUploaderName(e.target.value)}
							disabled={isUploading}
							className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition text-sm bg-slate-50/50"
						/>
					</div>

					{/* Strefa wyboru plików / aparat w przeglądarce */}
					{isCameraMode ? (
						<CameraCapture
							primaryColor={primaryColor}
							accentColor={accentColor}
							disabled={isUploading}
							onCapture={handleCameraCapture}
							onCancel={() => setIsCameraMode(false)}
						/>
					) : (
						<>
							<button
								type="button"
								disabled={isUploading}
								onClick={() => fileInputRef.current?.click()}
								aria-label={t("dropzoneTitle")}
								className="w-full border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-2xl p-6 text-center cursor-pointer transition group focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<input
									ref={fileInputRef}
									type="file"
									multiple
									accept="image/*,video/*"
									onChange={handleFilesSelected}
									className="hidden"
								/>
								<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition">
									<Upload className="w-6 h-6" aria-hidden="true" />
								</div>
								<p className="text-sm font-semibold text-slate-800">
									{t("dropzoneTitle")}
								</p>
								<p className="text-xs text-slate-500 mt-1">
									{t("dropzoneHint")}
								</p>
							</button>

							{isCameraSupported && (
								<button
									type="button"
									disabled={isUploading}
									onClick={() => setIsCameraMode(true)}
									aria-label={t("cameraOptionBtn")}
									className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Camera className="w-4 h-4" aria-hidden="true" />
									{t("cameraOptionBtn")}
								</button>
							)}
						</>
					)}

					{justFinished && files.length === 0 && (
						<p
							className="text-sm text-emerald-600 font-semibold text-center"
							aria-live="polite"
						>
							{t("allUploaded")}
						</p>
					)}

					{/* Lista wybranych plików */}
					{files.length > 0 && (
						<div className="space-y-2.5">
							<div
								className="flex justify-between items-center text-xs text-slate-500 px-1"
								aria-live="polite"
							>
								<span>{t("selectedCount", { count: files.length })}</span>
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

												{/* Pasek postępu */}
												<div
													role="progressbar"
													aria-valuenow={item.progress}
													aria-valuemin={0}
													aria-valuemax={100}
													aria-label={t("progressAria", {
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
														aria-label={t("removeFileTitle", {
															name: item.file.name,
														})}
														title={t("removeFileTitle", {
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
						</div>
					)}
				</div>

				{/* Dolny przycisk akcji */}
				<div className="p-4 bg-white border-t border-slate-100 flex gap-3">
					{justFinished ? (
						<button
							type="button"
							onClick={handleClose}
							className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
						>
							<CheckCircle2 className="w-5 h-5" aria-hidden="true" />
							{t("doneBtn")}
						</button>
					) : (
						<button
							type="button"
							onClick={startUpload}
							disabled={files.length === 0 || isUploading}
							className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-2xl font-semibold shadow-lg shadow-amber-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
						>
							{isUploading ? (
								<>
									<Loader2
										className="w-5 h-5 animate-spin"
										aria-hidden="true"
									/>
									{t("uploadingBtn")}
								</>
							) : (
								<>
									<Upload className="w-5 h-5" aria-hidden="true" />
									{t("submitBtn", { count: files.length })}
								</>
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
