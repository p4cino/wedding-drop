import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "WeddingDrop - Zdjęcia i Filmy z Wesela",
		short_name: "WeddingDrop",
		description:
			"Dziel się zdjęciami i filmami z wesela bez konieczności instalowania aplikacji.",
		start_url: "/",
		display: "standalone",
		background_color: "#FAF8F5",
		theme_color: "#FAF8F5",
		icons: [
			{
				src: "/icon-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icon-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
