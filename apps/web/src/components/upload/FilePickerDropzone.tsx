"use client";

import { Upload } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { css } from "styled-system/css";

interface FilePickerDropzoneProps {
	disabled?: boolean;
	title: string;
	hint: string;
	/** Mniejsza wersja (panel importu) zamiast pełnej (drawer gościa). */
	compact?: boolean;
	onFiles: (files: File[]) => void;
}

export default function FilePickerDropzone({
	disabled,
	title,
	hint,
	compact = false,
	onFiles,
}: FilePickerDropzoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files?.length) return;
		onFiles(Array.from(e.target.files));
		// Pozwala wybrać ten sam plik ponownie
		e.target.value = "";
	};

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={() => inputRef.current?.click()}
			aria-label={title}
			className={`group ${css({
				w: "full",
				borderWidth: "2px",
				borderStyle: "dashed",
				borderColor: "amber.300",
				_hover: { borderColor: "amber.500" },
				backgroundColor: "rgba(255, 251, 235, 0.4)", // amber-50/40 approx
				borderRadius: "2xl",
				textAlign: "center",
				cursor: "pointer",
				transition: "all 0.3s ease",
				_focusVisible: {
					outline: "none",
					boxShadow: "0 0 0 2px var(--colors-amber-500)",
				},
				_disabled: { opacity: 0.5, cursor: "not-allowed" },
				p: compact ? "5" : "6",
			})}`}
		>
			<input
				ref={inputRef}
				type="file"
				multiple
				accept="image/*,video/*,audio/*"
				capture="environment"
				onChange={handleChange}
				className={css({ display: "none" })}
			/>
			<div
				className={css({
					mx: "auto",
					borderRadius: "full",
					backgroundColor: "amber.100",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "amber.700",
					transition: "transform 0.3s ease",
					_groupHover: { transform: "scale(1.1)" },
					w: compact ? "10" : "12",
					h: compact ? "10" : "12",
					mb: compact ? "2" : "3",
				})}
			>
				<Upload
					className={css({
						w: compact ? "5" : "6",
						h: compact ? "5" : "6",
					})}
					aria-hidden="true"
				/>
			</div>
			<p
				className={css({
					fontSize: "sm",
					fontWeight: "semibold",
					color: "slate.800",
				})}
			>
				{title}
			</p>
			<p
				className={css({
					fontSize: "xs",
					color: "slate.500",
					mt: "1",
				})}
			>
				{hint}
			</p>
		</button>
	);
}
