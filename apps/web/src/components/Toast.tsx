"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface ToastMessage {
	type: "success" | "error";
	text: string;
}

interface ToastProps {
	toast: ToastMessage | null;
	closeLabel: string;
	onClose: () => void;
}

export default function Toast({ toast, closeLabel, onClose }: ToastProps) {
	if (!toast) return null;
	const isSuccess = toast.type === "success";
	return (
		<div
			role={isSuccess ? "status" : "alert"}
			aria-live={isSuccess ? "polite" : "assertive"}
			className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
				isSuccess
					? "bg-emerald-50 border-emerald-200 text-emerald-900"
					: "bg-red-50 border-red-200 text-red-900"
			}`}
		>
			{isSuccess ? (
				<CheckCircle2
					className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
					aria-hidden="true"
				/>
			) : (
				<AlertCircle
					className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
					aria-hidden="true"
				/>
			)}
			<div className="text-xs font-medium flex-1">{toast.text}</div>
			<button
				type="button"
				onClick={onClose}
				aria-label={closeLabel}
				title={closeLabel}
				className="text-xs font-bold opacity-60 hover:opacity-100 p-1 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none rounded"
			>
				✕
			</button>
		</div>
	);
}
