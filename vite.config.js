import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 👇 /api로 시작하는 요청은 백엔드로 프록시
      "/api": {
        target: "http://localhost:8080", // 백엔드 주소
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
