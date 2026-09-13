"use client";

import { Image as ImageIcon, Play, User } from "lucide-react";
import type { MediaItemData } from "./LightboxModal";

interface MediaGridProps {
	items: MediaItemData[];
	onItemClick: (index: number) => void;
}

export default function MediaGrid({ items, onItemClick }: MediaGridProps) {
	if (items.length === 0) {
		return (
			<div className="text-center py-20 px-4 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
				<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
					<ImageIcon className="w-8 h-8" aria-hidden="true" />
				</div>
				<h4 className="font-serif-luxury text-xl font-bold text-slate-800">
					Galeria czeka na pierwsze zdjęcia!
				</h4>
				<p className="text-sm text-slate-500 max-w-sm mx-auto mt-1.5">
					Bądź pierwszą osobą, która uwieczni ten wyjątkowy dzień. Kliknij
					przycisk poniżej, aby dodać zdjęcia.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
			{items.map((item, index) => {
				const isVideo = item.fileType === "video";
				const uploader = item.uploaderName || "Gość";

				return (
					<button
						type="button"
						key={item.id}
						onClick={() => onItemClick(index)}
						aria-label={`Powiększ ${isVideo ? "wideo" : "zdjęcie"}: ${item.originalFileName}, dodał: ${uploader}`}
						className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] text-left p-0 border-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
					>
						{/* Miniatura */}
						<img
							src={item.thumbUrl}
							alt={item.originalFileName}
							loading="lazy"
							className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>

						{/* Znacznik wideo */}
						{isVideo && (
							<div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-sm">
								<Play
									className="w-3.5 h-3.5 fill-current ml-0.5"
									aria-hidden="true"
								/>
							</div>
						)}

						{/* Gradient i podpis u dołu */}
						<div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-center justify-between text-white opacity-95 group-hover:opacity-100 transition">
							<div className="flex items-center gap-1.5 min-w-0">
								<User
									className="w-3 h-3 text-amber-300 shrink-0"
									aria-hidden="true"
								/>
								<span className="text-[11px] font-medium truncate drop-shadow-sm">
									{uploader}
								</span>
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}
