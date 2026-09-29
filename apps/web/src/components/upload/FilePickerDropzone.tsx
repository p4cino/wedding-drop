"use client";

import { Upload } from "lucide-react";
import type React from "react";
import { useRef } from "react";

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
			className={`w-full border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-2xl text-center cursor-pointer transition group focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${compact ? "p-5" : "p-6"}`}
		>
			<input
				ref={inputRef}
				type="file"
				multiple
				accept="image/*,video/*"
				onChange={handleChange}
				className="hidden"
			/>
			<div
				className={`mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition ${compact ? "w-10 h-10 mb-2" : "w-12 h-12 mb-3"}`}
			>
				<Upload
					className={compact ? "w-5 h-5" : "w-6 h-6"}
					aria-hidden="true"
				/>
			</div>
			<p className="text-sm font-semibold text-slate-800">{title}</p>
			<p className="text-xs text-slate-500 mt-1">{hint}</p>
		</button>
	);
}
