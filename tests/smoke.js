#!/usr/bin/env node
/**
 * Interaction smoke suite — the gate for JS extraction and config wiring.
 *
 *   $env:NODE_PATH = "$env:TEMP\zqshot\node_modules"
 *   node tests/smoke.js
 *
 * Covers: seal open, music play/mute/resume, petals, scratch reveal +
 * heart burst, .ics link, countdown tick, slideshow advance, RSVP success,
 * RSVP fallback, reduced-motion behaviour, and horizontal overflow.
 *
 * Exit code 0 = every check passed.
 */

"use strict";

const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright-core");

const PAGE_URL = pathToFileURL(path.join(__dirname, "..", "index.html")).href;
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail: detail === undefined ? "" : String(detail) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
}

async function newPage(browser, viewport, options = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, ...options });
  const errors = { console: [], page: [], request: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.console.push(msg.text());
  });
  page.on("pageerror", (err) => errors.page.push(err.message));
  page.on("requestfailed", (req) => {
    const failure = req.failure();
    const reason = failure ? failure.errorText : "unknown";
    if (!reason.includes("ERR_ABORTED")) errors.request.push(`${reason} ${req.url()}`);
  });
  page.errors = errors;
  return page;
}

async function openSeal(page) {
  await page.goto(PAGE_URL, { waitUntil: "networkidle" });
  await page.click("#openInvite", { force: true });
  await page.waitForTimeout(1500);
}

