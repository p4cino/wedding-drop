import { AdminPlaceholderAlert } from "@/components/AdminPlaceholderAlert";

export default function TermsOfServicePage() {
	return (
		<>
			<h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-slate-900 mb-8">
				Warunki korzystania z usługi
			</h1>

			<div className="text-slate-600 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200/60 leading-relaxed text-sm sm:text-base">
				<p className="italic mb-8 text-slate-500">
					Ostatnia aktualizacja: [DATA]
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					1. Postanowienia ogólne
				</h2>
				<p className="mb-6">
					Niniejszy regulamin określa zasady świadczenia i korzystania z usług
					platformy WeddingDrop, służącej do udostępniania i pobierania
					multimediów z uroczystości weselnych.
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					2. Zasady korzystania
				</h2>
				<p className="mb-6">
					Korzystanie z serwisu jest bezpłatne dla gości weselnych. Użytkownik
					zobowiązuje się do nieprzesyłania treści o charakterze bezprawnym,
					obraźliwym lub naruszającym prawa osób trzecich.
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					3. Prawa własności intelektualnej
				</h2>
				<p className="mb-6">
					Przesyłając materiały, użytkownik zachowuje do nich pełne prawa
					autorskie, jednocześnie wyrażając zgodę na ich wyświetlanie oraz
					pobieranie przez inne osoby z dostępem do danej galerii.
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					4. Odpowiedzialność
				</h2>
				<p className="mb-6">
					Administrator nie ponosi odpowiedzialności za treści (w tym zdjęcia i
					filmy) zamieszczane przez użytkowników platformy. Wszelkie sporne
					materiały mogą zostać usunięte przez administratora galerii.
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					5. Zmiany regulaminu
				</h2>
				<p className="mb-6">
					Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszym
					regulaminie. Zmiany wchodzą w życie z dniem ich publikacji na stronie.
				</p>

				<AdminPlaceholderAlert description="To jest przykładowy szablon Warunków Korzystania (Regulaminu). Upewnij się, że uzupełnisz brakujące informacje i zweryfikujesz zgodność z prawem obowiązującym w Twoim kraju, w tym prawami konsumenta." />
			</div>
		</>
	);
}
