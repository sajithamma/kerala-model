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
  buildproof: {
    out: "buildproof.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory product photo that instantly communicates: take a photo of a house, " +
      "and an AI app validates the construction quality. " +
      "Scene: a newly built single-storey government welfare house in rural Kerala — plain concrete walls, " +
      "sloped tiled roof, a few coconut palms, bright clean daylight. " +
      "In the foreground, slightly to one side, a young field inspector in a light blue shirt holds up a " +
      "smartphone in both hands, photographing the house. The phone is angled so the viewer clearly sees its screen, " +
      "which is in sharp focus while the background has a soft shallow depth of field. " +
      "On the phone screen is a modern, flat augmented-reality inspection app (clean white UI with green accents). " +
      "The live camera view on the screen shows the SAME house with neat rounded bounding-box markers and thin leader lines " +
      "pointing to specific parts of the house, each with a small crisp label: " +
      "a green checkmark label reading 'WATER OK', a green checkmark label 'ROOF OK', a green checkmark 'TOILET OK', " +
      "and one red warning label with an exclamation mark reading 'PLASTERING INCOMPLETE'. " +
      "A clean status bar at the top of the phone screen reads 'Housing Inspection AI' on the left and 'House #47 — 92% verified' on the right, " +
      "with a thin green progress bar. " +
      "Composition is uncluttered and editorial, the meaning obvious at a glance. Photoreal, crisp legible text on the UI. " +
      STYLE,
  },
  health: {
    out: "health.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory product photo communicating: in a medical emergency, a doctor instantly sees a " +
      "patient's key health record on a phone. " +
      "Scene: a bright hospital / ambulance setting in Kerala, a paramedic or doctor in uniform softly blurred in the background. " +
      "In sharp focus, a hand holds a smartphone whose screen shows a clean medical app card titled 'Quick Health Snapshot AI'. " +
      "The card clearly lists, each on its own row with a small icon: 'Blood group: O+', 'Allergies: Penicillin', " +
      "'Condition: Diabetic (Type 2)', 'Medication: Metformin', 'Emergency contact: Family'. " +
      "A small line at the top reads 'Verified · updated today'. " +
      "Clean white-and-green medical UI, crisp legible text, photoreal, shallow depth of field with the phone screen sharp. " +
      "Meaning obvious at a glance: scan → full medical history in seconds. " +
      STYLE,
  },
  sos: {
    out: "sos.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory, dignified product photo communicating: an elderly person in distress, and an AI " +
      "instantly calls for the right help. " +
      "Scene: a modest, warm Kerala home; an elderly woman in a simple sari seated in a chair, looking worried but reassured, " +
      "holding a smartphone in both hands. " +
      "The phone screen, in sharp focus, shows a large, friendly emergency app titled 'Senior Citizen SOS AI' with a big calm " +
      "'SOS' indicator and a voice waveform, plus a status checklist: 'Talking to you…', 'Ambulance dispatched', " +
      "'Son notified', 'Location shared'. " +
      "Warm soft daylight, large readable UI in green with a calm (not alarming) red SOS accent, photoreal, reassuring and respectful. " +
      "Meaning obvious at a glance: press → the AI talks, understands the emergency, and gets help. " +
      STYLE,
  },
  trip: {
    out: "trip-map.png",
    aspect: "16:9",
    prompt:
      "A beautiful, richly illustrated travel map of the South Kerala coastline around Varkala, India — " +
      "a top-down / gentle bird's-eye map view, premium travel-poster aesthetic. " +
      "The Arabian Sea fills the LEFT third of the map in a gradient of turquoise to deep blue with soft waves and a few tiny boats. " +
      "The LAND fills the centre and right in lush tropical greens — coconut palm groves, tiny red-roofed villages, winding " +
      "backwater canals and rice paddies. A sandy coastline with red laterite cliffs and beaches runs vertically (north–south) " +
      "down the middle of the map, separating sea from land. Include a small lighthouse near the coast and a couple of houseboats in a backwater. " +
      "Painterly, warm golden-hour light, soft shadows, subtle paper texture, decorative but clean and uncluttered. " +
      "ABSOLUTELY NO text, NO labels, NO map pins, NO markers — just the illustrated landscape map, leaving clean space along the coast. " +
      STYLE,
  },
  sentinel: {
    out: "sentinel.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory, empowering product photo communicating an AI women-safety guardian. " +
      "Absolutely NO violence, no threat figure, no fear — only protection and confidence. " +
      "Scene: a confident young woman walking calmly on a quiet, well-lit Kerala street at dusk, holding her smartphone. " +
      "The phone screen, in sharp focus, shows a safety app titled 'Sentinel AI' actively protecting, with a status panel: " +
      "'Live location shared', 'Audio recording on', 'Trusted contacts alerted', 'Pink Police notified', a small map, " +
      "and a discreet silent-SOS button. " +
      "Calm, reassuring, protective mood; modern UI in white with green and a coral alert accent; photoreal; tasteful and respectful. " +
      "Meaning obvious at a glance: the AI quietly senses danger and gets help. " +
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
