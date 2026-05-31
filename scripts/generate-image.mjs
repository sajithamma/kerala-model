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
  civicwatch: {
    out: "civicwatch.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory photo: a citizen reports a civic problem using a phone app. " +
      "Scene: a man standing on a road / small bridge in Kerala, pointing his smartphone at a clearly visible CRACK and pothole " +
      "in the road surface in front of him. " +
      "On the phone screen, in sharp focus, an app titled 'CivicWatch AI' shows the camera view of the crack with a detection box, " +
      "a label 'Road crack detected', a location pin line 'MG Road · geo-tagged', and a routing line 'Routed to → PWD' with a green " +
      "'Reported #2231' tag. " +
      "Clean white-and-green civic app UI, crisp legible text, photoreal, shallow depth of field with the phone screen sharp. " +
      "Meaning obvious at a glance: snap a civic issue → AI logs it, locates it and routes it to the right department. " +
      STYLE,
  },
  benefitfinder: {
    out: "benefitfinder.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory photo: a citizen discovers the government schemes they are eligible for, via an app. " +
      "Scene: an ordinary middle-aged Indian woman at a modest home, holding a smartphone, looking pleasantly surprised and hopeful. " +
      "On the phone screen, in sharp focus, an app titled 'BenefitFinder AI' shows a 'Schemes you can claim' list with three matched " +
      "entries, each with a green check: 'Widow Pension — eligible', 'LIFE Housing — eligible', 'Student Scholarship — eligible', " +
      "and a small line 'Matched to your profile · tap to apply'. " +
      "Clean white-and-green government app UI, crisp legible text, photoreal, shallow depth of field with the phone screen sharp. " +
      "Meaning obvious at a glance: share your family details → AI finds every benefit you qualify for. " +
      STYLE,
  },
  treetalk: {
    out: "treetalk.png",
    aspect: "16:9",
    prompt:
      "A charming, self-explanatory photo set in a lush botanical garden in Kerala. " +
      "A very large old tree, but only the LOWER part is visible — a massive textured trunk and the base, rising out of frame. " +
      "A small, cute, rounded AI device box (white-and-green, with a tiny speaker grille and a soft glowing ring) is neatly " +
      "fitted onto the trunk at chest height, like a friendly plaque. " +
      "A couple of garden visitors walk past; one visitor (a curious child or young adult) leans in and speaks to the little box. " +
      "To indicate THE TREE IS SPEAKING, show a friendly speech bubble appearing to come from the tree/box reading " +
      "'Hi! I'm a 200-year-old Banyan 🌳' (or similar short line) and gentle glowing sound-wave rings emanating from the box. " +
      "Warm dappled sunlight, green foliage, painterly-photoreal, heart-warming and educational mood. " +
      "Meaning obvious at a glance: a small offline AI box lets the tree tell its own story to visitors. " +
      STYLE,
  },
  farmmate: {
    out: "farmmate.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory photo communicating: a farmer points a phone at a plant leaf and an AI instantly diagnoses the disease. " +
      "Scene: a Kerala farm/field, a farmer (in a checked shirt) holding a smartphone up close to a green plant leaf that has " +
      "visible brown/yellow DISEASE SPOTS on it. " +
      "On the phone screen, in sharp focus, an app titled 'FarmMate AI' shows the same leaf in the camera view with neat AR " +
      "detection marks — small circles/bounding boxes around the diseased spots — and a result card: 'Leaf Spot (fungal) · 86%' " +
      "with a short remedy line 'Spray neem oil · remove affected leaves'. " +
      "Clean white-and-green app UI, crisp legible text, photoreal, shallow depth of field with the leaf and phone screen sharp. " +
      "Meaning obvious at a glance: photograph a sick leaf → AI names the disease and the fix. " +
      STYLE,
  },
  campusguard: {
    out: "campusguard.png",
    aspect: "16:9",
    prompt:
      "A wide-angle CCTV-style surveillance view of a high-school courtyard / corridor in Kerala, shot from a high corner camera " +
      "(slight fisheye, elevated perspective). Many students walk and stand around normally in daylight. " +
      "A subtle CCTV overlay: a small timestamp and a label 'CampusGuard AI · CAM 04' in a top corner. " +
      "The AI has flagged 2–3 students as anomalies — each enclosed in a thin CORAL/RED bounding box with a tiny label such as " +
      "'restricted area', 'after-hours' or 'unusual gathering' — while other students are unmarked. " +
      "On the RIGHT side, an inset detection panel/side screen lists the alerts: a few rows like 'Anomaly · restricted zone', " +
      "'Pattern: repeated', with small green/red status dots, in a clean UI. " +
      "Realistic, calm, professional security-monitoring look (NOT scary, no violence); muted CCTV color grade; crisp legible labels. " +
      "Meaning obvious at a glance: AI watches the campus feed and quietly flags unusual behaviour for staff to review. " +
      STYLE,
  },
  askbox: {
    out: "askbox.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory product photo of a beautifully designed AI ENQUIRY KIOSK at a railway station in Kerala. " +
      "Centre of frame: a sleek, premium free-standing interactive kiosk — a large VERTICAL touchscreen on an elegant minimal " +
      "stand with a rounded white-and-green body, a small camera and microphone at the top, softly glowing. " +
      "On the big screen, a friendly assistant UI titled 'AskBox AI' shows, top to bottom: a glowing circular voice waveform with a " +
      "prompt 'Tap & speak', a small line of language chips 'Malayalam · English · Hindi · Tamil', and a live 'Next Trains' board " +
      "listing two or three entries such as 'Venad Exp → Thiruvananthapuram · Plat 2 · 14:35 · On time' and " +
      "'Maveli Exp → Kollam · Plat 1 · +10 min'. " +
      "A traveler — a friendly middle-aged man with a shoulder bag — stands beside the kiosk speaking to it, looking helped and at ease. " +
      "Background: a clean, bright Kerala railway station concourse with platforms and a train, softly blurred. " +
      "Any station signage must be in ENGLISH ONLY, correctly spelled (e.g. a blue board reading 'KERALA RAILWAYS') — " +
      "absolutely NO Malayalam or other scripts on the boards, and no misspelled words. " +
      "Modern, warm, helpful mood; crisp legible UI text; photoreal; shallow depth of field with the kiosk screen sharp. " +
      "Meaning obvious at a glance: walk up, ask aloud, get live travel information. " +
      STYLE,
  },
  sme: {
    out: "sme.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory photo communicating: a customer simply CALLS a small business's phone NUMBER, and an AI voice " +
      "agent answers the call. This is an ORDINARY PHONE CALL — NOT an app, NOT a chat, NO message bubbles. " +
      "Foreground in sharp focus: a hand holds a smartphone showing a NATIVE PHONE-CALL screen of an ongoing voice call — " +
      "at the top a large contact name 'Spice Garden Café' with the dialled phone number '+91 98470 12345' below it, " +
      "a running call timer '00:42', and a clear sub-label 'Answered by AI voice assistant'. " +
      "In the middle a gentle animated voice waveform. At the bottom, the standard round CALL-CONTROL buttons in a grid — " +
      "mute, keypad, speaker, add-call, and a red END-CALL button — exactly like a normal smartphone call screen. " +
      "The caller is standing on a street / at home, softly blurred warm background. " +
      "Photoreal, clean native call UI, crisp legible text, shallow depth of field with the phone screen sharp. " +
      "Meaning obvious at a glance: dial the business number, and an AI answers and helps like a real receptionist. " +
      STYLE,
  },
  bloom: {
    out: "bloom.png",
    aspect: "16:9",
    prompt:
      "A warm, tasteful, respectful product photo communicating a private AI companion for women's health. " +
      "Scene: a young Indian woman relaxing comfortably at home — soft cosy interior, a plant, warm natural light — " +
      "holding a smartphone, calm and reassured (fully clothed, modest, no nudity). " +
      "The phone screen, in sharp focus, shows a gentle private wellness app titled 'Bloom AI' with: a soft circular " +
      "cycle tracker reading 'Day 14 · ovulation', an insight card 'Next period in ~14 days', a small line " +
      "'Ask me anything, privately', and a small privacy lock icon. " +
      "Soft pastel-and-green rounded friendly UI, photoreal, supportive and private mood, shallow depth of field with the screen sharp. " +
      "Meaning obvious at a glance: a private, judgment-free women's-health companion. " +
      STYLE,
  },
  carepoint: {
    out: "carepoint.png",
    aspect: "16:9",
    prompt:
      "A clear, self-explanatory product photo communicating: tell the app your medical need and it finds the nearest " +
      "affordable GOVERNMENT health facility. " +
      "Scene: a caregiver / ordinary person in a bright hospital corridor in Kerala, looking relieved, holding a smartphone. " +
      "The phone screen, in sharp focus, shows an app titled 'CarePoint AI' with a result card: a line 'You need: CT Scan', " +
      "a recommended facility 'Govt Medical College — 2.4 km', a cost comparison '₹1,500 govt  vs  ₹6,000 private', " +
      "a green 'Available today' tag, and a small map with a directions route. " +
      "Clean white-and-green medical UI, crisp legible text, photoreal, shallow depth of field with the phone screen sharp. " +
      "Meaning obvious at a glance: your problem → nearest cheap government facility, with cost and directions. " +
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
