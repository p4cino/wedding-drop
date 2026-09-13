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
});
