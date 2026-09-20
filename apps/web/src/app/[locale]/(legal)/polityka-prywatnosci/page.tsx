import { useTranslations } from "next-intl";
import { AdminPlaceholderAlert } from "@/components/AdminPlaceholderAlert";

export default function PrivacyPolicyPage() {
	const t = useTranslations("Legal");
	return (
		<>
			<h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-slate-900 mb-8">
				{t("privacyTitle")}
			</h1>

			<div className="text-slate-600 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200/60 leading-relaxed text-sm sm:text-base">
				<p className="italic mb-8 text-slate-500">{t("lastUpdate")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("p1Title")}
				</h2>
				<p className="mb-6">{t("p1Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("p2Title")}
				</h2>
				<p className="mb-6">{t("p2Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("p3Title")}
				</h2>
				<p className="mb-6">{t("p3Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("p4Title")}
				</h2>
				<p className="mb-6">{t("p4Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("p5Title")}
				</h2>
				<p className="mb-6">{t("p5Text")}</p>

				<AdminPlaceholderAlert type="privacy" />
			</div>
		</>
	);
}
