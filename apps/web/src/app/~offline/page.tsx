import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
	title: "Brak połączenia z internetem",
};

export default function OfflineFallbackPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
			<WifiOff className="w-16 h-16 text-slate-300 mb-6" />
			<h1 className="font-serif-luxury text-3xl font-bold text-slate-900 mb-4">
				Jesteś offline
			</h1>
			<p className="text-slate-600 mb-8 max-w-md">
				Wygląda na to, że straciłeś połączenie z siecią. Jeśli wysyłałeś pliki,
				nie martw się - wysyłanie zostanie automatycznie wznowione po powrocie
				internetu.
			</p>
			<button
				type="button"
				onClick={() => window.location.reload()}
				className="px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition shadow-md"
			>
				Spróbuj odświeżyć
			</button>
		</div>
	);
}
