"use client";

import { ArrowLeft, Check, Download, Printer, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

export default function CardCustomizerPage() {
	const params = useParams();
	const slug = params?.slug as string;
	const t = useTranslations("CardPage");

	const PRESET_PALETTES = [
		{ name: t("paletteGoldNavy"), primary: "#1E293B", accent: "#D4AF37" },
		{ name: t("paletteGreen"), primary: "#1B4332", accent: "#D4AF37" },
		{ name: t("palettePink"), primary: "#2D3748", accent: "#E0A899" },
		{ name: t("paletteBlack"), primary: "#0F172A", accent: "#475569" },
	];

	const [coupleNames, setCoupleNames] = useState("Katarzyna & Tomasz");
	const [weddingDate, setWeddingDate] = useState("12.09.2026");
	const [headline, setHeadline] = useState(t("defaultHeadline"));
	const [instructions, setInstructions] = useState(t("defaultInstructions"));
	const [primaryColor, setPrimaryColor] = useState("#1E293B");
	const [accentColor, setAccentColor] = useState("#D4AF37");
	const [qrDataUrl, setQrDataUrl] = useState<string>("");
	const [loading, setLoading] = useState(true);

	// Pobranie danych galerii
	useEffect(() => {
		async function loadData() {
			try {
				const res = await fetch(`/api/gallery/${slug}`);
				if (res.ok) {
					const data = await res.json();
					setCoupleNames(data.coupleNames || "Katarzyna & Tomasz");
					setWeddingDate(data.weddingDate || "12.09.2026");
					if (data.cardSettings) {
						if (data.cardSettings.headline)
							setHeadline(data.cardSettings.headline);
						if (data.cardSettings.customInstructions)
							setInstructions(data.cardSettings.customInstructions);
						if (data.cardSettings.primaryColor)
							setPrimaryColor(data.cardSettings.primaryColor);
						if (data.cardSettings.accentColor)
							setAccentColor(data.cardSettings.accentColor);
					}
				}
			} catch (e) {
				console.error("Błąd pobierania danych karteczki:", e);
			} finally {
				setLoading(false);
			}
		}
		loadData();
	}, [slug]);

	// Generowanie kodu QR dla podglądu
	useEffect(() => {
		const url =
			typeof window !== "undefined"
				? `${window.location.origin}/g/${slug}`
				: `http://localhost:3000/g/${slug}`;
		QRCode.toDataURL(url, {
			margin: 1,
			color: {
				dark: primaryColor,
				light: "#FFFFFF",
			},
			errorCorrectionLevel: "H",
		}).then(setQrDataUrl);
	}, [slug, primaryColor]);

	const handlePrint = () => {
		window.print();
	};

	const instructionLines = instructions
		.split("\n")
		.filter((l) => l.trim().length > 0);

	if (loading) {
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
						href={`/api/gallery/${slug}/card/pdf?primaryColor=${encodeURIComponent(primaryColor)}&accentColor=${encodeURIComponent(accentColor)}&headline=${encodeURIComponent(headline)}&instructions=${encodeURIComponent(instructions)}`}
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
										key={palette.name}
										type="button"
										aria-pressed={isActive}
										aria-label={`Wybierz motyw: ${palette.name}`}
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
											{palette.name}
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
									aria-label="Wybierz kolor tekstu i QR z próbnika"
									value={primaryColor}
									onChange={(e) => setPrimaryColor(e.target.value)}
									className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 focus-visible:ring-2 focus-visible:ring-amber-500"
								/>
								<input
									id="primary-color-text"
									type="text"
									aria-label="Wpisz kod HEX koloru tekstu i QR"
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
									aria-label="Wybierz kolor złotej ramki z próbnika"
									value={accentColor}
									onChange={(e) => setAccentColor(e.target.value)}
									className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 focus-visible:ring-2 focus-visible:ring-amber-500"
								/>
								<input
									id="accent-color-text"
									type="text"
									aria-label="Wpisz kod HEX koloru złotej ramki"
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

					{/* Podgląd wizualny karteczki */}
					<div
						id="printable-card"
						className="w-full max-w-[340px] aspect-[105/148] bg-white rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300"
						style={{
							borderColor: accentColor,
						}}
					>
						{/* Ozdobna podwójna ramka */}
						<div
							className="absolute inset-3 border-2 pointer-events-none rounded-lg"
							style={{ borderColor: accentColor }}
						/>
						<div
							className="absolute inset-4 border pointer-events-none rounded-md opacity-60"
							style={{ borderColor: accentColor }}
						/>

						{/* Górna sekcja - Imiona Pary */}
						<div className="relative z-10 pt-3">
							<h3
								className="font-serif-luxury text-xl sm:text-2xl font-bold tracking-tight"
								style={{ color: primaryColor }}
							>
								{coupleNames}
							</h3>
							<p
								className="text-[11px] font-serif-luxury italic tracking-widest mt-0.5"
								style={{ color: accentColor }}
							>
								{weddingDate}
							</p>
						</div>

						{/* Środkowa sekcja - Kod QR */}
						<div className="relative z-10 my-auto flex flex-col items-center">
							<div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-100">
								{qrDataUrl ? (
									<img
										src={qrDataUrl}
										alt={`${t("qrAlt")} ${coupleNames}`}
										className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
									/>
								) : (
									<div className="w-36 h-36 bg-slate-100 animate-pulse rounded-lg" />
								)}
							</div>
						</div>

						{/* Dolna sekcja - Instrukcja */}
						<div className="relative z-10 pb-2">
							<p
								className="font-bold text-xs uppercase tracking-wider mb-1.5"
								style={{ color: primaryColor }}
							>
								{headline}
							</p>
							<div className="space-y-0.5 text-[9.5px] leading-relaxed text-slate-600 max-w-[240px] mx-auto">
								{instructionLines.map((line) => (
									<p key={line}>{line}</p>
								))}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
