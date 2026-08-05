"use strict";

// Turns the shared primitives in scripts/core.js — the same ones the web page
// runs on — into the two JSON shapes the MCP tools hand back. Nothing here
// touches the network or the filesystem: an assistant calling these tools gets
// the same answer the page would give, computed locally.
//
// Kept separate from index.js so the logic is testable (mcp-server/test.js)
// without standing up a server or speaking JSON-RPC.

const core = require("../scripts/core.js");

// The shape of the input, so a caller can tell a full URL from a hash route
// from a bare "a=1&b=2" fragment without re-parsing it themselves.
function describeInput(raw) {
  const parts = core.splitBaseAndQuery(raw);
  return {
    input: raw,
    base: parts.base,
    queryString: parts.query,
    fragment: parts.fragment,
    // "query" | "hash" | "bare" | "none"
    style: parts.style
  };
}

// Mirrors the page's recursive table (buildRowsHtml in scripts/template.html):
// a value that is itself an encoded URL or query string gets expanded in
// place, up to core.MAX_NEST_DEPTH levels.
function describeParams(entries, depth) {
  return entries.map(function (e) {
    const type = core.detectType(e.value);
    const param = {
      key: e.key,
      value: e.value,
      type: type,
      // 1-based position among the values sharing this key, so duplicates stay
      // distinguishable; both are 1 when the key appears once.
      occurrence: e.occurrence,
      totalOccurrences: e.total
    };

    // Hand back the decoded object too, so a caller does not have to make a
    // second parse pass over a value we already know is JSON.
    if (type === "json") {
      try {
        param.parsed = JSON.parse(e.value);
      } catch (err) { /* detectType already proved this parses; be safe anyway */ }
    }

    const nestedQs = core.detectNested(e.value, depth);
    if (nestedQs) {
      const nestedEntries = core.parseQueryStringEntries(nestedQs);
      if (nestedEntries.length) {
        param.nested = describeParams(nestedEntries, depth + 1);
      }
    }

    return param;
  });
}

// Full breakdown of one URL: the same table, stats and nested expansion the
// page shows for the same input.
function parseUrl(raw) {
  const input = String(raw);
  const described = describeInput(input);
  const entries = core.parseQueryStringEntries(described.queryString);

  const uniqueKeys = [];
  entries.forEach(function (e) {
    if (uniqueKeys.indexOf(e.key) === -1) uniqueKeys.push(e.key);
  });
  const duplicateKeys = uniqueKeys.filter(function (k) {
    return entries.filter(function (e) { return e.key === k; }).length > 1;
  });

  return {
    input: described.input,
    base: described.base,
    queryString: described.queryString,
    fragment: described.fragment,
    style: described.style,
    summary: {
      total: entries.length,
      unique: uniqueKeys.length,
      duplicates: duplicateKeys.length,
      duplicateKeys: duplicateKeys,
      json: entries.filter(function (e) { return core.detectType(e.value) === "json"; }).length
    },
    params: describeParams(entries, 0)
  };
}

// Key-by-key diff of two URLs. Top-level params only — this matches the page's
// compare tab, which does not diff inside nested values either.
function compareUrls(rawA, rawB) {
  const a = describeInput(String(rawA));
  const b = describeInput(String(rawB));
  const rows = core.buildDiffRows(
    core.parseQueryStringEntries(a.queryString),
    core.parseQueryStringEntries(b.queryString)
  );

  const summary = { same: 0, diff: 0, onlyA: 0, onlyB: 0 };
  rows.forEach(function (r) { summary[r.status] += 1; });

  return {
    a: a,
    b: b,
    // status: "same" | "diff" | "onlyA" | "onlyB"
    rows: rows,
    summary: summary
  };
}

module.exports = { parseUrl: parseUrl, compareUrls: compareUrls };
