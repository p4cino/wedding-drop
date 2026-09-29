import type React from "react";

interface EmptyStateProps {
	icon: React.ReactNode;
	title: string;
	hint: string;
	/** Pionowy odstęp wewnętrzny (galeria: `py-20`, księga życzeń: `py-16`). */
	className?: string;
}

/** Pusty stan listy (brak zdjęć / brak życzeń). */
export default function EmptyState({
	icon,
	title,
	hint,
	className = "py-16",
}: EmptyStateProps) {
	return (
		<div
			className={`text-center px-4 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 ${className}`}
		>
			<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
				{icon}
			</div>
			<h4 className="font-serif-luxury text-xl font-bold text-slate-800">
				{title}
			</h4>
			<p className="text-sm text-slate-500 max-w-sm mx-auto mt-1.5">{hint}</p>
		</div>
	);
}
