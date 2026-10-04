"use client";

import { Eye, Lock, Settings2, ShieldCheck, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { css } from "styled-system/css";

export interface ModerationSettings {
	allowGuestUploads?: boolean;
	allowGuestViewing?: boolean;
	isApprovalQueueEnabled?: boolean;
}

interface ModerationSettingsPanelProps {
	settings: ModerationSettings;
	onSave: (
		settings: ModerationSettings & { guestPassword?: string | null },
	) => Promise<boolean>;
}

export const ModerationSettingsPanel: React.FC<
	ModerationSettingsPanelProps
> = ({ settings, onSave }) => {
	const t = useTranslations("OwnerPanel");
	const [localSettings, setLocalSettings] = useState<ModerationSettings>({
		allowGuestUploads: settings.allowGuestUploads ?? true,
		allowGuestViewing: settings.allowGuestViewing ?? true,
		isApprovalQueueEnabled: settings.isApprovalQueueEnabled ?? false,
	});
	const [guestPassword, setGuestPassword] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);

		const payload = {
			...localSettings,
			guestPassword: guestPassword !== "" ? guestPassword : undefined,
		};

		await onSave(payload);
		setGuestPassword(""); // clear on save if we don't want to show it, or keep it.
		setIsSaving(false);
	};

	return (
		<div
			className={css({
				bg: "white",
				borderRadius: "2xl",
				p: { base: "6", sm: "8" },
				borderWidth: "1px",
				borderColor: "slate.200",
				boxShadow: "sm",
			})}
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "3",
					mb: "6",
				})}
			>
				<div
					className={css({
						p: "2.5",
						bg: "amber.50",
						color: "wedding.gold",
						borderRadius: "xl",
					})}
				>
					<Settings2 className={css({ w: "5", h: "5" })} aria-hidden="true" />
				</div>
				<h2
					className={css({
						fontSize: "lg",
						fontWeight: "semibold",
						color: "slate.900",
					})}
				>
					{t("moderationSettingsTitle")}
				</h2>
			</div>

			<form
				onSubmit={handleSave}
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "6",
				})}
			>
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "4",
					})}
				>
					{/* allowGuestUploads Toggle */}
					<label
						className={css({
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							cursor: "pointer",
							p: "4",
							borderWidth: "1px",
							borderColor: "slate.200",
							borderRadius: "xl",
							transition: "border-color 0.2s ease",
							_hover: { borderColor: "wedding.gold" },
						})}
					>
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "3",
							})}
						>
							<Upload className={css({ w: "4", h: "4", color: "slate.400" })} />
							<div>
								<p
									className={css({
										fontSize: "sm",
										fontWeight: "medium",
										color: "slate.900",
									})}
								>
									{t("allowGuestUploadsLabel")}
								</p>
								<p className={css({ fontSize: "xs", color: "slate.500" })}>
									{t("allowGuestUploadsHint")}
								</p>
							</div>
						</div>
						<input
							type="checkbox"
							checked={localSettings.allowGuestUploads}
							onChange={(e) =>
								setLocalSettings({
									...localSettings,
									allowGuestUploads: e.target.checked,
								})
							}
							className={css({ w: "4", h: "4", accentColor: "wedding.gold" })}
						/>
					</label>

					{/* allowGuestViewing Toggle */}
					<label
						className={css({
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							cursor: "pointer",
							p: "4",
							borderWidth: "1px",
							borderColor: "slate.200",
							borderRadius: "xl",
							transition: "border-color 0.2s ease",
							_hover: { borderColor: "wedding.gold" },
						})}
					>
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "3",
							})}
						>
							<Eye className={css({ w: "4", h: "4", color: "slate.400" })} />
							<div>
								<p
									className={css({
										fontSize: "sm",
										fontWeight: "medium",
										color: "slate.900",
									})}
								>
									{t("allowGuestViewingLabel")}
								</p>
								<p className={css({ fontSize: "xs", color: "slate.500" })}>
									{t("allowGuestViewingHint")}
								</p>
							</div>
						</div>
						<input
							type="checkbox"
							checked={localSettings.allowGuestViewing}
							onChange={(e) =>
								setLocalSettings({
									...localSettings,
									allowGuestViewing: e.target.checked,
								})
							}
							className={css({ w: "4", h: "4", accentColor: "wedding.gold" })}
						/>
					</label>

					{/* isApprovalQueueEnabled Toggle */}
					<label
						className={css({
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							cursor: "pointer",
							p: "4",
							borderWidth: "1px",
							borderColor: "slate.200",
							borderRadius: "xl",
							transition: "border-color 0.2s ease",
							_hover: { borderColor: "wedding.gold" },
						})}
					>
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "3",
							})}
						>
							<ShieldCheck
								className={css({ w: "4", h: "4", color: "slate.400" })}
							/>
							<div>
								<p
									className={css({
										fontSize: "sm",
										fontWeight: "medium",
										color: "slate.900",
									})}
								>
									{t("isApprovalQueueEnabledLabel")}
								</p>
								<p className={css({ fontSize: "xs", color: "slate.500" })}>
									{t("isApprovalQueueEnabledHint")}
								</p>
							</div>
						</div>
						<input
							type="checkbox"
							checked={localSettings.isApprovalQueueEnabled}
							onChange={(e) =>
								setLocalSettings({
									...localSettings,
									isApprovalQueueEnabled: e.target.checked,
								})
							}
							className={css({ w: "4", h: "4", accentColor: "wedding.gold" })}
						/>
					</label>

					{/* Guest Password Input */}
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "2",
							p: "4",
							borderWidth: "1px",
							borderColor: "slate.200",
							borderRadius: "xl",
						})}
					>
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "3",
							})}
						>
							<Lock className={css({ w: "4", h: "4", color: "slate.400" })} />
							<label
								htmlFor="guestPassword"
								className={css({
									fontSize: "sm",
									fontWeight: "medium",
									color: "slate.900",
								})}
							>
								{t("guestPasswordLabel")}
							</label>
						</div>
						<p className={css({ fontSize: "xs", color: "slate.500", mb: "2" })}>
							{t("guestPasswordHint")}
						</p>
						<input
							id="guestPassword"
							type="text"
							value={guestPassword}
							onChange={(e) => setGuestPassword(e.target.value)}
							placeholder={t("guestPasswordPlaceholder")}
							className={css({
								px: "4",
								py: "2.5",
								borderWidth: "1px",
								borderColor: "slate.200",
								borderRadius: "lg",
								fontSize: "sm",
								w: "full",
								transition: "border-color 0.2s ease, box-shadow 0.2s ease",
								_focus: {
									outline: "none",
									borderColor: "wedding.gold",
									boxShadow: "0 0 0 3px rgba(212, 175, 55, 0.2)",
								},
							})}
						/>
					</div>
				</div>

				<div
					className={css({
						display: "flex",
						justifyContent: "flex-end",
						mt: "2",
					})}
				>
					<button
						type="submit"
						disabled={isSaving}
						className={css({
							bg: "slate.900",
							color: "white",
							px: "6",
							py: "2.5",
							borderRadius: "xl",
							fontSize: "sm",
							fontWeight: "semibold",
							transition: "all 0.2s ease",
							cursor: isSaving ? "not-allowed" : "pointer",
							opacity: isSaving ? 0.7 : 1,
							_hover: { bg: "slate.800" },
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "slate.900",
								outlineOffset: "2px",
							},
						})}
					>
						{isSaving ? t("savingSettings") : t("saveSettings")}
					</button>
				</div>
			</form>
		</div>
	);
};
