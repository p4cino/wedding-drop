"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Lock,
  Download,
  Eye,
  EyeOff,
  Trash2,
  HardDrive,
  Images,
  Film,
  QrCode,
  ExternalLink,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Play,
  Unlink,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface MediaItem {
  id: string;
  uploaderName: string;
  fileType: "image" | "video";
  originalFileName: string;
  fileSize: number;
  thumbUrl: string;
  rawUrl: string;
  status: "ready" | "hidden";
  createdAt: string;
}

export default function OwnerDashboardPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [galleryInfo, setGalleryInfo] = useState<any>(null);
  const [stats, setStats] = useState<{ totalFiles: number; totalBytes: number }>({ totalFiles: 0, totalBytes: 0 });
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<"all" | "ready" | "hidden">("all");

  // Google Drive state
  const [isGDriveConfigured, setIsGDriveConfigured] = useState(true);
  const [hasGDrive, setHasGDrive] = useState(false);
  const [gdriveEmail, setGDriveEmail] = useState<string | null>(null);
  const [gdriveStatus, setGDriveStatus] = useState<string>("idle");
  const [gdriveProgress, setGDriveProgress] = useState<any>(null);
  const [gdriveFolderId, setGDriveFolderId] = useState<string | null>(null);
  const [gdriveExportedAt, setGDriveExportedAt] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [includeHiddenInExport, setIncludeHiddenInExport] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [gdriveToast, setGDriveToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sprawdzanie parametrów powrotnych z Google OAuth i pamięci sesji
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("gdrive") === "connected") {
        setGDriveToast({
          type: "success",
          text: "Dysk Google został pomyślnie podłączony do galerii!",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get("gdrive_error")) {
        setGDriveToast({
          type: "error",
          text: `Nie udało się połączyć Dysku Google: ${urlParams.get("gdrive_error")}`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const savedPwd = sessionStorage.getItem(`owner_pwd_${slug}`);
      if (savedPwd) {
        setPassword(savedPwd);
        doLogin(savedPwd);
      }
    }
  }, [slug]);

  // Nasłuch zdarzeń SSE na żywo (nowe pliki oraz postęp Google Drive)
  useEffect(() => {
    if (!isAuthenticated || !slug) return;

    const es = new EventSource(`/api/gallery/${slug}/live`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new-media") {
          loadMedia();
        } else if (data.type === "gdrive-progress") {
          if (data.progress) {
            setGDriveProgress(data.progress);
            if (data.progress.status) {
              setGDriveStatus(data.progress.status);
            }
            if (data.progress.rootFolderId) {
              setGDriveFolderId(data.progress.rootFolderId);
            }
          }
        }
      } catch (e) {}
    };

    return () => {
      es.close();
    };
  }, [isAuthenticated, slug]);

  // Fallbackowe odpytywanie statusu eksportu, gdy jest 'running'
  useEffect(() => {
    if (!isAuthenticated || gdriveStatus !== "running") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-gdrive-status", slug, password }),
        });
        if (res.ok) {
          const data = await res.json();
          setGDriveStatus(data.gdriveExportStatus);
          if (data.gdriveExportProgress) {
            setGDriveProgress(data.gdriveExportProgress);
          }
          if (data.gdriveRootFolderId) {
            setGDriveFolderId(data.gdriveRootFolderId);
          }
          if (data.gdriveExportedAt) {
            setGDriveExportedAt(data.gdriveExportedAt);
          }
        }
      } catch (err) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated, gdriveStatus, slug, password]);

  const doLogin = async (pwd: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", slug, password: pwd }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Błędne hasło");
        sessionStorage.removeItem(`owner_pwd_${slug}`);
        return;
      }

      sessionStorage.setItem(`owner_pwd_${slug}`, pwd);
      setIsAuthenticated(true);
      setGalleryInfo(data.gallery);
      setStats(data.stats);
      setIsGDriveConfigured(data.isGDriveConfigured ?? true);
      setHasGDrive(Boolean(data.gallery?.hasGDrive));
      setGDriveEmail(data.gallery?.gdriveAccountEmail || null);
      setGDriveStatus(data.gallery?.gdriveExportStatus || "idle");
      setGDriveProgress(data.gallery?.gdriveExportProgress || null);
      setGDriveFolderId(data.gallery?.gdriveRootFolderId || null);
      setGDriveExportedAt(data.gallery?.gdriveExportedAt || null);

      loadMedia(pwd);
    } catch (err) {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(password);
  };

  const loadMedia = async (pwd = password) => {
    try {
      const res = await fetch(`/api/gallery/${slug}/media?includeHidden=true&password=${encodeURIComponent(pwd)}`);
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (mediaId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ready" ? "hidden" : "ready";
    try {
      const res = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-status", slug, password, mediaId, newStatus }),
      });
      if (res.ok) {
        setMediaList((prev) =>
          prev.map((m) => (m.id === mediaId ? { ...m, status: newStatus as any } : m))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm("Czy na pewno chcesz bezpowrotnie usunąć ten plik?")) return;
    try {
      const res = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-media", slug, password, mediaId }),
      });
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Obsługa łączenia z Dyskiem Google
  const handleConnectGDrive = () => {
    window.location.href = `/api/auth/google?slug=${slug}&password=${encodeURIComponent(password)}`;
  };

  // Obsługa odłączania Dysku Google
  const handleDisconnectGDrive = async () => {
    if (!confirm("Czy na pewno chcesz odłączyć konto Google Drive od tej galerii?")) return;
    try {
      const res = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect-gdrive", slug, password }),
      });
      if (res.ok) {
        setHasGDrive(false);
        setGDriveEmail(null);
        setGDriveStatus("idle");
        setGDriveProgress(null);
        setGDriveToast({ type: "success", text: "Konto Google Drive zostało odłączone." });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Uruchomienie eksportu
  const handleStartExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start-gdrive-export",
          slug,
          password,
          includeHidden: includeHiddenInExport,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Nie udało się rozpocząć eksportu.");
        return;
      }
      setGDriveStatus("running");
      setShowExportModal(false);
      setGDriveToast({
        type: "success",
        text: "Eksport został uruchomiony w tle. Poniżej możesz śledzić postęp.",
      });
    } catch (e) {
      alert("Błąd połączenia podczas uruchamiania eksportu.");
    } finally {
      setExportLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif-luxury text-2xl font-bold text-center text-slate-900 mb-1">
            Panel Pary Młodej
          </h2>
          <p className="text-xs text-center text-slate-500 mb-6">
            Podaj hasło do swojej galerii ({slug}), aby zarządzać zdjęciami, pobrać ZIP lub przesłać na Dysk Google.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hasło</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wpisz hasło dostępu"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Logowanie..." : "Zaloguj się"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredMedia = mediaList.filter((m) => {
    if (filter === "ready") return m.status === "ready";
    if (filter === "hidden") return m.status === "hidden";
    return true;
  });

  const totalMegabytes = (stats.totalBytes / (1024 * 1024)).toFixed(1);
  const imagesCount = mediaList.filter((m) => m.fileType === "image").length;
  const videosCount = mediaList.filter((m) => m.fileType === "video").length;

  // Obliczenia postępu Google Drive
  const progressPercent =
    gdriveProgress?.totalFiles && gdriveProgress?.totalFiles > 0
      ? Math.min(100, Math.round((gdriveProgress.processedFiles / gdriveProgress.totalFiles) * 100))
      : 0;

  const processedMB = gdriveProgress?.processedBytes
    ? (gdriveProgress.processedBytes / (1024 * 1024)).toFixed(1)
    : "0";
  const totalProgMB = gdriveProgress?.totalBytes
    ? (gdriveProgress.totalBytes / (1024 * 1024)).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20">
      {/* Toast powiadomień */}
      {gdriveToast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
            gdriveToast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {gdriveToast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-medium flex-1">{gdriveToast.text}</div>
          <button
            onClick={() => setGDriveToast(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pasek nawigacyjny */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-xl sm:text-2xl font-bold text-slate-900">
            {galleryInfo?.coupleNames || "Panel Właściciela"}
          </h1>
          <p className="text-xs text-slate-500">Zarządzanie galerią, eksport i moderacja treści</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/g/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Zobacz galerię gościa</span>
          </Link>

          <Link
            href={`/g/${slug}/card`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Karteczka A6</span>
          </Link>

          <a
            href={`/api/gallery/${slug}/zip?password=${encodeURIComponent(password)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Pobierz ZIP</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Kafelki statystyk */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Images className="w-4 h-4 text-amber-600" />
              <span>Zdjęcia</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{imagesCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Film className="w-4 h-4 text-amber-600" />
              <span>Filmy</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{videosCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <HardDrive className="w-4 h-4 text-amber-600" />
              <span>Zajęte miejsce</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalMegabytes} MB</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-xs font-medium mb-1">Status galerii</div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Aktywna
              </span>
            </div>
            <button
              onClick={() => loadMedia()}
              title="Odśwież"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sekcja: Kopia w chmurze (Google Drive) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-amber-500/5 via-amber-50/20 to-transparent border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 font-serif-luxury">
                    Kopia w chmurze Google Drive
                  </h2>
                  {hasGDrive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Połączono ({gdriveEmail || "Konto Google"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                      Niepodłączono
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  Prześlij wszystkie zdjęcia i filmy z wesela w 100% oryginalnej rozdzielczości bezpośrednio na swój prywatny Dysk Google w uporządkowanych folderach.
                </p>
              </div>
            </div>

            {/* Przyciski główne akcji */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {!hasGDrive ? (
                <button
                  onClick={handleConnectGDrive}
                  disabled={!isGDriveConfigured}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold shadow-sm transition ${
                    isGDriveConfigured
                      ? "bg-slate-900 hover:bg-slate-800 text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  <span>Połącz z Google Drive</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {gdriveFolderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${gdriveFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Otwórz folder na Dysku</span>
                    </a>
                  )}

                  <button
                    onClick={() => setShowExportModal(true)}
                    disabled={gdriveStatus === "running"}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition ${
                      gdriveStatus === "running"
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {gdriveStatus === "running" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Trwa eksport...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>{gdriveStatus === "interrupted" ? "Wznów eksport" : "Eksportuj na Dysk Google"}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDisconnectGDrive}
                    title="Odłącz konto Google"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isGDriveConfigured && !hasGDrive && (
            <div className="p-4 bg-amber-50/60 border-t border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Integracja wymaga ustawienia zmiennych <code>GOOGLE_CLIENT_ID</code> i <code>GOOGLE_CLIENT_SECRET</code> w pliku <code>.env</code> serwera.
              </span>
            </div>
          )}

          {/* Podgląd stanu i paska postępu eksportu */}
          {hasGDrive && (
            <div className="p-6 sm:p-8 space-y-4">
              {gdriveStatus === "running" && (
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                      Trwa przesyłanie plików na Twój Dysk Google...
                    </span>
                    <span>
                      {gdriveProgress?.processedFiles || 0} / {gdriveProgress?.totalFiles || 0} plików ({progressPercent}%)
                    </span>
                  </div>

                  {/* Pasek postępu */}
                  <div className="w-full h-3 bg-amber-200/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-amber-800/80">
                    <span className="truncate max-w-md">
                      {gdriveProgress?.currentFile ? `Wysyłanie: ${gdriveProgress.currentFile}` : "Przetwarzanie..."}
                    </span>
                    <span>
                      {processedMB} MB / {totalProgMB} MB
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-700/70 italic">
                    Transfer odbywa się bezpiecznie w tle na serwerze – możesz swobodnie zamknąć kartę lub wyłączyć telefon.
                  </p>
                </div>
              )}

              {gdriveStatus === "interrupted" && (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-orange-900">Transfer został wstrzymany</h3>
                      <p className="text-xs text-orange-700 mt-0.5">
                        Proces eksportu został przerwany (np. przez restart serwera). Kliknij przycisk „Wznów eksport” powyżej, aby kontynuować od ostatniego pliku.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {gdriveStatus === "failed" && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-red-900">Wystąpił problem podczas eksportu</h3>
                    <p className="text-xs text-red-700 mt-0.5">
                      {gdriveProgress?.error || "Nie udało się ukończyć transferu. Spróbuj ponownie za chwilę."}
                    </p>
                  </div>
                </div>
              )}

              {gdriveStatus === "completed" && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="text-xs font-bold text-emerald-900">
                        Wszystkie pliki zostały pomyślnie przesłane na Dysk Google!
                      </h3>
                      <p className="text-xs text-emerald-700">
                        {gdriveExportedAt
                          ? `Ostatni eksport: ${new Date(gdriveExportedAt).toLocaleString("pl-PL")}`
                          : "Pliki są posegregowane w folderach Zdjęcia i Filmy."}
                      </p>
                    </div>
                  </div>

                  {gdriveFolderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${gdriveFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Zobacz na Dysku Google</span>
                    </a>
                  )}
                </div>
              )}

              {gdriveStatus === "idle" && (
                <div className="text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
                  <span>
                    Dysk podłączony do: <strong>{gdriveEmail}</strong>. Gotowy do uruchomienia eksportu.
                  </span>
                  {gdriveExportedAt && (
                    <span className="text-[11px] text-slate-400">
                      Ostatni eksport: {new Date(gdriveExportedAt).toLocaleString("pl-PL")}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pasek filtrowania i moderacji */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-400 mr-1">Filtruj:</span>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Wszystkie ({mediaList.length})
            </button>
            <button
              onClick={() => setFilter("ready")}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === "ready" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Widoczne ({mediaList.filter((m) => m.status === "ready").length})
            </button>
            <button
              onClick={() => setFilter("hidden")}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === "hidden" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Ukryte ({mediaList.filter((m) => m.status === "hidden").length})
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Kliknij ikonę oka, aby ukryć zdjęcie przed gośćmi (będzie widoczne tylko dla Was w ZIP i na Dysku Google).
          </p>
        </div>

        {/* Siatka moderacji */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className={`relative bg-white rounded-2xl overflow-hidden border shadow-xs transition group ${
                item.status === "hidden" ? "opacity-60 border-dashed border-red-300" : "border-slate-200"
              }`}
            >
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                {item.status === "hidden" && (
                  <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider">
                    Ukryte
                  </div>
                )}
              </div>

              {/* Pasek akcji pod zdjęciem */}
              <div className="p-2.5 flex items-center justify-between gap-1 text-xs">
                <span className="truncate text-slate-600 font-medium text-[11px]">
                  {item.uploaderName}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleStatus(item.id, item.status)}
                    title={item.status === "ready" ? "Ukryj przed gośćmi" : "Pokaż w galerii"}
                    className={`p-1.5 rounded-lg transition ${
                      item.status === "ready"
                        ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        : "text-amber-600 bg-amber-50 hover:bg-amber-100"
                    }`}
                  >
                    {item.status === "ready" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => deleteMedia(item.id)}
                    title="Usuń bezpowrotnie"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal konfiguracji eksportu do Google Drive */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Eksport na Dysk Google</h3>
                <p className="text-xs text-slate-500">Wybierz zakres przesyłanych multimediów</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="radio"
                  name="export_scope"
                  checked={includeHiddenInExport}
                  onChange={() => setIncludeHiddenInExport(true)}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Prześlij wszystko (w tym ukryte)
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Zdjęcia ukryte przed gośćmi trafią do dedykowanego podfolderu <strong>„Ukryte”</strong> na Twoim Dysku.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="radio"
                  name="export_scope"
                  checked={!includeHiddenInExport}
                  onChange={() => setIncludeHiddenInExport(false)}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Tylko widoczne multimedia
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Pliki oznaczone jako ukryte zostaną pominięte podczas eksportu.
                  </span>
                </div>
              </label>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
              <p>
                📁 Na Twoim Dysku Google zostanie utworzony folder:
                <br />
                <span className="font-mono font-semibold text-slate-800">
                  WeddingDrop - {galleryInfo?.coupleNames || "Para Młoda"}
                </span>
              </p>
              <p className="text-slate-400">Pliki zostaną rozpakowane i zachowają oryginalną jakość 1:1.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                disabled={exportLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleStartExport}
                disabled={exportLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                {exportLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inicjalizacja...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Rozpocznij eksport</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
