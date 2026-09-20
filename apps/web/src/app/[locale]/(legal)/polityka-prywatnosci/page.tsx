import { AdminPlaceholderAlert } from "@/components/AdminPlaceholderAlert";

export default function PrivacyPolicyPage() {
	return (
		<>
			<h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-slate-900 mb-8">
				Polityka Prywatności
			</h1>

			<div className="text-slate-600 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200/60 leading-relaxed text-sm sm:text-base">
				<p className="italic mb-8 text-slate-500">
					Ostatnia aktualizacja: [DATA]
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					1. Postanowienia ogólne
				</h2>
				<p className="mb-6">
					Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony
					danych osobowych przekazanych przez użytkowników w związku z
					korzystaniem z platformy WeddingDrop.
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					2. Administrator Danych
				</h2>
				<p className="mb-6">
					Administratorem danych osobowych zawartych w serwisie jest [NAZWA
					FIRMY LUB IMIĘ I NAZWISKO], z siedzibą w [ADRES].
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					3. Zbierane dane i cel przetwarzania
				</h2>
				<p className="mb-6">
					Przetwarzamy dane dobrowolnie przesłane przez użytkowników (np.
					zdjęcia, filmy) wyłącznie w celu udostępnienia ich w ramach
					konkretnej, prywatnej galerii weselnej.
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					4. Udostępnianie danych
				</h2>
				<p className="mb-6">
					Przesłane materiały multimedialne są widoczne dla innych osób
					posiadających link lub kod QR do danej galerii weselnej. Nie
					udostępniamy danych podmiotom trzecim w celach marketingowych.
				</p>

				<h2 className="text-lg sm:text-xl font-semibold text-slate-800 mt-8 mb-3">
					5. Prawa użytkowników
				</h2>
				<p className="mb-6">
					Każdy użytkownik ma prawo wglądu do swoich danych, ich poprawiania
					oraz żądania ich usunięcia. W celu realizacji tych praw prosimy o
					kontakt pod adresem e-mail: [ADRES EMAIL].
				</p>

				<AdminPlaceholderAlert description="To jest przykładowy szablon Polityki Prywatności (placeholder). Pamiętaj, aby przed opublikowaniem usługi uzupełnić brakujące dane ([w nawiasach kwadratowych]) i dostosować treść do obowiązujących przepisów prawa, takich jak RODO, zgodnie ze specyfiką Twojej działalności." />
			</div>
		</>
	);
}
