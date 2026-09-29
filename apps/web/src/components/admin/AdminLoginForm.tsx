"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";

interface AdminLoginFormProps {
	username: string;
	password: string;
	error: string;
	loading: boolean;
	onUsernameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: (e: React.FormEvent) => void;
}

const INPUT_CLASS =
	"w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus-visible:ring-2 focus-visible:ring-slate-900";

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
		<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
			<div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
				<div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mx-auto mb-4">
					<ShieldCheck className="w-6 h-6" aria-hidden="true" />
				</div>
				<h2 className="font-serif-luxury text-2xl font-bold text-center text-slate-900 mb-1">
					{t("loginTitle")}
				</h2>
				<p className="text-xs text-center text-slate-500 mb-6">
					{t("loginDesc")}
				</p>

				<form onSubmit={onSubmit} className="space-y-4">
					{error && (
						<div
							id="admin-login-error"
							role="alert"
							aria-live="assertive"
							className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200"
						>
							{error}
						</div>
					)}
					<div>
						<label
							htmlFor="admin-username-input"
							className="block text-xs font-semibold text-slate-700 mb-1"
						>
							{t("usernameLabel")}
						</label>
						<input
							id="admin-username-input"
							type="text"
							required
							aria-invalid={Boolean(error)}
							aria-describedby={error ? "admin-login-error" : undefined}
							value={username}
							onChange={(e) => onUsernameChange(e.target.value)}
							className={INPUT_CLASS}
						/>
					</div>
					<div>
						<label
							htmlFor="admin-password-input"
							className="block text-xs font-semibold text-slate-700 mb-1"
						>
							{t("passwordLabel")}
						</label>
						<input
							id="admin-password-input"
							type="password"
							required
							aria-invalid={Boolean(error)}
							aria-describedby={error ? "admin-login-error" : undefined}
							value={password}
							onChange={(e) => onPasswordChange(e.target.value)}
							className={INPUT_CLASS}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-sm focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
					>
						{loading ? t("loginBtnLoading") : t("loginBtn")}
					</button>
				</form>
			</div>
		</div>
	);
}
