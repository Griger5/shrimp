// https://nuxt.com/docs/api/configuration/nuxt-config

import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineNuxtConfig({
	modules: ["@nuxt/eslint", "nuxt-auth-utils"],
	devtools: { enabled: true },
	css: ["@picocss/pico"],
	compatibilityDate: "2025-07-15",
	vite: {
		plugins: [
			wasm(),
			tsconfigPaths(),
		],
	},
	eslint: {
		config: {
			stylistic: {
				semi: true,
				quotes: "double",
				commaDangle: "always-multiline",
				indent: "tab",
			},
		},
	},
});
