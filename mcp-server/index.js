#!/usr/bin/env node
"use strict";

// An MCP server exposing the query-params-viewer parser to AI assistants, so
// one can break down or diff a URL's query params without a human pasting it
// into the web page.
//
// It speaks stdio: the MCP client spawns this file as a child process and
// talks JSON-RPC over stdin/stdout. That also means stdout belongs to the
// protocol — never console.log here, use console.error if you need to trace.
//
// The parsing itself is the very same code the pages run (scripts/core.js via
// lib.js), and it stays local: nothing is uploaded, no network calls are made.
// See mcp-server/README.md for how to register it with a client.

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const { parseUrl, compareUrls } = require("./lib.js");
const pkg = require("../package.json");

const server = new McpServer({ name: "query-params-viewer", version: pkg.version });

// Results go back twice over: as text, which every client can read, and as
// structuredContent for clients that prefer typed output.
function jsonResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload
  };
}

server.registerTool(
  "parse_url",
  {
    title: "Parse URL query params",
    description:
      "Break a URL's query string into its key/value params. Accepts a full URL, " +
      "a hash route (#/path?a=1) or a bare query string (a=1&b=2). Returns every " +
      "param with its detected type (string, number, boolean, empty, json), flags " +
      "duplicate keys, and expands values that are themselves an encoded URL or " +
      "query string up to three levels deep. Runs locally; nothing is uploaded.",
    inputSchema: {
      url: z
        .string()
        .describe("The URL, hash route or bare query string to parse.")
    }
  },
  async function (args) {
    return jsonResult(parseUrl(args.url));
  }
);

server.registerTool(
  "compare_urls",
  {
    title: "Compare two URLs' query params",
    description:
      "Diff the query params of two URLs key by key. Each key comes back marked " +
      "same, diff, onlyA or onlyB, with the values held under it on each side, " +
      "plus a count of each status. Useful for working out why two otherwise " +
      "identical-looking links behave differently. Runs locally; nothing is uploaded.",
    inputSchema: {
      urlA: z.string().describe("The first URL, hash route or bare query string."),
      urlB: z.string().describe("The second URL, to compare against the first.")
    }
  },
  async function (args) {
    return jsonResult(compareUrls(args.urlA, args.urlB));
  }
);

async function main() {
  await server.connect(new StdioServerTransport());
}

main().catch(function (err) {
  console.error("query-params-viewer MCP server failed to start:", err);
  process.exit(1);
});
