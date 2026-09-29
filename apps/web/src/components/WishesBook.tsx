"use client";

import { Heart, Loader2, MessageCircleHeart, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import EmptyState from "@/components/EmptyState";
import type { WishItemData } from "@/lib/gallery-types";

export type { WishItemData };

interface WishesBookProps {
	wishes: WishItemData[];
	onSubmit: (guestName: string, message: string) => Promise<boolean>;
}

export default function WishesBook({ wishes, onSubmit }: WishesBookProps) {
	const t = useTranslations("Wishes");
	const [guestName, setGuestName] = useState("");
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim()) {
			setError(t("messageRequired"));
			return;
		}
		setError("");
		setSubmitting(true);
		try {
			const success = await onSubmit(guestName.trim(), message.trim());
			if (success) {
				setMessage("");
				setGuestName("");
			} else {
				setError(t("submitError"));
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Formularz dodawania życzenia */}
			<form
				onSubmit={handleSubmit}
				className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4"
			>
				<div className="flex items-center gap-2 text-slate-800">
					<MessageCircleHeart
						className="w-5 h-5 text-amber-600"
						aria-hidden="true"
					/>
					<h2 className="font-serif-luxury text-lg font-bold">
						{t("formTitle")}
					</h2>
				</div>

				{error && (
					<div
						role="alert"
						aria-live="assertive"
						className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200"
					>
						{error}
					</div>
				)}

				<div>
					<label
						htmlFor="wish-guest-name"
						className="block text-xs font-semibold text-slate-700 mb-1.5"
					>
						{t("nameLabel")}
					</label>
					<input
						id="wish-guest-name"
						type="text"
						value={guestName}
						onChange={(e) => setGuestName(e.target.value)}
						maxLength={60}
						placeholder={t("namePlaceholder")}
						className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-500"
					/>
				</div>

				<div>
					<label
						htmlFor="wish-message"
						className="block text-xs font-semibold text-slate-700 mb-1.5"
					>
						{t("messageLabel")}
					</label>
					<textarea
						id="wish-message"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						maxLength={500}
						rows={4}
						required
						placeholder={t("messagePlaceholder")}
						className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-500 resize-none"
					/>
				</div>

				<button
					type="submit"
					disabled={submitting || !message.trim()}
					className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
				>
					{submitting ? (
						<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
					) : (
						<Send className="w-4 h-4" aria-hidden="true" />
					)}
					<span>{submitting ? t("sending") : t("submitBtn")}</span>
				</button>
			</form>

			{/* Lista życzeń */}
			{wishes.length === 0 ? (
				<EmptyState
					icon={<Heart className="w-8 h-8" aria-hidden="true" />}
					title={t("noWishes")}
					hint={t("beFirstWish")}
				/>
			) : (
				<ul className="space-y-3">
					{wishes.map((wish) => (
						<li
							key={wish.id}
							className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs"
						>
							<p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
								{wish.message}
							</p>
							<p className="mt-2 text-xs font-semibold text-amber-700">
								{wish.guestName?.trim() || t("anonymousGuest")}
							</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
