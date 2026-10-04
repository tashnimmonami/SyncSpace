import { resolve } from "path";
import { defineConfig } from "vite";

const root = resolve(__dirname, "..");

export default defineConfig({
  root,

  publicDir: false,

  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(root, "website/index.html"),
        login: resolve(root, "website/login.html"),
        signup: resolve(root, "website/signup.html"),
        websiteDashboard: resolve(root, "website/dashboard.html"),

        product: resolve(root, "product/index.html"),
        tasks: resolve(root, "product/tasks.html"),
        projects: resolve(root, "product/projects.html"),
        activity: resolve(root, "product/activity.html"),
        settings: resolve(root, "product/settings.html"),
      },

      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});