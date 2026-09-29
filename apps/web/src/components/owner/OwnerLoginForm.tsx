"use client";

import { Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";

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
		<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
			<div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80">
				<div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mx-auto mb-4">
					<Lock className="w-6 h-6" aria-hidden="true" />
				</div>
				<h2 className="font-serif-luxury text-2xl font-bold text-center text-slate-900 mb-1">
					{t("panelTitle")}
				</h2>
				<p className="text-xs text-center text-slate-500 mb-6">
					{t("panelDesc", { slug })}
				</p>

				<form onSubmit={onSubmit} className="space-y-4">
					{error && (
						<div
							id="owner-login-error"
							role="alert"
							aria-live="assertive"
							className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200"
						>
							{error}
						</div>
					)}

					<div>
						<label
							htmlFor="owner-pwd-input"
							className="block text-xs font-semibold text-slate-700 mb-1.5"
						>
							{t("pwdLabel")}
						</label>
						<input
							id="owner-pwd-input"
							type="password"
							required
							aria-invalid={Boolean(error)}
							aria-describedby={error ? "owner-login-error" : undefined}
							value={password}
							onChange={(e) => onPasswordChange(e.target.value)}
							placeholder={t("pwdPlaceholder")}
							className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-500"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
					>
						{loading && (
							<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
						)}
						<span>{loading ? t("loggingIn") : t("loginBtn")}</span>
					</button>
				</form>
			</div>
		</div>
	);
}
