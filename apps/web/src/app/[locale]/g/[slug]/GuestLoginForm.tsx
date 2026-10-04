"use client";

import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { css } from "styled-system/css";

interface GuestLoginFormProps {
	slug: string;
	galleryName: string;
	backgroundUrl?: string;
	logoUrl?: string;
}

export default function GuestLoginForm({
	slug,
	galleryName,
	backgroundUrl,
	logoUrl,
}: GuestLoginFormProps) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const t = useTranslations("GuestGallery");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch(`/api/gallery/${slug}/auth`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});

			if (res.ok) {
				// Refresh to allow layout.tsx to read the cookie
				window.location.reload();
			} else {
				const data = await res.json();
				setError(data.error || "Nieprawidłowe hasło");
			}
		} catch (err) {
			setError("Wystąpił błąd podczas logowania");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className={css({
				minH: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#FAF8F5",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundAttachment: "fixed",
				p: "4",
			})}
			style={
				backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
			}
		>
			{backgroundUrl && (
				<div
					className={css({
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(255, 255, 255, 0.8)",
						backdropFilter: "blur(8px)",
						zIndex: 0,
					})}
				/>
			)}

			<div
				className={css({
					position: "relative",
					zIndex: 1,
					bg: "white",
					p: { base: "6", sm: "10" },
					borderRadius: "2xl",
					boxShadow: "xl",
					w: "full",
					maxW: "md",
					textAlign: "center",
					borderWidth: "1px",
					borderColor: "slate.100",
				})}
			>
				{logoUrl ? (
					<img
						src={logoUrl}
						alt={galleryName}
						className={css({
							maxH: "20",
							mx: "auto",
							mb: "6",
							objectFit: "contain",
						})}
					/>
				) : (
					<div
						className={css({
							w: "16",
							h: "16",
							bg: "amber.50",
							color: "wedding.gold",
							borderRadius: "full",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							mx: "auto",
							mb: "6",
						})}
					>
						<Lock className={css({ w: "8", h: "8" })} />
					</div>
				)}

				<h1
					className={css({
						fontFamily: "serif",
						fontSize: "2xl",
						fontWeight: "bold",
						color: "slate.900",
						mb: "2",
					})}
				>
					{galleryName}
				</h1>
				<p
					className={css({
						color: "slate.500",
						fontSize: "sm",
						mb: "8",
					})}
				>
					Ta galeria jest zabezpieczona hasłem.
				</p>

				<form
					onSubmit={handleSubmit}
					className={css({ display: "flex", flexDir: "column", gap: "4" })}
				>
					<div className={css({ position: "relative" })}>
						<input
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Wpisz hasło galerii"
							className={css({
								w: "full",
								pl: "4",
								pr: "12",
								py: "3",
								borderRadius: "xl",
								borderWidth: "1px",
								borderColor: error ? "red.300" : "slate.200",
								bg: "slate.50",
								fontSize: "base",
								transition: "all 0.2s",
								_focus: {
									bg: "white",
									borderColor: "wedding.gold",
									outline: "none",
									boxShadow: "0 0 0 3px rgba(212, 175, 55, 0.2)",
								},
							})}
						/>
						<button
							type="submit"
							disabled={isLoading}
							className={css({
								position: "absolute",
								right: "2",
								top: "50%",
								transform: "translateY(-50%)",
								p: "2",
								bg: "slate.900",
								color: "white",
								borderRadius: "lg",
								cursor: isLoading ? "not-allowed" : "pointer",
								opacity: isLoading ? 0.7 : 1,
								transition: "background 0.2s",
								_hover: { bg: "slate.800" },
							})}
						>
							{isLoading ? (
								<Loader2
									className={css({ w: "4", h: "4", animation: "spin" })}
								/>
							) : (
								<ArrowRight className={css({ w: "4", h: "4" })} />
							)}
						</button>
					</div>

					{error && (
						<p
							className={css({
								color: "red.500",
								fontSize: "sm",
								textAlign: "left",
								mt: "1",
							})}
						>
							{error}
						</p>
					)}
				</form>
			</div>
		</div>
	);
}
