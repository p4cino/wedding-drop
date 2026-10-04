"use client";

import { adminLoginDto } from "@wedding-drop/db/validators";
import { Plus, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminStats } from "@/components/admin/AdminStats";
import {
	type CreateGalleryForm,
	CreateGalleryModal,
	type CreateGalleryResult,
} from "@/components/admin/CreateGalleryModal";
import { GalleryTable } from "@/components/admin/GalleryTable";
import { useAdminApi } from "@/hooks/useAdminApi";
import type { GalleryRow } from "@/lib/admin-types";

export default function AdminDashboardPage() {
	const t = useTranslations("AdminPanel");
	const [token, setToken] = useState<string | null>(null);
	const [username, setUsername] = useState("admin");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const [galleries, setGalleries] = useState<GalleryRow[]>([]);
	const [notice, setNotice] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Wygasły token (401) wraca do logowania z komunikatem, zamiast udawać pustą listę
	const handleUnauthorized = useCallback(() => {
		setToken(null);
		setGalleries([]);
		setIsModalOpen(false);
		setError(t("sessionExpired"));
	}, [t]);
	const request = useAdminApi(token, handleUnauthorized);

	const loadGalleries = useCallback(async () => {
		const res = await request<{ galleries: GalleryRow[] }>(
			"GET",
			"/api/admin/galleries",
		);
		if (res.ok) {
			setNotice("");
			setGalleries(res.data?.galleries || []);
		} else if (res.status !== 401) {
			setNotice(t("loadError"));
		}
	}, [request, t]);

	useEffect(() => {
		if (token) loadGalleries();
	}, [token, loadGalleries]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const valResult = adminLoginDto.safeParse({ username, password });
		if (!valResult.success) {
			setError(valResult.error.issues[0]?.message || t("loginError"));
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/admin/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(valResult.data),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || t("loginError"));
				return;
			}
			setToken(data.adminToken);
		} catch (_err) {
			setError(t("loginNetworkError"));
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (
		form: CreateGalleryForm,
	): Promise<CreateGalleryResult> => {
		const res = await request<{ gallery: GalleryRow; error?: string }>(
			"POST",
			"/api/admin/galleries",
			form,
		);
		if (res.ok && res.data?.gallery) {
			loadGalleries();
			return { ok: true, gallery: res.data.gallery };
		}
		return {
			ok: false,
			error:
				res.status === 0
					? t("connectionError")
					: res.data?.error || t("createError"),
		};
	};

	const handleDelete = async (gallery: GalleryRow) => {
		if (!confirm(t("deleteConfirm", { slug: gallery.slug }))) return;
		const res = await request("DELETE", `/api/admin/galleries/${gallery.id}`);
		if (res.ok) {
			setNotice("");
			setGalleries((prev) => prev.filter((g) => g.id !== gallery.id));
		} else if (res.status !== 401) {
			setNotice(t("deleteError"));
		}
	};

	const handleLogout = async () => {
		const current = token;
		// Najpierw czyścimy stan lokalny, potem unieważniamy token na serwerze (best effort)
		setToken(null);
		setGalleries([]);
		setIsModalOpen(false);
		setPassword("");
		if (current) {
			try {
				await fetch("/api/admin/auth/logout", {
					method: "POST",
					headers: { "x-admin-token": current },
				});
			} catch {
				// Błąd sieci - token i tak wygaśnie po 8 godzinach
			}
		}
	};

	if (!token) {
		return (
			<AdminLoginForm
				username={username}
				password={password}
				error={error}
				loading={loading}
				onUsernameChange={setUsername}
				onPasswordChange={setPassword}
				onSubmit={handleLogin}
			/>
		);
	}

	return (
		<div
			className={css({ minH: "100vh", backgroundColor: "#FAF8F5", pb: "20" })}
		>
			<header
				className={css({
					backgroundColor: "white",
					borderBottomWidth: "1px",
					borderBottomColor: "slate.200",
					px: "6",
					py: "4",
					position: "sticky",
					top: "0",
					zIndex: 30,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				})}
			>
				<div
					className={css({ display: "flex", alignItems: "center", gap: "3" })}
				>
					<div
						className={css({
							w: "9",
							h: "9",
							borderRadius: "xl",
							backgroundColor: "slate.900",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "white",
						})}
					>
						<ShieldCheck
							className={css({ w: "5", h: "5" })}
							aria-hidden="true"
						/>
					</div>
					<div>
						<h1
							className={css({
								fontWeight: "bold",
								color: "slate.900",
								fontSize: "base",
							})}
						>
							{t("navTitle")}
						</h1>
						<p className={css({ fontSize: "xs", color: "slate.500" })}>
							{t("navSubtitle")}
						</p>
					</div>
				</div>

				<div
					className={css({ display: "flex", alignItems: "center", gap: "2" })}
				>
					<button
						type="button"
						onClick={handleLogout}
						className={css({
							px: "4",
							py: "2.5",
							borderRadius: "xl",
							fontSize: "sm",
							fontWeight: "semibold",
							color: "slate.700",
							borderWidth: "1px",
							borderColor: "slate.200",
							cursor: "pointer",
							_hover: { backgroundColor: "slate.50" },
						})}
					>
						{t("logout")}
					</button>
					<button
						type="button"
						aria-haspopup="dialog"
						aria-expanded={isModalOpen}
						onClick={() => setIsModalOpen(true)}
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "2",
							px: "4",
							py: "2.5",
							borderRadius: "xl",
							backgroundColor: "amber.600",
							_hover: { backgroundColor: "amber.700" },
							color: "white",
							fontSize: "xs",
							fontWeight: "semibold",
							boxShadow: "sm",
							transition: "all 0.15s ease",
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "amber.500",
							},
							cursor: "pointer",
						})}
					>
						<Plus className={css({ w: "4", h: "4" })} aria-hidden="true" />
						<span>{t("newWeddingBtn")}</span>
					</button>
				</div>
			</header>

			<main
				className={css({
					maxW: "7xl",
					mx: "auto",
					px: "6",
					py: "8",
					display: "flex",
					flexDirection: "column",
					gap: "8",
				})}
			>
				{notice && (
					<div
						role="alert"
						className={css({
							p: "3",
							fontSize: "xs",
							backgroundColor: "red.50",
							color: "red.700",
							borderRadius: "xl",
							borderWidth: "1px",
							borderColor: "red.200",
						})}
					>
						{notice}
					</div>
				)}
				<AdminStats galleries={galleries} />
				<GalleryTable galleries={galleries} onDelete={handleDelete} />
			</main>

			{isModalOpen && (
				<CreateGalleryModal
					onClose={() => setIsModalOpen(false)}
					onCreate={handleCreate}
				/>
			)}
		</div>
	);
}
