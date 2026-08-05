#!/usr/bin/env node
"use strict";

// Generates one index.html per language (the default one at the root, the
// rest under their own directory) plus sitemap.xml, from
// scripts/template.html + scripts/i18n.js. Run: node scripts/build.js
// The output files are plain static HTML — no build step is needed to
// serve them, this script only exists to keep the language variants in
// sync from one shared template.
//
// The language roster lives in scripts/langs.js; see the note there for what
// adding a language involves.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const i18n = require("./i18n.js");
const {
  SITE_BASE,
  LANGS,
  DEFAULT_LANG,
  FALLBACK_LANG,
  LEGACY_ALIASES,
  LANG_NAMES,
  UPDATED_AT,
  dirOf,
  canonicalOf
} = require("./langs.js");
const template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");

// scripts/core.js is the single source of truth for the URL-parsing and
// diffing primitives: the pages get them inlined here, the MCP server in
// mcp-server/ requires the same file as a module. Only the region between the
// markers is inlined, so the module.exports tail never reaches the browser.
const CORE_START = "// >>> shared with the page";
const CORE_END = "// <<< shared with the page";

function readCoreJs() {
  const src = fs.readFileSync(path.join(__dirname, "core.js"), "utf8");
  const start = src.indexOf(CORE_START);
  const end = src.indexOf(CORE_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("scripts/core.js is missing its shared-region markers");
  }
  // Skip to the end of the marker's own line — it carries a trailing comment.
  const bodyStart = src.indexOf("\n", start);
  const body = src.slice(bodyStart + 1, end).trim();
  // Re-indent to sit inside template.html's IIFE, which is two spaces deep.
  return body
    .split("\n")
    .map(function (line) { return line ? "  " + line : line; })
    .join("\n");
}

// The command the tab-row panel offers. This is the server itself rather than
// one vendor's install helper: MCP is a protocol and every client ultimately
// asks for a command to run, so `claude mcp add ...` and the rest belong in
// mcp-server/README.md, not on the page. Defined once and fanned out into the
// visible text, the JS constant the copy button reads, and llms.txt, so the
// three can never disagree about what to run.
const MCP_CMD = "npx -y github:Deguang/query-params-viewer";
const MCP_DOCS_URL = "https://github.com/Deguang/query-params-viewer/tree/main/mcp-server";

// Renders the command with its leading program name picked out, the way a
// terminal would -- purely cosmetic, so it is built from MCP_CMD rather than
// hand-written alongside it.
function buildMcpCmdHtml() {
  const space = MCP_CMD.indexOf(" ");
  return '<span class="cmd">' + escapeAttr(MCP_CMD.slice(0, space)) + "</span>" +
    escapeAttr(MCP_CMD.slice(space));
}

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
  const toDir = dirOf(toLang);
  if (fromLang === DEFAULT_LANG) return toDir + "/";
  return "../" + (toDir ? toDir + "/" : "");
}

// A <details> disclosure, not a <select> or a scripted popover: it opens and
// closes with no JS at all, so the language links stay usable and crawlable on
// a page whose scripts never ran.
function buildLangSwitch(currentLang) {
  const label = escapeAttr(i18n[currentLang].langMenuLabel);
  const links = LANGS.map(function (lang) {
    const current = lang === currentLang ? ' aria-current="true"' : "";
    return '<a href="' + relativeHref(currentLang, lang) + '" data-lang="' + lang + '"' + current + ">" + LANG_NAMES[lang] + "</a>";
  });
  return '<details class="lang-menu" id="langMenu">\n' +
    '        <summary id="langMenuSummary" title="' + label + '" aria-label="' + label + '"><svg class="icon" aria-hidden="true"><use href="#i-globe"/></svg><span id="langCurrentLabel">' + LANG_NAMES[currentLang] + '</span><svg class="icon caret" aria-hidden="true"><use href="#i-chevron"/></svg></summary>\n' +
    '        <nav class="lang-switch" aria-label="Language">\n          ' +
    links.join("\n          ") +
    "\n        </nav>\n      </details>";
}

// Every page declares the full set of translations, so the block is identical
// across pages (Google wants each variant to list itself too).
function buildHreflangLinks() {
  const links = LANGS.map(function (lang) {
    return '<link rel="alternate" hreflang="' + i18n[lang].htmlLang + '" href="' + canonicalOf(lang) + '">';
  });
  links.push('<link rel="alternate" hreflang="x-default" href="' + canonicalOf(DEFAULT_LANG) + '">');
  return links.join("\n");
}

// The FAQ, rendered as a list of native <details> disclosures. The same markup
// is produced client-side by renderFaq() in the template, so switching language
// in place reproduces it exactly. escapeAttr covers the same characters the
// template's escapeHtml does, so the question text matches on both paths.
function buildFaqHtml(dict) {
  return dict.faq.map(function (item) {
    return '<details class="faq-item"><summary>' + escapeAttr(item.q) +
      '</summary><div class="faq-a">' + item.a + '</div></details>';
  }).join("\n        ");
}

