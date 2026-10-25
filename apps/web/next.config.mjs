process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = "1";

import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	transpilePackages: ["@wedding-drop/db", "@wedding-drop/media"],
	images: {
		unoptimized: true, // Ponieważ miniatury generujemy bezpośrednio przez Sharp i serwujemy statycznie
	},
	serverExternalPackages: [
		"sharp",
		"pdf-lib",
		"archiver",
		"@tus/server",
		"@tus/file-store",
		"postgres",
		"@googleapis/drive",
		"drizzle-orm",
		"@node-rs/bcrypt",
	],
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(self), microphone=(self), geolocation=()",
					},
				],
			},
		];
	},
	output: "standalone",
	turbopack: {},
};

const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	disable: process.env.NODE_ENV !== "production",
});

export default withSerwist(withNextIntl(nextConfig));
