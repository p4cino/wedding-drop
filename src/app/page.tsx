"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, QrCode, Shield, ArrowRight, Lock, Camera, Download } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [slugInput, setSlugInput] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugInput.trim()) return;
    const cleanSlug = slugInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    router.push(`/g/${cleanSlug}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      {/* Pasek górny */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <span className="font-serif-luxury text-xl font-bold tracking-tight text-slate-900">
            WeddingDrop
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200/50 transition"
          >
            Panel Administratora
          </Link>
        </div>
      </header>

      {/* Główna sekcja hero */}
      <main className="max-w-3xl mx-auto px-6 py-12 text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/70 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Samoobsługowa Fotowrzutka Ślubna
        </div>

        <h1 className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
          Wszystkie zdjęcia z Twojego wesela w jednym miejscu
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-8 font-light">
          Goście skanują kod QR ze stolika i wrzucają zdjęcia prosto z telefonów. Bez instalowania aplikacji, bez logowania i bez limitów.
        </p>

        {/* Formularz wejścia do galerii */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
          <div className="flex items-center bg-white p-2 rounded-2xl shadow-xl border border-slate-200/80 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
            <input
              type="text"
              placeholder="Wpisz nazwę galerii (np. kasia-i-tomek)"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm bg-transparent focus:outline-none text-slate-800"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
            >
              <span>Otwórz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Cechy systemu */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-200/60">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
            <QrCode className="w-5 h-5 text-amber-600 mb-2" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">Karteczki A6 z QR</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automatyczny generator gotowych do druku winietek na stoły weselne w wysokiej rozdzielczości.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
            <Camera className="w-5 h-5 text-amber-600 mb-2" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">Wznawialny Upload</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Protokół TUS gwarantuje, że zerwane połączenie Wi-Fi/LTE na sali wznowi się bez utraty danych.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
            <Download className="w-5 h-5 text-amber-600 mb-2" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">Pobieranie ZIP w locie</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Para młoda pobiera wszystkie zdjęcia jednym kliknięciem bez czekania na kompresję i bez zapychania RAMu.
            </p>
          </div>
        </div>
      </main>

      {/* Stopka */}
      <footer className="border-t border-slate-200/60 py-6 text-center text-xs text-slate-400">
        <p>WeddingDrop • Self-Hosted Wedding Gallery Platform • Zoptymalizowano pod Intel N100</p>
      </footer>
    </div>
  );
}
