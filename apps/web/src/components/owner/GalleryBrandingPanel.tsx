import { useTranslations } from "next-intl";
import { useState } from "react";
import { css } from "styled-system/css";
import { ownerRequest } from "@/lib/owner-api";

interface GalleryBrandingPanelProps {
	gallerySlug: string;
	ownerToken: string;
	currentLogoPath?: string | null;
	currentBackgroundPath?: string | null;
	onBrandingUpdated: () => void;
}

export function GalleryBrandingPanel({
	gallerySlug,
	ownerToken,
	currentLogoPath,
	currentBackgroundPath,
	onBrandingUpdated,
}: GalleryBrandingPanelProps) {
	// Reużywamy namespace OwnerPanel do ogólnych stringów, ale najlepiej byłoby dodać je do locales.
	// Zakładamy, że UI jest zrobione po polsku dla prostoty, a tłumaczenia można uzupełnić.
	const [loading, setLoading] = useState<"logo" | "background" | null>(null);
	const [error, setError] = useState<string>("");

	const logoFileName = currentLogoPath?.split("/").pop() || "logo.png";
	const backgroundFileName =
		currentBackgroundPath?.split("/").pop() || "background.png";

	const handleUpload = async (type: "logo" | "background", file: File) => {
		setLoading(type);
		setError("");

		const formData = new FormData();
		formData.append(type, file);

		try {
			const res = await fetch(`/api/owner/${gallerySlug}/branding`, {
				method: "POST",
				headers: {
					"x-owner-token": ownerToken,
				},
				body: formData,
			});

			if (res.ok) {
				onBrandingUpdated();
			} else {
				let errMsg = "Nie udało się wgrać pliku";
				try {
					const data = await res.json();
					if (data.error) errMsg = data.error;
				} catch (e) {}
				setError(errMsg);
			}
		} catch (err) {
			setError("Błąd sieci");
		} finally {
			setLoading(null);
		}
	};

	const handleDelete = async (type: "logo" | "background") => {
		setLoading(type);
		setError("");

		try {
			const res = await fetch(`/api/owner/${gallerySlug}/branding`, {
				method: "DELETE",
				headers: {
					"x-owner-token": ownerToken,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ type }),
			});

			if (res.ok) {
				onBrandingUpdated();
			} else {
				let errMsg = "Nie udało się usunąć pliku";
				try {
					const data = await res.json();
					if (data.error) errMsg = data.error;
				} catch (e) {}
				setError(errMsg);
			}
		} catch (err) {
			setError("Błąd sieci");
		} finally {
			setLoading(null);
		}
	};

	return (
		<section
			className={css({
				backgroundColor: "white",
				borderRadius: "2xl",
				padding: { base: "4", sm: "8" },
				boxShadow: "sm",
				border: "1px solid",
				borderColor: "slate.200",
			})}
		>
			<div className={css({ mb: "6" })}>
				<h2
					className={css({
						fontSize: "xl",
						fontWeight: "semibold",
						color: "slate.900",
					})}
				>
					Wygląd galerii
				</h2>
				<p className={css({ color: "slate.500", fontSize: "sm", mt: "1" })}>
					Spersonalizuj wygląd galerii widocznej dla Twoich gości
				</p>
			</div>

			{error && (
				<div className={css({ color: "red.500", mb: "4", fontSize: "sm" })}>
					{error}
				</div>
			)}

			<div
				className={css({
					display: "grid",
					gridTemplateColumns: { base: "1fr", md: "1fr 1fr" },
					gap: "6",
				})}
			>
				{/* Sekcja Logo */}
				<div
					className={css({
						border: "1px solid",
						borderColor: "slate.200",
						borderRadius: "xl",
						p: "6",
						display: "flex",
						flexDirection: "column",
						gap: "4",
					})}
				>
					<div>
						<h3 className={css({ fontWeight: "medium", color: "slate.900" })}>
							Własne Logo
						</h3>
						<p className={css({ fontSize: "sm", color: "slate.500", mt: "1" })}>
							Zastępuje tekstowe imiona pary na górze galerii. Zalecany format
							PNG z przezroczystością.
						</p>
					</div>

					{currentLogoPath ? (
						<div
							className={css({
								display: "flex",
								flexDirection: "column",
								gap: "2",
								alignItems: "flex-start",
							})}
						>
							<img
								src={`/branding-file/${gallerySlug}/${logoFileName}?v=${Date.now()}`}
								alt="Obecne logo"
								className={css({
									maxH: "20",
									objectFit: "contain",
									border: "1px dashed",
									borderColor: "slate.300",
									p: "2",
									borderRadius: "md",
								})}
							/>
							<button
								type="button"
								onClick={() => handleDelete("logo")}
								disabled={loading !== null}
								className={css({
									color: "red.600",
									fontSize: "sm",
									fontWeight: "medium",
									cursor: "pointer",
									_disabled: { opacity: 0.5, cursor: "not-allowed" },
								})}
							>
								Usuń logo
							</button>
						</div>
					) : (
						<div>
							<label
								className={css({
									display: "inline-block",
									px: "4",
									py: "2",
									backgroundColor: "slate.100",
									color: "slate.700",
									borderRadius: "md",
									fontSize: "sm",
									fontWeight: "medium",
									cursor: "pointer",
									_hover: { backgroundColor: "slate.200" },
									_disabled: { opacity: 0.5, cursor: "not-allowed" },
								})}
							>
								{loading === "logo" ? "Wgrywanie..." : "Wybierz plik z logo"}
								<input
									type="file"
									accept="image/png,image/jpeg,image/webp"
									className={css({ display: "none" })}
									disabled={loading !== null}
									onChange={(e) => {
										if (e.target.files?.[0]) {
											handleUpload("logo", e.target.files[0]);
										}
									}}
								/>
							</label>
						</div>
					)}
				</div>

				{/* Sekcja Tła */}
				<div
					className={css({
						border: "1px solid",
						borderColor: "slate.200",
						borderRadius: "xl",
						p: "6",
						display: "flex",
						flexDirection: "column",
						gap: "4",
					})}
				>
					<div>
						<h3 className={css({ fontWeight: "medium", color: "slate.900" })}>
							Własne Tło
						</h3>
						<p className={css({ fontSize: "sm", color: "slate.500", mt: "1" })}>
							Wyświetla się pod siatką zdjęć w galerii. Zostanie na nie nałożony
							przyciemniający overlay dla czytelności.
						</p>
					</div>

					{currentBackgroundPath ? (
						<div
							className={css({
								display: "flex",
								flexDirection: "column",
								gap: "2",
								alignItems: "flex-start",
							})}
						>
							<div
								className={css({
									height: "20",
									width: "100%",
									borderRadius: "md",
									backgroundSize: "cover",
									backgroundPosition: "center",
									border: "1px solid",
									borderColor: "slate.300",
								})}
								style={{
									backgroundImage: `url('/branding-file/${gallerySlug}/${backgroundFileName}?v=${Date.now()}')`,
								}}
							/>
							<button
								type="button"
								onClick={() => handleDelete("background")}
								disabled={loading !== null}
								className={css({
									color: "red.600",
									fontSize: "sm",
									fontWeight: "medium",
									cursor: "pointer",
									_disabled: { opacity: 0.5, cursor: "not-allowed" },
								})}
							>
								Usuń tło
							</button>
						</div>
					) : (
						<div>
							<label
								className={css({
									display: "inline-block",
									px: "4",
									py: "2",
									backgroundColor: "slate.100",
									color: "slate.700",
									borderRadius: "md",
									fontSize: "sm",
									fontWeight: "medium",
									cursor: "pointer",
									_hover: { backgroundColor: "slate.200" },
									_disabled: { opacity: 0.5, cursor: "not-allowed" },
								})}
							>
								{loading === "background"
									? "Wgrywanie..."
									: "Wybierz plik z tłem"}
								<input
									type="file"
									accept="image/png,image/jpeg,image/webp"
									className={css({ display: "none" })}
									disabled={loading !== null}
									onChange={(e) => {
										if (e.target.files?.[0]) {
											handleUpload("background", e.target.files[0]);
										}
									}}
								/>
							</label>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
