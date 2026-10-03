"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { css } from "styled-system/css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminLoginFormProps {
	username: string;
	password: string;
	error: string;
	loading: boolean;
	onUsernameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function AdminLoginForm({
	username,
	password,
	error,
	loading,
	onUsernameChange,
	onPasswordChange,
	onSubmit,
}: AdminLoginFormProps) {
	const t = useTranslations("AdminPanel");
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
						backgroundColor: "slate.900",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "white",
						mx: "auto",
						mb: "4",
					})}
				>
					<ShieldCheck className={css({ w: "6", h: "6" })} aria-hidden="true" />
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
					{t("loginTitle")}
				</h2>
				<p
					className={css({
						fontSize: "xs",
						textAlign: "center",
						color: "slate.500",
						mb: "6",
					})}
				>
					{t("loginDesc")}
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
							id="admin-login-error"
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
							htmlFor="admin-username-input"
							className={css({
								display: "block",
								fontSize: "xs",
								fontWeight: "semibold",
								color: "slate.700",
								mb: "1",
							})}
						>
							{t("usernameLabel")}
						</label>
						<Input
							id="admin-username-input"
							type="text"
							required
							aria-invalid={Boolean(error)}
							aria-describedby={error ? "admin-login-error" : undefined}
							value={username}
							onChange={(e) => onUsernameChange(e.target.value)}
							className={css({
								w: "full",
								px: "4",
								py: "2.5",
								fontSize: "sm",
								borderRadius: "xl",
								borderColor: "slate.200",
								_focus: { borderColor: "slate.900" },
							})}
						/>
					</div>
					<div>
						<label
							htmlFor="admin-password-input"
							className={css({
								display: "block",
								fontSize: "xs",
								fontWeight: "semibold",
								color: "slate.700",
								mb: "1",
							})}
						>
							{t("passwordLabel")}
						</label>
						<Input
							id="admin-password-input"
							type="password"
							required
							aria-invalid={Boolean(error)}
							aria-describedby={error ? "admin-login-error" : undefined}
							value={password}
							onChange={(e) => onPasswordChange(e.target.value)}
							className={css({
								w: "full",
								px: "4",
								py: "2.5",
								fontSize: "sm",
								borderRadius: "xl",
								borderColor: "slate.200",
								_focus: { borderColor: "slate.900" },
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
							cursor: "pointer",
						})}
					>
						{loading ? t("loginBtnLoading") : t("loginBtn")}
					</Button>
				</form>
			</div>
		</div>
	);
}
