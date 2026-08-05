# query-params-viewer

English | [简体中文](README.zh.md)

Parses and visualizes the query params of a URL. Available in English / 简体中文 / 繁體中文 / 日本語 / Русский / Deutsch / हिन्दी.

- Every language page is a self-contained single HTML file (no external dependencies, pure front-end, aside from Google Analytics)
- Accepts a full URL, a hash route (`#/path?a=1`), or a bare query string (`a=1&b=2`)
- Automatically detects duplicate keys, JSON values, empty values and other types
- If a value is itself a nested URL or an encoded query string (e.g. `redirect=https%3A%2F%2F...%3Ftoken%3Dabc`), it can be expanded to reveal the inner key/value pairs (up to 3 levels deep)
- Edit mode: the table becomes an editable form (add/remove/change key/value), with a live Base URL + full URL preview that's one click to copy
- Compare mode: paste two URLs and get a per-key diff table (same / different / A only / B only)
- Share: both the parse result and the compare result can generate a share link in one click. State is encoded in the **fragment (`#`), not the query string** —
  purely client-side, with no backend or third-party link shortener involved; see "Share link format" below
- Light/dark theme toggle
- The language switcher lives in a dropdown (a native `<details>`, not a JS popover, so it still expands and its links stay crawlable with JS off);
  each language is labeled in its own language inside the menu. Switching is progressive enhancement: with JS off it's a plain link to that language's static page;
  with JS on it swaps the copy in place without a reload, so the URL you've already typed in and its parsed result are preserved
- On a first visit to the root path, the page auto-redirects to the language matching the browser's language; see "Automatic language selection" below
- Each page has an "About + FAQ" section at the bottom that re-translates live on language switch; the same FAQ data also generates
  `FAQPage` structured data for search engines and AI answer engines to cite — see "Optimizing for AI (GEO)" below
- Key interactions (parse, copy, edit, compare, language/theme switch, etc.) are instrumented with GA4 events

## Directory structure

```
index.html         English (default language, served from the root)
zh/index.html       简体中文
zh-hant/index.html 繁體中文
ja/index.html       日本語
ru/index.html       Русский
de/index.html       Deutsch
hi/index.html       हिन्दी
en/index.html       Stub for the old address: canonical + redirect to the root (see "Why the root is English" below)
sitemap.xml         Sitemap (generated)
llms.txt            Site summary for AI answer engines (generated, see "Optimizing for AI (GEO)" below)
robots.txt          Allows all crawlers (including AI crawlers) and declares the sitemap
favicon.svg         Icon shared by every language page
scripts/            Build scripts that generate the pages — don't edit the generated index.html files directly
  langs.js          Language roster: which languages exist, which one lives at the root, the fallback language, each language's self-name in the menu
  template.html     Shared HTML/CSS/JS template; translated copy is inserted via __TOKEN__ placeholders
  i18n.js           Per-language translated copy + TDK (title/description/keywords)
  build.js          Reads langs.js + template.html + i18n.js and generates each language's index.html plus sitemap.xml
  test.js           Regression suite that drives the generated output with jsdom
package.json        Build/test scripts only; jsdom is a devDependency and never ships
```

Each language's `index.html` and `sitemap.xml` are **generated output** (each HTML file has a comment at the top saying so),
but every HTML file is still a directly deployable static single file. To change behavior or copy, edit the source files under `scripts/`, then run:

```
node scripts/build.js
```

**Adding a language**: add a dictionary to `i18n.js` (UI copy, TDK, and the `aboutHeading` / `aboutHtml` /
`features` / `faqHeading` / `faq` prose and FAQ entries), then add the language code to `LANGS` and `LANG_NAMES` in `langs.js`.
The directory, canonical, hreflang, sitemap, language switcher, automatic language selection, and the front-end's path
detection are all derived from these two files — nothing else needs to change (the language code doubles as the
directory name, and whichever one `langs.js`'s `DEFAULT_LANG` names lives at the root). `langs.js` is shared by both
`build.js` and `test.js`, so the build and the tests can never drift onto two different language rosters.
Note that the language code is the **directory name** so it stays lowercase (`zh-hant`), while hreflang / `<html lang>`
use the dictionary's `htmlLang` (`zh-Hant`) — the two are deliberately kept separate.

## Tests

```
npm install    # only installs jsdom, test-only
npm test       # builds first, then runs scripts/test.js
```

The tests drive the **generated HTML in jsdom** rather than doing text matching against the template. That's because the
bugs that actually happened (a share card rendered below a long table and invisible, `textContent` permanently wiping
out an inline `<svg>` icon on copy, a length warning getting cleared before it could be re-translated, a common param
like `?a=1&b=2` being misdetected as a share link) were things **no static check would have caught** — only running the
page for real surfaced them.

Coverage: share-link round-trip (both parse and compare modes), clicks landing on the icon still firing, the icon
surviving a copy-flash, length-warning tiers and re-translation across languages, a query string not being mistaken
for a share link, a malformed share link not aborting initialization, the three-state theme cycle and its storage,
diff-row coloring, language-switch paths not accumulating, the language dropdown's open/close behavior (closes on
selection, closes on outside click / Esc, its label follows the switch), automatic language selection (various
`navigator.languages` match outcomes, Chinese resolved by script — Hant/Hans — rather than by primary language,
English and unsupported languages staying at the root, query/fragment surviving the jump, a remembered choice only
deciding *where* to jump, jumping only when the root is this session's entry point — having seen any page this
session and then returning to the root no longer triggers a jump, even with a saved preference — and sub-path pages
never redirecting), share links carrying no language segment (including after an in-page switch), no unreplaced
token on any language page, every i18n key present on every language, every language having a switcher link and
hreflang entry on every page and being listed in the sitemap, the legacy stub page having a canonical and being
excluded from the sitemap, the About/FAQ copy rendering into the static DOM and re-translating on language switch,
the FAQPage structured data matching the visible Q&A, the WebApplication node declaring `inLanguage`/`featureList`,
and `llms.txt` listing every language's canonical.