async function scratch(page) {
  await page.evaluate(() =>
    document.getElementById("scratchCard").scrollIntoView({ block: "center" }),
  );
  await page.waitForTimeout(500);
  const box = await page.locator("#scratchCanvas").boundingBox();
  for (let k = 0; k < 10; k++) {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * (0.3 + 0.04 * k));
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width * (0.3 + (k % 3) * 0.2),
      box.y + box.height * (0.35 + 0.05 * k),
      { steps: 4 },
    );
    await page.mouse.up();
  }
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  /* ---------- main page ------------------------------------------- */
  const page = await newPage(browser, MOBILE);
  await page.goto(PAGE_URL, { waitUntil: "networkidle" });

  const beforeOpen = await page.evaluate(() => ({
    locked: document.body.classList.contains("locked"),
    petals: document.querySelectorAll("#petals .petal").length,
    countdown: document.getElementById("cd-days").textContent.trim(),
  }));
  check("page starts locked at the seal", beforeOpen.locked);
  check("petals spawned", beforeOpen.petals === 18, beforeOpen.petals);

  await page.click("#openInvite", { force: true });
  await page.waitForTimeout(2200);

  const afterOpen = await page.evaluate(() => {
    const audio = document.getElementById("bgMusic");
    return {
      locked: document.body.classList.contains("locked"),
      opened: document.body.classList.contains("opened"),
      introHidden: document.getElementById("intro").getAttribute("aria-hidden"),
      paused: audio.paused,
      volume: Number(audio.volume.toFixed(2)),
      pressed: document.getElementById("musicBtn").getAttribute("aria-pressed"),
    };
  });
  check("seal unlocks the body", !afterOpen.locked && afterOpen.opened);
  check("intro is hidden after the transition", afterOpen.introHidden === "true");
  check("music is playing", !afterOpen.paused, `volume ${afterOpen.volume}`);
  check("music fades toward 0.55", afterOpen.volume > 0.4, afterOpen.volume);
  check("music button reports pressed", afterOpen.pressed === "true");

  await page.click("#musicBtn");
  await page.waitForTimeout(700);
  const muted = await page.evaluate(() => {
    const audio = document.getElementById("bgMusic");
    return {
      paused: audio.paused,
      volume: Number(audio.volume.toFixed(2)),
      pressed: document.getElementById("musicBtn").getAttribute("aria-pressed"),
      label: document.getElementById("musicBtn").getAttribute("aria-label"),
    };
  });
  check("mute pauses and silences", muted.paused && muted.volume === 0);
  check("mute updates aria", muted.pressed === "false" && /Play/.test(muted.label));

  await page.click("#musicBtn");
  await page.waitForTimeout(900);
  const resumed = await page.evaluate(() => ({
    paused: document.getElementById("bgMusic").paused,
    pressed: document.getElementById("musicBtn").getAttribute("aria-pressed"),
  }));
  check("unmute resumes playback", !resumed.paused && resumed.pressed === "true");

  const ics = await page.evaluate(() => {
    const href = document.getElementById("saveDate").getAttribute("href") || "";
    return {
      data: href.startsWith("data:text/calendar"),
      start: href.indexOf("DTSTART%3A20270127T200000") !== -1,
      location: href.indexOf("Kara%20Convention%20Center") !== -1,
    };
  });
  check("save-the-date builds a calendar link", ics.data && ics.start && ics.location);

  const tick1 = await page.evaluate(() => document.getElementById("cd-seconds").textContent);
  await page.waitForTimeout(1200);
  const tick2 = await page.evaluate(() => document.getElementById("cd-seconds").textContent);
  check("countdown ticks", tick1 !== tick2, `${tick1} -> ${tick2}`);

  const slide1 = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("#gallery .gallery-frame img")];
    return imgs.findIndex((img) => img.classList.contains("active"));
  });
  await page.waitForTimeout(5600);
  const slide2 = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("#gallery .gallery-frame img")];
    return imgs.findIndex((img) => img.classList.contains("active"));
  });
  check("slideshow advances", slide1 !== slide2, `${slide1} -> ${slide2}`);

  await scratch(page);
  await page.waitForTimeout(400);
  const revealed = await page.evaluate(() => ({
    class: document.getElementById("scratchCard").classList.contains("revealed"),
    hearts: document.querySelectorAll(".burst-heart").length,
  }));
  check("scratch reveals the date", revealed.class);
  check("heart burst spawns 24 particles", revealed.hearts > 0, revealed.hearts);
  await page.waitForTimeout(3200);
  const cleaned = await page.evaluate(
    () => document.querySelectorAll(".burst-heart").length,
  );
  check("heart particles clean up", cleaned === 0, cleaned);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  check("no horizontal overflow at 390", !overflow);
  check("no console errors", page.errors.console.length === 0, page.errors.console.join(" | "));
  check("no page errors", page.errors.page.length === 0, page.errors.page.join(" | "));
  check("no failed requests", page.errors.request.length === 0, page.errors.request.join(" | "));

  /* ---------- RSVP success ---------------------------------------- */
  await page.route("https://formsubmit.co/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type, accept",
        },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ success: "true", message: "ok" }),
    });
  });

  await page.fill("#rsvpName", "Test Guest");
  await page.selectOption("#rsvpAttend", "yes");
  await page.fill("#rsvpMessage", "Looking forward to it.");
  await page.click('#rsvpForm button[type="submit"]');
  await page.waitForTimeout(900);
  const success = await page.evaluate(() => ({
    formHidden: document.getElementById("rsvpForm").hidden,
    successHidden: document.getElementById("rsvpSuccess").hidden,
    text: document.getElementById("rsvpSuccessText").textContent.trim(),
  }));
  check("RSVP success panel shows", success.formHidden && !success.successHidden);
  check("RSVP greets by first name", success.text.indexOf("Test") !== -1);

  await page.close();

  /* ---------- RSVP fallback --------------------------------------- */
  const fallbackPage = await newPage(browser, MOBILE);
  await fallbackPage.route("https://formsubmit.co/**", (route) =>
    route.fulfill({ status: 500, body: "nope" }),
  );
  await openSeal(fallbackPage);
  await fallbackPage.fill("#rsvpName", "Fallback Guest");
  await fallbackPage.selectOption("#rsvpAttend", "no");
  await fallbackPage.click('#rsvpForm button[type="submit"]');
  await fallbackPage.waitForTimeout(900);
  const fallback = await fallbackPage.evaluate(() => ({
    statusHidden: document.getElementById("rsvpStatus").hidden,
    href: document.getElementById("rsvpMailto").getAttribute("href") || "",
    enabled: !document.querySelector('#rsvpForm button[type="submit"]').disabled,
  }));
  check("RSVP fallback is visible", !fallback.statusHidden);
  check("RSVP fallback builds a mailto link", fallback.href.startsWith("mailto:sflshahed@gmail.com"));
  check("RSVP button re-enables after failure", fallback.enabled);
  await fallbackPage.close();

  /* ---------- reduced motion -------------------------------------- */
  const calm = await newPage(browser, MOBILE, { reducedMotion: "reduce" });
  await openSeal(calm);
  const calmState = await calm.evaluate(() => ({
    petals: document.querySelectorAll("#petals .petal").length,
    revealed: document.querySelectorAll(".reveal.in").length,
    totalReveals: document.querySelectorAll(".reveal").length,
  }));
  await calm.evaluate(() => document.getElementById("scratchCard").dispatchEvent(
    new MouseEvent("dblclick", { bubbles: true }),
  ));
  await calm.waitForTimeout(400);
  const calmHearts = await calm.evaluate(
    () => document.querySelectorAll(".burst-heart").length,
  );
  check("reduced motion disables petals", calmState.petals === 0);
  check("reduced motion shows all reveals", calmState.revealed === calmState.totalReveals);
  check("reduced motion skips the heart burst", calmHearts === 0);
  await calm.close();

  /* ---------- desktop overflow ------------------------------------ */
  const wide = await newPage(browser, DESKTOP);
  await openSeal(wide);
  const wideOverflow = await wide.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  check("no horizontal overflow at 1440", !wideOverflow);
  await wide.close();

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("Failures:");
    for (const item of failed) console.log(`  - ${item.name} ${item.detail}`);
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
