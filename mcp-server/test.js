#!/usr/bin/env node
"use strict";

// Tests for the MCP server's two tools. Run: npm test
//
// These exercise lib.js directly rather than speaking JSON-RPC: index.js is a
// thin wrapper whose only job is to hand these results to the SDK, so driving
// a transport would test the SDK, not this project. What is worth pinning down
// is that the tools answer exactly what the web page shows for the same input
// — same types, same duplicate handling, same nested expansion — since that
// equivalence is the whole reason scripts/core.js is shared between them.

const fs = require("fs");
const path = require("path");

const { parseUrl, compareUrls } = require("./lib.js");

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

function deepEq(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(name, a === e, "expected " + e + "\n      actual   " + a);
}

// Read the example straight out of the template instead of copying it here, so
// this suite always exercises the very URL the page offers via its "example"
// button — if that changes, these tests follow it rather than going stale.
const templateSrc = fs.readFileSync(path.join(__dirname, "..", "scripts", "template.html"), "utf8");
const exampleMatch = /var EXAMPLE_URL = '([^']*)';/.exec(templateSrc);
if (!exampleMatch) {
  console.error("could not find EXAMPLE_URL in scripts/template.html");
  process.exit(1);
}
const EXAMPLE_URL = exampleMatch[1];

function testExampleUrlBreakdown() {
  const r = parseUrl(EXAMPLE_URL);

  eq("[parse] base is split off", r.base, "https://example.com/search");
  eq("[parse] style is a plain query", r.style, "query");
  eq("[parse] no fragment", r.fragment, "");

  eq("[parse] every param is counted", r.summary.total, 11);
  eq("[parse] unique keys", r.summary.unique, 10);
  eq("[parse] one key is duplicated", r.summary.duplicates, 1);
  deepEq("[parse] the duplicated key is named", r.summary.duplicateKeys, ["tags"]);
  eq("[parse] one json value", r.summary.json, 1);

  const byKey = {};
  r.params.forEach(function (p) { if (!byKey[p.key]) byKey[p.key] = p; });

  eq("[parse] '+' decodes to a space", byKey.q.value, "claude code");
  eq("[parse] a digit value is a number", byKey.page.type, "number");
  eq("[parse] true/false is a boolean", byKey.debug.type, "boolean");
  eq("[parse] a valueless key is empty", byKey.empty.type, "empty");
  eq("[parse] plain text is a string", byKey.category.type, "string");
}

function testDuplicateKeysAreKeptApart() {
  const r = parseUrl(EXAMPLE_URL);
  const tags = r.params.filter(function (p) { return p.key === "tags"; });

  eq("[dup] both occurrences survive", tags.length, 2);
  deepEq("[dup] in document order", tags.map(function (p) { return p.value; }), ["ai", "cli"]);
  deepEq("[dup] numbered 1..n", tags.map(function (p) { return p.occurrence; }), [1, 2]);
  deepEq("[dup] each knows the total", tags.map(function (p) { return p.totalOccurrences; }), [2, 2]);

  const single = r.params.find(function (p) { return p.key === "page"; });
  eq("[dup] a lone key is 1 of 1", single.occurrence + "/" + single.totalOccurrences, "1/1");
}

function testJsonValuesComeBackParsed() {
  const r = parseUrl(EXAMPLE_URL);
  const user = r.params.find(function (p) { return p.key === "user"; });

  eq("[json] typed as json", user.type, "json");
  deepEq("[json] handed back decoded", user.parsed, { id: 123, name: "Ada" });

  const notJson = r.params.find(function (p) { return p.key === "category"; });
  eq("[json] non-json carries no parsed field", "parsed" in notJson, false);
}

function testNestedValuesAreExpanded() {
  const r = parseUrl(EXAMPLE_URL);

  const redirect = r.params.find(function (p) { return p.key === "redirect"; });
  deepEq("[nested] an encoded URL value is unpacked",
    redirect.nested.map(function (p) { return p.key + "=" + p.value; }),
    ["token=abc123", "next=/dashboard"]);

  const filter = r.params.find(function (p) { return p.key === "filter"; });
  deepEq("[nested] a bare query-string value is unpacked",
    filter.nested.map(function (p) { return p.key + "=" + p.value; }),
    ["status=active", "owner=me"]);

  const plain = r.params.find(function (p) { return p.key === "sort"; });
  eq("[nested] an ordinary value is left alone", "nested" in plain, false);
}

