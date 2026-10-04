import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: "index.html",
        login: "login.html",
        signup: "signup.html",
        dashboard: "dashboard.html"
      }
    }
  }
});
