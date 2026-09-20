import { useTranslations } from "next-intl";
import { AdminPlaceholderAlert } from "@/components/AdminPlaceholderAlert";

export default function TermsOfServicePage() {
	const t = useTranslations("Legal");
	return (
		<>
			<h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-slate-900 mb-8">
				{t("termsTitle")}
			</h1>

			<div className="text-slate-600 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200/60 leading-relaxed text-sm sm:text-base">
				<p className="italic mb-8 text-slate-500">{t("lastUpdate")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("t1Title")}
				</h2>
				<p className="mb-6">{t("t1Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("t2Title")}
				</h2>
				<p className="mb-6">{t("t2Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("t3Title")}
				</h2>
				<p className="mb-6">{t("t3Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("t4Title")}
				</h2>
				<p className="mb-6">{t("t4Text")}</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					{t("t5Title")}
				</h2>
				<p className="mb-6">{t("t5Text")}</p>

				<AdminPlaceholderAlert type="terms" />
			</div>
		</>
	);
}
