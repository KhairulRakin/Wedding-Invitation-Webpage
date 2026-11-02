#!/usr/bin/env node
/**
 * Compares two capture runs produced by tests/capture-reference.js.
 *
 *   node tests/diff-reference.js baseline phase-1-assets
 *
 * Exit code 0 = identical (within tolerance), 1 = drift detected.
 *
 * A pure asset move is expected to change inventory *paths* only, so files are
 * compared by basename + byte size rather than by full path.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REF = path.join(__dirname, "reference");
const [baseLabel, targetLabel] = process.argv.slice(2);

if (!baseLabel || !targetLabel) {
  console.error("Usage: node tests/diff-reference.js <baseline-label> <target-label>");
  process.exit(2);
}

function load(label) {
  const file = path.join(REF, label, "metrics.json");
  if (!fs.existsSync(file)) {
    console.error(`Missing metrics for "${label}": ${file}`);
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const NUMERIC = new Set([
  "width",
  "height",
  "top",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginBottom",
  "borderTopWidth",
  "borderRadius",
  "opacity",
]);

function numbers(value) {
  return (value.match(/-?\d+(\.\d+)?/g) || []).map(Number);
}

function sameStyle(prop, a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;

  if (NUMERIC.has(prop)) return Math.abs(parseFloat(a) - parseFloat(b)) <= 0.02;

  if (prop === "transform") {
    const na = numbers(a);
    const nb = numbers(b);
    if (na.length !== nb.length) return false;
    return na.every((n, i) => Math.abs(n - nb[i]) <= 0.02);
  }

  if (prop === "backgroundImage") {
    // Captured as "<length>:<prefix>" to keep metrics.json readable.
    return a.split(":")[0] === b.split(":")[0];
  }

  return false;
}

function near(a, b, tolerance = 0.6) {
  return Math.abs(a - b) <= tolerance;
}

const base = load(baseLabel);
const target = load(targetLabel);
const problems = [];

/* ---- payload -------------------------------------------------------- */
const sizeByName = (metrics) => {
  const map = new Map();
  for (const file of metrics.inventory) {
    if (file.path.startsWith("tests/")) continue;
    const name = path.basename(file.path);
    map.set(name, (map.get(name) || 0) + file.bytes);
  }
  return map;
};

const BINARY = /\.(jpe?g|png|webp|avif|gif|mp3|wav|ogg|m4a|ico|woff2?|ttf|otf)$/i;

const baseSizes = sizeByName(base);
const targetSizes = sizeByName(target);
for (const [name, bytes] of baseSizes) {
  if (!targetSizes.has(name)) {
    problems.push(`asset missing after refactor: ${name}`);
  } else if (BINARY.test(name) && targetSizes.get(name) !== bytes) {
    // Binary assets must survive a move byte-for-byte. Text files may grow or
    // shrink legitimately (path rewrites, extraction), so their size is not
    // part of the gate; rendering and console checks cover those.
    problems.push(`binary asset changed size: ${name} (${bytes} -> ${targetSizes.get(name)})`);
  }
}

/* ---- console -------------------------------------------------------- */
if (target.consoleErrors.length > base.consoleErrors.length) {
  problems.push(
    `console errors increased: ${base.consoleErrors.length} -> ${target.consoleErrors.length}`,
  );
}

/* ---- geometry + styles ---------------------------------------------- */
for (const tag of Object.keys(base.viewports)) {
  const b = base.viewports[tag];
  const t = target.viewports[tag];
  if (!t) {
    problems.push(`[${tag}] viewport missing from target run`);
    continue;
  }

  const bd = b.documentInfo;
  const td = t.documentInfo;

  if (bd.overflowX !== td.overflowX) {
    problems.push(`[${tag}] horizontal overflow: ${bd.overflowX} -> ${td.overflowX}`);
  }
  if (!near(bd.scrollWidth, td.scrollWidth)) {
    problems.push(`[${tag}] scrollWidth: ${bd.scrollWidth} -> ${td.scrollWidth}`);
  }
  if (!near(bd.scrollHeight, td.scrollHeight, 2)) {
    problems.push(`[${tag}] scrollHeight: ${bd.scrollHeight} -> ${td.scrollHeight}`);
  }
  if (bd.domNodes !== td.domNodes) {
    problems.push(`[${tag}] DOM node count: ${bd.domNodes} -> ${td.domNodes}`);
  }
  if (bd.sectionCount !== td.sectionCount) {
    problems.push(`[${tag}] section count: ${bd.sectionCount} -> ${td.sectionCount}`);
  }

  if (bd.sections.length === td.sections.length) {
    bd.sections.forEach((section, i) => {
      const other = td.sections[i];
      const name = `${section.tag}${section.id ? "#" + section.id : ""}[${i}]`;
      if (!near(section.top, other.top, 1)) {
        problems.push(`[${tag}] ${name} top: ${section.top} -> ${other.top}`);
      }
      if (!near(section.height, other.height, 1)) {
        problems.push(`[${tag}] ${name} height: ${section.height} -> ${other.height}`);
      }
    });
  }

  for (const selector of Object.keys(b.fingerprint)) {
    const before = b.fingerprint[selector];
    const after = t.fingerprint[selector];

    if (!before && !after) continue;
    if (!before || !after) {
      problems.push(`[${tag}] ${selector}: presence changed`);
      continue;
    }

    if (!near(before.width, after.width, 1)) {
      problems.push(`[${tag}] ${selector} width: ${before.width} -> ${after.width}`);
    }
    if (!near(before.height, after.height, 1)) {
      problems.push(`[${tag}] ${selector} height: ${before.height} -> ${after.height}`);
    }
    if (!near(before.top, after.top, 1)) {
      problems.push(`[${tag}] ${selector} top: ${before.top} -> ${after.top}`);
    }

    for (const prop of Object.keys(before.style)) {
      if (!sameStyle(prop, before.style[prop], after.style[prop])) {
        problems.push(
          `[${tag}] ${selector} ${prop}: "${before.style[prop]}" -> "${after.style[prop]}"`,
        );
      }
    }
  }
}

/* ---- report --------------------------------------------------------- */
if (!problems.length) {
  const payloadFiles = base.inventory.filter((f) => !f.path.startsWith("tests/")).length;
  console.log(`PASS  ${baseLabel} == ${targetLabel}`);
  console.log(
    `${Object.keys(base.viewports).length} viewports · ` +
      `${payloadFiles} payload files · console errors ${target.consoleErrors.length}`,
  );
  process.exit(0);
}

console.log(`FAIL  ${baseLabel} != ${targetLabel}  (${problems.length} difference(s))`);
for (const line of problems.slice(0, 60)) console.log("  - " + line);
if (problems.length > 60) console.log(`  ... and ${problems.length - 60} more`);
process.exit(1);
