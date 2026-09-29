"use client";

import { Camera, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import FilePickerDropzone from "@/components/upload/FilePickerDropzone";
import UploadFileRow from "@/components/upload/UploadFileRow";
import { useUploadQueue } from "@/hooks/useUploadQueue";

interface PhotographerImportPanelProps {
	gallerySlug: string;
	ownerToken: string;
	onImportSuccess?: () => void;
}

/**
 * Masowy import materiałów profesjonalnego fotografa/kamerzysty przez właściciela galerii.
 * Współdzieli z UploaderDrawer.tsx kolejkę (`useUploadQueue`) i klienta TUS (`lib/tus-upload.ts`),
 * różniąc się tylko metadanymi (source, ownerToken) i brakiem pola podpisu gościa.
 * Import przechodzi przez dokładnie tę samą, ograniczoną kolejkę przetwarzania (p-queue concurrency: 2)
 * co uploady gości - patrz packages/media/src/media-processor.ts.
 */
export function PhotographerImportPanel({
	gallerySlug,
	ownerToken,
	onImportSuccess,
}: PhotographerImportPanelProps) {
	const t = useTranslations("OwnerPanel");
	const queue = useUploadQueue({
		errorMessage: t("importError"),
		onFinished: () => onImportSuccess?.(),
	});
	const { items: files, isUploading } = queue;

	const startImport = () => {
		if (!ownerToken) return;
		queue.start((file) => ({
			gallerySlug,
			originalName: file.name,
			fileType: file.type,
			source: "photographer",
			ownerToken,
		}));
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

			<FilePickerDropzone
				compact
				disabled={isUploading}
				title={t("importDropzoneTitle")}
				hint={t("importDropzoneHint")}
				onFiles={queue.addFiles}
			/>

			{queue.phase === "done" && (
				<p
					className="text-sm text-emerald-600 font-semibold text-center"
					aria-live="polite"
				>
					{t("importAllUploaded", { count: queue.completedCount })}
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
								onClick={queue.clear}
								className="text-slate-400 hover:text-red-500 font-medium"
							>
								{t("importClearAll")}
							</button>
						)}
					</div>

					<div className="max-h-48 overflow-y-auto space-y-2 pr-1">
						{files.map((item) => (
							<UploadFileRow
								key={item.id}
								item={item}
								isUploading={isUploading}
								progressAria={t("importProgressAria", { name: item.file.name })}
								removeTitle={t("importRemoveFileTitle", {
									name: item.file.name,
								})}
								onRemove={queue.remove}
							/>
						))}
					</div>

					<button
						type="button"
						onClick={startImport}
						disabled={isUploading || !ownerToken}
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
