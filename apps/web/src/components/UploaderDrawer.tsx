"use client";

import { Camera, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AudioVideoRecorder from "@/components/upload/AudioVideoRecorder";
import FilePickerDropzone from "@/components/upload/FilePickerDropzone";
import UploadFileRow from "@/components/upload/UploadFileRow";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import { getActiveQuests, type QuestsConfig } from "@/lib/photo-quests";

const MAX_CAPTION_LENGTH = 140;

interface UploaderDrawerProps {
	gallerySlug: string;
	isOpen: boolean;
	onClose: () => void;
	onUploadSuccess?: () => void;
	// Kolory motywu wesela dla ramki zdjęcia z photobooth w przeglądarce (patrz `CameraCapture`).
	// Opcjonalne — komponent i tak posiada własne domyślne kolory generatora winietek.
	primaryColor?: string | null;
	accentColor?: string | null;
	questsConfig?: QuestsConfig | null;
	initialQuestId?: string | null;
}

export default function UploaderDrawer({
	gallerySlug,
	isOpen,
	onClose,
	onUploadSuccess,
	questsConfig,
	initialQuestId,
}: UploaderDrawerProps) {
	const [uploaderName, setUploaderName] = useState("");
	const [caption, setCaption] = useState("");
	const [selectedQuestId, setSelectedQuestId] = useState<string>(
		initialQuestId ?? "",
	);
	const t = useTranslations("GuestGallery");
	const activeQuests = useMemo(
		() => getActiveQuests(questsConfig),
		[questsConfig],
	);

	const queue = useUploadQueue({
		errorMessage: t("uploadError"),
		tooLargeMessage: t("uploadTooLarge"),
		onFinished: () => {
			setCaption("");
			onUploadSuccess?.();
		},
	});
	const { isUploading, clear: clearQueue } = queue;

	const handleClose = () => {
		if (isUploading) return;
		onClose();
	};

	// Zamknięcie (również z rodzica) nie może zostawić kolejki na kolejne otwarcie
	useEffect(() => {
		if (!isOpen) {
			clearQueue();
			setCaption("");
			setSelectedQuestId("");
		} else {
			setSelectedQuestId(initialQuestId ?? "");
		}
	}, [isOpen, initialQuestId, clearQueue]);

	// Escape zamyka panel (poza trwającą wysyłką); fokus zostaje wewnątrz okna
	const dialogRef = useRef<HTMLDivElement>(null);
	useEscapeKey(isOpen && !isUploading, onClose);
	useFocusTrap(dialogRef, isOpen);

	if (!isOpen) return null;

	const startUpload = () => {
		const name = uploaderName.trim() || t("defaultUploaderName");
		const trimmedCaption = caption.trim();
		const validQuestId = activeQuests.some((q) => q.id === selectedQuestId)
			? selectedQuestId
			: "";

		queue.start((file) => ({
			gallerySlug,
			uploaderName: name,
			originalName: file.name,
			fileType: file.type,
			...(trimmedCaption ? { caption: trimmedCaption } : {}),
			...(validQuestId ? { questId: validQuestId } : {}),
		}));
	};

	const justFinished = queue.phase === "done";
	const files = queue.items;

	return (
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="uploader-drawer-title"
			aria-describedby="uploader-drawer-desc"
			className={css({
				position: "fixed",
				inset: "0",
				zIndex: "50",
				display: "flex",
				alignItems: { base: "flex-end", sm: "center" },
				justifyContent: "center",
				backgroundColor: "rgba(0, 0, 0, 0.6)",
				backdropFilter: "blur(4px)",
				p: { base: "0", sm: "4" },
			})}
		>
			<div
				className={css({
					width: "full",
					maxWidth: "lg",
					backgroundColor: "white",
					borderTopRadius: { base: "3xl", sm: "3xl" },
					borderBottomRadius: { base: "none", sm: "3xl" },
					boxShadow: "2xl",
					overflow: "hidden",
					maxHeight: "90vh",
					display: "flex",
					flexDirection: "column",
				})}
			>
				{/* Nagłówek Drawer */}
				<div
					className={css({
						px: "6",
						py: "4",
						borderBottomWidth: "1px",
						borderColor: "slate.100",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						backgroundColor: "#FAF8F5",
					})}
				>
					<div>
						<h3
							id="uploader-drawer-title"
							className={cx(
								"font-serif-luxury",
								css({
									fontSize: "xl",
									fontWeight: "bold",
									color: "slate.900",
								}),
							)}
						>
							{t("drawerTitle")}
						</h3>
						<p
							id="uploader-drawer-desc"
							className={css({
								fontSize: "xs",
								color: "slate.500",
							})}
						>
							{t("drawerSubtitle")}
						</p>
					</div>
					<button
						type="button"
						onClick={handleClose}
						disabled={isUploading}
						aria-label={t("drawerCloseTitle")}
						title={t("drawerCloseTitle")}
						className={css({
							p: "2",
							color: "slate.400",
							borderRadius: "full",
							cursor: "pointer",
							_hover: { color: "slate.600", bg: "slate.100" },
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "amber.500",
							},
						})}
					>
						<X className={css({ w: "5", h: "5" })} aria-hidden="true" />
					</button>
				</div>

				{/* Zawartość */}
				<div
					className={css({
						p: "6",
						overflowY: "auto",
						display: "flex",
						flexDirection: "column",
						gap: "5",
						flex: "1",
					})}
				>
					{/* Podpis gościa */}
					<div>
						<label
							htmlFor="uploader-name-input"
							className={css({
								display: "block",
								fontSize: "xs",
								fontWeight: "semibold",
								textTransform: "uppercase",
								letterSpacing: "wider",
								color: "slate.600",
								mb: "1.5",
							})}
						>
							{t("signatureLabel")}
						</label>
						<Input
							id="uploader-name-input"
							type="text"
							placeholder={t("signaturePlaceholder")}
							value={uploaderName}
							onChange={(e) => setUploaderName(e.target.value)}
							disabled={isUploading}
						/>
					</div>

					{/* Krótki podpis zdjęcia (caption) */}
					<div>
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								mb: "1.5",
							})}
						>
							<label
								htmlFor="uploader-caption-input"
								className={css({
									display: "block",
									fontSize: "xs",
									fontWeight: "semibold",
									textTransform: "uppercase",
									letterSpacing: "wider",
									color: "slate.600",
								})}
							>
								{t("captionLabel")}
							</label>
							<span
								className={css({
									fontSize: "11px",
									color:
										caption.length >= MAX_CAPTION_LENGTH
											? "amber.700"
											: "slate.400",
								})}
							>
								{t("captionCounter", {
									current: caption.length,
								})}
							</span>
						</div>
						<Input
							id="uploader-caption-input"
							type="text"
							maxLength={MAX_CAPTION_LENGTH}
							placeholder={t("captionPlaceholder")}
							value={caption}
							onChange={(e) =>
								setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))
							}
							disabled={isUploading}
						/>
					</div>

					{/* Wybór Foto-Wyzwania (gdy aktywne w galerii) */}
					{activeQuests.length > 0 && (
						<div>
							<p
								className={css({
									display: "block",
									fontSize: "xs",
									fontWeight: "semibold",
									textTransform: "uppercase",
									letterSpacing: "wider",
									color: "slate.600",
									mb: "2",
								})}
							>
								{t("questSelectLabel")}
							</p>
							<div
								className={css({
									display: "flex",
									flexWrap: "wrap",
									gap: "2",
								})}
							>
								<button
									type="button"
									disabled={isUploading}
									aria-pressed={selectedQuestId === ""}
									onClick={() => setSelectedQuestId("")}
									className={css({
										px: "3",
										py: "1.5",
										borderRadius: "full",
										fontSize: "xs",
										fontWeight: "semibold",
										borderWidth: "1px",
										cursor: isUploading ? "not-allowed" : "pointer",
										transition: "all 0.15s ease",
										backgroundColor:
											selectedQuestId === "" ? "slate.900" : "slate.50",
										borderColor:
											selectedQuestId === "" ? "slate.900" : "slate.200",
										color: selectedQuestId === "" ? "white" : "slate.600",
									})}
								>
									{t("questSelectNone")}
								</button>
								{activeQuests.map((quest) => {
									const isSelected = selectedQuestId === quest.id;
									return (
										<button
											key={quest.id}
											type="button"
											disabled={isUploading}
											aria-pressed={isSelected}
											onClick={() =>
												setSelectedQuestId(isSelected ? "" : quest.id)
											}
											className={css({
												display: "inline-flex",
												alignItems: "center",
												gap: "1.5",
												px: "3",
												py: "1.5",
												borderRadius: "full",
												fontSize: "xs",
												fontWeight: "semibold",
												borderWidth: "1px",
												cursor: isUploading ? "not-allowed" : "pointer",
												transition: "all 0.15s ease",
												backgroundColor: isSelected ? "amber.600" : "amber.50",
												borderColor: isSelected ? "amber.600" : "amber.200",
												color: isSelected ? "white" : "amber.900",
											})}
										>
											<span aria-hidden="true">🎯</span>
											<span>{quest.title}</span>
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Strefa wyboru plików / aparat natywny */}
					<FilePickerDropzone
						disabled={isUploading}
						title={t("dropzoneTitle")}
						hint={t("dropzoneHint")}
						onFiles={queue.addFiles}
					/>

					{/* Nagrywanie audio/wideo */}
					<AudioVideoRecorder
						disabled={isUploading}
						onRecorded={(file) => queue.addFiles([file])}
					/>

					<Button
						type="button"
						variant="outline"
						disabled={isUploading}
						onClick={() =>
							document.getElementById("native-camera-input")?.click()
						}
						aria-label={t("cameraOptionBtn")}
						className={css({
							w: "full",
							py: "2.5",
							borderRadius: "xl",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "2",
							position: "relative",
							overflow: "hidden",
						})}
					>
						<Camera className={css({ w: "4", h: "4" })} aria-hidden="true" />
						{t("cameraOptionBtn")}
					</Button>
					<input
						id="native-camera-input"
						type="file"
						accept="image/*,video/*"
						capture="environment"
						onChange={(e) => {
							if (e.target.files?.length) {
								queue.addFiles(Array.from(e.target.files));
							}
							e.target.value = "";
						}}
						className={css({
							position: "absolute",
							width: "1px",
							height: "1px",
							padding: "0",
							margin: "-1px",
							overflow: "hidden",
							clip: "rect(0, 0, 0, 0)",
							border: "0",
						})}
					/>

					{justFinished && files.length === 0 && (
						<p
							className={css({
								fontSize: "sm",
								color: "emerald.600",
								fontWeight: "semibold",
								textAlign: "center",
							})}
							aria-live="polite"
						>
							{t("allUploaded")}
						</p>
					)}

					{/* Lista wybranych plików */}
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
								<span>{t("selectedCount", { count: files.length })}</span>
							</div>

							<div
								className={css({
									maxHeight: "48",
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
										progressAria={t("progressAria", {
											name: item.file.name,
										})}
										removeTitle={t("removeFileTitle", {
											name: item.file.name,
										})}
										onRemove={queue.remove}
									/>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Dolny przycisk akcji */}
				<div
					className={css({
						p: "4",
						backgroundColor: "white",
						borderTopWidth: "1px",
						borderColor: "slate.100",
						display: "flex",
						gap: "3",
					})}
				>
					{justFinished ? (
						<Button
							type="button"
							onClick={handleClose}
							className={css({
								w: "full",
								py: "3.5",
								bg: "emerald.600",
								_hover: { bg: "emerald.700" },
								color: "white",
								borderRadius: "2xl",
								fontWeight: "semibold",
								boxShadow: "lg",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "2",
							})}
						>
							<CheckCircle2
								className={css({ w: "5", h: "5" })}
								aria-hidden="true"
							/>
							{t("doneBtn")}
						</Button>
					) : (
						<Button
							type="button"
							onClick={startUpload}
							disabled={files.length === 0 || isUploading}
							className={css({
								w: "full",
								py: "3.5",
								bg: "amber.600",
								_hover: { bg: "amber.700" },
								color: "white",
								borderRadius: "2xl",
								fontWeight: "semibold",
								boxShadow: "lg",
								_disabled: {
									opacity: "0.5",
									cursor: "not-allowed",
								},
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "2",
							})}
						>
							{isUploading ? (
								<>
									<Loader2
										className={cx(css({ w: "5", h: "5" }), "animate-spin")}
										aria-hidden="true"
									/>
									{t("uploadingBtn")}
								</>
							) : (
								<>
									<Upload
										className={css({ w: "5", h: "5" })}
										aria-hidden="true"
									/>
									{t("submitBtn", { count: files.length })}
								</>
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
