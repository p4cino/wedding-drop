"use client";

import {
	AlertCircle,
	CheckCircle2,
	Image as ImageIcon,
	Loader2,
	Video,
	X,
} from "lucide-react";
import { css, cx } from "styled-system/css";
import type { UploadItem } from "@/hooks/useUploadQueue";
import { formatMegabytes } from "@/lib/format";

interface UploadFileRowProps {
	item: UploadItem;
	/** Ukrywa przycisk usuwania w trakcie wysyłki. */
	isUploading: boolean;
	progressAria: string;
	removeTitle: string;
	onRemove: (id: string) => void;
}

const PROGRESS_COLOR: Record<UploadItem["status"], string> = {
	pending: css({ backgroundColor: "amber.500" }),
	uploading: css({ backgroundColor: "amber.500" }),
	completed: css({ backgroundColor: "emerald.500" }),
	error: css({ backgroundColor: "red.500" }),
};

export default function UploadFileRow({
	item,
	isUploading,
	progressAria,
	removeTitle,
	onRemove,
}: UploadFileRowProps) {
	const isVideo = item.file.type.startsWith("video");
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				gap: "3",
				p: "2.5",
				backgroundColor: "slate.50",
				borderRadius: "xl",
				borderWidth: "1px",
				borderColor: "slate.100",
				fontSize: "xs",
			})}
		>
			<div
				className={css({
					w: "8",
					h: "8",
					borderRadius: "lg",
					backgroundColor: "slate.200",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "slate.600",
					flexShrink: 0,
				})}
			>
				{isVideo ? (
					<Video className={css({ w: "4", h: "4" })} aria-hidden="true" />
				) : (
					<ImageIcon className={css({ w: "4", h: "4" })} aria-hidden="true" />
				)}
			</div>

			<div className={css({ flex: "1", minW: 0 })}>
				<div
					className={css({
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: "1",
					})}
				>
					<p
						className={css({
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							fontWeight: "medium",
							color: "slate.800",
						})}
					>
						{item.file.name}
					</p>
					<span
						className={css({
							color: "slate.400",
							flexShrink: 0,
							ml: "2",
						})}
					>
						{formatMegabytes(item.file.size)} MB
					</span>
				</div>

				<div
					role="progressbar"
					aria-valuenow={item.progress}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={progressAria}
					className={css({
						w: "full",
						backgroundColor: "slate.200",
						h: "1.5",
						borderRadius: "full",
						overflow: "hidden",
					})}
				>
					<div
						className={cx(
							css({ h: "full", transition: "all 300ms ease" }),
							PROGRESS_COLOR[item.status],
						)}
						style={{ width: `${item.progress}%` }}
					/>
				</div>
				{item.status === "error" && item.error && (
					<p className={css({ color: "red.500", mt: "1" })}>{item.error}</p>
				)}
			</div>

			<div className={css({ flexShrink: 0 })}>
				{item.status === "completed" && (
					<CheckCircle2
						className={css({ w: "5", h: "5", color: "emerald.500" })}
						aria-hidden="true"
					/>
				)}
				{item.status === "error" && (
					<AlertCircle
						className={css({ w: "5", h: "5", color: "red.500" })}
						aria-hidden="true"
					/>
				)}
				{item.status === "uploading" && (
					<Loader2
						className={css({
							w: "4",
							h: "4",
							animation: "spin 1s linear infinite",
							color: "amber.600",
						})}
						aria-hidden="true"
					/>
				)}
				{item.status === "pending" && !isUploading && (
					<button
						type="button"
						data-testid="remove-file-btn"
						onClick={(e) => {
							e.stopPropagation();
							onRemove(item.id);
						}}
						aria-label={removeTitle}
						title={removeTitle}
						className={css({
							p: "1",
							color: "slate.400",
							borderRadius: "md",
							cursor: "pointer",
							_hover: { color: "red.500" },
							_focusVisible: {
								outline: "none",
								boxShadow: "0 0 0 2px var(--colors-red-400)",
							},
						})}
					>
						<X className={css({ w: "4", h: "4" })} aria-hidden="true" />
					</button>
				)}
			</div>
		</div>
	);
}
