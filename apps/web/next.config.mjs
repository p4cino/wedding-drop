import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
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
	],
};

const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
