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
  dirOf,
  canonicalOf
};
