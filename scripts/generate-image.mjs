// Generate images with Google's Gemini image model via fal.ai (fal-ai/nano-banana-pro).
// Mirrors the approach in /Users/sajithmr/1box/moviebox/src/core/fal.ts.
//
// Usage:
//   node --env-file=.env scripts/generate-image.mjs                 # generate all presets
//   node --env-file=.env scripts/generate-image.mjs hero            # one preset by key
//   node --env-file=.env scripts/generate-image.mjs "<prompt>" out.png [aspect]
//
// Requires FAL_KEY in the environment (loaded from .env via --env-file).

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "assets");

const MODEL = "fal-ai/nano-banana-pro"; // Gemini image model on fal
const STYLE =
  "cinematic, photoreal, dramatic natural light, lush tropical greenery, " +
  "high detail, no on-screen text except where explicitly requested, no watermark";

// Reusable Kerala-themed prompts for the presentation.
const PRESETS = {
  hero: {
    out: "kerala-hero.png",
    aspect: "16:9",
    prompt:
      "A breathtaking aerial cinematic illustration of a small tropical island shaped to spell " +
      "the word 'KERALA' in giant weathered stone letters overgrown with greenery, set in a deep " +
      "turquoise ocean. On the island: a red-and-white striped lighthouse, a traditional Kerala " +
      "houseboat (kettuvallam) on the water, an ornate wooden temple/heritage building with a " +
      "tiered roof, dense coconut palms, rocky cliffs and gentle surf. Soft blue sky with a few " +
      "clouds and seagulls. Warm, hopeful, postcard-quality. " +
      STYLE,
  },
  band: {
    out: "kerala-band.png",
    aspect: "21:9",
    prompt:
      "Ultra-wide serene panorama of the Kerala backwaters at golden hour: a traditional houseboat " +
      "gliding through calm palm-lined canals, reflections on still water, distant green hills, " +
      "soft mist. Peaceful, inspirational, cinematic. " +
      STYLE,
  },
};

async function generate(prompt, aspect) {
  fal.config({ credentials: process.env.FAL_KEY });
  let last = "";
  const result = await fal.subscribe(MODEL, {
    input: {
      prompt,
      aspect_ratio: aspect,
      num_images: 1,
      output_format: "png",
    },
    logs: false,
    onQueueUpdate: (u) => {
      const s = u?.status ?? "";
      if (s && s !== last) {
        last = s;
        process.stderr.write(`  [fal] ${MODEL}: ${s.toLowerCase()}\n`);
      }
    },
  });
  const url = result?.data?.images?.[0]?.url;
  if (!url) throw new Error(`no image returned from ${MODEL}: ${JSON.stringify(result?.data ?? {})}`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`download failed: HTTP ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

async function run(prompt, outFile, aspect) {
  await fs.mkdir(ASSETS, { recursive: true });
  process.stderr.write(`\n→ Generating ${outFile} (${aspect})\n`);
  const bytes = await generate(prompt, aspect);
  const outPath = path.join(ASSETS, outFile);
  await fs.writeFile(outPath, bytes);
  process.stderr.write(`✓ Saved ${outPath} (${(bytes.length / 1024).toFixed(0)} KB)\n`);
}

async function main() {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY missing. Run with: node --env-file=.env scripts/generate-image.mjs");
  }
  const [a, b, c] = process.argv.slice(2);

  if (!a) {
    // generate all presets
    for (const key of Object.keys(PRESETS)) {
      const p = PRESETS[key];
      await run(p.prompt, p.out, p.aspect);
    }
    return;
  }
  if (PRESETS[a]) {
    const p = PRESETS[a];
    await run(p.prompt, p.out, p.aspect);
    return;
  }
  // custom: "<prompt>" out.png [aspect]
  await run(a, b || "custom.png", c || "16:9");
}

main().catch((e) => {
  process.stderr.write(`\n✗ ${e.message}\n`);
  process.exit(1);
});
