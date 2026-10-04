import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["server.ts"],
	format: ["cjs"],
	target: "node24",
	clean: true,
	// Tsup domyślnie wyklucza pakiety z package.json (node_modules), co jest poprawne.
	// Wymuszamy jednak wbudowanie naszych pakietów roboczych (monorepo workspaces),
	// ponieważ nie posiadają one własnego kroku budowania na produkcję.
	noExternal: [/^@wedding-drop\//],
	// sharp jest zależnością @wedding-drop/media, a nie apps/web, więc tsup nie wykrywa
	// jej automatycznie jako zewnętrznej z package.json i wbudowuje jej kod do dist/server.js.
	// Sharp lokalizuje swój natywny plik .node względem własnego katalogu w node_modules —
	// po zbundlowaniu ta ścieżka się gubi i przetwarzanie miniaturek wywala się w produkcji.
	external: ["sharp"],
});
