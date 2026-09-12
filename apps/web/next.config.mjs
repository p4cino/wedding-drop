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
	],
};

export default nextConfig;
