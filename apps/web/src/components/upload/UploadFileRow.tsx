"use client";

import {
	AlertCircle,
	CheckCircle2,
	Image as ImageIcon,
	Loader2,
	Video,
	X,
} from "lucide-react";
import type { UploadItem } from "@/hooks/useUploadQueue";

interface UploadFileRowProps {
	item: UploadItem;
	/** Ukrywa przycisk usuwania w trakcie wysyłki. */
	isUploading: boolean;
	progressAria: string;
	removeTitle: string;
	onRemove: (id: string) => void;
}

const PROGRESS_COLOR: Record<UploadItem["status"], string> = {
	pending: "bg-amber-500",
	uploading: "bg-amber-500",
	completed: "bg-emerald-500",
	error: "bg-red-500",
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
		<div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
			<div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
				{isVideo ? (
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
					aria-label={progressAria}
					className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"
				>
					<div
						className={`h-full transition-all duration-300 ${PROGRESS_COLOR[item.status]}`}
						style={{ width: `${item.progress}%` }}
					/>
				</div>
				{item.status === "error" && item.error && (
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
					<AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
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
							onRemove(item.id);
						}}
						aria-label={removeTitle}
						title={removeTitle}
						className="p-1 hover:text-red-500 text-slate-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded-md"
					>
						<X className="w-4 h-4" aria-hidden="true" />
					</button>
				)}
			</div>
		</div>
	);
}
