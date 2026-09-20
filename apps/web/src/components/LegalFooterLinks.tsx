import {Link} from "@/i18n/routing";
import React from "react";

export function LegalFooterLinks() {
	return (
		<div className="flex justify-center items-center gap-4">
			<Link
				href="/polityka-prywatnosci"
				className="hover:text-slate-800 transition focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
			>
				Polityka Prywatności
			</Link>
			<span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
			<Link
				href="/regulamin"
				className="hover:text-slate-800 transition focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
			>
				Warunki Korzystania
			</Link>
		</div>
	);
}
