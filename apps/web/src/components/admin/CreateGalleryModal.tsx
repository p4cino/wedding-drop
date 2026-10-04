"use client";

import { createGalleryDto } from "@wedding-drop/db/validators";
import { Check, ExternalLink, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useReducer, useRef, useState } from "react";
import { css, cx } from "styled-system/css";
import NewTabLabel from "@/components/NewTabLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
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

const inputStyle = css({
	w: "full",
	px: "3",
	py: "2",
	fontSize: "sm",
	borderWidth: "1px",
	borderColor: "slate.200",
	borderRadius: "xl",
	_focus: { borderColor: "wedding.gold" },
});

const labelStyle = css({
	display: "block",
	fontWeight: "semibold",
	color: "slate.700",
	mb: "1",
});

export function CreateGalleryModal({
	onClose,
	onCreate,
}: CreateGalleryModalProps) {
	const t = useTranslations("AdminPanel");
	const [form, dispatch] = useReducer(formReducer, undefined, initialForm);
	const [created, setCreated] = useState<GalleryRow | null>(null);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const dialogRef = useRef<HTMLDivElement>(null);
	useEscapeKey(true, onClose);
	useFocusTrap(dialogRef, true);

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
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-create-wedding-title"
			className={css({
				position: "fixed",
				inset: "0",
				zIndex: "50",
				display: "flex",
				alignItems: { base: "flex-start", sm: "center" },
				justifyContent: "center",
				overflowY: "auto",
				backgroundColor: "rgba(0, 0, 0, 0.6)",
				backdropFilter: "blur(4px)",
				p: "4",
			})}
		>
			<div
				className={css({
					w: "full",
					maxW: "lg",
					backgroundColor: "white",
					borderRadius: "3xl",
					boxShadow: "2xl",
					p: "6",
					position: "relative",
					my: "auto",
				})}
			>
				<button
					type="button"
					onClick={onClose}
					aria-label={t("closeModal")}
					title={t("closeModal")}
					className={css({
						position: "absolute",
						top: "5",
						right: "5",
						zIndex: "10",
						p: "2",
						color: "slate.400",
						borderRadius: "full",
						borderWidth: "0",
						backgroundColor: "transparent",
						cursor: "pointer",
						transition: "color 0.15s ease",
						_hover: { color: "slate.600" },
						_focusVisible: {
							outline: "2px solid",
							outlineColor: "slate.900",
						},
					})}
				>
					<X className={css({ w: "5", h: "5" })} aria-hidden="true" />
				</button>

				<h3
					id="admin-create-wedding-title"
					className={css({
						fontFamily: "serif",
						fontSize: "xl",
						fontWeight: "bold",
						color: "wedding.slate",
						mb: "1",
						pr: "10",
					})}
				>
					{t("modalTitle")}
				</h3>
				<p className={css({ fontSize: "xs", color: "slate.500", mb: "5" })}>
					{t("modalDesc")}
				</p>

				{created ? (
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "4",
						})}
					>
						<div
							className={css({
								p: "4",
								backgroundColor: "emerald.50",
								borderWidth: "1px",
								borderColor: "emerald.200",
								borderRadius: "2xl",
								fontSize: "xs",
								color: "emerald.800",
								display: "flex",
								flexDirection: "column",
								gap: "2",
							})}
						>
							<div
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "1.5",
									fontWeight: "bold",
								})}
							>
								<Check className={css({ w: "4", h: "4" })} aria-hidden="true" />{" "}
								{t("modalSuccess")}
							</div>
							<p>
								<strong>{t("modalSuccessCouple")}</strong> {created.coupleNames}
							</p>
							<p>
								<strong>{t("modalSuccessSlug")}</strong> {created.slug}
							</p>
						</div>

						<div
							className={css({
								display: "flex",
								flexDirection: "column",
								gap: "2",
								pt: "2",
							})}
						>
							{GALLERY_LINKS.map((link) => (
								<Link
									key={link.path("")}
									href={link.path(created.slug)}
									target="_blank"
									className={cx(
										css({
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											gap: "2",
											p: "3",
											borderRadius: "xl",
											borderWidth: "1px",
											fontSize: "xs",
											fontWeight: "semibold",
											_focusVisible: { outline: "none" },
										}),
										link.modalTone,
									)}
								>
									<span>{t(link.modalLabelKey)}</span>
									{link.Icon ? (
										<link.Icon
											className={cx(
												css({ w: "4", h: "4", flexShrink: "0" }),
												link.modalIconTone,
											)}
											aria-hidden="true"
										/>
									) : (
										<ExternalLink
											className={cx(
												css({ w: "4", h: "4", flexShrink: "0" }),
												link.modalIconTone,
											)}
											aria-hidden="true"
										/>
									)}
									<NewTabLabel />
								</Link>
							))}
						</div>

						<Button
							type="button"
							onClick={onClose}
							className={css({
								w: "full",
								mt: "4",
								py: "3",
								backgroundColor: "slate.900",
								_hover: { backgroundColor: "slate.800" },
								color: "white",
								borderRadius: "xl",
								fontSize: "xs",
								fontWeight: "semibold",
								cursor: "pointer",
							})}
						>
							{t("modalCloseBtn")}
						</Button>
					</div>
				) : (
					<form
						onSubmit={handleSubmit}
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "3",
							fontSize: "xs",
						})}
					>
						{error && (
							<div
								role="alert"
								className={css({
									p: "3",
									backgroundColor: "red.50",
									color: "red.700",
									borderRadius: "xl",
									borderWidth: "1px",
									borderColor: "red.200",
								})}
							>
								{error}
							</div>
						)}

						<div>
							<label htmlFor="admin-couple-names" className={labelStyle}>
								{t("formCouple")}
							</label>
							<Input
								id="admin-couple-names"
								type="text"
								required
								placeholder={t("formCouplePlaceholder")}
								{...field("coupleNames")}
								className={inputStyle}
							/>
						</div>

						<div
							className={css({
								display: "grid",
								gridTemplateColumns: "repeat(2, 1fr)",
								gap: "3",
							})}
						>
							<div>
								<label htmlFor="admin-wedding-date" className={labelStyle}>
									{t("formDate")}
								</label>
								<Input
									id="admin-wedding-date"
									type="date"
									required
									{...field("weddingDate")}
									className={inputStyle}
								/>
							</div>

							<div>
								<label htmlFor="admin-custom-slug" className={labelStyle}>
									{t("formSlug")}
								</label>
								<Input
									id="admin-custom-slug"
									type="text"
									placeholder={t("formSlugPlaceholder")}
									{...field("customSlug")}
									className={inputStyle}
								/>
							</div>
						</div>

						<div>
							<label htmlFor="admin-owner-email" className={labelStyle}>
								{t("formEmail")}
							</label>
							<Input
								id="admin-owner-email"
								type="email"
								required
								placeholder="kontakt@kasiaitomek.pl"
								{...field("ownerEmail")}
								className={inputStyle}
							/>
						</div>

						<div>
							<label htmlFor="admin-owner-password" className={labelStyle}>
								{t("formPassword")}
							</label>
							<Input
								id="admin-owner-password"
								type="password"
								required
								placeholder={t("formPasswordPlaceholder")}
								{...field("ownerPassword")}
								className={inputStyle}
							/>
						</div>

						<Button
							type="submit"
							disabled={submitting}
							className={css({
								w: "full",
								mt: "4",
								py: "3",
								background: "linear-gradient(to right, #b45309, #d97706)",
								_hover: {
									background: "linear-gradient(to right, #92400e, #b45309)",
								},
								_disabled: { opacity: 0.6, cursor: "not-allowed" },
								color: "white",
								borderRadius: "xl",
								fontWeight: "semibold",
								boxShadow: "md",
								cursor: "pointer",
							})}
						>
							{t("formSubmit")}
						</Button>
					</form>
				)}
			</div>
		</div>
	);
}