// FAQPage structured data, built from the very same faq entries that render on
// the page, so the markup never drifts from what a reader sees. The answer
// keeps its inline HTML — schema.org Answer.text permits it.
function buildFaqJsonLd(dict) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dict.faq.map(function (item) {
      return {
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      };
    })
  }, null, 2);
}

// An llms.txt (see llmstxt.org): a concise, link-first map of the site for AI
// answer engines, derived from the same roster so it never goes stale.
function buildLlmsTxt() {
  const lines = [
    "# Query Params Viewer",
    "",
    "> " + i18n[DEFAULT_LANG].jsonldDescription +
      " Everything runs client-side in the browser: nothing is uploaded, and share links encode their state in the URL fragment (#), which is never sent to a server.",
    "",
    "## Pages"
  ];
  for (const lang of LANGS) {
    lines.push("- [" + LANG_NAMES[lang] + "](" + canonicalOf(lang) + "): " + i18n[lang].title);
  }
  lines.push(
    "",
    "## Notes",
    "- Each language is a self-contained static HTML page with no backend and no runtime dependencies.",
    "- Accepts full URLs, hash routes (#/path?a=1) and bare query strings (a=1&b=2).",
    "- Detects JSON, number, boolean, empty and duplicate values, and expands parameters that are themselves an encoded URL up to three levels deep.",
    "- Also compares the query params of two URLs by key, and can edit and re-serialise them.",
    "",
    "## For AI assistants",
    "- The same parser ships as an MCP server, so an assistant can call it directly instead of reading this page: " + MCP_DOCS_URL,
    "- Any MCP client can run it; the server command is: " + MCP_CMD,
    "- Tools: `parse_url` (break a URL into typed params, flagging duplicates and expanding nested URLs) and `compare_urls` (diff two URLs key by key as same/diff/onlyA/onlyB).",
    "- It runs locally over stdio on the user's own machine and makes no network calls.",
    ""
  );
  return lines.join("\n");
}

function buildSitemap() {
  const alternates = LANGS.map(function (lang) {
    return '    <xhtml:link rel="alternate" hreflang="' + i18n[lang].htmlLang + '" href="' + canonicalOf(lang) + '"/>';
  }).concat('    <xhtml:link rel="alternate" hreflang="x-default" href="' + canonicalOf(DEFAULT_LANG) + '"/>').join("\n");

  const entries = LANGS.map(function (lang) {
    return [
      "  <url>",
      "    <loc>" + canonicalOf(lang) + "</loc>",
      "    <lastmod>" + UPDATED_AT[lang] + "</lastmod>",
      "    <changefreq>monthly</changefreq>",
      "    <priority>" + (lang === DEFAULT_LANG ? "1.0" : "0.8") + "</priority>",
      alternates,
      "  </url>"
    ].join("\n");
  }).join("\n");

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries + "\n</urlset>\n";
}

const CANONICALS = {};
// Directory each language is served from, relative to the site base — the
// client-side switcher builds its hrefs from this.
const LANG_DIRS = {};
for (const lang of LANGS) {
  CANONICALS[lang] = canonicalOf(lang);
  LANG_DIRS[lang] = dirOf(lang) ? dirOf(lang) + "/" : "";
}

const HREFLANG_LINKS = buildHreflangLinks();
const CORE_JS = readCoreJs();

