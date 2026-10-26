import { stat, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(projectRoot, "dist");

try {
  const indexStat = await stat(join(outputDir, "index.html"));
  if (!indexStat.isFile()) {
    throw new Error("dist/index.html not found. Run 'npm run build' first.");
  }

  const files = await readdir(outputDir, { recursive: true });
  console.log(`\n========================================`);
  console.log(` Cloudflare Static Distribution Ready!`);
  console.log(` Output directory: ${outputDir}`);
  console.log(` Total bundle files: ${files.length}`);
  console.log(` Target platform: Cloudflare Pages / Workers Assets`);
  console.log(` Config file: wrangler.toml`);
  console.log(` Deploy with: npx wrangler deploy`);
  console.log(`========================================\n`);
} catch (err) {
  console.error("Cloudflare build verification failed:", err.message);
  process.exit(1);
}
