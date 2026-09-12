"use client";

import React, { useEffect } from "react";
import { X, Download, ChevronLeft, ChevronRight, Video, Calendar, User } from "lucide-react";

export interface MediaItemData {
  id: string;
  uploaderName: string;
  fileType: "image" | "video";
  mimeType: string;
  originalFileName: string;
  thumbUrl: string;
  rawUrl: string;
  createdAt: string;
}

interface LightboxModalProps {
  items: MediaItemData[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  allowDownloads?: boolean;
}

export default function LightboxModal({
  items,
  currentIndex,
  onClose,
  onNavigate,
  allowDownloads = true,
}: LightboxModalProps) {
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex === null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < items.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, items.length, onClose, onNavigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null || currentIndex === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // piksele

    if (diff > minSwipeDistance && currentIndex < items.length - 1) {
      // Przesunięcie w lewo -> Następne zdjęcie
      onNavigate(currentIndex + 1);
    } else if (diff < -minSwipeDistance && currentIndex > 0) {
      // Przesunięcie w prawo -> Poprzednie zdjęcie
      onNavigate(currentIndex - 1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (currentIndex === null || !items[currentIndex]) return null;
  const current = items[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Górny pasek nawigacji */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white text-xs space-y-0.5">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-sm">{current.uploaderName}</span>
          </div>
          <p className="text-slate-400 text-[11px] truncate max-w-[200px] sm:max-w-md">
            {current.originalFileName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {allowDownloads && (
            <a
              href={current.rawUrl}
              download={current.originalFileName}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
              title="Pobierz oryginalny plik"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Strzałki poprzedni/następny (zoptymalizowane pod desktop i mobile) */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-2 sm:left-4 p-2.5 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition z-20"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {currentIndex < items.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-2 sm:right-4 p-2.5 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition z-20"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Podgląd nośnika */}
      <div className="w-full h-full flex items-center justify-center p-2 sm:p-12">
        {current.fileType === "video" ? (
          <video
            src={current.rawUrl}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
          />
        ) : (
          <img
            src={current.rawUrl}
            alt={current.originalFileName}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition duration-300"
          />
        )}
      </div>

      {/* Dolny wskaźnik pozycji */}
      <div className="absolute bottom-4 inset-x-0 text-center text-xs text-slate-400 font-medium pointer-events-none">
        {currentIndex + 1} z {items.length}
      </div>
    </div>
  );
}
