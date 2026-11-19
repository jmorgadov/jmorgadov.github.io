import { existsSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { parse } from "yaml";

// Turns `import data from "../en.yml"` into a plain JS object at build time.
function yamlPlugin(): Plugin {
  return {
    name: "yaml",
    transform(src, id) {
      if (!/\.ya?ml$/.test(id)) return null;
      return { code: `export default ${JSON.stringify(parse(src))};`, map: null };
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), yamlPlugin()],
  define: {
    __HAS_CV__: JSON.stringify(existsSync("public/cv.pdf")),
  },
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
