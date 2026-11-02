#!/usr/bin/env node
/**
 * Phase 0 gate — visual + geometric baseline.
 *
 * Captures, for each target viewport:
 *   1. a full-page JPEG reference in tests/reference/
 *   2. a computed-style / geometry fingerprint in tests/reference/metrics.json
 *
 * The fingerprint is what later phases diff against after extracting CSS or JS.
 * Volatile subtrees (random petals, auto-advancing slideshow) are excluded from
 * the fingerprint so the baseline stays comparable run to run.
 *
 * Run from the project root:
 *   $env:NODE_PATH = "$env:TEMP\zqshot\node_modules"
 *   node tests/capture-reference.js --label baseline
 *   node tests/capture-reference.js --label phase-1-assets
 *
 * Each run writes to tests/reference/<label>/ so runs never overwrite each
 * other. Compare two runs with:
 *   node tests/diff-reference.js baseline phase-1-assets
 *
 * This script is a development tool. It is never loaded by index.html.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch (err) {
  console.error(
    "playwright-core was not found.\n" +
      "Run with: $env:NODE_PATH = \"$env:TEMP\\zqshot\\node_modules\"\n" +
      "Original error: " +
      err.message,
  );
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const LABEL = argValue("--label", "baseline");
const OUT = path.join(__dirname, "reference", LABEL);
const PAGE_URL = pathToFileURL(path.join(ROOT, "index.html")).href;
const METRICS_FILE = path.join(OUT, "metrics.json");

const VIEWPORTS = [
  { tag: "320", width: 320, height: 740 },
  { tag: "360", width: 360, height: 780 },
  { tag: "390", width: 390, height: 844 },
  { tag: "768", width: 768, height: 1024 },
  { tag: "1440", width: 1440, height: 900 },
];

/* Deterministic rendering. Petals are randomly positioned on every load, so
   they are hidden; everything else is frozen in place. */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  #petals { display: none !important; }
`;

/* Stable, semantic selectors. Missing ones are recorded as null rather than
   omitted, so the key set itself is part of the contract. */
const FINGERPRINT_TARGETS = [
  "body",
  "header#home",
  "main#invitation",
  "footer.site-footer",
  "#intro",
  ".music-btn",
  ".section",
  ".section-inner",
  ".closing",
  ".scratch-wrap",
  "#scratchCard",
  "#scratchCanvas",
  "#gallery",
  "#saveDate",
  "#rsvpForm",
  "#rsvpStatus",
  "#rsvpMailto",
];

const PROPS = [
  "display",
  "position",
  "boxSizing",
  "width",
  "height",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginBottom",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "color",
  "backgroundColor",
  "backgroundSize",
  "backgroundPosition",
  "borderTopWidth",
  "borderTopColor",
  "borderRadius",
  "opacity",
  "transform",
  "overflowX",
];

function hash(input) {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    const relative = path.relative(ROOT, full).split(path.sep).join("/");
    // Inventory is the deployable payload: exclude the test harness and its
    // reference captures so a second run cannot double-count them.
    if (relative === "tests" || relative.startsWith("tests/")) continue;
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function inventory() {
  return walk(ROOT, [])
    .map((file) => ({
      path: path.relative(ROOT, file).split(path.sep).join("/"),
      bytes: fs.statSync(file).size,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

async function capture(page, viewport, errors) {
  page.on("pageerror", (err) => errors.page.push(`${viewport.tag}: ${err.message}`));

  await page.goto(PAGE_URL, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: FREEZE_CSS });

  // Open the seal so the invitation itself is measured, not the overlay.
  await page.click("#openInvite", { force: true });
  await page.waitForTimeout(1400);

  // Stop every interval so the slideshow and countdown cannot move mid-capture.
  await page.evaluate(() => {
    for (let i = 1; i < 5000; i++) window.clearInterval(i);
  });
  await page.waitForTimeout(200);

  const fingerprint = await page.evaluate(
    ({ targets, props }) => {
      const result = {};

      function styleOf(el) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const style = {};
        for (const prop of props) {
          let value = cs[prop];
          if (prop === "backgroundImage" || prop === "background") {
            value = value && value !== "none" ? value.length + ":" + value.slice(0, 40) : value;
          }
          style[prop] = value;
        }
        return {
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
          top: Math.round((rect.top + scrollY) * 100) / 100,
          style,
        };
      }

      for (const target of targets) {
        let el = null;
        try {
          el = document.querySelector(target);
        } catch (err) {
          el = null;
        }
        result[target] = el ? styleOf(el) : null;
      }
      return result;
    },
    { targets: FINGERPRINT_TARGETS, props: PROPS },
  );

  const documentInfo = await page.evaluate(() => {
    const sections = [];
    document
      .querySelectorAll("header, main > section, footer")
      .forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        sections.push({
          index,
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: typeof el.className === "string" ? el.className : "",
          top: Math.round(rect.top + scrollY),
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        });
      });

    return {
      title: document.title,
      bodyClass: document.body.className,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      innerWidth: window.innerWidth,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      domNodes: document.querySelectorAll("*").length,
      sectionCount: sections.length,
      sections,
    };
  });

  const file = path.join(OUT, `${viewport.tag}-full.jpg`);
  await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 75 });

  return { file: path.relative(ROOT, file).split(path.sep).join("/"), fingerprint, documentInfo };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const viewports = {};

  for (const viewport of VIEWPORTS) {
    console.log(`Capturing ${viewport.tag}x${viewport.height} ...`);
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const errors = { console: consoleErrors, page: pageErrors, request: failedRequests };
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`${viewport.tag}: ${msg.text()}`);
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure();
      const reason = failure ? failure.errorText : "unknown";
      // Browsers abort MP3 range requests by design; that is not a failure.
      if (reason.includes("ERR_ABORTED")) return;
      failedRequests.push(`${viewport.tag}: ${reason} ${request.url()}`);
    });

    const result = await capture(page, viewport, errors);
    viewports[viewport.tag] = result;
    console.log(
      `  ${result.file} · ${result.documentInfo.scrollHeight}px tall · ` +
        `overflowX=${result.documentInfo.overflowX}`,
    );
    await page.close();
  }

  await browser.close();

  const metrics = {
    label: LABEL,
    generatedAt: new Date().toISOString(),
    page: "index.html",
    viewports,
    consoleErrors,
    pageErrors,
    failedRequests,
    inventory: inventory(),
  };

  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2) + "\n", "utf8");

  console.log(`\nWrote ${path.relative(ROOT, METRICS_FILE)}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Page errors:    ${pageErrors.length}`);
  console.log(`Failed assets:  ${failedRequests.length}`);
  for (const failure of failedRequests) console.log("  ! " + failure);
  for (const failure of pageErrors) console.log("  ! " + failure);
})();
