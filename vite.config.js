import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  root: repoRoot,

  build: {
    outDir: "dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        "website/index": fileURLToPath(
          new URL("./index.html", import.meta.url)
        ),
        "website/login": fileURLToPath(
          new URL("./login.html", import.meta.url)
        ),
        "website/signup": fileURLToPath(
          new URL("./signup.html", import.meta.url)
        ),
        "website/dashboard": fileURLToPath(
          new URL("./dashboard.html", import.meta.url)
        ),

        "product/index": fileURLToPath(
          new URL("../product/index.html", import.meta.url)
        ),
        "product/tasks": fileURLToPath(
          new URL("../product/tasks.html", import.meta.url)
        ),
        "product/projects": fileURLToPath(
          new URL("../product/projects.html", import.meta.url)
        ),
        "product/activity": fileURLToPath(
          new URL("../product/activity.html", import.meta.url)
        ),
        "product/settings": fileURLToPath(
          new URL("../product/settings.html", import.meta.url)
        ),
      },
    },
  },
});
