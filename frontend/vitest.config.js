import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.js",
    css: true,
    globals: true,
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
