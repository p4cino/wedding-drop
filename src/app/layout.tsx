import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeddingDrop - Zdjęcia i Filmy z Wesela",
  description: "Dziel się zdjęciami i filmami z wesela bez konieczności instalowania aplikacji.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </head>
      <body className="min-h-screen bg-[#FAF8F5] text-slate-800 antialiased selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
