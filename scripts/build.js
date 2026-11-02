/**
 * build.js — assemble the deployable site into dist/
 *
 * Netlify publishes everything in the publish directory, so shipping the
 * repository root would also ship tests/ (≈10 MB of reference screenshots),
 * docs/, package.json and node_modules/. This copies only what guests need.
 *
 *   node scripts/build.js
 *
 * No dependencies, works on Windows, macOS, Linux and the Netlify image.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "dist");

/* Everything a guest's browser can reach. Anything not listed is internal. */
const FILES = ["index.html", "robots.txt", "_headers"];
const DIRS = ["assets"];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else if (entry.isFile()) fs.copyFileSync(src, dest);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let count = 0;
let bytes = 0;

for (const file of FILES) {
  const src = path.join(ROOT, file);
  if (!fs.existsSync(src)) {
    throw new Error(`missing required file: ${file}`);
  }
  fs.copyFileSync(src, path.join(OUT, file));
  count += 1;
  bytes += fs.statSync(src).size;
}

for (const dir of DIRS) {
  const src = path.join(ROOT, dir);
  if (!fs.existsSync(src)) {
    throw new Error(`missing required directory: ${dir}`);
  }
  copyDir(src, path.join(OUT, dir));
}

/* Recount from disk so the number reflects what actually landed in dist/. */
function measure(dir) {
  let files = 0;
  let size = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = measure(full);
      files += nested.files;
      size += nested.size;
    } else {
      files += 1;
      size += fs.statSync(full).size;
    }
  }
  return { files, size };
}

const total = measure(OUT);

/* Fail the build rather than deploy a broken invitation. */
const required = ["index.html", "_headers", "assets/js/main.js", "assets/css/tokens.css"];
for (const file of required) {
  if (!fs.existsSync(path.join(OUT, file))) {
    throw new Error(`build output is missing ${file}`);
  }
}

console.log(
  `dist/ · ${total.files} files · ${(total.size / 1024 / 1024).toFixed(2)} MB`,
);
