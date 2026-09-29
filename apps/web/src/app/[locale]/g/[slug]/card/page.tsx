"use client";

import { ArrowLeft, Check, Download, Printer, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
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
			<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
				<div className="text-center space-y-3">
					<div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-sm font-medium text-slate-600">
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
		<div className="min-h-screen bg-[#FAF8F5] pb-16">
			{/* Pasek nawigacyjny */}
			<nav className="no-print bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
				<Link
					href={`/g/${slug}`}
					className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-lg p-1"
				>
					<ArrowLeft className="w-4 h-4" aria-hidden="true" />
					<span>{t("backToGallery")}</span>
				</Link>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handlePrint}
						aria-label={t("printAria")}
						className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
					>
						<Printer className="w-4 h-4" aria-hidden="true" />
						<span className="hidden sm:inline">{t("printBtn")}</span>
					</button>
					<a
						href={`/api/gallery/${slug}/card/pdf?${pdfParams}`}
						download
						aria-label={t("downloadAria")}
						className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
					>
						<Download className="w-4 h-4" aria-hidden="true" />
						<span>{t("downloadBtn")}</span>
					</a>
				</div>
			</nav>

			<main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Lewa kolumna: Formularz edycji (ukryty podczas druku) */}
				<div className="no-print lg:col-span-5 space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
					<div>
						<div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
							<Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
							{t("designerTitle")}
						</div>
						<h2 className="font-serif-luxury text-2xl font-bold text-slate-900">
							{t("designerSubtitle")}
						</h2>
						<p className="text-xs text-slate-500 mt-1">{t("designerDesc")}</p>
					</div>

					{/* Palety kolorów */}
					<div>
						<div
							id="color-palette-label"
							className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
						>
							{t("colorTheme")}
						</div>
						<div
							role="group"
							aria-labelledby="color-palette-label"
							className="grid grid-cols-2 gap-2"
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
										className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition text-left focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
											isActive
												? "border-amber-600 bg-amber-50/50"
												: "border-slate-200 hover:border-slate-300"
										}`}
									>
										<div className="flex -space-x-1 shrink-0">
											<span
												className="w-4 h-4 rounded-full border border-white"
												style={{ background: palette.primary }}
											/>
											<span
												className="w-4 h-4 rounded-full border border-white"
												style={{ background: palette.accent }}
											/>
										</div>
										<span className="truncate text-slate-800">
											{t(palette.nameKey)}
										</span>
										{isActive && (
											<Check
												className="w-3.5 h-3.5 text-amber-600 ml-auto shrink-0"
												aria-hidden="true"
											/>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Własne kolory HEX */}
					<div className="grid grid-cols-2 gap-3 pt-1">
						<div>
							<label
								htmlFor="primary-color-text"
								className="block text-[11px] font-medium text-slate-600 mb-1"
							>
								{t("textColor")}
							</label>
							<div className="flex items-center gap-2">
								<input
									type="color"
									aria-label={t("textColorPickerAria")}
									value={primaryColor}
									onChange={(e) => setPrimaryColor(e.target.value)}
									className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 focus-visible:ring-2 focus-visible:ring-amber-500"
								/>
								<input
									id="primary-color-text"
									type="text"
									aria-label={t("textColorHexAria")}
									value={primaryColor}
									onChange={(e) => setPrimaryColor(e.target.value)}
									className="w-full px-2 py-1 text-xs border rounded-lg uppercase focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
								/>
							</div>
						</div>
						<div>
							<label
								htmlFor="accent-color-text"
								className="block text-[11px] font-medium text-slate-600 mb-1"
							>
								{t("frameColor")}
							</label>
							<div className="flex items-center gap-2">
								<input
									type="color"
									aria-label={t("accentColorPickerAria")}
									value={accentColor}
									onChange={(e) => setAccentColor(e.target.value)}
									className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 focus-visible:ring-2 focus-visible:ring-amber-500"
								/>
								<input
									id="accent-color-text"
									type="text"
									aria-label={t("accentColorHexAria")}
									value={accentColor}
									onChange={(e) => setAccentColor(e.target.value)}
									className="w-full px-2 py-1 text-xs border rounded-lg uppercase focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
								/>
							</div>
						</div>
					</div>

					{/* Teksty */}
					<div className="space-y-3 pt-2">
						<div>
							<label
								htmlFor="headline-input"
								className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
							>
								{t("headlineLabel")}
							</label>
							<input
								id="headline-input"
								type="text"
								value={headline}
								onChange={(e) => setHeadline(e.target.value)}
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-500"
							/>
						</div>

						<div>
							<label
								htmlFor="instructions-input"
								className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
							>
								{t("instructionsLabel")}
							</label>
							<textarea
								id="instructions-input"
								rows={3}
								value={instructions}
								onChange={(e) => setInstructions(e.target.value)}
								className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-500"
							/>
						</div>
					</div>
				</div>

				{/* Prawa kolumna: Podgląd Karteczki A6 1:1 */}
				<div className="lg:col-span-7 flex flex-col items-center justify-center">
					<div className="no-print text-xs text-slate-400 mb-3 font-medium">
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
