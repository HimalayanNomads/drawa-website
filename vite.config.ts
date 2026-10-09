import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/", // served at the root of drawa.cc
  plugins: [],
  build: {
    // one HTML file per page: / and /features/
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        features: resolve(import.meta.dirname, "features/index.html"),
      },
    },
  },
});
