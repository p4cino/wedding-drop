"use client";

import { ownerLoginDto } from "@wedding-drop/db/validators";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import { GalleryBrandingPanel } from "@/components/owner/GalleryBrandingPanel";
import { GDriveBackupCard } from "@/components/owner/GDriveBackupCard";
import { GDriveExportModal } from "@/components/owner/GDriveExportModal";
import {
	MediaGridWithModeration,
	type OwnerMediaItem,
} from "@/components/owner/MediaGridWithModeration";
import { ModerationSettingsPanel } from "@/components/owner/ModerationSettingsPanel";
import { OwnerHeader } from "@/components/owner/OwnerHeader";
import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";
import { OwnerStatsGrid } from "@/components/owner/OwnerStatsGrid";
import { PhotographerImportPanel } from "@/components/owner/PhotographerImportPanel";
import {
	type OwnerWishItem,
	WishesModeration,
} from "@/components/owner/WishesModeration";
import Toast, { type ToastMessage } from "@/components/Toast";
import { useGalleryEvents } from "@/hooks/useGalleryEvents";
import { useGDriveExport } from "@/hooks/useGDriveExport";
import { useOwnerApi } from "@/hooks/useOwnerApi";
import { parseGDriveReturn } from "@/lib/gdrive-state";
import { type ModerationStatus, toggledStatus } from "@/lib/moderation";
import { ownerRequest } from "@/lib/owner-api";
import type { OwnerPanelData, OwnerPanelGallery } from "@/lib/owner-types";