for (const lang of LANGS) {
  const dict = i18n[lang];
  let html = template;

  const tokens = {
    __CORE_JS__: CORE_JS,
    __HTML_LANG__: dict.htmlLang,
    __TITLE__: escapeAttr(dict.title),
    __DESCRIPTION__: escapeAttr(dict.description),
    __OG_DESCRIPTION__: escapeAttr(dict.ogDescription),
    __KEYWORDS__: escapeAttr(dict.keywords),
    __OG_LOCALE__: dict.ogLocale,
    __HREFLANG_LINKS__: HREFLANG_LINKS,
    __CANONICAL__: canonicalOf(lang),
    __CANONICAL_JSON__: JSON.stringify(canonicalOf(lang)),
    __HTML_LANG_JSON__: JSON.stringify(dict.htmlLang),
    __FEATURES_JSON__: JSON.stringify(dict.features),
    __FAQ_JSONLD__: buildFaqJsonLd(dict),
    __ABOUT_HEADING__: escapeAttr(dict.aboutHeading),
    __ABOUT_HTML__: dict.aboutHtml,
    __FAQ_HEADING__: escapeAttr(dict.faqHeading),
    __FAQ_HTML__: buildFaqHtml(dict),
    __JSONLD_DESCRIPTION_JSON__: JSON.stringify(dict.jsonldDescription),
    __TAGLINE__: dict.tagline,
    __INPUT_PLACEHOLDER__: escapeAttr(dict.inputPlaceholder),
    __BTN_PARSE__: dict.btnParse,
    __BTN_EXAMPLE__: dict.btnExample,
    __BTN_CLEAR__: dict.btnClear,
    __HINT_HTML__: dict.hintHtml,
    __EMPTY_TEXT__: dict.emptyText,
    __THEME_TOGGLE_LABEL__: escapeAttr(dict.themeToggleLabel),
    __TABLE_TITLE__: dict.tableTitle,
    __COPY_URL_BTN__: dict.copyUrlBtn,
    __COPY_JSON_BTN__: dict.copyJsonBtn,
    __COPY__: dict.copy,
    __EDIT_PARAMS__: dict.editParams,
    __FULL_URL_HEADING__: dict.fullUrlHeading,
    __BASE_URL_LABEL__: escapeAttr(dict.baseUrlLabel),
    __FULL_URL_PREVIEW_LABEL__: escapeAttr(dict.fullUrlPreviewLabel),
    __BASE_URL_PLACEHOLDER__: escapeAttr(dict.baseUrlPlaceholder),
    __MCP_CMD_HTML__: buildMcpCmdHtml(),
    __MCP_CMD_JSON__: JSON.stringify(MCP_CMD),
    __MCP_DOCS_URL__: MCP_DOCS_URL,
    __MCP_MENU__: escapeAttr(dict.mcpMenu),
    __MCP_NOTE__: escapeAttr(dict.mcpNote),
    __MCP_COPY_LABEL__: escapeAttr(dict.mcpCopyLabel),
    __TAB_PARSE__: dict.tabParse,
    __TAB_COMPARE__: dict.tabCompare,
    __COMPARE_HEADING__: dict.compareHeading,
    __COMPARE_BTN__: dict.compareBtn,
    __SHARE_BTN__: dict.shareBtn,
    __FOOTER__: dict.footer,
    __LANG_SWITCH__: buildLangSwitch(lang),
    __LANG__: JSON.stringify(lang),
    __DEFAULT_LANG__: JSON.stringify(DEFAULT_LANG),
    __LANG_DIRS_JSON__: JSON.stringify(LANG_DIRS),
    __LANG_NAMES_JSON__: JSON.stringify(LANG_NAMES),
    __LANG_FALLBACK__: JSON.stringify(FALLBACK_LANG),
    __CANONICALS_JSON__: JSON.stringify(CANONICALS),
    __I18N_ALL_JSON__: JSON.stringify(i18n)
  };

  for (const token of Object.keys(tokens)) {
    html = replaceAll(html, token, tokens[token]);
  }

  const leftover = html.match(/__[A-Z_]+__/);
  if (leftover) {
    throw new Error("Unreplaced token " + leftover[0] + " in " + lang + " page");
  }

  const outDir = path.join(ROOT, dirOf(lang));
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");
  fs.writeFileSync(outFile, html);
  console.log("wrote", path.relative(ROOT, outFile));
}

// A language that used to live in a subdirectory and now sits at the root
// keeps a stub at the old URL: GitHub Pages cannot issue a 301, so the stub
// carries a canonical (what search engines consolidate on), a meta refresh
// and a plain link (what a visitor and a JS-less client follow). It is left
// out of the sitemap and out of the hreflang set on purpose — it is an old
// address, not a version of the page.
for (const [lang, dir] of Object.entries(LEGACY_ALIASES)) {
  if (dirOf(lang) === dir) continue; // still lives there; nothing to alias
  const target = canonicalOf(lang);
  const stub = [
    "<!-- AUTO-GENERATED by scripts/build.js — " + dir + "/ is the old home of the " + lang + " page, kept so existing links resolve. -->",
    '<!doctype html>',
    '<html lang="' + i18n[lang].htmlLang + '">',
    "<head>",
    '<meta charset="UTF-8">',
    '<link rel="canonical" href="' + target + '">',
    '<meta http-equiv="refresh" content="0; url=' + target + '">',
    "<title>" + escapeAttr(i18n[lang].title) + "</title>",
    "</head>",
    "<body>",
    '<p><a href="' + target + '">' + escapeAttr(i18n[lang].title) + "</a></p>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
  const aliasDir = path.join(ROOT, dir);
  fs.mkdirSync(aliasDir, { recursive: true });
  const aliasFile = path.join(aliasDir, "index.html");
  fs.writeFileSync(aliasFile, stub);
  console.log("wrote", path.relative(ROOT, aliasFile), "(alias -> " + target + ")");
}

const sitemapFile = path.join(ROOT, "sitemap.xml");
fs.writeFileSync(sitemapFile, buildSitemap());
console.log("wrote", path.relative(ROOT, sitemapFile));

const llmsFile = path.join(ROOT, "llms.txt");
fs.writeFileSync(llmsFile, buildLlmsTxt());
console.log("wrote", path.relative(ROOT, llmsFile));