jsdom has no `CompressionStream`, so the tests inject Node's native implementation to exercise the compression path.
jsdom also can't actually navigate, so the automatic-selection outcome is written to `<html data-lang-redirect>`
before the redirect fires, and the tests assert on that attribute; `navigator.languages` is stubbed by the tests
(defaulting to the root page's own language, i.e. the root page staying put).

## Usage

Open `index.html` directly in a browser, or deploy to GitHub Pages:

1. Settings → Pages → Source: `main` branch, `/ (root)`
2. `app.lideguang.com` is a domain shared by several projects; it maps `/query-params-viewer/` to this repo's Pages site via a reverse proxy, so the repo deliberately has **no** `CNAME` file
3. Visit `https://app.lideguang.com/query-params-viewer/` (English); the other languages live under their own sub-paths:
   `.../zh/` (简体中文), `.../zh-hant/` (繁體中文), `.../ja/` (日本語), `.../ru/` (Русский),
   `.../de/` (Deutsch), `.../hi/` (हिन्दी); `.../en/` is the old address and redirects back to the root

You can also append params straight to the site URL, e.g.
`https://app.lideguang.com/query-params-viewer/?foo=bar&baz=1`, and the page will parse and display them automatically.

## Automatic language selection

When **the root path is this session's entry point**, the page redirects to the sub-path matching `navigator.languages`.
The detection script sits at the very top of `<head>` (ahead of GA, styles and the body), so there's no flash of
English before the redirect fires.

Matching rule: an exact match first (`de` → `/de/`), then a primary-language match (`de-AT` → `/de/`); Chinese is
special-cased and resolved by **script** rather than primary language — `zh-Hant` / `zh-TW` / `zh-HK` / `zh-MO` go to
`/zh-hant/`, every other `zh-*` goes to `/zh/`. The first entry in `navigator.languages` that matches wins; if none
match, the page stays at the root (the fallback language *is* the root's English page, so this case is "don't
redirect" rather than "redirect somewhere").

Three constraints keep this from fighting the visitor:

1. **Only redirects from the root.** `/zh/`, `/ja/` and the like are already an explicit choice and are never
   rewritten under any circumstance.
2. **Only redirects when the root is this session's entry point.** Every page visit sets `sessionStorage.qpv-visited`;
   once any page has been seen this session, returning to the root afterward — say, by manually deleting the
   `/<lang>/` segment from the address bar, or navigating back to it — counts as a **deliberate choice** and won't
   be redirected away again. The only thing that actually triggers a jump is a fresh visitor **landing on the root
   as their very first page** (Googlebot crawling as `en` falls into this case too, but it matches `en` — the root's
   own language — and is judged "don't redirect").
3. **Which language it jumps to** is decided by a manually chosen language (`localStorage.qpv-lang`, written when the
   language menu is used, including clicking the current language) if one exists, otherwise by the browser's
   language. Note this only decides *where* to jump, **not whether to jump at all** — that's entirely governed by
   rule 2, so someone with a saved preference who deliberately navigates back to the root won't keep getting bounced
   to their language page.

The query string and the fragment (`#`, where share payloads live) are carried over to the destination page
unchanged, via `location.replace`, so no extra history entry is left behind to trap the back button. With JS off,
none of this runs and the root path simply stays the English page.

### Why the root is English

This isn't an aesthetic choice — it follows from how this auto-redirect interacts with search engines. When Google
renders a page it executes this script, and `location.replace` is treated as a redirect signal. If the root path
were Chinese, Googlebot crawling as `en` would get redirected away on arrival, and **the site's single strongest URL
could well get consolidated away and drop out of the index as its own page**.

Putting English at the root solves exactly that: Googlebot matches `en` → the outcome is "don't redirect" → the root
stays indexed as the primary page, and the redirect only ever fires for genuinely non-English visitors. The fallback
language is likewise set to `en` (`langs.js`'s `FALLBACK_LANG`), so an unsupported language doesn't send a crawler or
visitor somewhere else either.

English used to live at `/en/`. After the change, that directory is kept as a stub page: its `canonical` points at
the root (so search engines consolidate on it), plus a `meta refresh` and a plain link (so visitors and no-JS clients
still get there). GitHub Pages can't issue a real 301, so this is the substitute. The stub is **excluded from the
sitemap and from the hreflang set** — it's an old address, not a language variant. `langs.js`'s `LEGACY_ALIASES`
tracks this; the day English no longer lives at the root, the stub stops being generated automatically.

## Share link format

The link generated by the page's "Share" button always encodes its state in the **fragment (`#`)**:

```
https://app.lideguang.com/query-params-viewer/#s=<base64url(gzip(json))>   compressed
https://app.lideguang.com/query-params-viewer/#p=<encodeURIComponent(json)> plain-text fallback
```

**Why `#` instead of the query string** — both reasons matter, neither is optional on its own:

1. **To avoid colliding with the "append params to the site URL" convention above.** The query string is already
   claimed by that convention — if the share link used `?z=` / `?u=` / `?a=`, then analyzing a URL that happens to
   contain those keys would get misdetected as a share link, and `a`, `b`, `u`, `z` are all extremely common short
   param names (`?a=1&b=2` is literally the example in this page's own hint text). The fragment and the query string
   are two independent namespaces that never interfere with each other. Detection uses the strict prefix `^#[sp]=`,
   so pasting in something like `#/path?a=1` — a hash route — to analyze doesn't get misdetected either.
2. **The fragment is never sent to the server**, so a long payload never runs into a reverse proxy's request-line
   length limit (nginx defaults to 8KB and returns a flat 414 past that). The only remaining ceiling is whatever URL
   length the browser itself can handle.

**Compression strategy**: browsers that support `CompressionStream` gzip-compress the payload natively and
base64url-encode it. But compression isn't always a win — gzip barely touches high-entropy content like tokens or
JWTs, and base64 adds another +33% on top, which can make the link *longer*. So both forms are always built and
**whichever is shorter wins**, guaranteeing the share link is never worse than the plain-text form.

Link length gets a three-tier warning (green ≤2000 / yellow / red >32000). Note this is **not a hard cap** —
compression can only shrink things, not put a ceiling on them; an actual cap would require a backend link-shortening
service. A link that can't be decoded (corrupted, truncated, or the browser doesn't support decompression) is called
out with the specific reason rather than silently falling through to being parsed as an ordinary param.

On privacy: the payload never shows up in server access logs; but GA4's `page_location` captures the full `href`,
**fragment included**, so it does end up in analytics events.

## SEO

Each language is an independently crawlable static page, declared as a translation of every other one via
`hreflang` (with `x-default` pointing at the English root), and all of them are listed in `sitemap.xml`. See "Why
the root is English" above for why the root is English and how that interacts with the auto-redirect. Share links
always point at the root (no language segment), so a social-platform unfurl picks up the English page's TDK.
`robots.txt` / `sitemap.xml` live at the repo root, but since the site is actually served from the
`/query-params-viewer/` sub-path, search engines by default only honor the `robots.txt` at the domain root — for
these to take effect, whoever manages the `app.lideguang.com` root needs to fold them in or reference this sitemap.

## Optimizing for AI (GEO)

GEO (Generative Engine Optimization) targets being read and cited by **answer engines** — ChatGPT, Perplexity,
Google AI Overviews, Claude — a different discipline from traditional SEO, though the two overlap a lot. An answer
engine will only cite a page if it contains **clean, directly quotable prose** answering some specific question —
plain UI controls carry no value for it. This project does three things toward that:

1. **Quotable prose + FAQ.** Every language page has an "About" paragraph and an FAQ section at the bottom (written
   independently per language, with code samples kept identical). This content ships in the static HTML, so it's
   readable with JS off and by crawlers and AI fetchers alike; switching language in place re-renders it from the
   same `i18n.js` data via `renderFaq()`.
2. **Structured data.** `<head>` carries two JSON-LD blocks: a `WebApplication` node (with `featureList`,
   `inLanguage`, `isAccessibleForFree`) and a `FAQPage` node. The `FAQPage` block is generated by `build.js` from the
   exact same `faq` data rendered on the page, so the structured data **can never drift from the visible Q&A**
   (which Google requires to match).
3. **`llms.txt` + an AI-crawler allowlist.** `llms.txt` (see [llmstxt.org](https://llmstxt.org)) is a site summary
   for LLMs, generated by `build.js` from the language roster, listing each language's canonical URL and the
   highlights. `robots.txt` explicitly allows answer-engine crawlers such as GPTBot, ClaudeBot, PerplexityBot and
   Google-Extended.

**Sub-path caveat**: both `llms.txt` and `robots.txt` live at the repo root, and by convention they're fetched from
the **domain root** (`https://app.lideguang.com/llms.txt`, etc.), while this site is served from the
`/query-params-viewer/` sub-path. For these to actually take effect, whoever manages the `app.lideguang.com` root
needs to publish them there (or merge the rules in). Keeping them at the repo root is the part that can be done
locally — the rest depends on confirming the mapping after deployment.
