import { ExternalLink, type LucideIcon, QrCode } from "lucide-react";
import { css } from "styled-system/css";

export interface GalleryLinkConfig {
	/** Ścieżka względem sluga galerii, np. `/g/{slug}`. */
	path: (slug: string) => string;
	/** Klucz etykiety w tabeli (ikona) i w modalu sukcesu. */
	tableLabelKey: "actionGuest" | "actionPrint" | "actionOwner";
	modalLabelKey: "modalLinkGuest" | "modalLinkPrint" | "modalLinkOwner";
	Icon: LucideIcon | null;
	tableTone: string;
	modalTone: string;
	modalIconTone: string;
}

/** Trzy linki do galerii (gość, wydruk karty, panel pary) — jedno źródło dla tabeli i modala. */
export const GALLERY_LINKS: GalleryLinkConfig[] = [
	{
		path: (slug) => `/g/${slug}`,
		tableLabelKey: "actionGuest",
		modalLabelKey: "modalLinkGuest",
		Icon: ExternalLink,
		tableTone: css({
			color: "slate.600",
			_hover: { color: "slate.900", backgroundColor: "slate.100" },
			_focusVisible: { outline: "2px solid", outlineColor: "slate.900" },
		}),
		modalTone: css({
			borderColor: "slate.200",
			_hover: { backgroundColor: "slate.50" },
			_focusVisible: { outline: "2px solid", outlineColor: "slate.900" },
		}),
		modalIconTone: css({ color: "slate.400" }),
	},
	{
		path: (slug) => `/g/${slug}/card`,
		tableLabelKey: "actionPrint",
		modalLabelKey: "modalLinkPrint",
		Icon: QrCode,
		tableTone: css({
			color: "amber.600",
			_hover: { color: "amber.800", backgroundColor: "amber.50" },
			_focusVisible: { outline: "2px solid", outlineColor: "amber.500" },
		}),
		modalTone: css({
			borderColor: "amber.200",
			backgroundColor: "rgba(254, 243, 199, 0.5)",
			_hover: { backgroundColor: "rgba(253, 230, 138, 0.5)" },
			color: "amber.900",
			_focusVisible: { outline: "2px solid", outlineColor: "amber.500" },
		}),
		modalIconTone: css({ color: "amber.700" }),
	},
	{
		path: (slug) => `/owner/${slug}`,
		tableLabelKey: "actionOwner",
		modalLabelKey: "modalLinkOwner",
		Icon: null,
		tableTone: css({
			color: "blue.600",
			_hover: { color: "blue.800", backgroundColor: "blue.50" },
			fontWeight: "medium",
			_focusVisible: { outline: "2px solid", outlineColor: "blue.500" },
		}),
		modalTone: css({
			borderColor: "slate.200",
			_hover: { backgroundColor: "slate.50" },
			_focusVisible: { outline: "2px solid", outlineColor: "slate.900" },
		}),
		modalIconTone: css({ color: "slate.400" }),
	},
];
