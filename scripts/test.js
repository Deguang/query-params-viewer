#!/usr/bin/env node
"use strict";

// Regression tests for the generated pages. Run: npm test
//
// These drive the real generated HTML in jsdom rather than checking the
// template as text, because every bug this suite was written for -- a share
// card rendered below the fold, a "copied" flash wiping out an inline <svg>,
// a hint cleared before it could be re-translated, a share key colliding with
// ordinary query params -- was invisible to static inspection and only showed
// up when the page actually ran.
//
// jsdom is a devDependency only; the generated pages ship with no runtime
// dependencies at all.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const SITE = "https://app.lideguang.com/query-params-viewer/";
const PAGES = { zh: "index.html", en: "en/index.html", ja: "ja/index.html" };

let passed = 0;
const failures = [];

function ok(name, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failures.push(name + (detail ? "\n      " + detail : ""));
  }
}

function eq(name, actual, expected) {
  ok(name, actual === expected, "expected " + JSON.stringify(expected) + "\n      actual   " + JSON.stringify(actual));
}

const tick = (ms) => new Promise((r) => setTimeout(r, ms));

// jsdom has no CompressionStream, but the browsers this feature targets do,
// so inject Node's implementations to exercise the compressed path.
function load(pageUrl, file) {
  const html = fs.readFileSync(path.join(ROOT, file || "index.html"), "utf8");
  const clip = { text: "" };
  const pageErrors = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: pageUrl,
    beforeParse(w) {
      w.gtag = function () {};
      w.CompressionStream = CompressionStream;
      w.DecompressionStream = DecompressionStream;
      w.Blob = Blob;
      w.Response = Response;
      Object.defineProperty(w.navigator, "clipboard", {
        value: { writeText: function (t) { clip.text = t; return Promise.resolve(); } },
        configurable: true
      });
      w.addEventListener("error", (e) => pageErrors.push(String(e.error && e.error.stack || e.message)));
    }
  });
  const w = dom.window;
  return {
    window: w,
    clip,
    pageErrors,
    $: (id) => w.document.getElementById(id),
    qs: (sel) => w.document.querySelector(sel),
    click: (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })),
    rowKeys: (tbodyId) => [...w.document.getElementById(tbodyId).children]
      .map((tr) => tr.children[0].textContent.trim())
  };
}

