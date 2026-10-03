import { defineConfig } from "@pandacss/dev";
import { createPreset } from "@park-ui/panda-preset";
import amber from "@park-ui/panda-preset/colors/amber";
import sand from "@park-ui/panda-preset/colors/sand";

export default defineConfig({
	preflight: true,
	presets: [
		createPreset({
			accentColor: amber,
			grayColor: sand,
			radius: "sm",
		}),
	],
	include: ["./src/**/*.{js,jsx,ts,tsx}"],
	exclude: [],
	jsxFramework: "react",
	outdir: "styled-system",
	theme: {
		extend: {
			tokens: {
				colors: {
					wedding: {
						champagne: { value: "#F7F4EE" },
						gold: { value: "#D4AF37" },
						goldLight: { value: "#F3E5AB" },
						rose: { value: "#E0A899" },
						slate: { value: "#1E293B" },
						dark: { value: "#0F172A" },
						emerald: { value: "#1B4332" },
					},
				},
				fonts: {
					serif: { value: '"Playfair Display", "Cinzel", Georgia, serif' },
					sans: { value: '"Inter", system-ui, -apple-system, sans-serif' },
				},
			},
		},
	},
});
