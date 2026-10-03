"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { css, cx } from "styled-system/css";

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
			className={cx(
				css({
					position: "fixed",
					top: "4",
					right: "4",
					zIndex: "50",
					maxWidth: "md",
					p: "4",
					borderRadius: "2xl",
					boxShadow: "xl",
					borderWidth: "1px",
					display: "flex",
					alignItems: "flex-start",
					gap: "3",
					transition: "all 0.2s ease-in-out",
					background: isSuccess ? "#f0fdf4" : "#fef2f2",
					borderColor: isSuccess ? "#bbf7d0" : "#fecaca",
					color: isSuccess ? "#14532d" : "#7f1d1d",
				}),
			)}
		>
			{isSuccess ? (
				<CheckCircle2
					className={css({
						w: "5",
						h: "5",
						color: "#16a34a",
						flexShrink: 0,
						mt: "0.5",
					})}
					aria-hidden="true"
				/>
			) : (
				<AlertCircle
					className={css({
						w: "5",
						h: "5",
						color: "#dc2626",
						flexShrink: 0,
						mt: "0.5",
					})}
					aria-hidden="true"
				/>
			)}
			<div
				className={css({
					fontSize: "xs",
					fontWeight: "medium",
					flex: "1",
				})}
			>
				{toast.text}
			</div>
			<button
				type="button"
				onClick={onClose}
				aria-label={closeLabel}
				title={closeLabel}
				className={css({
					fontSize: "xs",
					fontWeight: "bold",
					opacity: "0.6",
					p: "1",
					borderRadius: "md",
					cursor: "pointer",
					_hover: { opacity: "1" },
					_focusVisible: {
						outline: "2px solid",
						outlineColor: "#94a3b8",
					},
				})}
			>
				✕
			</button>
		</div>
	);
}
