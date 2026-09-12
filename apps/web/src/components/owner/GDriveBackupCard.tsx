"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowUpRight,
	CheckCircle2,
	Cloud,
	Loader2,
	Play,
	Unlink,
} from "lucide-react";
import type React from "react";

export interface GDriveProgressData {
	totalFiles?: number;
	processedFiles?: number;
	totalBytes?: number;
	processedBytes?: number;
	currentFile?: string | null;
	error?: string | null;
}

interface GDriveBackupCardProps {
	hasGDrive: boolean;
	gdriveEmail: string | null;
	gdriveStatus: string;
	gdriveProgress: GDriveProgressData | null;
	gdriveFolderId: string | null;
	gdriveExportedAt: string | null;
	isGDriveConfigured: boolean;
	onConnect: () => void;
	onDisconnect: () => void;
	onOpenExportModal: () => void;
}

export const GDriveBackupCard: React.FC<GDriveBackupCardProps> = ({
	hasGDrive,
	gdriveEmail,
	gdriveStatus,
	gdriveProgress,
	gdriveFolderId,
	gdriveExportedAt,
	isGDriveConfigured,
	onConnect,
	onDisconnect,
	onOpenExportModal,
}) => {
	const progressPercent =
		gdriveProgress?.totalFiles && gdriveProgress?.totalFiles > 0
			? Math.min(
					100,
					Math.round(
						((gdriveProgress.processedFiles ?? 0) / gdriveProgress.totalFiles) *
							100,
					),
				)
			: 0;

	const processedMB = gdriveProgress?.processedBytes
		? (gdriveProgress.processedBytes / (1024 * 1024)).toFixed(1)
		: "0";
	const totalProgMB = gdriveProgress?.totalBytes
		? (gdriveProgress.totalBytes / (1024 * 1024)).toFixed(1)
		: "0";

	return (
		<div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
			<div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-amber-500/5 via-amber-50/20 to-transparent border-b border-slate-100">
				<div className="flex items-start gap-4">
					<div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
						<Cloud className="w-6 h-6" />
					</div>
					<div>
						<div className="flex items-center gap-2 mb-1 flex-wrap">
							<h2 className="text-lg font-bold text-slate-900 font-serif-luxury">
								Kopia w chmurze Google Drive
							</h2>
							{hasGDrive ? (
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
									<CheckCircle2 className="w-3 h-3" />
									Połączono ({gdriveEmail || "Konto Google"})
								</span>
							) : (
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
									Niepodłączono
								</span>
							)}
						</div>
						<p className="text-xs text-slate-500 max-w-xl">
							Prześlij wszystkie zdjęcia i filmy z wesela w 100% oryginalnej
							rozdzielczości bezpośrednio na swój prywatny Dysk Google w
							uporządkowanych folderach.
						</p>
					</div>
				</div>

				{/* Przyciski główne akcji */}
				<div className="flex items-center gap-3 shrink-0 flex-wrap">
					{!hasGDrive ? (
						<button
							type="button"
							onClick={onConnect}
							disabled={!isGDriveConfigured}
							className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold shadow-sm transition ${
								isGDriveConfigured
									? "bg-slate-900 hover:bg-slate-800 text-white"
									: "bg-slate-200 text-slate-400 cursor-not-allowed"
							}`}
						>
							<Cloud className="w-4 h-4" />
							<span>Połącz z Google Drive</span>
						</button>
					) : (
						<div className="flex items-center gap-2 flex-wrap">
							{gdriveFolderId && (
								<a
									href={`https://drive.google.com/drive/folders/${gdriveFolderId}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
								>
									<ArrowUpRight className="w-4 h-4" />
									<span>Otwórz folder na Dysku</span>
								</a>
							)}

							<button
								type="button"
								onClick={onOpenExportModal}
								disabled={gdriveStatus === "running"}
								className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition ${
									gdriveStatus === "running"
										? "bg-slate-200 text-slate-400 cursor-not-allowed"
										: "bg-emerald-600 hover:bg-emerald-700 text-white"
								}`}
							>
								{gdriveStatus === "running" ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Trwa eksport...</span>
									</>
								) : (
									<>
										<Play className="w-3.5 h-3.5" />
										<span>
											{gdriveStatus === "interrupted"
												? "Wznów eksport"
												: "Eksportuj na Dysk Google"}
										</span>
									</>
								)}
							</button>

							<button
								type="button"
								onClick={onDisconnect}
								title="Odłącz konto Google"
								className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
							>
								<Unlink className="w-4 h-4" />
							</button>
						</div>
					)}
				</div>
			</div>

			{!isGDriveConfigured && !hasGDrive && (
				<div className="p-4 bg-amber-50/60 border-t border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
					<AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
					<span>
						Integracja wymaga ustawienia zmiennych <code>GOOGLE_CLIENT_ID</code>{" "}
						i <code>GOOGLE_CLIENT_SECRET</code> w pliku <code>.env</code>{" "}
						serwera.
					</span>
				</div>
			)}

			{/* Podgląd stanu i paska postępu eksportu */}
			{hasGDrive && (
				<div className="p-6 sm:p-8 space-y-4">
					{gdriveStatus === "running" && (
						<div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
							<div className="flex items-center justify-between text-xs font-semibold text-amber-900">
								<span className="flex items-center gap-2">
									<Loader2 className="w-4 h-4 animate-spin text-amber-700" />
									Trwa przesyłanie plików na Twój Dysk Google...
								</span>
								<span>
									{gdriveProgress?.processedFiles || 0} /{" "}
									{gdriveProgress?.totalFiles || 0} plików ({progressPercent}%)
								</span>
							</div>

							{/* Pasek postępu */}
							<div className="w-full h-3 bg-amber-200/70 rounded-full overflow-hidden">
								<div
									className="h-full bg-amber-600 transition-all duration-500 rounded-full"
									style={{ width: `${progressPercent}%` }}
								/>
							</div>

							<div className="flex items-center justify-between text-[11px] text-amber-800/80">
								<span className="truncate max-w-md">
									{gdriveProgress?.currentFile
										? `Wysyłanie: ${gdriveProgress.currentFile}`
										: "Przetwarzanie..."}
								</span>
								<span>
									{processedMB} MB / {totalProgMB} MB
								</span>
							</div>

							<p className="text-[11px] text-amber-700/70 italic">
								Transfer odbywa się bezpiecznie w tle na serwerze – możesz
								swobodnie zamknąć kartę lub wyłączyć telefon.
							</p>
						</div>
					)}

					{gdriveStatus === "interrupted" && (
						<div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-start justify-between gap-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
								<div>
									<h3 className="text-xs font-bold text-orange-900">
										Transfer został wstrzymany
									</h3>
									<p className="text-xs text-orange-700 mt-0.5">
										Proces eksportu został przerwany (np. przez restart
										serwera). Kliknij przycisk „Wznów eksport” powyżej, aby
										kontynuować od ostatniego pliku.
									</p>
								</div>
							</div>
						</div>
					)}

					{gdriveStatus === "failed" && (
						<div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
							<div>
								<h3 className="text-xs font-bold text-red-900">
									Wystąpił problem podczas eksportu
								</h3>
								<p className="text-xs text-red-700 mt-0.5">
									{gdriveProgress?.error ||
										"Nie udało się ukończyć transferu. Spróbuj ponownie za chwilę."}
								</p>
							</div>
						</div>
					)}

					{gdriveStatus === "completed" && (
						<div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 flex-wrap">
							<div className="flex items-center gap-3">
								<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
								<div>
									<h3 className="text-xs font-bold text-emerald-900">
										Wszystkie pliki zostały pomyślnie przesłane na Dysk Google!
									</h3>
									<p className="text-xs text-emerald-700">
										{gdriveExportedAt
											? `Ostatni eksport: ${new Date(gdriveExportedAt).toLocaleString("pl-PL")}`
											: "Pliki są posegregowane w folderach Zdjęcia i Filmy."}
									</p>
								</div>
							</div>

							{gdriveFolderId && (
								<a
									href={`https://drive.google.com/drive/folders/${gdriveFolderId}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
								>
									<ArrowUpRight className="w-4 h-4" />
									<span>Zobacz na Dysku Google</span>
								</a>
							)}
						</div>
					)}

					{gdriveStatus === "idle" && (
						<div className="text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
							<span>
								Dysk podłączony do: <strong>{gdriveEmail}</strong>. Gotowy do
								uruchomienia eksportu.
							</span>
							{gdriveExportedAt && (
								<span className="text-[11px] text-slate-400">
									Ostatni eksport:{" "}
									{new Date(gdriveExportedAt).toLocaleString("pl-PL")}
								</span>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
