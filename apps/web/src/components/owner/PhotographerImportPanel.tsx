"use client";

import { Camera, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";
import { Button } from "@/components/ui/button";
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
		<div
			className={css({
				backgroundColor: "white",
				p: { base: "4", sm: "6" },
				borderRadius: "2xl",
				borderWidth: "1px",
				borderColor: "slate.200",
				display: "flex",
				flexDirection: "column",
				gap: "4",
			})}
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "3",
				})}
			>
				<div
					className={css({
						w: "10",
						h: "10",
						borderRadius: "xl",
						backgroundColor: "amber.100",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "wedding.gold",
						flexShrink: 0,
					})}
				>
					<Camera className={css({ w: "5", h: "5" })} aria-hidden="true" />
				</div>
				<div>
					<h3
						className={css({
							fontFamily: "serif",
							fontSize: "lg",
							fontWeight: "bold",
							color: "wedding.slate",
						})}
					>
						{t("importTitle")}
					</h3>
					<p className={css({ fontSize: "xs", color: "slate.500" })}>
						{t("importSubtitle")}
					</p>
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
					className={css({
						fontSize: "sm",
						color: "emerald.600",
						fontWeight: "semibold",
						textAlign: "center",
					})}
					aria-live="polite"
				>
					{t("importAllUploaded", { count: queue.completedCount })}
				</p>
			)}

			{files.length > 0 && (
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "2.5",
					})}
				>
					<div
						className={css({
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: "xs",
							color: "slate.500",
							px: "1",
						})}
						aria-live="polite"
					>
						<span>{t("importSelectedCount", { count: files.length })}</span>
						{!isUploading && (
							<button
								type="button"
								onClick={queue.clear}
								className={css({
									color: "slate.400",
									fontWeight: "medium",
									borderWidth: "0",
									backgroundColor: "transparent",
									cursor: "pointer",
									_hover: { color: "red.500" },
								})}
							>
								{t("importClearAll")}
							</button>
						)}
					</div>

					<div
						className={css({
							maxH: "48",
							overflowY: "auto",
							display: "flex",
							flexDirection: "column",
							gap: "2",
							pr: "1",
						})}
					>
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

					<Button
						type="button"
						onClick={startImport}
						disabled={isUploading || !ownerToken}
						className={css({
							w: "full",
							py: "3",
							background: "linear-gradient(to right, #b45309, #d97706)",
							_hover: {
								background: "linear-gradient(to right, #92400e, #b45309)",
							},
							_disabled: {
								opacity: 0.5,
								cursor: "not-allowed",
							},
							color: "white",
							borderRadius: "2xl",
							fontWeight: "semibold",
							boxShadow: "0 10px 15px -3px rgba(180, 83, 9, 0.25)",
							transition: "all 0.15s ease",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "2",
							cursor: "pointer",
						})}
					>
						{isUploading ? (
							<>
								<Loader2
									className={css({
										w: "5",
										h: "5",
										animation: "spin 1s linear infinite",
									})}
									aria-hidden="true"
								/>
								{t("importUploadingBtn")}
							</>
						) : (
							<>
								<Upload
									className={css({ w: "5", h: "5" })}
									aria-hidden="true"
								/>
								{t("importSubmitBtn", { count: files.length })}
							</>
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
