"use client";

import React, { useState, useRef } from "react";
import * as tus from "tus-js-client";
import { Upload, X, CheckCircle2, AlertCircle, Image as ImageIcon, Video, Loader2 } from "lucide-react";

interface UploaderDrawerProps {
  gallerySlug: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  uploadInstance?: tus.Upload;
}

export default function UploaderDrawer({
  gallerySlug,
  isOpen,
  onClose,
  onUploadSuccess,
}: UploaderDrawerProps) {
  const [uploaderName, setUploaderName] = useState("");
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const selected = Array.from(e.target.files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const name = uploaderName.trim() || "Gość weselny";

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === "completed") continue;

      await new Promise<void>((resolve) => {
        const tusEndpoint = typeof window !== "undefined"
          ? `${window.location.origin}/api/upload/tus`
          : "/api/upload/tus";

        const upload = new tus.Upload(item.file, {
          endpoint: tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000],
          chunkSize: 5 * 1024 * 1024, // 5MB chunki - idealne przy słabym LTE
          metadata: {
            gallerySlug,
            uploaderName: name,
            originalName: item.file.name,
            fileType: item.file.type,
          },
          onError: (error) => {
            console.error(`Błąd uploadu pliku ${item.file.name}:`, error);
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, status: "error", error: "Błąd połączenia" } : f))
            );
            resolve();
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress: percentage, status: "uploading" } : f))
            );
          },
          onSuccess: () => {
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress: 100, status: "completed" } : f))
            );
            resolve();
          },
        });

        upload.start();
      });
    }

    setIsUploading(false);
    onUploadSuccess?.();
  };

  const allCompleted = files.length > 0 && files.every((f) => f.status === "completed");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Nagłówek Drawer */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3 className="font-serif-luxury text-xl font-bold text-slate-900">Dodaj zdjęcia i filmy</h3>
            <p className="text-xs text-slate-500">Bez logowania • Zostaną zapisane w galerii</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zawartość */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Podpis gościa */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Twój podpis (opcjonalnie)
            </label>
            <input
              type="text"
              placeholder="np. Ciocia Kasia i Wujek Michał"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition text-sm bg-slate-50/50"
            />
          </div>

          {/* Strefa wyboru plików */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-2xl p-6 text-center cursor-pointer transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFilesSelected}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Kliknij, aby wybrać z galerii lub aparatu</p>
            <p className="text-xs text-slate-500 mt-1">Obsługa zdjęć JPEG, PNG, HEIC oraz filmów MP4/MOV</p>
          </div>

          {/* Lista wybranych plików */}
          {files.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                <span>Wybrano: {files.length} plików</span>
                {allCompleted && <span className="text-emerald-600 font-semibold">Wszystko wysłane! 🎉</span>}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {files.map((item) => {
                  const isVid = item.file.type.startsWith("video");
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        {isVid ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="truncate font-medium text-slate-800">{item.file.name}</p>
                          <span className="text-slate-400 shrink-0 ml-2">
                            {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>

                        {/* Pasek postępu */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.status === "completed"
                                ? "bg-emerald-500"
                                : item.status === "error"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.status === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        {item.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {item.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                        {item.status === "pending" && !isUploading && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(item.id);
                            }}
                            className="p-1 hover:text-red-500 text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dolny przycisk akcji */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
          {allCompleted ? (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Gotowe, wróć do galerii
            </button>
          ) : (
            <button
              onClick={startUpload}
              disabled={files.length === 0 || isUploading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-2xl font-semibold shadow-lg shadow-amber-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wysyłanie plików...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Wyślij do galerii ({files.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
