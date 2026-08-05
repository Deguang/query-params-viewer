"use strict";

// The pure URL-parsing and diffing primitives, shared by two consumers that
// cannot import from each other:
//
//   1. the static pages — scripts/build.js inlines the region between the
//      markers below straight into the <script> IIFE of scripts/template.html,
//      so the shipped HTML stays dependency-free and needs no bundler;
//   2. the MCP server — mcp-server/lib.js `require`s this file as a normal
//      CommonJS module.
//
// Everything here must therefore be plain ES5-era JavaScript with no DOM,
// no i18n and no Node API access. Anything that touches the page (rendering,
// escaping, colour slots) belongs in template.html instead.
//
// The markers are load-bearing: build.js extracts exactly what sits between
// them and fails the build if either goes missing.

// >>> shared with the page — inlined by scripts/build.js
var MAX_NEST_DEPTH = 3;

// Splits a full URL / hash route / bare query string into its base and
// query parts, mirroring the three input shapes this tool accepts, so the
// parts can be re-joined later (editor mode) without losing the original
// shape.
function splitBaseAndQuery(raw) {
  var s = raw.trim();
  if (!s) return { base: "", query: "", fragment: "", style: "none" };

  var hashIdx = s.indexOf("#");
  if (hashIdx !== -1) {
    var hashPart = s.slice(hashIdx + 1);
    var hQ = hashPart.indexOf("?");
    if (hQ !== -1) {
      return {
        base: s.slice(0, hashIdx + 1) + hashPart.slice(0, hQ),
        query: hashPart.slice(hQ + 1),
        fragment: "",
        style: "hash"
      };
    }
  }

  var qIdx = s.indexOf("?");
  if (qIdx !== -1) {
    var afterQ = s.slice(qIdx + 1);
    var hIdx2 = afterQ.indexOf("#");
    return {
      base: s.slice(0, qIdx),
      query: hIdx2 !== -1 ? afterQ.slice(0, hIdx2) : afterQ,
      fragment: hIdx2 !== -1 ? afterQ.slice(hIdx2) : "",
      style: "query"
    };
  }

  if (s.indexOf("=") !== -1) {
    return { base: "", query: s, fragment: "", style: "bare" };
  }

  return { base: s, query: "", fragment: "", style: "none" };
}

function extractQueryString(raw) {
  return splitBaseAndQuery(raw).query;
}

function annotateOccurrences(entries) {
  var counts = Object.create(null);
  entries.forEach(function (e) { counts[e.key] = (counts[e.key] || 0) + 1; });
  var running = Object.create(null);
  entries.forEach(function (e) {
    running[e.key] = (running[e.key] || 0) + 1;
    e.occurrence = running[e.key];
    e.total = counts[e.key];
  });
  return entries;
}

function parseQueryStringEntries(qs) {
  if (!qs) return [];
  var params = new URLSearchParams(qs);
  var entries = [];
  params.forEach(function (value, key) {
    entries.push({ key: key, value: value });
  });
  return annotateOccurrences(entries);
}

function parseEntries(raw) {
  return parseQueryStringEntries(extractQueryString(raw));
}

function detectType(value) {
  if (value === "") return "empty";
  if (value === "true" || value === "false") return "boolean";
  if (/^-?\d+(\.\d+)?$/.test(value)) return "number";
  try {
    var parsed = JSON.parse(value);
    if (parsed !== null && typeof parsed === "object") return "json";
  } catch (e) { /* not json */ }
  return "string";
}

function isQueryStringLike(qs) {
  if (!qs) return false;
  var pairs = qs.split("&");
  return pairs.length > 0 && pairs.every(function (p) {
    var eq = p.indexOf("=");
    if (eq <= 0) return false;
    return /^[A-Za-z0-9_.[\]-]+$/.test(p.slice(0, eq));
  });
}

// Detects a value that is itself a URL (with its own "?a=b&c=d") or a bare
// "a=1&b=2" query string, so it can be parsed and shown as a nested table.
function detectNested(value, depth) {
  if (depth >= MAX_NEST_DEPTH || !value) return null;

  var candidate = value;
  try {
    var decodedOnce = decodeURIComponent(value);
    if (decodedOnce !== value) candidate = decodedOnce;
  } catch (e) { /* leave as-is on invalid escape sequences */ }

  var qIdx = candidate.indexOf("?");
  if (qIdx !== -1 && /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    var qs = candidate.slice(qIdx + 1).split("#")[0];
    if (isQueryStringLike(qs)) return qs;
  }

  if (candidate.indexOf("&") !== -1 && isQueryStringLike(candidate)) {
    return candidate;
  }

  return null;
}

function groupByKey(entries) {
  var map = Object.create(null);
  entries.forEach(function (e) {
    if (!map[e.key]) map[e.key] = [];
    map[e.key].push(e.value);
  });
  return map;
}

function buildDiffRows(entriesA, entriesB) {
  var mapA = groupByKey(entriesA);
  var mapB = groupByKey(entriesB);
  var keys = [];
  entriesA.concat(entriesB).forEach(function (e) {
    if (keys.indexOf(e.key) === -1) keys.push(e.key);
  });

  return keys.map(function (key) {
    var valuesA = mapA[key] || [];
    var valuesB = mapB[key] || [];
    var status;
    if (valuesA.length && !valuesB.length) status = "onlyA";
    else if (valuesB.length && !valuesA.length) status = "onlyB";
    else if (JSON.stringify(valuesA.slice().sort()) === JSON.stringify(valuesB.slice().sort())) status = "same";
    else status = "diff";
    return { key: key, valuesA: valuesA, valuesB: valuesB, status: status };
  });
}
// <<< shared with the page

module.exports = {
  MAX_NEST_DEPTH: MAX_NEST_DEPTH,
  splitBaseAndQuery: splitBaseAndQuery,
  extractQueryString: extractQueryString,
  parseQueryStringEntries: parseQueryStringEntries,
  parseEntries: parseEntries,
  detectType: detectType,
  detectNested: detectNested,
  groupByKey: groupByKey,
  buildDiffRows: buildDiffRows
};
