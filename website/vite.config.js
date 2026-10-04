import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");
const websiteDir = resolve(root, "website");
const productDir = resolve(root, "product");

export default defineConfig({
  root: websiteDir,
  publicDir: false,
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(websiteDir, "index.html"),
        login: resolve(websiteDir, "login.html"),
        signup: resolve(websiteDir, "signup.html"),
        websiteDashboard: resolve(websiteDir, "dashboard.html"),
        product: resolve(productDir, "index.html"),
        tasks: resolve(productDir, "tasks.html"),
        projects: resolve(productDir, "projects.html"),
        activity: resolve(productDir, "activity.html"),
        settings: resolve(productDir, "settings.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
