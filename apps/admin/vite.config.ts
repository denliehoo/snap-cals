import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5888,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@snap-cals/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
