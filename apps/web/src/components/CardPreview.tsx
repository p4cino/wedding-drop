"use client";

import { useTranslations } from "next-intl";
import { css, cx } from "styled-system/css";

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
			className={css({
				w: "full",
				maxW: "340px",
				aspectRatio: "105/148",
				backgroundColor: "white",
				borderRadius: "xl",
				boxShadow: "2xl",
				p: { base: "4", sm: "5" },
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				textAlign: "center",
				position: "relative",
				overflow: "hidden",
				transition: "all 0.3s ease",
			})}
			style={{ borderColor: accentColor }}
		>
			{/* Ozdobna podwójna ramka */}
			<div
				className={css({
					position: "absolute",
					inset: "3",
					borderWidth: "2px",
					pointerEvents: "none",
					borderRadius: "lg",
				})}
				style={{ borderColor: accentColor }}
			/>
			<div
				className={css({
					position: "absolute",
					inset: "4",
					borderWidth: "1px",
					pointerEvents: "none",
					borderRadius: "md",
					opacity: 0.6,
				})}
				style={{ borderColor: accentColor }}
			/>

			{/* Górna sekcja - Imiona Pary */}
			<div className={css({ position: "relative", zIndex: 10, pt: "3" })}>
				<h3
					className={cx(
						"font-serif-luxury",
						css({
							fontSize: { base: "xl", sm: "2xl" },
							fontWeight: "bold",
							letterSpacing: "tight",
						}),
					)}
					style={{ color: primaryColor }}
				>
					{coupleNames}
				</h3>
				<p
					className={cx(
						"font-serif-luxury",
						css({
							fontSize: "11px",
							fontStyle: "italic",
							letterSpacing: "widest",
							mt: "0.5",
						}),
					)}
					style={{ color: accentColor }}
				>
					{weddingDate}
				</p>
			</div>

			{/* Środkowa sekcja - Kod QR */}
			<div
				className={css({
					position: "relative",
					zIndex: 10,
					my: "auto",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				})}
			>
				<div
					className={css({
						p: "2.5",
						backgroundColor: "white",
						borderRadius: "2xl",
						boxShadow: "xs",
						borderWidth: "1px",
						borderColor: "slate.100",
					})}
				>
					{qrDataUrl ? (
						<img
							src={qrDataUrl}
							alt={`${t("qrAlt")} ${coupleNames}`}
							className={css({
								w: { base: "36", sm: "40" },
								h: { base: "36", sm: "40" },
								objectFit: "contain",
							})}
						/>
					) : qrFailed ? (
						<div
							role="alert"
							className={css({
								w: "36",
								h: "36",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "10px",
								color: "red.600",
								textAlign: "center",
								p: "2",
							})}
						>
							{t("qrError")}
						</div>
					) : (
						<div
							className={css({
								w: "36",
								h: "36",
								backgroundColor: "slate.100",
								animation: "pulse",
								borderRadius: "lg",
							})}
						/>
					)}
				</div>
			</div>

			{/* Dolna sekcja - Instrukcja */}
			<div className={css({ position: "relative", zIndex: 10, pb: "2" })}>
				<p
					className={css({
						fontWeight: "bold",
						fontSize: "xs",
						textTransform: "uppercase",
						letterSpacing: "wider",
						mb: "1.5",
					})}
					style={{ color: primaryColor }}
				>
					{headline}
				</p>
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "0.5",
						fontSize: "9.5px",
						lineHeight: "relaxed",
						color: "slate.600",
						maxW: "240px",
						mx: "auto",
					})}
				>
					{keyedLines.map(({ key, line }) => (
						<p key={key}>{line}</p>
					))}
				</div>
			</div>
		</div>
	);
}
