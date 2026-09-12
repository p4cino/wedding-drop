import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				wedding: {
					champagne: "#F7F4EE",
					gold: "#D4AF37",
					goldLight: "#F3E5AB",
					rose: "#E0A899",
					slate: "#1E293B",
					dark: "#0F172A",
					emerald: "#1B4332",
				},
			},
			fontFamily: {
				serif: ["Playfair Display", "Cinzel", "Georgia", "serif"],
				sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
			},
		},
	},
	plugins: [],
};
export default config;