function testNestingStopsAtThreeLevels() {
  // A URL wrapped inside a URL inside a URL inside a URL. Note that each level
  // of expansion consumes *two* layers of encoding — detectNested decodes once
  // to sniff the value, then URLSearchParams decodes again when it splits the
  // pairs — so the innermost payload surfaces sooner than the wrapping suggests.
  // That is long-standing page behaviour; what is pinned here is the depth cap.
  const l4 = "x=1&y=2";
  const l3 = "https://d.example.com/?q=" + encodeURIComponent(l4);
  const l2 = "https://c.example.com/?q=" + encodeURIComponent(l3);
  const l1 = "https://b.example.com/?q=" + encodeURIComponent(l2);
  const top = "https://a.example.com/?q=" + encodeURIComponent(l1);

  const r = parseUrl(top);
  const d1 = r.params[0].nested;
  const d2 = d1[0].nested;
  const d3 = d2[0].nested;

  ok("[depth] level 1 expands", Array.isArray(d1));
  ok("[depth] level 2 expands", Array.isArray(d2));
  ok("[depth] level 3 expands", Array.isArray(d3));
  eq("[depth] level 4 does not", "nested" in d3[0], false);
  eq("[depth] the deepest level still yields a real pair", d3[0].key + "=" + d3[0].value, "q=x=1");
}

function testTheThreeInputShapes() {
  const full = parseUrl("https://example.com/search?a=1#frag");
  eq("[shapes] a full URL is style 'query'", full.style, "query");
  eq("[shapes] its fragment is kept", full.fragment, "#frag");

  const hash = parseUrl("#/dashboard?tab=usage&range=30d");
  eq("[shapes] a hash route is style 'hash'", hash.style, "hash");
  eq("[shapes] the route is the base", hash.base, "#/dashboard");
  eq("[shapes] its params still parse", hash.summary.total, 2);

  const bare = parseUrl("a=1&b=2");
  eq("[shapes] a bare query string is style 'bare'", bare.style, "bare");
  eq("[shapes] with no base", bare.base, "");
  eq("[shapes] and both params", bare.summary.total, 2);

  const none = parseUrl("https://example.com/");
  eq("[shapes] a URL with no query is style 'none'", none.style, "none");
  eq("[shapes] and yields no params", none.summary.total, 0);
  deepEq("[shapes] an empty input is handled", parseUrl("").params, []);
}

function testCompareCoversEveryStatus() {
  const r = compareUrls(
    "https://example.com/?a=1&b=2&dup=x&dup=y&z=0",
    "https://example.com/?a=1&b=3&c=9&dup=y&dup=x"
  );

  const status = {};
  r.rows.forEach(function (row) { status[row.key] = row.status; });

  eq("[compare] an identical value is 'same'", status.a, "same");
  eq("[compare] a changed value is 'diff'", status.b, "diff");
  eq("[compare] a key only on the left is 'onlyA'", status.z, "onlyA");
  eq("[compare] a key only on the right is 'onlyB'", status.c, "onlyB");
  eq("[compare] reordered duplicates still count as 'same'", status.dup, "same");

  deepEq("[compare] the tally matches the rows", r.summary, { same: 2, diff: 1, onlyA: 1, onlyB: 1 });
  eq("[compare] every key appears once", r.rows.length, 5);
  deepEq("[compare] left keys come first, then new right keys",
    r.rows.map(function (row) { return row.key; }), ["a", "b", "dup", "z", "c"]);
}

function testCompareReportsBothSides() {
  const r = compareUrls("https://a.example.com/?x=1", "#/route?x=2&y=3");

  eq("[compare] side A is described", r.a.base, "https://a.example.com/");
  eq("[compare] including its shape", r.a.style, "query");
  eq("[compare] side B is described", r.b.base, "#/route");
  eq("[compare] shapes may differ between sides", r.b.style, "hash");

  const x = r.rows.find(function (row) { return row.key === "x"; });
  deepEq("[compare] values are grouped per side", [x.valuesA, x.valuesB], [["1"], ["2"]]);
}

const tests = [
  testExampleUrlBreakdown,
  testDuplicateKeysAreKeptApart,
  testJsonValuesComeBackParsed,
  testNestedValuesAreExpanded,
  testNestingStopsAtThreeLevels,
  testTheThreeInputShapes,
  testCompareCoversEveryStatus,
  testCompareReportsBothSides
];

for (const t of tests) {
  try {
    t();
  } catch (e) {
    failures.push(t.name + " threw\n      " + ((e && e.stack) || e));
  }
}

console.log(`\n  mcp-server: ${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  for (const f of failures) console.log("  ✗ " + f);
  console.log("");
  process.exit(1);
}
