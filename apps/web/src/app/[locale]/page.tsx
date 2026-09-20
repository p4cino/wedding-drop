"use client";

import {
	ArrowRight,
	Camera,
	Download,
	Heart,
	QrCode,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";
import { Link } from "@/i18n/routing";

export default function HomePage() {
	const t = useTranslations("LandingPage");
	const [slugInput, setSlugInput] = useState("");
	const router = useRouter();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (!slugInput.trim()) return;
		const cleanSlug = slugInput
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, "");
		router.push(`/g/${cleanSlug}`);
	};

	return (
		<div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
			{/* Pasek górny */}
			<header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs">
						<Heart className="w-4 h-4 fill-current" aria-hidden="true" />
					</div>
					<span className="font-serif-luxury text-xl font-bold tracking-tight text-slate-900">
						WeddingDrop
					</span>
				</div>

				<div className="flex items-center gap-3">
					<Link
						href="/admin"
						className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200/50 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
					>
						{t("adminPanel")}
					</Link>
				</div>
			</header>

			{/* Główna sekcja hero */}
			<main className="max-w-3xl mx-auto px-6 py-12 text-center my-auto">
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/70 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-6">
					<Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
					{t("badge")}
				</div>

				<h1 className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
					{t("heroTitle")}
				</h1>

				<p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-8 font-light">
					{t("heroSubtitle")}
				</p>

				{/* Formularz wejścia do galerii */}
				<form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
					<div className="flex items-center bg-white p-2 rounded-2xl shadow-xl border border-slate-200/80 focus-within:ring-2 focus-within:ring-amber-500/30 transition">
						<label htmlFor="gallery-slug-input" className="sr-only">
							{t("inputLabel")}
						</label>
						<input
							id="gallery-slug-input"
							type="text"
							aria-label={t("inputLabel")}
							placeholder={t("inputPlaceholder")}
							value={slugInput}
							onChange={(e) => setSlugInput(e.target.value)}
							className="flex-1 px-4 py-2.5 text-sm bg-transparent focus:outline-none text-slate-800"
						/>
						<button
							type="submit"
							className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
						>
							<span>{t("submitBtn")}</span>
							<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
						</button>
					</div>
				</form>

				{/* Cechy systemu */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-200/60">
					<div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
						<QrCode
							className="w-5 h-5 text-amber-600 mb-2"
							aria-hidden="true"
						/>
						<h3 className="font-bold text-slate-900 text-sm mb-1">
							{t("feature1Title")}
						</h3>
						<p className="text-xs text-slate-500 leading-relaxed">
							{t("feature1Desc")}
						</p>
					</div>

					<div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
						<Camera
							className="w-5 h-5 text-amber-600 mb-2"
							aria-hidden="true"
						/>
						<h3 className="font-bold text-slate-900 text-sm mb-1">
							{t("feature2Title")}
						</h3>
						<p className="text-xs text-slate-500 leading-relaxed">
							{t("feature2Desc")}
						</p>
					</div>

					<div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
						<Download
							className="w-5 h-5 text-amber-600 mb-2"
							aria-hidden="true"
						/>
						<h3 className="font-bold text-slate-900 text-sm mb-1">
							{t("feature3Title")}
						</h3>
						<p className="text-xs text-slate-500 leading-relaxed">
							{t("feature3Desc")}
						</p>
					</div>
				</div>
			</main>

			{/* Stopka */}
			<footer className="border-t border-slate-200/60 py-8 text-center text-xs text-slate-600">
				<p className="mb-4">{t("footerText")}</p>
				<LegalFooterLinks />
			</footer>
		</div>
	);
}
