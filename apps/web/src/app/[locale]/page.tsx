"use client";

import { sanitizeSlug } from "@wedding-drop/db/slug";
import {
	ArrowRight,
	Camera,
	Download,
	Heart,
	QrCode,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { css } from "styled-system/css";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function HomePage() {
	const t = useTranslations("LandingPage");
	const [slugInput, setSlugInput] = useState("");
	const [slugError, setSlugError] = useState(false);
	const router = useRouter();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const cleanSlug = sanitizeSlug(slugInput);
		if (!cleanSlug) {
			// Puste pole lub same niedozwolone znaki — nie nawigujemy do `/g/`
			setSlugError(true);
			return;
		}
		setSlugError(false);
		router.push(`/g/${cleanSlug}`);
	};

	return (
		<div
			className={css({
				minH: "100vh",
				backgroundColor: "#FAF8F5",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			})}
		>
			{/* Pasek górny */}
			<header
				className={css({
					maxW: "6xl",
					mx: "auto",
					w: "full",
					px: "6",
					py: "6",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				})}
			>
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "2",
					})}
				>
					<div
						className={css({
							w: "8",
							h: "8",
							borderRadius: "xl",
							backgroundColor: "amber.600",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "white",
							boxShadow: "xs",
						})}
					>
						<Heart
							className={css({ w: "4", h: "4", fill: "currentColor" })}
							aria-hidden="true"
						/>
					</div>
					<span
						className={css({
							fontFamily: "serif",
							fontSize: "xl",
							fontWeight: "bold",
							letterSpacing: "tight",
							color: "wedding.slate",
						})}
					>
						WeddingDrop
					</span>
				</div>

				<div
					className={css({ display: "flex", alignItems: "center", gap: "3" })}
				>
					<Link
						href="/admin"
						className={css({
							fontSize: "xs",
							fontWeight: "semibold",
							color: "slate.600",
							textDecoration: "none",
							px: "3",
							py: "1.5",
							borderRadius: "lg",
							transition: "all 0.15s ease",
							_hover: {
								color: "slate.900",
								backgroundColor: "rgba(226, 232, 240, 0.5)",
							},
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "wedding.gold",
							},
						})}
					>
						{t("adminPanel")}
					</Link>
				</div>
			</header>

			{/* Główna sekcja hero */}
			<main
				className={css({
					maxW: "3xl",
					mx: "auto",
					px: "6",
					py: "12",
					textAlign: "center",
					my: "auto",
				})}
			>
				<div
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "2",
						px: "3.5",
						py: "1.5",
						borderRadius: "full",
						backgroundColor: "rgba(254, 243, 199, 0.7)",
						color: "amber.800",
						fontSize: "xs",
						fontWeight: "semibold",
						textTransform: "uppercase",
						letterSpacing: "wider",
						mb: "6",
					})}
				>
					<Sparkles
						className={css({ w: "3.5", h: "3.5" })}
						aria-hidden="true"
					/>
					{t("badge")}
				</div>

				<h1
					className={css({
						fontFamily: "serif",
						fontSize: { base: "4xl", sm: "5xl", md: "6xl" },
						fontWeight: "bold",
						color: "wedding.slate",
						letterSpacing: "tight",
						lineHeight: "tight",
						mb: "4",
					})}
				>
					{t("heroTitle")}
				</h1>

				<p
					className={css({
						fontSize: { base: "base", sm: "lg" },
						color: "slate.600",
						maxW: "xl",
						mx: "auto",
						mb: "8",
						fontWeight: "light",
					})}
				>
					{t("heroSubtitle")}
				</p>

				{/* Formularz wejścia do galerii */}
				<form
					onSubmit={handleSearch}
					className={css({ maxW: "md", mx: "auto", mb: "12" })}
				>
					<div
						className={css({
							display: "flex",
							alignItems: "center",
							backgroundColor: "white",
							p: "2",
							borderRadius: "2xl",
							boxShadow: "xl",
							borderWidth: "1px",
							borderColor: "slate.200",
							transition: "all 0.15s ease",
							_focusWithin: {
								borderColor: "wedding.gold",
								boxShadow: "0 0 0 2px rgba(202, 138, 4, 0.3)",
							},
						})}
					>
						<label
							htmlFor="gallery-slug-input"
							className={css({ display: "none" })}
						>
							{t("inputLabel")}
						</label>
						<input
							id="gallery-slug-input"
							type="text"
							aria-label={t("inputLabel")}
							placeholder={t("inputPlaceholder")}
							value={slugInput}
							onChange={(e) => {
								setSlugInput(e.target.value);
								setSlugError(false);
							}}
							className={css({
								flex: "1",
								px: "4",
								py: "2.5",
								fontSize: "sm",
								backgroundColor: "transparent",
								outline: "none",
								borderWidth: "0",
								color: "wedding.slate",
							})}
						/>
						<Button
							type="submit"
							className={css({
								px: "5",
								py: "2.5",
								borderRadius: "xl",
								backgroundColor: "slate.900",
								_hover: { backgroundColor: "slate.800" },
								color: "white",
								fontWeight: "semibold",
								fontSize: "xs",
								transition: "all 0.15s ease",
								display: "flex",
								alignItems: "center",
								gap: "1.5",
								flexShrink: 0,
								cursor: "pointer",
							})}
						>
							<span>{t("submitBtn")}</span>
							<ArrowRight
								className={css({ w: "3.5", h: "3.5" })}
								aria-hidden="true"
							/>
						</Button>
					</div>
					{slugError && (
						<p
							role="alert"
							className={css({ mt: "2", fontSize: "xs", color: "red.600" })}
						>
							{t("slugInvalid")}
						</p>
					)}
				</form>

				{/* Cechy systemu */}
				<div
					className={css({
						display: "grid",
						gridTemplateColumns: {
							base: "repeat(1, 1fr)",
							sm: "repeat(3, 1fr)",
						},
						gap: "4",
						textAlign: "left",
						pt: "6",
						borderTopWidth: "1px",
						borderTopColor: "rgba(226, 232, 240, 0.6)",
					})}
				>
					<div
						className={css({
							backgroundColor: "rgba(255, 255, 255, 0.8)",
							backdropFilter: "blur(4px)",
							p: "4",
							borderRadius: "2xl",
							borderWidth: "1px",
							borderColor: "rgba(226, 232, 240, 0.6)",
						})}
					>
						<QrCode
							className={css({
								w: "5",
								h: "5",
								color: "wedding.gold",
								mb: "2",
							})}
							aria-hidden="true"
						/>
						<h3
							className={css({
								fontWeight: "bold",
								color: "wedding.slate",
								fontSize: "sm",
								mb: "1",
							})}
						>
							{t("feature1Title")}
						</h3>
						<p
							className={css({
								fontSize: "xs",
								color: "slate.500",
								lineHeight: "relaxed",
							})}
						>
							{t("feature1Desc")}
						</p>
					</div>

					<div
						className={css({
							backgroundColor: "rgba(255, 255, 255, 0.8)",
							backdropFilter: "blur(4px)",
							p: "4",
							borderRadius: "2xl",
							borderWidth: "1px",
							borderColor: "rgba(226, 232, 240, 0.6)",
						})}
					>
						<Camera
							className={css({
								w: "5",
								h: "5",
								color: "wedding.gold",
								mb: "2",
							})}
							aria-hidden="true"
						/>
						<h3
							className={css({
								fontWeight: "bold",
								color: "wedding.slate",
								fontSize: "sm",
								mb: "1",
							})}
						>
							{t("feature2Title")}
						</h3>
						<p
							className={css({
								fontSize: "xs",
								color: "slate.500",
								lineHeight: "relaxed",
							})}
						>
							{t("feature2Desc")}
						</p>
					</div>

					<div
						className={css({
							backgroundColor: "rgba(255, 255, 255, 0.8)",
							backdropFilter: "blur(4px)",
							p: "4",
							borderRadius: "2xl",
							borderWidth: "1px",
							borderColor: "rgba(226, 232, 240, 0.6)",
						})}
					>
						<Download
							className={css({
								w: "5",
								h: "5",
								color: "wedding.gold",
								mb: "2",
							})}
							aria-hidden="true"
						/>
						<h3
							className={css({
								fontWeight: "bold",
								color: "wedding.slate",
								fontSize: "sm",
								mb: "1",
							})}
						>
							{t("feature3Title")}
						</h3>
						<p
							className={css({
								fontSize: "xs",
								color: "slate.500",
								lineHeight: "relaxed",
							})}
						>
							{t("feature3Desc")}
						</p>
					</div>
				</div>
			</main>

			{/* Stopka */}
			<footer
				className={css({
					borderTopWidth: "1px",
					borderTopColor: "rgba(226, 232, 240, 0.6)",
					py: "8",
					textAlign: "center",
					fontSize: "xs",
					color: "slate.600",
				})}
			>
				<p className={css({ mb: "4" })}>{t("footerText")}</p>
				<LegalFooterLinks />
			</footer>
		</div>
	);
}
