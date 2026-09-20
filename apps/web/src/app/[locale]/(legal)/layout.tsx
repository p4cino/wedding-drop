import { ArrowLeft } from "lucide-react";
import type React from "react";
import { Link } from "@/i18n/routing";

export default function LegalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-[#FAF8F5] flex flex-col">
			<header className="max-w-4xl mx-auto w-full px-6 py-8">
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-lg py-1"
				>
					<ArrowLeft className="w-4 h-4" aria-hidden="true" />
					Powrót do strony głównej
				</Link>
			</header>

			<main className="max-w-3xl mx-auto w-full px-6 py-8 flex-1">
				{children}
			</main>

			<footer className="border-t border-slate-200/60 py-6 mt-12 text-center text-xs text-slate-500">
				<p>WeddingDrop • Self-Hosted Wedding Gallery Platform</p>
			</footer>
		</div>
	);
}
