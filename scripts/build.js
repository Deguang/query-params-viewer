#!/usr/bin/env node
"use strict";

// Generates index.html (zh), en/index.html, ja/index.html from
// scripts/template.html + scripts/i18n.js. Run: node scripts/build.js
// The output files are plain static HTML — no build step is needed to
// serve them, this script only exists to keep the three language
// variants in sync from one shared template.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_BASE = "https://app.lideguang.com/query-params-viewer/";
const i18n = require("./i18n.js");
const template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");

const PAGES = {
  zh: { dir: "", canonical: SITE_BASE },
  en: { dir: "en", canonical: SITE_BASE + "en/" },
  ja: { dir: "ja", canonical: SITE_BASE + "ja/" }
};

const LANG_LABELS = { zh: "中文", en: "EN", ja: "日本語" };

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceAll(str, token, value) {
  return str.split(token).join(value);
}

function relativeHref(fromLang, toLang) {
  if (fromLang === toLang) return "./";
  return fromLang === "zh" ? PAGES[toLang].dir + "/" : "../" + (PAGES[toLang].dir ? PAGES[toLang].dir + "/" : "");
}

function buildLangSwitch(currentLang) {
  const langs = ["zh", "en", "ja"];
  const links = langs.map(function (lang) {
    const current = lang === currentLang ? ' aria-current="true"' : "";
    return '<a href="' + relativeHref(currentLang, lang) + '"' + current + ">" + LANG_LABELS[lang] + "</a>";
  });
  return '<nav class="lang-switch" aria-label="Language">\n        ' +
    links.join('\n        <span class="sep">·</span>\n        ') +
    "\n      </nav>";
}

for (const lang of Object.keys(PAGES)) {
  const dict = i18n[lang];
  const page = PAGES[lang];
  let html = template;

  const tokens = {
    __HTML_LANG__: dict.htmlLang,
    __TITLE__: escapeAttr(dict.title),
    __DESCRIPTION__: escapeAttr(dict.description),
    __OG_DESCRIPTION__: escapeAttr(dict.ogDescription),
    __KEYWORDS__: escapeAttr(dict.keywords),
    __OG_LOCALE__: dict.ogLocale,
    __CANONICAL__: page.canonical,
    __CANONICAL_JSON__: JSON.stringify(page.canonical),
    __JSONLD_DESCRIPTION_JSON__: JSON.stringify(dict.jsonldDescription),
    __TAGLINE__: dict.tagline,
    __INPUT_PLACEHOLDER__: escapeAttr(dict.inputPlaceholder),
    __BTN_PARSE__: dict.btnParse,
    __BTN_EXAMPLE__: dict.btnExample,
    __BTN_CLEAR__: dict.btnClear,
    __HINT_HTML__: dict.hintHtml,
    __EMPTY_TEXT__: dict.emptyText,
    __THEME_TOGGLE_LABEL__: escapeAttr(dict.themeToggleLabel),
    __CHART_TITLE__: dict.chartTitle,
    __TABLE_TITLE__: dict.tableTitle,
    __COPY_JSON_BTN__: dict.copyJsonBtn,
    __FOOTER__: dict.footer,
    __LANG_SWITCH__: buildLangSwitch(lang),
    __STR_STAT_TOTAL__: JSON.stringify(dict.statTotal),
    __STR_STAT_UNIQUE__: JSON.stringify(dict.statUnique),
    __STR_STAT_DUP__: JSON.stringify(dict.statDup),
    __STR_STAT_JSON__: JSON.stringify(dict.statJson),
    __STR_CHART_MORE_TEMPLATE__: JSON.stringify(dict.chartMoreTemplate),
    __STR_COPY__: JSON.stringify(dict.copy),
    __STR_COPIED__: JSON.stringify(dict.copied),
    __STR_COPIED_JSON__: JSON.stringify(dict.copiedJson),
    __STR_VAL_EMPTY__: JSON.stringify(dict.valEmpty),
    __STR_CHAR_SUFFIX__: JSON.stringify(dict.charSuffix)
  };

  for (const token of Object.keys(tokens)) {
    html = replaceAll(html, token, tokens[token]);
  }

  const leftover = html.match(/__[A-Z_]+__/);
  if (leftover) {
    throw new Error("Unreplaced token " + leftover[0] + " in " + lang + " page");
  }

  const outDir = path.join(ROOT, page.dir);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");
  fs.writeFileSync(outFile, html);
  console.log("wrote", path.relative(ROOT, outFile));
}
