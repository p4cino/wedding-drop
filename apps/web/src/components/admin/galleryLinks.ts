import { ExternalLink, type LucideIcon, QrCode } from "lucide-react";

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
		tableTone:
			"text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-900",
		modalTone:
			"border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-900",
		modalIconTone: "text-slate-400",
	},
	{
		path: (slug) => `/g/${slug}/card`,
		tableLabelKey: "actionPrint",
		modalLabelKey: "modalLinkPrint",
		Icon: QrCode,
		tableTone:
			"text-amber-600 hover:text-amber-800 hover:bg-amber-50 focus-visible:ring-amber-500",
		modalTone:
			"border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-amber-900 focus-visible:ring-amber-500",
		modalIconTone: "text-amber-700",
	},
	{
		path: (slug) => `/owner/${slug}`,
		tableLabelKey: "actionOwner",
		modalLabelKey: "modalLinkOwner",
		Icon: null,
		tableTone:
			"text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium focus-visible:ring-blue-500",
		modalTone:
			"border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-900",
		modalIconTone: "text-slate-400",
	},
];
