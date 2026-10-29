import { writeFile } from "node:fs/promises";
await writeFile(new URL("../docs/.nojekyll", import.meta.url), "");
console.log("GitHub Pages build ready in docs/.");
