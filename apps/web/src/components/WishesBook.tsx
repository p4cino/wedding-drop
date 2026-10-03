"use client";

import { Heart, Loader2, MessageCircleHeart, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { css } from "styled-system/css";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
		<div
			className={css({
				maxW: "2xl",
				mx: "auto",
				display: "flex",
				flexDirection: "column",
				gap: "6",
			})}
		>
			{/* Formularz dodawania życzenia */}
			<form
				onSubmit={handleSubmit}
				className={css({
					bg: "white",
					borderRadius: "3xl",
					p: { base: "5", sm: "6" },
					borderWidth: "1px",
					borderColor: "slate.200",
					boxShadow: "sm",
					display: "flex",
					flexDirection: "column",
					gap: "4",
				})}
			>
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "2",
						color: "wedding.slate",
					})}
				>
					<MessageCircleHeart
						className={css({ w: "5", h: "5", color: "wedding.gold" })}
						aria-hidden="true"
					/>
					<h2
						className={css({
							fontFamily: "serif",
							fontSize: "lg",
							fontWeight: "bold",
						})}
					>
						{t("formTitle")}
					</h2>
				</div>

				{error && (
					<div
						role="alert"
						aria-live="assertive"
						className={css({
							p: "3",
							fontSize: "xs",
							bg: "red.50",
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
					<label
						htmlFor="wish-guest-name"
						className={css({
							display: "block",
							fontSize: "xs",
							fontWeight: "semibold",
							color: "slate.700",
							mb: "1.5",
						})}
					>
						{t("nameLabel")}
					</label>
					<Input
						id="wish-guest-name"
						type="text"
						value={guestName}
						onChange={(e) => setGuestName(e.target.value)}
						maxLength={60}
						placeholder={t("namePlaceholder")}
						className={css({
							w: "full",
							borderRadius: "xl",
							borderColor: "slate.200",
							_focus: { borderColor: "wedding.gold" },
						})}
					/>
				</div>

				<div>
					<label
						htmlFor="wish-message"
						className={css({
							display: "block",
							fontSize: "xs",
							fontWeight: "semibold",
							color: "slate.700",
							mb: "1.5",
						})}
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
						className={css({
							w: "full",
							px: "4",
							py: "2.5",
							fontSize: "sm",
							borderRadius: "xl",
							borderWidth: "1px",
							borderColor: "slate.200",
							resize: "none",
							outline: "none",
							_focus: {
								borderColor: "wedding.gold",
								boxShadow: "0 0 0 2px rgba(202, 138, 4, 0.2)",
							},
						})}
					/>
				</div>

				<Button
					type="submit"
					disabled={submitting || !message.trim()}
					className={css({
						w: "full",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "2",
						px: "6",
						py: "3",
						background: "linear-gradient(to right, #b45309, #d97706)",
						_hover: {
							background: "linear-gradient(to right, #92400e, #b45309)",
						},
						_disabled: {
							opacity: 0.5,
							cursor: "not-allowed",
						},
						color: "white",
						fontWeight: "semibold",
						borderRadius: "xl",
						fontSize: "sm",
						transition: "all 0.15s ease",
						boxShadow: "sm",
						cursor: "pointer",
					})}
				>
					{submitting ? (
						<Loader2
							className={css({
								w: "4",
								h: "4",
								animation: "spin 1s linear infinite",
							})}
							aria-hidden="true"
						/>
					) : (
						<Send className={css({ w: "4", h: "4" })} aria-hidden="true" />
					)}
					<span>{submitting ? t("sending") : t("submitBtn")}</span>
				</Button>
			</form>

			{/* Lista życzeń */}
			{wishes.length === 0 ? (
				<EmptyState
					icon={
						<Heart className={css({ w: "8", h: "8" })} aria-hidden="true" />
					}
					title={t("noWishes")}
					hint={t("beFirstWish")}
				/>
			) : (
				<ul
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
				>
					{wishes.map((wish) => (
						<li
							key={wish.id}
							className={css({
								bg: "white",
								borderRadius: "2xl",
								p: "4",
								borderWidth: "1px",
								borderColor: "slate.200",
								boxShadow: "xs",
							})}
						>
							<p
								className={css({
									fontSize: "sm",
									color: "wedding.slate",
									whiteSpace: "pre-wrap",
									wordBreak: "break-words",
								})}
							>
								{wish.message}
							</p>
							<p
								className={css({
									mt: "2",
									fontSize: "xs",
									fontWeight: "semibold",
									color: "wedding.gold",
								})}
							>
								{wish.guestName?.trim() || t("anonymousGuest")}
							</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
