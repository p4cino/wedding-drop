"use client";

import { useTranslations } from "next-intl";

interface CardPreviewProps {
	coupleNames: string;
	weddingDate: string;
	headline: string;
	lines: string[];
	primaryColor: string;
	accentColor: string;
	qrDataUrl: string;
	/** Generowanie kodu QR nie powiodło się — pokazujemy komunikat zamiast szkieletu ładowania. */
	qrFailed: boolean;
}

/** Podgląd karteczki A6 1:1 (`#printable-card` jest celem druku przeglądarki). */
export default function CardPreview({
	coupleNames,
	weddingDate,
	headline,
	lines,
	primaryColor,
	accentColor,
	qrDataUrl,
	qrFailed,
}: CardPreviewProps) {
	const t = useTranslations("CardPage");
	// Powtarzające się linie instrukcji dostają unikalne klucze (linia + numer wystąpienia)
	const seen = new Map<string, number>();
	const keyedLines = lines.map((line) => {
		const occurrence = (seen.get(line) ?? 0) + 1;
		seen.set(line, occurrence);
		return { key: `${line}#${occurrence}`, line };
	});
	return (
		<div
			id="printable-card"
			className="w-full max-w-[340px] aspect-[105/148] bg-white rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300"
			style={{ borderColor: accentColor }}
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
					) : qrFailed ? (
						<div
							role="alert"
							className="w-36 h-36 flex items-center justify-center text-[10px] text-red-600 text-center p-2"
						>
							{t("qrError")}
						</div>
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
					{keyedLines.map(({ key, line }) => (
						<p key={key}>{line}</p>
					))}
				</div>
			</div>
		</div>
	);
}
