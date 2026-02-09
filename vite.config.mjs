import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  // Critical for Electron file:// protocol
  base: './',
  // This changes the out put dir from dist to build
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [tsconfigPaths(), react()],
  server: {
    port: 4028,
    host: "127.0.0.1",
    strictPort: true
  }
});