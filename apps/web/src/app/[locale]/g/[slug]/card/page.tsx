"use client";

import { ArrowLeft, Check, Download, Printer, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { css, cx } from "styled-system/css";
import CardPreview from "@/components/CardPreview";
import GalleryStatusScreen from "@/components/GalleryStatusScreen";
import { Link } from "@/i18n/routing";
import { DEFAULT_CARD_COLORS } from "@/lib/card-defaults";
import { fetchGalleryData } from "@/lib/gallery-api";
import { buildGalleryUrl } from "@/lib/gallery-url";

const PRESET_PALETTES = [
	{ nameKey: "paletteGoldNavy", primary: "#1E293B", accent: "#D4AF37" },
	{ nameKey: "paletteGreen", primary: "#1B4332", accent: "#D4AF37" },
	{ nameKey: "palettePink", primary: "#2D3748", accent: "#E0A899" },
	{ nameKey: "paletteBlack", primary: "#0F172A", accent: "#475569" },
] as const;

type LoadStatus = "loading" | "ready" | "notFound" | "error";

export default function CardCustomizerPage() {
	const params = useParams();
	const slug = params?.slug as string;
	const t = useTranslations("CardPage");

	const [coupleNames, setCoupleNames] = useState("Katarzyna & Tomasz");
	const [weddingDate, setWeddingDate] = useState("12.09.2026");
	const [headline, setHeadline] = useState(t("defaultHeadline"));
	const [instructions, setInstructions] = useState(t("defaultInstructions"));
	const [primaryColor, setPrimaryColor] = useState<string>(
		DEFAULT_CARD_COLORS.primary,
	);
	const [accentColor, setAccentColor] = useState<string>(
		DEFAULT_CARD_COLORS.accent,
	);
	const [qrDataUrl, setQrDataUrl] = useState<string>("");
	const [qrFailed, setQrFailed] = useState(false);
	const [status, setStatus] = useState<LoadStatus>("loading");

	// Pobranie danych galerii (404 => brak galerii, błąd sieci => stan błędu z ponowieniem)
	const loadData = useCallback(async () => {
		setStatus("loading");
		const result = await fetchGalleryData(slug);
		if (result.status !== "ready") {
			setStatus(result.status);
			return;
		}
		const data = result.gallery;
		setCoupleNames(data.coupleNames || "Katarzyna & Tomasz");
		setWeddingDate(data.weddingDate || "12.09.2026");
		const card = data.cardSettings;
		if (card?.headline) setHeadline(card.headline);
		if (card?.customInstructions) setInstructions(card.customInstructions);
		if (card?.primaryColor) setPrimaryColor(card.primaryColor);
		if (card?.accentColor) setAccentColor(card.accentColor);
		setStatus("ready");
	}, [slug]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Generowanie kodu QR dla podglądu; starszy wynik nie może nadpisać nowszego
	useEffect(() => {
		let cancelled = false;
		setQrFailed(false);
		QRCode.toDataURL(buildGalleryUrl(slug), {
			margin: 1,
			color: { dark: primaryColor, light: "#FFFFFF" },
			errorCorrectionLevel: "H",
		})
			.then((url) => {
				if (!cancelled) setQrDataUrl(url);
			})
			.catch((err) => {
				console.error("Błąd generowania kodu QR:", err);
				if (!cancelled) {
					setQrDataUrl("");
					setQrFailed(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [slug, primaryColor]);

	const handlePrint = () => {
		window.print();
	};

	const instructionLines = instructions
		.split("\n")
		.filter((l) => l.trim().length > 0);

	if (status === "notFound") return <GalleryStatusScreen variant="notFound" />;
	if (status === "error") {
		return <GalleryStatusScreen variant="error" onRetry={loadData} />;
	}
	if (status === "loading") {
		return (
			<div
				className={css({
					minH: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#FAF8F5",
				})}
			>
				<div
					className={css({
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
				>
					<div
						className={css({
							w: "8",
							h: "8",
							borderWidth: "2px",
							borderColor: "amber.600",
							borderTopColor: "transparent",
							borderRadius: "full",
							animation: "spin 1s linear infinite",
							mx: "auto",
						})}
					/>
					<p
						className={css({
							fontSize: "sm",
							fontWeight: "medium",
							color: "slate.600",
						})}
					>
						{t("loadingCard")}
					</p>
				</div>
			</div>
		);
	}

	const pdfParams = new URLSearchParams({
		primaryColor,
		accentColor,
		headline,
		instructions,
	});

	return (
		<div
			className={css({
				minH: "100vh",
				backgroundColor: "#FAF8F5",
				pb: "16",
			})}
		>
			{/* Pasek nawigacyjny */}
			<nav
				className={cx(
					"no-print",
					css({
						backgroundColor: "white",
						borderBottomWidth: "1px",
						borderBottomColor: "slate.200", // slate-200/80 approx
						px: "4",
						py: "3",
						position: "sticky",
						top: "0",
						zIndex: 30,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}),
				)}
			>
				<Link
					href={`/g/${slug}`}
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "2",
						fontSize: "sm",
						fontWeight: "medium",
						color: "slate.600",
						_hover: { color: "slate.900" },
						transition: "all 0.15s ease",
						_focusVisible: {
							outline: "2px solid",
							outlineColor: "amber.500",
						},
						borderRadius: "lg",
						p: "1",
					})}
				>
					<ArrowLeft className={css({ w: "4", h: "4" })} aria-hidden="true" />
					<span>{t("backToGallery")}</span>
				</Link>
				<div
					className={css({ display: "flex", alignItems: "center", gap: "2" })}
				>
					<button
						type="button"
						onClick={handlePrint}
						aria-label={t("printAria")}
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "1.5",
							px: "3.5",
							py: "2",
							fontSize: "xs",
							fontWeight: "semibold",
							borderRadius: "xl",
							backgroundColor: "slate.100",
							_hover: { backgroundColor: "slate.200" },
							color: "slate.700",
							transition: "all 0.15s ease",
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "amber.500",
							},
							cursor: "pointer",
						})}
					>
						<Printer className={css({ w: "4", h: "4" })} aria-hidden="true" />
						<span className={css({ display: { base: "none", sm: "inline" } })}>
							{t("printBtn")}
						</span>
					</button>
					<a
						href={`/api/gallery/${slug}/card/pdf?${pdfParams}`}
						download
						aria-label={t("downloadAria")}
						className={css({
							display: "inline-flex",
							alignItems: "center",
							gap: "1.5",
							px: "4",
							py: "2",
							fontSize: "xs",
							fontWeight: "semibold",
							borderRadius: "xl",
							backgroundColor: "amber.600",
							_hover: { backgroundColor: "amber.700" },
							color: "white",
							boxShadow: "sm",
							transition: "all 0.15s ease",
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "amber.500",
							},
						})}
					>
						<Download className={css({ w: "4", h: "4" })} aria-hidden="true" />
						<span>{t("downloadBtn")}</span>
					</a>
				</div>
			</nav>

			<main
				className={css({
					maxW: "5xl",
					mx: "auto",
					px: "4",
					py: "8",
					display: "grid",
					gridTemplateColumns: { base: "1fr", lg: "repeat(12, 1fr)" },
					gap: "8",
					alignItems: "start",
				})}
			>
				{/* Lewa kolumna: Formularz edycji (ukryty podczas druku) */}
				<div
					className={cx(
						"no-print",
						css({
							gridColumn: { lg: "span 5" },
							display: "flex",
							flexDirection: "column",
							gap: "6",
							backgroundColor: "white",
							p: "6",
							borderRadius: "3xl",
							borderWidth: "1px",
							borderColor: "slate.200",
							boxShadow: "xs",
						}),
					)}
				>
					<div>
						<div
							className={css({
								display: "inline-flex",
								alignItems: "center",
								gap: "1.5",
								fontSize: "xs",
								fontWeight: "semibold",
								color: "amber.700",
								textTransform: "uppercase",
								letterSpacing: "wider",
								mb: "1",
							})}
						>
							<Sparkles
								className={css({ w: "3.5", h: "3.5" })}
								aria-hidden="true"
							/>
							{t("designerTitle")}
						</div>
						<h2
							className={cx(
								"font-serif-luxury",
								css({
									fontSize: "2xl",
									fontWeight: "bold",
									color: "slate.900",
								}),
							)}
						>
							{t("designerSubtitle")}
						</h2>
						<p className={css({ fontSize: "xs", color: "slate.500", mt: "1" })}>
							{t("designerDesc")}
						</p>
					</div>

					{/* Palety kolorów */}
					<div>
						<div
							id="color-palette-label"
							className={css({
								display: "block",
								fontSize: "xs",
								fontWeight: "semibold",
								color: "slate.700",
								textTransform: "uppercase",
								letterSpacing: "wider",
								mb: "2",
							})}
						>
							{t("colorTheme")}
						</div>
						<div
							role="group"
							aria-labelledby="color-palette-label"
							className={css({
								display: "grid",
								gridTemplateColumns: "2",
								gap: "2",
							})}
						>
							{PRESET_PALETTES.map((palette) => {
								const isActive =
									primaryColor === palette.primary &&
									accentColor === palette.accent;
								return (
									<button
										key={palette.nameKey}
										type="button"
										aria-pressed={isActive}
										aria-label={t("paletteAria", { name: t(palette.nameKey) })}
										onClick={() => {
											setPrimaryColor(palette.primary);
											setAccentColor(palette.accent);
										}}
										className={css({
											display: "flex",
											alignItems: "center",
											gap: "2",
											p: "2",
											borderRadius: "xl",
											borderWidth: "1px",
											fontSize: "xs",
											fontWeight: "medium",
											transition: "all 0.15s ease",
											textAlign: "left",
											_focusVisible: {
												outline: "2px solid",
												outlineColor: "amber.500",
											},
											cursor: "pointer",
											borderColor: isActive ? "amber.600" : "slate.200",
											backgroundColor: isActive ? "amber.50" : "transparent",
											_hover: {
												borderColor: isActive ? "amber.600" : "slate.300",
											},
										})}
									>
										<div
											className={css({
												display: "flex",
												alignItems: "center",
												flexShrink: 0,
												"& > span": {
													w: "4",
													h: "4",
													borderRadius: "full",
													borderWidth: "1px",
													borderColor: "white",
												},
												"& > span:not(:first-child)": {
													marginLeft: "-1",
												},
											})}
										>
											<span style={{ background: palette.primary }} />
											<span style={{ background: palette.accent }} />
										</div>
										<span
											className={css({
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
												color: "slate.800",
											})}
										>
											{t(palette.nameKey)}
										</span>
										{isActive && (
											<Check
												className={css({
													w: "3.5",
													h: "3.5",
													color: "amber.600",
													ml: "auto",
													flexShrink: 0,
												})}
												aria-hidden="true"
											/>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Własne kolory HEX */}
					<div
						className={css({
							display: "grid",
							gridTemplateColumns: "2",
							gap: "3",
							pt: "1",
						})}
					>
						<div>
							<label
								htmlFor="primary-color-text"
								className={css({
									display: "block",
									fontSize: "11px",
									fontWeight: "medium",
									color: "slate.600",
									mb: "1",
								})}
							>
								{t("textColor")}
							</label>
							<div
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "2",
								})}
							>
								<input
									type="color"
									aria-label={t("textColorPickerAria")}
									value={primaryColor}
									onChange={(e) => setPrimaryColor(e.target.value)}
									className={css({
										w: "8",
										h: "8",
										borderRadius: "lg",
										cursor: "pointer",
										borderWidth: "1px",
										borderColor: "slate.200",
										p: "0.5",
										_focusVisible: {
											outline: "2px solid",
											outlineColor: "amber.500",
										},
									})}
								/>
								<input
									id="primary-color-text"
									type="text"
									aria-label={t("textColorHexAria")}
									value={primaryColor}
									onChange={(e) => setPrimaryColor(e.target.value)}
									className={css({
										w: "full",
										px: "2",
										py: "1",
										fontSize: "xs",
										borderWidth: "1px",
										borderRadius: "lg",
										textTransform: "uppercase",
										_focusVisible: {
											outline: "2px solid",
											outlineColor: "amber.500",
										},
									})}
								/>
							</div>
						</div>
						<div>
							<label
								htmlFor="accent-color-text"
								className={css({
									display: "block",
									fontSize: "11px",
									fontWeight: "medium",
									color: "slate.600",
									mb: "1",
								})}
							>
								{t("frameColor")}
							</label>
							<div
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "2",
								})}
							>
								<input
									type="color"
									aria-label={t("accentColorPickerAria")}
									value={accentColor}
									onChange={(e) => setAccentColor(e.target.value)}
									className={css({
										w: "8",
										h: "8",
										borderRadius: "lg",
										cursor: "pointer",
										borderWidth: "1px",
										borderColor: "slate.200",
										p: "0.5",
										_focusVisible: {
											outline: "2px solid",
											outlineColor: "amber.500",
										},
									})}
								/>
								<input
									id="accent-color-text"
									type="text"
									aria-label={t("accentColorHexAria")}
									value={accentColor}
									onChange={(e) => setAccentColor(e.target.value)}
									className={css({
										w: "full",
										px: "2",
										py: "1",
										fontSize: "xs",
										borderWidth: "1px",
										borderRadius: "lg",
										textTransform: "uppercase",
										_focusVisible: {
											outline: "2px solid",
											outlineColor: "amber.500",
										},
									})}
								/>
							</div>
						</div>
					</div>

					{/* Teksty */}
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "3",
							pt: "2",
						})}
					>
						<div>
							<label
								htmlFor="headline-input"
								className={css({
									display: "block",
									fontSize: "xs",
									fontWeight: "semibold",
									color: "slate.700",
									textTransform: "uppercase",
									letterSpacing: "wider",
									mb: "1",
								})}
							>
								{t("headlineLabel")}
							</label>
							<input
								id="headline-input"
								type="text"
								value={headline}
								onChange={(e) => setHeadline(e.target.value)}
								className={css({
									w: "full",
									px: "3",
									py: "2",
									fontSize: "sm",
									borderWidth: "1px",
									borderColor: "slate.200",
									borderRadius: "xl",
									_focus: { outline: "none" },
									_focusVisible: {
										outline: "2px solid",
										outlineColor: "amber.500",
									},
								})}
							/>
						</div>

						<div>
							<label
								htmlFor="instructions-input"
								className={css({
									display: "block",
									fontSize: "xs",
									fontWeight: "semibold",
									color: "slate.700",
									textTransform: "uppercase",
									letterSpacing: "wider",
									mb: "1",
								})}
							>
								{t("instructionsLabel")}
							</label>
							<textarea
								id="instructions-input"
								rows={3}
								value={instructions}
								onChange={(e) => setInstructions(e.target.value)}
								className={css({
									w: "full",
									px: "3",
									py: "2",
									fontSize: "xs",
									borderWidth: "1px",
									borderColor: "slate.200",
									borderRadius: "xl",
									_focus: { outline: "none" },
									_focusVisible: {
										outline: "2px solid",
										outlineColor: "amber.500",
									},
								})}
							/>
						</div>
					</div>
				</div>

				{/* Prawa kolumna: Podgląd Karteczki A6 1:1 */}
				<div
					className={css({
						gridColumn: { lg: "span 7" },
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
					})}
				>
					<div
						className={cx(
							"no-print",
							css({
								fontSize: "xs",
								color: "slate.400",
								mb: "3",
								fontWeight: "medium",
							}),
						)}
					>
						{t("previewFormat")}
					</div>

					<CardPreview
						coupleNames={coupleNames}
						weddingDate={weddingDate}
						headline={headline}
						lines={instructionLines}
						primaryColor={primaryColor}
						accentColor={accentColor}
						qrDataUrl={qrDataUrl}
						qrFailed={qrFailed}
					/>
				</div>
			</main>
		</div>
	);
}
