import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          router: ["react-router-dom"],
          redux: ["@reduxjs/toolkit", "react-redux", "redux"],
          network: ["axios", "socket.io-client"],
          icons: ["lucide-react", "react-icons"],
        },
      },
    },
  },
});
