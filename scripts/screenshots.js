#!/usr/bin/env node
"use strict";

// Regenerates the README screenshots in screenshots/ from the real, built
// index.html — not mockups. Not part of the build pipeline (build.js doesn't
// call this); run by hand after a UI change that should be reflected in the
// README. Needs Puppeteer, which is intentionally not a project dependency
// (it drags in a whole Chromium download for something used a few times a
// year), so install it in a scratch directory first:
//
//   mkdir -p /tmp/qpv-shots && cd /tmp/qpv-shots && npm init -y >/dev/null
//   npm install puppeteer --no-save
//   node /path/to/this/repo/scripts/screenshots.js
//
// Run node scripts/build.js first so index.html reflects the current
// scripts/template.html and scripts/i18n.js.

const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.join(__dirname, "..");
const FILE = "file://" + path.join(ROOT, "index.html");
const OUT = path.join(ROOT, "screenshots");

const EXAMPLE_A = "https://shop.example.com/search?q=running+shoes&page=1&sort=asc&color=red";
const EXAMPLE_B = "https://shop.example.com/search?q=running+shoes&page=2&sort=asc&size=10";

async function shootParse(page, theme, outFile) {
  await page.goto(FILE, { waitUntil: "networkidle0" });
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await page.click("#exampleBtn");
  await page.waitForSelector("#results:not([hidden])");
  await new Promise((r) => setTimeout(r, 150));
  const box = await (await page.$(".app")).boundingBox();
  await page.screenshot({
    path: path.join(OUT, outFile),
    clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 900) }
  });
}

async function shootCompare(page, theme, outFile) {
  await page.goto(FILE, { waitUntil: "networkidle0" });
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await page.click("#tabCompareBtn");
  await page.type("#compareInputA", EXAMPLE_A);
  await page.type("#compareInputB", EXAMPLE_B);
  await page.click("#compareBtn");
  await page.waitForSelector("#compareResultCard:not([hidden])");
  await new Promise((r) => setTimeout(r, 150));
  const box = await (await page.$(".app")).boundingBox();
  const cardBox = await (await page.$("#compareResultCard")).boundingBox();
  await page.screenshot({
    path: path.join(OUT, outFile),
    // Crop right after the diff table instead of the whole .app: the
    // About/FAQ section below it would otherwise dominate the frame.
    clip: { x: box.x, y: box.y, width: box.width, height: (cardBox.y + cardBox.height) - box.y + 24 }
  });
}

(async () => {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1040, height: 1000, deviceScaleFactor: 2 });

  await shootParse(page, "light", "parse-light.png");
  await shootParse(page, "dark", "parse-dark.png");
  await shootCompare(page, "light", "compare-light.png");
  await shootCompare(page, "dark", "compare-dark.png");

  await browser.close();
  console.log("wrote screenshots/{parse,compare}-{light,dark}.png");
})();
