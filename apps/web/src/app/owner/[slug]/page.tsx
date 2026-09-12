"use client";

import {
	AlertCircle,
	CheckCircle2,
	Download,
	ExternalLink,
	Loader2,
	Lock,
	QrCode,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	GDriveBackupCard,
	type GDriveProgressData,
} from "@/components/owner/GDriveBackupCard";
import { GDriveExportModal } from "@/components/owner/GDriveExportModal";
import {
	MediaGridWithModeration,
	type OwnerMediaItem,
} from "@/components/owner/MediaGridWithModeration";
import { OwnerStatsGrid } from "@/components/owner/OwnerStatsGrid";

export default function OwnerDashboardPage() {
	const params = useParams();
	const slug = params?.slug as string;

	const [password, setPassword] = useState("");
	const [ownerToken, setOwnerToken] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const [galleryInfo, setGalleryInfo] = useState<{
		coupleNames?: string;
		[key: string]: unknown;
	} | null>(null);
	const [stats, setStats] = useState<{
		totalFiles: number;
		totalBytes: number;
	}>({ totalFiles: 0, totalBytes: 0 });
	const [mediaList, setMediaList] = useState<OwnerMediaItem[]>([]);
	const [filter, setFilter] = useState<"all" | "ready" | "hidden">("all");

	// Google Drive state
	const [isGDriveConfigured, setIsGDriveConfigured] = useState(true);
	const [hasGDrive, setHasGDrive] = useState(false);
	const [gdriveEmail, setGDriveEmail] = useState<string | null>(null);
	const [gdriveStatus, setGDriveStatus] = useState<string>("idle");
	const [gdriveProgress, setGDriveProgress] =
		useState<GDriveProgressData | null>(null);
	const [gdriveFolderId, setGDriveFolderId] = useState<string | null>(null);
	const [gdriveExportedAt, setGDriveExportedAt] = useState<string | null>(null);
	const [showExportModal, setShowExportModal] = useState(false);
	const [includeHiddenInExport, setIncludeHiddenInExport] = useState(true);
	const [exportLoading, setExportLoading] = useState(false);
	const [gdriveToast, setGDriveToast] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const loadMedia = useCallback(
		async (token = ownerToken) => {
			try {
				const headers: Record<string, string> = {};
				if (token) headers["x-owner-token"] = token;

				const res = await fetch(
					`/api/gallery/${slug}/media?includeHidden=true`,
					{
						headers,
					},
				);
				if (res.ok) {
					const data = await res.json();
					setMediaList(data.media || []);
				}
			} catch (e) {
				console.error(e);
			}
		},
		[ownerToken, slug],
	);

	const doLogin = useCallback(
		async (pwd: string) => {
			setError("");
			setLoading(true);

			try {
				const res = await fetch(`/api/owner/${slug}/auth`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ password: pwd }),
				});

				const data = await res.json();
				if (!res.ok) {
					setError(data.error || "Błędne hasło");
					sessionStorage.removeItem(`owner_pwd_${slug}`);
					sessionStorage.removeItem(`owner_token_${slug}`);
					return;
				}

				if (data.ownerToken) {
					setOwnerToken(data.ownerToken);
					sessionStorage.setItem(`owner_token_${slug}`, data.ownerToken);
				}
				sessionStorage.setItem(`owner_pwd_${slug}`, pwd);
				setIsAuthenticated(true);
				setGalleryInfo(data.gallery);
				setStats(data.stats);
				setIsGDriveConfigured(data.isGDriveConfigured ?? true);
				setHasGDrive(Boolean(data.gallery?.hasGDrive));
				setGDriveEmail(data.gallery?.gdriveAccountEmail || null);
				setGDriveStatus(data.gallery?.gdriveExportStatus || "idle");
				setGDriveProgress(data.gallery?.gdriveExportProgress || null);
				setGDriveFolderId(data.gallery?.gdriveRootFolderId || null);
				setGDriveExportedAt(data.gallery?.gdriveExportedAt || null);

				loadMedia(data.ownerToken);
			} catch (_err) {
				setError("Błąd połączenia");
			} finally {
				setLoading(false);
			}
		},
		[slug, loadMedia],
	);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		doLogin(password);
	};

	// Sprawdzanie parametrów powrotnych z Google OAuth i pamięci sesji
	useEffect(() => {
		if (typeof window !== "undefined") {
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get("gdrive") === "connected") {
				setGDriveToast({
					type: "success",
					text: "Dysk Google został pomyślnie podłączony do galerii!",
				});
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname,
				);
			} else if (urlParams.get("gdrive_error")) {
				setGDriveToast({
					type: "error",
					text: `Nie udało się połączyć Dysku Google: ${urlParams.get("gdrive_error")}`,
				});
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname,
				);
			}

			const savedToken = sessionStorage.getItem(`owner_token_${slug}`);
			const savedPwd = sessionStorage.getItem(`owner_pwd_${slug}`);
			if (savedToken) {
				setOwnerToken(savedToken);
			}
			if (savedPwd) {
				setPassword(savedPwd);
				doLogin(savedPwd);
			}
		}
	}, [slug, doLogin]);

	// Nasłuch zdarzeń SSE na żywo (nowe pliki oraz postęp Google Drive)
	useEffect(() => {
		if (!isAuthenticated || !slug) return;

		const es = new EventSource(`/api/gallery/${slug}/live`);
		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "new-media") {
					loadMedia();
				} else if (data.type === "gdrive-progress") {
					if (data.progress) {
						setGDriveProgress(data.progress);
						if (data.progress.status) {
							setGDriveStatus(data.progress.status);
						}
						if (data.progress.rootFolderId) {
							setGDriveFolderId(data.progress.rootFolderId);
						}
					}
				}
			} catch (_e) {}
		};

		return () => {
			es.close();
		};
	}, [isAuthenticated, slug, loadMedia]);

	// Fallbackowe odpytywanie statusu eksportu, gdy jest 'running'
	useEffect(() => {
		if (!isAuthenticated || gdriveStatus !== "running") return;

		const interval = setInterval(async () => {
			try {
				const headers: Record<string, string> = {};
				if (ownerToken) headers["x-owner-token"] = ownerToken;

				const res = await fetch(`/api/owner/${slug}/gdrive`, {
					method: "GET",
					headers,
				});
				if (res.ok) {
					const data = await res.json();
					setGDriveStatus(data.gdriveExportStatus);
					if (data.gdriveExportProgress) {
						setGDriveProgress(data.gdriveExportProgress);
					}
					if (data.gdriveRootFolderId) {
						setGDriveFolderId(data.gdriveRootFolderId);
					}
					if (data.gdriveExportedAt) {
						setGDriveExportedAt(data.gdriveExportedAt);
					}
				}
			} catch (_err) {}
		}, 3000);

		return () => clearInterval(interval);
	}, [isAuthenticated, gdriveStatus, slug, ownerToken]);

	const toggleStatus = async (mediaId: string, currentStatus: string) => {
		const newStatus = currentStatus === "ready" ? "hidden" : "ready";
		try {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (ownerToken) headers["x-owner-token"] = ownerToken;

			const res = await fetch(`/api/owner/${slug}/media/${mediaId}/status`, {
				method: "PATCH",
				headers,
				body: JSON.stringify({
					newStatus,
					token: ownerToken,
				}),
			});
			if (res.ok) {
				setMediaList((prev) =>
					prev.map((m) =>
						m.id === mediaId
							? { ...m, status: newStatus as "ready" | "hidden" }
							: m,
					),
				);
			}
		} catch (e) {
			console.error(e);
		}
	};

	const deleteMedia = async (mediaId: string) => {
		if (!confirm("Czy na pewno chcesz bezpowrotnie usunąć ten plik?")) return;
		try {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (ownerToken) headers["x-owner-token"] = ownerToken;

			const res = await fetch(`/api/owner/${slug}/media/${mediaId}`, {
				method: "DELETE",
				headers,
				body: JSON.stringify({
					token: ownerToken,
				}),
			});
			if (res.ok) {
				setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
			}
		} catch (e) {
			console.error(e);
		}
	};

	// Obsługa łączenia z Dyskiem Google
	const handleConnectGDrive = () => {
		const tokenParam = ownerToken
			? `&token=${encodeURIComponent(ownerToken)}`
			: "";
		window.location.href = `/api/auth/google?slug=${slug}${tokenParam}`;
	};

	// Obsługa odłączania Dysku Google
	const handleDisconnectGDrive = async () => {
		if (
			!confirm(
				"Czy na pewno chcesz odłączyć konto Google Drive od tej galerii?",
			)
		)
			return;
		try {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (ownerToken) headers["x-owner-token"] = ownerToken;

			const res = await fetch(`/api/owner/${slug}/gdrive`, {
				method: "DELETE",
				headers,
				body: JSON.stringify({ token: ownerToken }),
			});
			if (res.ok) {
				setHasGDrive(false);
				setGDriveEmail(null);
				setGDriveStatus("idle");
				setGDriveProgress(null);
				setGDriveToast({
					type: "success",
					text: "Konto Google Drive zostało odłączone.",
				});
			}
		} catch (e) {
			console.error(e);
		}
	};

	// Uruchomienie eksportu
	const handleStartExport = async () => {
		setExportLoading(true);
		try {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (ownerToken) headers["x-owner-token"] = ownerToken;

			const res = await fetch(`/api/owner/${slug}/gdrive/export`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					token: ownerToken,
					includeHidden: includeHiddenInExport,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.error || "Nie udało się rozpocząć eksportu.");
				return;
			}
			setGDriveStatus("running");
			setShowExportModal(false);
			setGDriveToast({
				type: "success",
				text: "Eksport został uruchomiony w tle. Poniżej możesz śledzić postęp.",
			});
		} catch (_e) {
			alert("Błąd połączenia podczas uruchamiania eksportu.");
		} finally {
			setExportLoading(false);
		}
	};

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
				<div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
					<div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mx-auto mb-4">
						<Lock className="w-6 h-6" />
					</div>
					<h2 className="font-serif-luxury text-2xl font-bold text-center text-slate-900 mb-1">
						Panel Pary Młodej
					</h2>
					<p className="text-xs text-center text-slate-500 mb-6">
						Podaj hasło do swojej galerii ({slug}), aby zarządzać zdjęciami,
						pobrać ZIP lub przesłać na Dysk Google.
					</p>

					<form onSubmit={handleLogin} className="space-y-4">
						{error && (
							<div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
								{error}
							</div>
						)}

						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1.5">
								Hasło właściciela
							</label>
							<input
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Wpisz hasło dostępu"
								className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
						>
							{loading && <Loader2 className="w-4 h-4 animate-spin" />}
							<span>{loading ? "Logowanie..." : "Zaloguj się"}</span>
						</button>
					</form>
				</div>
			</div>
		);
	}

	const totalMegabytes = (stats.totalBytes / (1024 * 1024)).toFixed(1);
	const imagesCount = mediaList.filter((m) => m.fileType === "image").length;
	const videosCount = mediaList.filter((m) => m.fileType === "video").length;

	return (
		<div className="min-h-screen bg-[#FAF8F5] pb-20">
			{/* Toast powiadomień */}
			{gdriveToast && (
				<div
					className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
						gdriveToast.type === "success"
							? "bg-emerald-50 border-emerald-200 text-emerald-900"
							: "bg-red-50 border-red-200 text-red-900"
					}`}
				>
					{gdriveToast.type === "success" ? (
						<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
					) : (
						<AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
					)}
					<div className="text-xs font-medium flex-1">{gdriveToast.text}</div>
					<button
						type="button"
						onClick={() => setGDriveToast(null)}
						className="text-xs font-bold opacity-60 hover:opacity-100"
					>
						✕
					</button>
				</div>
			)}

			{/* Pasek nawigacyjny */}
			<header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-slate-900">
						{galleryInfo?.coupleNames || "Panel Właściciela"}
					</h1>
					<p className="text-xs text-slate-500">
						Zarządzanie galerią, eksport i moderacja treści
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<Link
						href={`/g/${slug}`}
						target="_blank"
						className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
					>
						<ExternalLink className="w-3.5 h-3.5" />
						<span>Zobacz galerię gościa</span>
					</Link>

					<Link
						href={`/g/${slug}/card`}
						className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
					>
						<QrCode className="w-3.5 h-3.5" />
						<span>Karteczka A6</span>
					</Link>

					<a
						href={`/api/gallery/${slug}/zip?token=${encodeURIComponent(ownerToken)}`}
						className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition"
					>
						<Download className="w-4 h-4" />
						<span>Pobierz ZIP</span>
					</a>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
				{/* Kafelki statystyk */}
				<OwnerStatsGrid
					imagesCount={imagesCount}
					videosCount={videosCount}
					totalMegabytes={totalMegabytes}
					onRefresh={() => loadMedia()}
				/>

				{/* Sekcja: Kopia w chmurze (Google Drive) */}
				<GDriveBackupCard
					hasGDrive={hasGDrive}
					gdriveEmail={gdriveEmail}
					gdriveStatus={gdriveStatus}
					gdriveProgress={gdriveProgress}
					gdriveFolderId={gdriveFolderId}
					gdriveExportedAt={gdriveExportedAt}
					isGDriveConfigured={isGDriveConfigured}
					onConnect={handleConnectGDrive}
					onDisconnect={handleDisconnectGDrive}
					onOpenExportModal={() => setShowExportModal(true)}
				/>

				{/* Siatka moderacji */}
				<MediaGridWithModeration
					mediaList={mediaList}
					filter={filter}
					setFilter={setFilter}
					onToggleStatus={toggleStatus}
					onDeleteMedia={deleteMedia}
				/>
			</main>

			{/* Modal konfiguracji eksportu do Google Drive */}
			<GDriveExportModal
				isOpen={showExportModal}
				coupleNames={galleryInfo?.coupleNames || ""}
				includeHidden={includeHiddenInExport}
				setIncludeHidden={setIncludeHiddenInExport}
				exportLoading={exportLoading}
				onClose={() => setShowExportModal(false)}
				onStartExport={handleStartExport}
			/>
		</div>
	);
}
