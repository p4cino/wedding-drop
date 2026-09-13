import withSerwistInit from "@serwist/next";

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
		"googleapis",
	],
	turbopack: {},
};

const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	disable: process.env.NODE_ENV !== "production",
});

export default withSerwist(nextConfig);
