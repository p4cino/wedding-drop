"use client";

import { Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { css } from "styled-system/css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OwnerLoginFormProps {
	slug: string;
	password: string;
	error: string;
	loading: boolean;
	onPasswordChange: (value: string) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function OwnerLoginForm({
	slug,
	password,
	error,
	loading,
	onPasswordChange,
	onSubmit,
}: OwnerLoginFormProps) {
	const t = useTranslations("OwnerPanel");
	return (
		<div
			className={css({
				minH: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#FAF8F5",
				p: "4",
			})}
		>
			<div
				className={css({
					w: "full",
					maxW: "md",
					backgroundColor: "white",
					p: "8",
					borderRadius: "3xl",
					boxShadow: "xl",
					borderWidth: "1px",
					borderColor: "slate.200",
				})}
			>
				<div
					className={css({
						w: "12",
						h: "12",
						borderRadius: "2xl",
						backgroundColor: "amber.100",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "wedding.gold",
						mx: "auto",
						mb: "4",
					})}
				>
					<Lock className={css({ w: "6", h: "6" })} aria-hidden="true" />
				</div>
				<h2
					className={css({
						fontFamily: "serif",
						fontSize: "2xl",
						fontWeight: "bold",
						textAlign: "center",
						color: "wedding.slate",
						mb: "1",
					})}
				>
					{t("panelTitle")}
				</h2>
				<p
					className={css({
						fontSize: "xs",
						textAlign: "center",
						color: "slate.500",
						mb: "6",
					})}
				>
					{t("panelDesc", { slug })}
				</p>

				<form
					onSubmit={onSubmit}
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "4",
					})}
				>
					{error && (
						<div
							id="owner-login-error"
							role="alert"
							aria-live="assertive"
							className={css({
								p: "3",
								fontSize: "xs",
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
						<label
							htmlFor="owner-pwd-input"
							className={css({
								display: "block",
								fontSize: "xs",
								fontWeight: "semibold",
								color: "slate.700",
								mb: "1.5",
							})}
						>
							{t("pwdLabel")}
						</label>
						<Input
							id="owner-pwd-input"
							name="password"
							type="password"
							autoComplete="current-password"
							required
							aria-invalid={Boolean(error)}
							aria-describedby={error ? "owner-login-error" : undefined}
							value={password}
							onChange={(e) => onPasswordChange(e.target.value)}
							placeholder={t("pwdPlaceholder")}
							className={css({
								w: "full",
								px: "4",
								py: "3",
								fontSize: "sm",
								borderRadius: "xl",
								borderColor: "slate.200",
								_focus: { borderColor: "wedding.gold" },
							})}
						/>
					</div>

					<Button
						type="submit"
						disabled={loading}
						className={css({
							w: "full",
							py: "3",
							backgroundColor: "slate.900",
							_hover: { backgroundColor: "slate.800" },
							color: "white",
							fontWeight: "semibold",
							borderRadius: "xl",
							fontSize: "sm",
							transition: "all 0.15s ease",
							boxShadow: "sm",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "2",
							cursor: "pointer",
						})}
					>
						{loading && (
							<Loader2
								className={css({
									w: "4",
									h: "4",
									animation: "spin 1s linear infinite",
								})}
								aria-hidden="true"
							/>
						)}
						<span>{loading ? t("loggingIn") : t("loginBtn")}</span>
					</Button>
				</form>
			</div>
		</div>
	);
}
