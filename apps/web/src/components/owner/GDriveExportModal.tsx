"use client";

import { Cloud, Loader2, Play } from "lucide-react";
import type React from "react";
import { useEffect } from "react";

interface GDriveExportModalProps {
	isOpen: boolean;
	coupleNames: string;
	includeHidden: boolean;
	setIncludeHidden: (val: boolean) => void;
	exportLoading: boolean;
	onClose: () => void;
	onStartExport: () => void;
}

export const GDriveExportModal: React.FC<GDriveExportModalProps> = ({
	isOpen,
	coupleNames,
	includeHidden,
	setIncludeHidden,
	exportLoading,
	onClose,
	onStartExport,
}) => {
	// Obsługa klawisza Escape
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !exportLoading) {
				e.preventDefault();
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, exportLoading, onClose]);

	if (!isOpen) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="gdrive-export-modal-title"
			className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
		>
			<div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
						<Cloud className="w-5 h-5" aria-hidden="true" />
					</div>
					<div>
						<h3
							id="gdrive-export-modal-title"
							className="text-base font-bold text-slate-900"
						>
							Eksport na Dysk Google
						</h3>
						<p className="text-xs text-slate-500">
							Wybierz zakres przesyłanych multimediów
						</p>
					</div>
				</div>

				<fieldset className="space-y-3 text-xs border-0 p-0 m-0">
					<legend className="sr-only">Wybierz zakres eksportu</legend>

					<label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition focus-within:ring-2 focus-within:ring-amber-500/30">
						<input
							type="radio"
							name="export_scope"
							checked={includeHidden}
							onChange={() => setIncludeHidden(true)}
							className="mt-0.5 text-amber-600 focus:ring-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500"
						/>
						<div>
							<span className="font-semibold text-slate-900 block">
								Prześlij wszystko (w tym ukryte)
							</span>
							<span className="text-slate-500 block mt-0.5">
								Zdjęcia ukryte przed gośćmi trafią do dedykowanego podfolderu{" "}
								<strong>„Ukryte”</strong> na Twoim Dysku.
							</span>
						</div>
					</label>

					<label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition focus-within:ring-2 focus-within:ring-amber-500/30">
						<input
							type="radio"
							name="export_scope"
							checked={!includeHidden}
							onChange={() => setIncludeHidden(false)}
							className="mt-0.5 text-amber-600 focus:ring-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500"
						/>
						<div>
							<span className="font-semibold text-slate-900 block">
								Tylko widoczne multimedia
							</span>
							<span className="text-slate-500 block mt-0.5">
								Pliki oznaczone jako ukryte zostaną pominięte podczas eksportu.
							</span>
						</div>
					</label>
				</fieldset>

				<div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
					<p>
						📁 Na Twoim Dysku Google zostanie utworzony folder:
						<br />
						<span className="font-mono font-semibold text-slate-800">
							WeddingDrop - {coupleNames || "Para Młoda"}
						</span>
					</p>
					<p className="text-slate-500">
						Pliki zostaną rozpakowane i zachowają oryginalną jakość 1:1.
					</p>
				</div>

				<div className="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onClick={onClose}
						disabled={exportLoading}
						className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
					>
						Anuluj
					</button>
					<button
						type="button"
						onClick={onStartExport}
						disabled={exportLoading}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
					>
						{exportLoading ? (
							<>
								<Loader2
									className="w-3.5 h-3.5 animate-spin"
									aria-hidden="true"
								/>
								<span>Inicjalizacja...</span>
							</>
						) : (
							<>
								<Play className="w-3.5 h-3.5" aria-hidden="true" />
								<span>Rozpocznij eksport</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};
