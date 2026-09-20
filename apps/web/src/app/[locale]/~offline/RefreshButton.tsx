"use client";

export function RefreshButton() {
	return (
		<button
			type="button"
			onClick={() => window.location.reload()}
			className="px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition shadow-md"
		>
			Spróbuj odświeżyć
		</button>
	);
}