export default function OwnerDashboardPage() {
	const t = useTranslations("OwnerPanel");
	const tWishes = useTranslations("Wishes");
	const params = useParams();
	const slug = Array.isArray(params?.slug)
		? params.slug[0]
		: (params?.slug as string);

	const [password, setPassword] = useState("");
	const [ownerToken, setOwnerToken] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [galleryInfo, setGalleryInfo] = useState<OwnerPanelGallery | null>(
		null,
	);
	const [stats, setStats] = useState({ totalFiles: 0, totalBytes: 0 });
	const [mediaList, setMediaList] = useState<OwnerMediaItem[]>([]);
	const [wishesList, setWishesList] = useState<OwnerWishItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showExportModal, setShowExportModal] = useState(false);
	const [toast, setToast] = useState<ToastMessage | null>(null);

	const api = useOwnerApi(ownerToken);
	const gdrive = useGDriveExport(slug, ownerToken);
	const { loadFromPanel, applySseProgress } = gdrive;

	const showError = useCallback(
		() => setToast({ type: "error", text: t("actionError") }),
		[t],
	);

	// Listy pobierane z jawnym tokenem: tuż po logowaniu stan `ownerToken` nie jest jeszcze ustawiony
	const loadMedia = useCallback(
		async (token = ownerToken) => {
			const res = await ownerRequest<{ media: OwnerMediaItem[] }>(
				token,
				"GET",
				`/api/gallery/${slug}/media?includeHidden=true`,
			);
			if (res.ok) setMediaList(res.data?.media || []);
			else showError();
		},
		[ownerToken, slug, showError],
	);

	const loadWishes = useCallback(
		async (token = ownerToken) => {
			const res = await ownerRequest<{ wishes: OwnerWishItem[] }>(
				token,
				"GET",
				`/api/gallery/${slug}/wishes?includeHidden=true`,
			);
			if (res.ok) setWishesList(res.data?.wishes || []);
			else showError();
		},
		[ownerToken, slug, showError],
	);

	// Wspólne wypełnienie stanu panelu danymi z logowania lub odtworzenia sesji
	const applyPanelData = useCallback(
		(data: OwnerPanelData, token: string) => {
			setIsAuthenticated(true);
			setGalleryInfo(data.gallery);
			setStats(data.stats);
			loadFromPanel(data);
			loadMedia(token);
			loadWishes(token);
		},
		[loadFromPanel, loadMedia, loadWishes],
	);

	const doLogin = useCallback(
		async (pwd: string) => {
			setError("");

			const valResult = ownerLoginDto.safeParse({ password: pwd });
			if (!valResult.success) {
				setError(valResult.error.issues[0]?.message || t("pwdRequired"));
				return;
			}

			setLoading(true);
			try {
				const res = await fetch(`/api/owner/${slug}/auth`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(valResult.data),
				});
				const data = await res.json();
				if (!res.ok) {
					setError(data.error || t("invalidPwd"));
					return;
				}

				setOwnerToken(data.ownerToken);
				setPassword("");
				applyPanelData(data, data.ownerToken);
			} catch (_err) {
				setError(t("connError"));
			} finally {
				setLoading(false);
			}
		},
		[slug, applyPanelData, t],
	);

	// Odtworzenie sesji z ciasteczka HttpOnly (bez konieczności posiadania tokenu w storage)
	const restoreSession = useCallback(async () => {
		try {
			const res = await fetch(`/api/owner/${slug}/session`, {
				method: "GET",
			});
			if (!res.ok) {
				return;
			}
			const data = (await res.json()) as OwnerPanelData;
			if (data?.ownerToken) {
				setOwnerToken(data.ownerToken);
				applyPanelData(data, data.ownerToken);
			}
		} catch (_err) {
			// Błąd sieciowy przy odtwarzaniu sesji
		}
	}, [slug, applyPanelData]);

	// Jednorazowa inicjalizacja per slug: powrót z Google OAuth, odtworzenie sesji z ciasteczka i sprzątanie storage
	const initializedSlug = useRef<string | null>(null);
	useEffect(() => {
		if (initializedSlug.current === slug) return;
		initializedSlug.current = slug;

		const gdriveReturn = parseGDriveReturn(window.location.search);
		if (gdriveReturn) {
			setToast(
				gdriveReturn.type === "success"
					? { type: "success", text: t("gdriveSuccess") }
					: {
							type: "error",
							text: t("gdriveError", { error: gdriveReturn.error }),
						},
			);
			window.history.replaceState({}, document.title, window.location.pathname);
		}

		// Jednorazowe czyszczenie pozostałości po starej wersji w sessionStorage (migracja bezpieczeństwa)
		sessionStorage.removeItem(`owner_pwd_${slug}`);
		sessionStorage.removeItem(`owner_token_${slug}`);

		restoreSession();
	}, [slug, restoreSession, t]);

	// Zdarzenia na żywo: nowe pliki/życzenia oraz postęp Google Drive
	useGalleryEvents(isAuthenticated ? slug : undefined, {
		onEvent: (event) => {
			if (event.type === "new-media") loadMedia();
			else if (event.type === "new-wish" || event.type === "wish-updated")
				loadWishes();
			else if (event.type === "gdrive-progress")
				applySseProgress(event.progress);
		},
	});

	const toggleStatus = async (
		mediaId: string,
		currentStatus: ModerationStatus,
	) => {
		const newStatus = toggledStatus(currentStatus);
		const res = await api(
			"PATCH",
			`/api/owner/${slug}/media/${mediaId}/status`,
			{
				newStatus,
			},
		);
		if (!res.ok) return showError();
		setMediaList((prev) =>
			prev.map((m) => (m.id === mediaId ? { ...m, status: newStatus } : m)),
		);
	};

	const deleteMedia = async (mediaId: string) => {
		if (!confirm(t("deleteConfirm"))) return;
		const res = await api("DELETE", `/api/owner/${slug}/media/${mediaId}`);
		if (!res.ok) return showError();
		setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
	};

	const toggleWishStatus = async (
		wishId: string,
		currentStatus: ModerationStatus,
	) => {
		const newStatus = toggledStatus(currentStatus);
		const res = await api(
			"PATCH",
			`/api/owner/${slug}/wishes/${wishId}/status`,
			{
				newStatus,
			},
		);
		if (!res.ok) return showError();
		setWishesList((prev) =>
			prev.map((w) => (w.id === wishId ? { ...w, status: newStatus } : w)),
		);
	};

	const deleteWish = async (wishId: string) => {
		if (!confirm(tWishes("deleteConfirm"))) return;
		const res = await api(
			"PATCH",
			`/api/owner/${slug}/wishes/${wishId}/status`,
			{
				newStatus: "deleted",
			},
		);
		if (!res.ok) return showError();
		setWishesList((prev) => prev.filter((w) => w.id !== wishId));
	};

	const handleLogout = async () => {
		try {
			await fetch(`/api/owner/${slug}/session`, {
				method: "DELETE",
			});
		} catch (_err) {
			// Błąd sieciowy przy wylogowywaniu
		} finally {
			setIsAuthenticated(false);
			setOwnerToken("");
			setPassword("");
			setGalleryInfo(null);
			setStats({ totalFiles: 0, totalBytes: 0 });
			setMediaList([]);
			setWishesList([]);
		}
	};

	const handleConnectGDrive = async () => {
		try {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (ownerToken) headers["x-owner-token"] = ownerToken;

			const res = await fetch("/api/auth/google", {
				method: "POST",
				headers,
				body: JSON.stringify({ slug }),
			});

			const data = await res.json().catch(() => null);
			if (!res.ok || !data?.authUrl) {
				setToast({
					type: "error",
					text: data?.error || t("gdriveConnectError"),
				});
				return;
			}

			window.location.assign(data.authUrl);
		} catch (_err) {
			setToast({
				type: "error",
				text: t("connError"),
			});
		}
	};

	const handleDisconnectGDrive = async () => {
		if (!confirm(t("disconnectConfirm"))) return;
		if (await gdrive.disconnect()) {
			setToast({ type: "success", text: t("disconnectSuccess") });
		} else {
			showError();
		}
	};

	const handleStartExport = async (includeHidden: boolean) => {
		const result = await gdrive.startExport(includeHidden);
		if (result.ok) {
			setToast({ type: "success", text: t("exportStartSuccess") });
			return true;
		}
		setToast({
			type: "error",
			text: result.network
				? t("exportConnError")
				: result.message || t("exportStartError"),
		});
		return false;
	};

	if (!isAuthenticated) {
		return (
			<OwnerLoginForm
				slug={slug}
				password={password}
				error={error}
				loading={loading}
				onPasswordChange={setPassword}
				onSubmit={(e: React.FormEvent) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget as HTMLFormElement);
					const pwd = (formData.get("password") as string) || password;
					doLogin(pwd);
				}}
			/>
		);
	}

	const imagesCount = mediaList.filter((m) => m.fileType === "image").length;
	const videosCount = mediaList.filter((m) => m.fileType === "video").length;

	return (
		<div
			className={css({ minH: "100vh", backgroundColor: "#FAF8F5", pb: "20" })}
		>
			<Toast
				toast={toast}
				closeLabel={t("closeToast")}
				onClose={() => setToast(null)}
			/>

			<OwnerHeader
				slug={slug}
				ownerToken={ownerToken}
				coupleNames={galleryInfo?.coupleNames}
				onLogout={handleLogout}
			/>

			<main
				className={css({
					maxW: "7xl",
					mx: "auto",
					px: { base: "4", sm: "8" },
					py: "8",
					display: "flex",
					flexDirection: "column",
					gap: "8",
				})}
			>
				<OwnerStatsGrid
					imagesCount={imagesCount}
					videosCount={videosCount}
					totalBytes={stats.totalBytes}
					onRefresh={() => loadMedia()}
				/>

				<GDriveBackupCard
					state={gdrive.state}
					onConnect={handleConnectGDrive}
					onDisconnect={handleDisconnectGDrive}
					onOpenExportModal={() => setShowExportModal(true)}
				/>

				<PhotographerImportPanel
					gallerySlug={slug}
					ownerToken={ownerToken}
					onImportSuccess={() => loadMedia()}
				/>

				<GalleryBrandingPanel
					gallerySlug={slug}
					ownerToken={ownerToken}
					currentLogoPath={galleryInfo?.branding?.logoPath}
					currentBackgroundPath={galleryInfo?.branding?.backgroundPath}
					onBrandingUpdated={restoreSession}
				/>

				<ModerationSettingsPanel
					settings={{
						allowGuestUploads: galleryInfo?.allowGuestUploads,
						allowGuestViewing: galleryInfo?.allowGuestViewing,
						isApprovalQueueEnabled: galleryInfo?.isApprovalQueueEnabled,
					}}
					onSave={async (newSettings) => {
						const res = await api(
							"PATCH",
							`/api/owner/${slug}/settings`,
							newSettings,
						);
						if (res.ok) {
							setToast({ type: "success", text: t("settingsSaveSuccess") });
							restoreSession();
							return true;
						} else {
							showError();
							return false;
						}
					}}
				/>

				<MediaGridWithModeration
					mediaList={mediaList}
					onToggleStatus={toggleStatus}
					onDeleteMedia={deleteMedia}
				/>

				<WishesModeration
					wishesList={wishesList}
					onToggleStatus={toggleWishStatus}
					onDeleteWish={deleteWish}
				/>
			</main>

			<GDriveExportModal
				isOpen={showExportModal}
				coupleNames={galleryInfo?.coupleNames || ""}
				onClose={() => setShowExportModal(false)}
				onStartExport={handleStartExport}
			/>
		</div>
	);
}
