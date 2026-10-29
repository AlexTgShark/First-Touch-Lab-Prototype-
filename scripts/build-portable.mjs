import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = await mkdtemp(path.join(tmpdir(), "first-touch-portable-"));
try {
  const result = await build({
    root,
    configFile: false,
    plugins: [react(), tailwindcss()],
    build: {
      outDir: temporary,
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        output: { manualChunks: undefined, inlineDynamicImports: true },
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(
    (r) => r.output,
  );
  const javascript = outputs
    .filter((o) => o.type === "chunk")
    .map((o) => o.code)
    .join("\n");
  const css = outputs
    .filter((o) => o.type === "asset" && o.fileName.endsWith(".css"))
    .map((o) => o.source)
    .join("\n");
  let html = await readFile(path.join(root, "index.html"), "utf8");
  html = html.replace(
    /<script\b[^>]*src="\/src\/main.tsx"[^>]*><\/script>/,
    "",
  );
  html = html.replace(
    "</head>",
    () => `<style>${css.replace(/<\/style/gi, "<\\/style")}</style></head>`,
  );
  html = html.replace(
    "</body>",
    () =>
      `<script type="module">${javascript.replace(/<\/script/gi, "<\\/script")}</script></body>`,
  );
  await mkdir(path.join(root, "downloads"), { recursive: true });
  await writeFile(path.join(root, "downloads", "First-Touch-Lab.html"), html);
  console.log("Standalone preview: downloads/First-Touch-Lab.html");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