async function testBuildOutput() {
  for (const [lang, file] of Object.entries(PAGES)) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    ok(`[build] ${lang}: no unreplaced __TOKEN__`, !/__[A-Z_]+__/.test(html));

    const defined = [...html.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]);
    const referenced = [...new Set([...html.matchAll(/#(i-[a-z]+)/g)].map((m) => m[1]))];
    const missing = referenced.filter((r) => !defined.includes(r));
    ok(`[build] ${lang}: every icon reference has a <symbol>`, missing.length === 0, "missing: " + missing);

    const start = html.indexOf("(function () {");
    ok(`[build] ${lang}: inline script parses`, (() => {
      try { new Function(html.slice(start, html.indexOf("</script>", start))); return true; } catch (e) { return false; }
    })());
  }

  const i18n = require("./i18n.js");
  const keys = Object.keys(i18n.zh);
  for (const lang of ["en", "ja"]) {
    const missing = keys.filter((k) => !(k in i18n[lang]));
    ok(`[build] i18n ${lang} has all ${keys.length} keys`, missing.length === 0, "missing: " + missing);
  }
}

async function testShareRoundTripParse() {
  const a = load(SITE);
  a.$("urlInput").value = 'https://example.com/s?q=hi&user={"id":1}&r=https%3A%2F%2Fx.com%2Fcb%3Ft%3Dabc';
  a.click(a.$("parseBtn"));
  a.click(a.$("shareBtn"));
  await tick(150);

  ok("[share] parse: link copied to clipboard", a.clip.text.startsWith(SITE + "#"));
  ok("[share] parse: uses fragment, not query string", !a.clip.text.includes("?"));

  const b = load(SITE + new a.window.URL(a.clip.text).hash);
  await tick(200);
  eq("[share] parse: input restored", b.$("urlInput").value, a.$("urlInput").value);
  eq("[share] parse: results shown", b.$("results").hidden, false);
  eq("[share] parse: stays in parse view", b.$("compareView").hidden, true);
}

async function testShareRoundTripCompare() {
  const a = load(SITE);
  a.click(a.$("tabCompareBtn"));
  a.$("compareInputA").value = "https://e.com/a?same=1&changed=x&onlyA=1";
  a.$("compareInputB").value = "https://e.com/b?same=1&changed=y&onlyB=2";
  a.click(a.$("compareBtn"));
  a.click(a.$("compareShareBtn"));
  await tick(150);

  const b = load(SITE + new a.window.URL(a.clip.text).hash);
  await tick(200);
  eq("[share] compare: switches to compare view", b.$("compareView").hidden, false);
  eq("[share] compare: A restored", b.$("compareInputA").value, a.$("compareInputA").value);
  eq("[share] compare: B restored", b.$("compareInputB").value, a.$("compareInputB").value);
  eq("[share] compare: diff table rendered", b.$("compareResultCard").hidden, false);
}

async function testShareClickOnIcon() {
  const p = load(SITE);
  p.click(p.$("tabCompareBtn"));
  p.$("compareInputA").value = "https://e.com/a?x=1";
  p.$("compareInputB").value = "https://e.com/b?x=2";

  // A real click usually lands on the icon, not the button box.
  p.$("compareShareBtn").querySelector("svg").dispatchEvent(
    new p.window.MouseEvent("click", { bubbles: true, cancelable: true })
  );
  await tick(150);
  ok("[share] click on the icon still triggers the button", p.clip.text.startsWith(SITE + "#"));
}

async function testFlashKeepsIcon() {
  const p = load(SITE);
  p.$("urlInput").value = "https://e.com/s?q=1";
  p.click(p.$("parseBtn"));
  const before = p.$("shareBtnLabel").textContent;

  p.click(p.$("shareBtn"));
  await tick(150);
  ok("[share] icon survives the copied flash", !!p.$("shareBtn").querySelector("svg use"));
  ok("[share] label flashes to 'copied'", p.$("shareBtnLabel").textContent !== before);
  ok("[share] button marked copied", p.$("shareBtn").classList.contains("copied"));

  await tick(1300);
  eq("[share] label restored after flash", p.$("shareBtnLabel").textContent, before);
  ok("[share] icon still present after restore", !!p.$("shareBtn").querySelector("svg use"));
}

async function testLengthHintTiers() {
  const p = load(SITE);
  p.$("urlInput").value = "https://e.com/s?q=1";
  p.click(p.$("parseBtn"));
  p.click(p.$("shareBtn"));
  await tick(150);
  eq("[hint] short link stays silent", p.$("shareLenHint").hidden, true);

  let big = "https://e.com/x?";
  for (let i = 0; i < 400; i++) big += "k" + i + "=" + "abcdefghij".repeat(2) + i + "&";
  p.$("urlInput").value = big;
  p.click(p.$("parseBtn"));
  eq("[hint] re-parsing clears a stale warning", p.$("shareLenHint").hidden, true);

  p.click(p.$("shareBtn"));
  await tick(200);
  const hint = p.$("shareLenHint");
  ok("[hint] long link warns", !hint.hidden && /hint-(warn|risk)/.test(hint.className), hint.className);
  ok("[hint] warning records the length", !!hint.getAttribute("data-len"));

  // A language switch re-renders the page, which clears the hint; it must be
  // captured beforehand and restored in the new language.
  const zhText = hint.textContent;
  p.qs('.lang-switch a[data-lang="en"]').dispatchEvent(new p.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  await tick(100);
  ok("[hint] warning survives a language switch", !p.$("shareLenHint").hidden);
  ok("[hint] warning is re-translated", p.$("shareLenHint").textContent !== zhText && p.$("shareLenHint").textContent.length > 0);
}

async function testQueryParamsAreNotShareKeys() {
  // The documented convention is pasting params onto this tool's own URL, so
  // these must parse normally rather than be mistaken for share links.
  const cases = [
    ["?a=1&b=2", ["a", "b"]],
    ["?x=1&z=2", ["x", "z"]],
    ["?u=admin&role=x", ["u", "role"]],
    ["?foo=bar&baz=1", ["foo", "baz"]]
  ];
  for (const [query, expectedKeys] of cases) {
    const p = load(SITE + query);
    await tick(80);
    eq(`[collision] ${query} stays in parse view`, p.$("compareView").hidden, true);
    ok(`[collision] ${query} parses its params`,
      JSON.stringify(p.rowKeys("tableBody")) === JSON.stringify(expectedKeys),
      "got " + JSON.stringify(p.rowKeys("tableBody")));
  }

  const h = load(SITE + "#/route?a=1");
  await tick(80);
  eq("[collision] a hash route is not read as a share link", h.$("compareView").hidden, true);
  ok("[collision] hash route parses its params", h.rowKeys("tableBody").join(",") === "a");
}

async function testBrokenShareLink() {
  const p = load(SITE + "#s=!!!not-base64!!!");
  await tick(200);
  eq("[share] a mangled link does not abort init", p.pageErrors.length, 0);
  ok("[share] a mangled link explains itself",
    p.$("emptyText").textContent.length > 0 && p.$("empty-state").hidden === false);
}

async function testThemeCycle() {
  const p = load(SITE);
  const root = p.window.document.documentElement;
  const icon = () => p.$("themeToggleIcon").getAttribute("href");
  const stored = () => p.window.localStorage.getItem("qpv-theme");

  eq("[theme] defaults to auto (no attribute)", root.hasAttribute("data-theme"), false);
  eq("[theme] auto stores nothing", stored(), null);
  eq("[theme] auto shows the contrast icon", icon(), "#i-contrast");

  p.click(p.$("themeToggle"));
  eq("[theme] auto -> light", root.getAttribute("data-theme"), "light");
  eq("[theme] light persisted", stored(), "light");
  eq("[theme] light shows the sun icon", icon(), "#i-sun");

  p.click(p.$("themeToggle"));
  eq("[theme] light -> dark", root.getAttribute("data-theme"), "dark");
  eq("[theme] dark persisted", stored(), "dark");
  eq("[theme] dark shows the moon icon", icon(), "#i-moon");

  p.click(p.$("themeToggle"));
  eq("[theme] dark -> auto", root.hasAttribute("data-theme"), false);
  eq("[theme] returning to auto clears storage", stored(), null);
  eq("[theme] auto icon restored", icon(), "#i-contrast");
}

async function testCompareRowTinting() {
  const p = load(SITE);
  p.click(p.$("tabCompareBtn"));
  p.$("compareInputA").value = "https://e.com/a?same=1&changed=x&onlyA=1";
  p.$("compareInputB").value = "https://e.com/b?same=1&changed=y&onlyB=2";
  p.click(p.$("compareBtn"));

  const byKey = {};
  for (const tr of p.$("compareTableBody").children) {
    byKey[tr.children[0].textContent.trim()] = {
      row: tr.className,
      badge: tr.querySelector(".status-badge").className.replace("status-badge ", "")
    };
  }
  eq("[diff] unchanged rows are not tinted", byKey.same.row, "");
  eq("[diff] unchanged badge", byKey.same.badge, "status-same");
  eq("[diff] changed rows tinted", byKey.changed.row, "row-diff");
  eq("[diff] changed badge", byKey.changed.badge, "status-diff");
  eq("[diff] only-in-A rows tinted", byKey.onlyA.row, "row-onlyA");
  eq("[diff] only-in-A badge", byKey.onlyA.badge, "status-onlyA");
  eq("[diff] only-in-B rows tinted", byKey.onlyB.row, "row-onlyB");
  eq("[diff] only-in-B badge", byKey.onlyB.badge, "status-onlyB");
}

// jsdom does no layout, so these read the stylesheet rather than measuring.
// That is enough to guard the regressions that actually happened: a column
// rule written without a table selector, and A/B widths drifting apart.
function cssRules(win) {
  const sheet = [...win.document.styleSheets].find((s) => s.cssRules.length);
  const base = [];
  const mobile = [];
  for (const r of sheet.cssRules) {
    if (r.media && r.conditionText && r.conditionText.includes("560px")) {
      mobile.push(...r.cssRules);
    } else if (r.selectorText) {
      base.push(r);
    }
  }
  return { base, mobile };
}

function compareColWidths(rules) {
  const widths = {};
  for (const r of rules) {
    if (!r.selectorText || !r.style || !r.style.width) continue;
    for (const sel of r.selectorText.split(",").map((x) => x.trim())) {
      const m = sel.match(/^#compareTable th:nth-child\((\d)\)$/);
      if (m) widths[m[1]] = r.style.width;
    }
  }
  return widths;
}

async function testResponsiveRules() {
  const p = load(SITE);
  const { base, mobile } = cssRules(p.window);
  ok("[mobile] a max-width:560px block exists", mobile.length > 0);

  // The original rule was unscoped, so it also hid the compare table's third
  // column -- which is B -- wiping out half the diff on every phone.
  const unscopedHide = mobile.filter((r) =>
    r.selectorText &&
    /(^|,)\s*(thead th|tbody td):nth-child\(3\)/.test(r.selectorText) &&
    r.style.display === "none");
  eq("[mobile] no unscoped nth-child(3) hiding rule", unscopedHide.length, 0);

  const paramsHide = mobile.some((r) =>
    r.selectorText && r.selectorText.includes("#paramsTable") && r.style.display === "none");
  ok("[mobile] the params table still hides its Type column", paramsHide);

  const compareHidden = mobile.some((r) =>
    r.selectorText && /#compareTable (th|td):nth-child\(3\)/.test(r.selectorText) &&
    r.style.display === "none");
  eq("[mobile] the compare table never hides column B", compareHidden, false);

  const fixed = base.some((r) =>
    r.selectorText === "#compareTable" && r.style.tableLayout === "fixed");
  ok("[compare] table-layout is fixed so columns cannot drift", fixed);

  const wide = compareColWidths(base);
  const narrow = compareColWidths(mobile);
  ok("[compare] A and B share a width on desktop", wide["2"] && wide["2"] === wide["3"],
    JSON.stringify(wide));
  ok("[compare] A and B share a width on mobile", narrow["2"] && narrow["2"] === narrow["3"],
    JSON.stringify(narrow));

  // The mobile rule hides this span, so the markup has to actually emit it.
  p.click(p.$("tabCompareBtn"));
  p.$("compareInputA").value = "https://e.com/a?k=1";
  p.$("compareInputB").value = "https://e.com/b?k=2";
  p.click(p.$("compareBtn"));
  ok("[compare] status badges wrap their label for the mobile rule to hide",
    !!p.$("compareTableBody").querySelector(".status-badge .status-text"));
  ok("[compare] status badge keeps a glyph outside that label",
    p.$("compareTableBody").querySelector(".status-badge").textContent.trim().length >
    p.$("compareTableBody").querySelector(".status-text").textContent.trim().length);
}

async function testLanguagePathsDoNotAccumulate() {
  // Switching language repeatedly used to stack /en/ja/en/ onto the path.
  for (const [file, url] of [
    [PAGES.en, SITE + "en/"],
    [PAGES.en, SITE + "en/index.html"]
  ]) {
    const p = load(url, file);
    const hrefOf = (lang) => p.qs('.lang-switch a[data-lang="' + lang + '"]').getAttribute("href");
    eq(`[lang] ${url} -> zh href`, hrefOf("zh"), "/query-params-viewer/");
    eq(`[lang] ${url} -> ja href`, hrefOf("ja"), "/query-params-viewer/ja/");

    for (const lang of ["ja", "en", "ja", "zh"]) {
      p.qs('.lang-switch a[data-lang="' + lang + '"]').dispatchEvent(
        new p.window.MouseEvent("click", { bubbles: true, cancelable: true })
      );
    }
    ok(`[lang] ${url}: path never accumulates after repeated switches`,
      !/\/(en|ja)\/(en|ja)\//.test(p.window.location.pathname), p.window.location.pathname);
  }
}

(async function main() {
  const tests = [
    testBuildOutput,
    testShareRoundTripParse,
    testShareRoundTripCompare,
    testShareClickOnIcon,
    testFlashKeepsIcon,
    testLengthHintTiers,
    testQueryParamsAreNotShareKeys,
    testBrokenShareLink,
    testThemeCycle,
    testCompareRowTinting,
    testLanguagePathsDoNotAccumulate,
    testResponsiveRules
  ];

  for (const t of tests) {
    try {
      await t();
    } catch (e) {
      failures.push(t.name + " threw\n      " + (e && e.stack || e));
    }
  }

  console.log(`\n  ${passed} passed, ${failures.length} failed\n`);
  if (failures.length) {
    for (const f of failures) console.log("  ✗ " + f);
    console.log("");
    process.exit(1);
  }
})();
