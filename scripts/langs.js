"use strict";

// The language roster, shared by the build and the tests so the two cannot
// drift. Everything else — directories, canonicals, hreflang, the sitemap, the
// switcher, the automatic language selection — is derived from this.
//
// Adding a language: add its dictionary to i18n.js and its code to LANGS.
// The code doubles as the directory name, so keep it lowercase; the properly
// cased tag for hreflang and <html lang> lives in the dictionary's htmlLang.

const SITE_BASE = "https://app.lideguang.com/query-params-viewer/";

// Order here is the order shown in the language switcher.
const LANGS = ["en", "zh", "zh-hant", "ja", "ru", "de", "hi"];

// The default language is served from the site root rather than a
// subdirectory. English, deliberately: the root is the URL search engines
// treat as the site's main page, and it is also the one the automatic
// selection leaves alone for an English-language crawler — so the crawler
// indexes it as a page in its own right instead of following a redirect
// somewhere else. See README, 语言自动选择.
const DEFAULT_LANG = "en";

// Where a visitor whose browser languages match nothing is sent. Same as the
// default, so that case is a no-op rather than a redirect.
const FALLBACK_LANG = "en";

// English used to be the one at /en/. That URL is kept alive as a stub
// pointing at the root so existing links do not break.
const LEGACY_ALIASES = { en: "en" };

// Each language names itself, so a reader who cannot read the current page's
// language can still find their own.
const LANG_NAMES = {
  en: "English",
  zh: "简体中文",
  "zh-hant": "繁體中文",
  ja: "日本語",
  ru: "Русский",
  de: "Deutsch",
  hi: "हिन्दी"
};

// The date each language's content (i18n.js dict) last actually changed —
// hand-maintained rather than stamped at build time, so sitemap <lastmod>
// reflects real edits instead of "rebuilt today" for every language on
// every commit, which would teach crawlers to distrust it. Bump a language's
// date only when you change its dict entry in i18n.js.
const UPDATED_AT = {
  en: "2026-07-23",
  zh: "2026-07-23",
  "zh-hant": "2026-07-23",
  ja: "2026-07-23",
  ru: "2026-07-23",
  de: "2026-07-23",
  hi: "2026-07-23"
};

function dirOf(lang) {
  return lang === DEFAULT_LANG ? "" : lang;
}

function canonicalOf(lang) {
  const dir = dirOf(lang);
  return SITE_BASE + (dir ? dir + "/" : "");
}

module.exports = {
  SITE_BASE,
  LANGS,
  DEFAULT_LANG,
  FALLBACK_LANG,
  LEGACY_ALIASES,
  LANG_NAMES,
  UPDATED_AT,
  dirOf,
  canonicalOf
};
