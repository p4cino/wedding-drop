"use client";

import { Camera, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import FilePickerDropzone from "@/components/upload/FilePickerDropzone";
import UploadFileRow from "@/components/upload/UploadFileRow";
import { useUploadQueue } from "@/hooks/useUploadQueue";

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

export default function UploaderDrawer({
	gallerySlug,
	isOpen,
	onClose,
	onUploadSuccess,
	primaryColor,
	accentColor,
}: UploaderDrawerProps) {
	const [uploaderName, setUploaderName] = useState("");
	const [isCameraMode, setIsCameraMode] = useState(false);
	const t = useTranslations("GuestGallery");
	const queue = useUploadQueue({
		errorMessage: t("uploadError"),
		onFinished: () => onUploadSuccess?.(),
	});
	const { isUploading, clear: clearQueue } = queue;

	// `getUserMedia` niedostępny (starsza przeglądarka / brak bezpiecznego kontekstu)
	// -> opcja "Zrób zdjęcie" jest po prostu niedostępna, zwykły wybór pliku pozostaje jedyną opcją.
	const isCameraSupported =
		typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

	const handleClose = () => {
		if (isUploading) return;
		onClose();
	};

	// Zamknięcie (również z rodzica) nie może zostawić kolejki na kolejne otwarcie
	useEffect(() => {
		if (!isOpen) {
			clearQueue();
			setIsCameraMode(false);
		}
	}, [isOpen, clearQueue]);

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

	// Zdjęcie zrobione w przeglądarce (`CameraCapture`) trafia do dokładnie tej
	// samej kolejki co plik wybrany ręcznie z dysku — zero rozgałęzień w logice wysyłki.
	const handleCameraCapture = (file: File) => {
		queue.addFiles([file]);
		setIsCameraMode(false);
	};

	const startUpload = () => {
		const name = uploaderName.trim() || t("defaultUploaderName");
		queue.start((file) => ({
			gallerySlug,
			uploaderName: name,
			originalName: file.name,
			fileType: file.type,
		}));
	};

	const justFinished = queue.phase === "done";
	const files = queue.items;

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
							<FilePickerDropzone
								disabled={isUploading}
								title={t("dropzoneTitle")}
								hint={t("dropzoneHint")}
								onFiles={queue.addFiles}
							/>

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
								{files.map((item) => (
									<UploadFileRow
										key={item.id}
										item={item}
										isUploading={isUploading}
										progressAria={t("progressAria", { name: item.file.name })}
										removeTitle={t("removeFileTitle", { name: item.file.name })}
										onRemove={queue.remove}
									/>
								))}
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
