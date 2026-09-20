import type { Metadata, Viewport } from "next";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import "../globals.css";

export const metadata: Metadata = {
	title: "WeddingDrop - Zdjęcia i Filmy z Wesela",
	description:
		"Dziel się zdjęciami i filmami z wesela bez konieczności instalowania aplikacji.",
	robots: {
		index: false,
		follow: false,
		nocache: true,
	},
	appleWebApp: {
		capable: true,
		title: "WeddingDrop",
		statusBarStyle: "default",
	},
	formatDetection: {
		telephone: false,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: "#FAF8F5",
};

export default async function RootLayout({
	children,
	params
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{locale: string}>;
}>) {
	const { locale } = await params;
	if (!routing.locales.includes(locale as any)) {
		notFound();
	}
	const messages = await getMessages();

	return (
		<html lang={locale}>
			<head>
				<meta name="robots" content="noindex, nofollow, noarchive" />
			</head>
			<body className="min-h-screen bg-[#FAF8F5] text-slate-800 antialiased selection:bg-amber-100 selection:text-amber-900">
				<NextIntlClientProvider messages={messages}>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
