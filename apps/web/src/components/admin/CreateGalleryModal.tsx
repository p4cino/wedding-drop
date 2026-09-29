"use client";

import { createGalleryDto } from "@wedding-drop/db/validators";
import { Check, ExternalLink, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useReducer, useState } from "react";
import NewTabLabel from "@/components/NewTabLabel";
import { Link } from "@/i18n/routing";
import type { GalleryRow } from "@/lib/admin-types";
import { GALLERY_LINKS } from "./galleryLinks";

export interface CreateGalleryForm {
	coupleNames: string;
	weddingDate: string;
	ownerEmail: string;
	ownerPassword: string;
	customSlug: string;
}

type FormAction =
	| { type: "field"; name: keyof CreateGalleryForm; value: string }
	| { type: "reset" };

const initialForm = (): CreateGalleryForm => ({
	coupleNames: "",
	weddingDate: new Date().toISOString().slice(0, 10),
	ownerEmail: "",
	ownerPassword: "",
	customSlug: "",
});

function formReducer(
	state: CreateGalleryForm,
	action: FormAction,
): CreateGalleryForm {
	if (action.type === "reset") return initialForm();
	return { ...state, [action.name]: action.value };
}

export type CreateGalleryResult =
	| { ok: true; gallery: GalleryRow }
	| { ok: false; error: string };

interface CreateGalleryModalProps {
	onClose: () => void;
	onCreate: (data: CreateGalleryForm) => Promise<CreateGalleryResult>;
}

const INPUT_CLASS =
	"w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-500";
const LABEL_CLASS = "block font-semibold text-slate-700 mb-1";

export function CreateGalleryModal({
	onClose,
	onCreate,
}: CreateGalleryModalProps) {
	const t = useTranslations("AdminPanel");
	const [form, dispatch] = useReducer(formReducer, undefined, initialForm);
	const [created, setCreated] = useState<GalleryRow | null>(null);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const field = (name: keyof CreateGalleryForm) => ({
		value: form[name],
		onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
			dispatch({ type: "field", name, value: e.target.value }),
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const parsed = createGalleryDto.safeParse(form);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message || t("invalidForm"));
			return;
		}
		setSubmitting(true);
		try {
			const result = await onCreate(form);
			if (result.ok) {
				setCreated(result.gallery);
				dispatch({ type: "reset" });
			} else {
				setError(result.error);
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-create-wedding-title"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
		>
			<div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
				<button
					type="button"
					onClick={onClose}
					aria-label={t("closeModal")}
					title={t("closeModal")}
					className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
				>
					<X className="w-5 h-5" aria-hidden="true" />
				</button>

				<h3
					id="admin-create-wedding-title"
					className="font-serif-luxury text-xl font-bold text-slate-900 mb-1"
				>
					{t("modalTitle")}
				</h3>
				<p className="text-xs text-slate-500 mb-5">{t("modalDesc")}</p>

				{created ? (
					<div className="space-y-4">
						<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-2">
							<div className="flex items-center gap-1.5 font-bold">
								<Check className="w-4 h-4" aria-hidden="true" />{" "}
								{t("modalSuccess")}
							</div>
							<p>
								<strong>{t("modalSuccessCouple")}</strong> {created.coupleNames}
							</p>
							<p>
								<strong>{t("modalSuccessSlug")}</strong> {created.slug}
							</p>
						</div>

						<div className="space-y-2 pt-2">
							{GALLERY_LINKS.map((link) => (
								<Link
									key={link.path("")}
									href={link.path(created.slug)}
									target="_blank"
									className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none ${link.modalTone}`}
								>
									<span>{t(link.modalLabelKey)}</span>
									{link.Icon ? (
										<link.Icon
											className={`w-4 h-4 ${link.modalIconTone}`}
											aria-hidden="true"
										/>
									) : (
										<ExternalLink
											className={`w-4 h-4 ${link.modalIconTone}`}
											aria-hidden="true"
										/>
									)}
									<NewTabLabel />
								</Link>
							))}
						</div>

						<button
							type="button"
							onClick={onClose}
							className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
						>
							{t("modalCloseBtn")}
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-3 text-xs">
						{error && (
							<div
								role="alert"
								className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200"
							>
								{error}
							</div>
						)}

						<div>
							<label htmlFor="admin-couple-names" className={LABEL_CLASS}>
								{t("formCouple")}
							</label>
							<input
								id="admin-couple-names"
								type="text"
								required
								placeholder={t("formCouplePlaceholder")}
								{...field("coupleNames")}
								className={INPUT_CLASS}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label htmlFor="admin-wedding-date" className={LABEL_CLASS}>
									{t("formDate")}
								</label>
								<input
									id="admin-wedding-date"
									type="date"
									required
									{...field("weddingDate")}
									className={INPUT_CLASS}
								/>
							</div>

							<div>
								<label htmlFor="admin-custom-slug" className={LABEL_CLASS}>
									{t("formSlug")}
								</label>
								<input
									id="admin-custom-slug"
									type="text"
									placeholder={t("formSlugPlaceholder")}
									{...field("customSlug")}
									className={INPUT_CLASS}
								/>
							</div>
						</div>

						<div>
							<label htmlFor="admin-owner-email" className={LABEL_CLASS}>
								{t("formEmail")}
							</label>
							<input
								id="admin-owner-email"
								type="email"
								required
								placeholder="kontakt@kasiaitomek.pl"
								{...field("ownerEmail")}
								className={INPUT_CLASS}
							/>
						</div>

						<div>
							<label htmlFor="admin-owner-password" className={LABEL_CLASS}>
								{t("formPassword")}
							</label>
							<input
								id="admin-owner-password"
								type="password"
								required
								placeholder={t("formPasswordPlaceholder")}
								{...field("ownerPassword")}
								className={INPUT_CLASS}
							/>
						</div>

						<button
							type="submit"
							disabled={submitting}
							className="w-full mt-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl font-semibold shadow-md disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
						>
							{t("formSubmit")}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
