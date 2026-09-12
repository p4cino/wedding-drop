"use client";

import {
	Calendar,
	Check,
	ExternalLink,
	HardDrive,
	Plus,
	QrCode,
	ShieldCheck,
	Trash2,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

interface GalleryRow {
	id: string;
	slug: string;
	coupleNames: string;
	weddingDate: string;
	ownerEmail: string;
	isActive: boolean;
	totalFiles: number;
	totalBytes: number;
	createdAt: string;
}

export default function AdminDashboardPage() {
	const [token, setToken] = useState<string | null>(null);
	const [username, setUsername] = useState("admin");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const [galleries, setGalleries] = useState<GalleryRow[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Formularz nowego wesela
	const [coupleNames, setCoupleNames] = useState("");
	const [weddingDate, setWeddingDate] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [ownerEmail, setOwnerEmail] = useState("");
	const [ownerPassword, setOwnerPassword] = useState("");
	const [customSlug, setCustomSlug] = useState("");
	const [createdGallery, setCreatedGallery] = useState<any | null>(null);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "login", username, password }),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Błędne dane logowania");
				return;
			}

			setToken(data.adminToken);
			loadGalleries(data.adminToken);
		} catch (_err) {
			setError("Błąd połączenia");
		} finally {
			setLoading(false);
		}
	};

	const loadGalleries = async (adminToken: string) => {
		try {
			const res = await fetch("/api/admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "list-galleries", token: adminToken }),
			});
			if (res.ok) {
				const data = await res.json();
				setGalleries(data.galleries || []);
			}
		} catch (e) {
			console.error(e);
		}
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token) return;

		try {
			const res = await fetch("/api/admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "create-gallery",
					token,
					coupleNames,
					weddingDate,
					ownerEmail,
					ownerPassword,
					customSlug,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				setCreatedGallery(data.gallery);
				loadGalleries(token);
				// Reset formularza
				setCoupleNames("");
				setOwnerEmail("");
				setOwnerPassword("");
				setCustomSlug("");
			} else {
				alert(data.error || "Nie udało się utworzyć galerii");
			}
		} catch (_e) {
			alert("Błąd połączenia");
		}
	};

	const handleDelete = async (galleryId: string, slug: string) => {
		if (
			!confirm(
				`Czy na pewno chcesz bezpowrotnie usunąć galerię "${slug}" wraz ze wszystkimi zdjęciami?`,
			)
		)
			return;
		if (!token) return;

		try {
			const res = await fetch("/api/admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "delete-gallery", token, galleryId }),
			});
			if (res.ok) {
				setGalleries((prev) => prev.filter((g) => g.id !== galleryId));
			}
		} catch (e) {
			console.error(e);
		}
	};

	if (!token) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
				<div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
					<div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mx-auto mb-4">
						<ShieldCheck className="w-6 h-6" />
					</div>
					<h2 className="font-serif-luxury text-2xl font-bold text-center text-slate-900 mb-1">
						Panel Administratora
					</h2>
					<p className="text-xs text-center text-slate-500 mb-6">
						Logowanie do zarządzania wszystkimi galeriami ślubnymi.
					</p>

					<form onSubmit={handleLogin} className="space-y-4">
						{error && (
							<div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
								{error}
							</div>
						)}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Login
							</label>
							<input
								type="text"
								required
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Hasło
							</label>
							<input
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-sm"
						>
							{loading ? "Logowanie..." : "Zaloguj się"}
						</button>
					</form>
				</div>
			</div>
		);
	}

	const totalGlobalFiles = galleries.reduce(
		(acc, g) => acc + (g.totalFiles || 0),
		0,
	);
	const totalGlobalBytes = galleries.reduce(
		(acc, g) => acc + Number(g.totalBytes || 0),
		0,
	);
	const totalGlobalMb = (totalGlobalBytes / (1024 * 1024)).toFixed(1);

	return (
		<div className="min-h-screen bg-[#FAF8F5] pb-20">
			{/* Pasek nawigacyjny */}
			<header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
						<ShieldCheck className="w-5 h-5" />
					</div>
					<div>
						<h1 className="font-bold text-slate-900 text-base">
							Zarządzanie WeddingDrop
						</h1>
						<p className="text-xs text-slate-400">
							Panel Administratora Systemu
						</p>
					</div>
				</div>

				<button
					onClick={() => {
						setCreatedGallery(null);
						setIsModalOpen(true);
					}}
					className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
				>
					<Plus className="w-4 h-4" />
					<span>Nowe wesele</span>
				</button>
			</header>

			<main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
				{/* Statystyki globalne */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
						<div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
							<Users className="w-4 h-4 text-amber-600" />
							<span>Wszystkie wesela</span>
						</div>
						<p className="text-3xl font-bold text-slate-900">
							{galleries.length}
						</p>
					</div>

					<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
						<div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
							<Calendar className="w-4 h-4 text-amber-600" />
							<span>Zebrane zdjęcia i filmy</span>
						</div>
						<p className="text-3xl font-bold text-slate-900">
							{totalGlobalFiles}
						</p>
					</div>

					<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
						<div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
							<HardDrive className="w-4 h-4 text-amber-600" />
							<span>Łączne zużycie dysku</span>
						</div>
						<p className="text-3xl font-bold text-slate-900">
							{totalGlobalMb} MB
						</p>
					</div>
				</div>

				{/* Tabela ślubów */}
				<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
					<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
						<h3 className="font-bold text-slate-800 text-sm">
							Aktywne Galerie Weselne
						</h3>
						<span className="text-xs text-slate-400">
							{galleries.length} rekordów
						</span>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
								<tr>
									<th className="px-6 py-3">Para Młoda</th>
									<th className="px-6 py-3">Data</th>
									<th className="px-6 py-3">Slug (URL)</th>
									<th className="px-6 py-3">E-mail właściciela</th>
									<th className="px-6 py-3">Pliki</th>
									<th className="px-6 py-3">Rozmiar</th>
									<th className="px-6 py-3 text-right">Akcje</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{galleries.map((g) => {
									const mb = (
										Number(g.totalBytes || 0) /
										(1024 * 1024)
									).toFixed(1);
									return (
										<tr key={g.id} className="hover:bg-slate-50/80 transition">
											<td className="px-6 py-3.5 font-bold text-slate-900">
												{g.coupleNames}
											</td>
											<td className="px-6 py-3.5 text-slate-600">
												{g.weddingDate}
											</td>
											<td className="px-6 py-3.5 font-mono text-amber-700">
												{g.slug}
											</td>
											<td className="px-6 py-3.5 text-slate-500">
												{g.ownerEmail}
											</td>
											<td className="px-6 py-3.5 font-medium">
												{g.totalFiles}
											</td>
											<td className="px-6 py-3.5 font-medium text-slate-600">
												{mb} MB
											</td>
											<td className="px-6 py-3.5 text-right space-x-2">
												<Link
													href={`/g/${g.slug}`}
													target="_blank"
													title="Otwórz widok gościa"
													className="inline-block p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
												>
													<ExternalLink className="w-4 h-4" />
												</Link>
												<Link
													href={`/g/${g.slug}/card`}
													target="_blank"
													title="Drukuj karteczkę"
													className="inline-block p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition"
												>
													<QrCode className="w-4 h-4" />
												</Link>
												<Link
													href={`/owner/${g.slug}`}
													target="_blank"
													title="Panel pary młodej"
													className="inline-block p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition font-medium"
												>
													Panel
												</Link>
												<button
													onClick={() => handleDelete(g.id, g.slug)}
													title="Usuń galerię"
													className="inline-block p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</main>

			{/* Modal tworzenia nowej galerii */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 relative">
						<button
							onClick={() => setIsModalOpen(false)}
							className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
						>
							<X className="w-5 h-5" />
						</button>

						<h3 className="font-serif-luxury text-xl font-bold text-slate-900 mb-1">
							Nowa Galeria Weselna
						</h3>
						<p className="text-xs text-slate-500 mb-5">
							Wypełnij podstawowe dane. Kod QR i karteczka do druku wygenerują
							się automatycznie.
						</p>

						{createdGallery ? (
							<div className="space-y-4">
								<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-2">
									<div className="flex items-center gap-1.5 font-bold">
										<Check className="w-4 h-4" /> Galeria została pomyślnie
										utworzona!
									</div>
									<p>
										<strong>Para:</strong> {createdGallery.coupleNames}
									</p>
									<p>
										<strong>Slug:</strong> {createdGallery.slug}
									</p>
								</div>

								<div className="space-y-2 pt-2">
									<Link
										href={`/g/${createdGallery.slug}`}
										target="_blank"
										className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold"
									>
										<span>Otwórz galerię gościa</span>
										<ExternalLink className="w-4 h-4 text-slate-400" />
									</Link>

									<Link
										href={`/g/${createdGallery.slug}/card`}
										target="_blank"
										className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-xs font-semibold text-amber-900"
									>
										<span>Zobacz i pobierz karteczkę A6 do druku</span>
										<QrCode className="w-4 h-4 text-amber-700" />
									</Link>

									<Link
										href={`/owner/${createdGallery.slug}`}
										target="_blank"
										className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold"
									>
										<span>Panel zarządzania pary młodej</span>
										<ExternalLink className="w-4 h-4 text-slate-400" />
									</Link>
								</div>

								<button
									onClick={() => setIsModalOpen(false)}
									className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold"
								>
									Zamknij
								</button>
							</div>
						) : (
							<form onSubmit={handleCreate} className="space-y-3 text-xs">
								<div>
									<label className="block font-semibold text-slate-700 mb-1">
										Imiona Pary Młodej *
									</label>
									<input
										type="text"
										required
										placeholder="np. Kasia & Tomek"
										value={coupleNames}
										onChange={(e) => setCoupleNames(e.target.value)}
										className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-semibold text-slate-700 mb-1">
											Data Ślubu *
										</label>
										<input
											type="date"
											required
											value={weddingDate}
											onChange={(e) => setWeddingDate(e.target.value)}
											className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
										/>
									</div>

									<div>
										<label className="block font-semibold text-slate-700 mb-1">
											Własny Slug (opcjonalny)
										</label>
										<input
											type="text"
											placeholder="np. kasia-i-tomek"
											value={customSlug}
											onChange={(e) => setCustomSlug(e.target.value)}
											className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
										/>
									</div>
								</div>

								<div>
									<label className="block font-semibold text-slate-700 mb-1">
										E-mail Pary Młodej *
									</label>
									<input
										type="email"
										required
										placeholder="kontakt@kasiaitomek.pl"
										value={ownerEmail}
										onChange={(e) => setOwnerEmail(e.target.value)}
										className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
									/>
								</div>

								<div>
									<label className="block font-semibold text-slate-700 mb-1">
										Hasło dostępu dla Pary Młodej *
									</label>
									<input
										type="password"
										required
										placeholder="Hasło do moderacji i pobierania ZIP"
										value={ownerPassword}
										onChange={(e) => setOwnerPassword(e.target.value)}
										className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
									/>
								</div>

								<button
									type="submit"
									className="w-full mt-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl font-semibold shadow-md"
								>
									Utwórz wesele
								</button>
							</form>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
