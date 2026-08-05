# Query Params Viewer — MCP server

Lets an AI assistant call the [Query Params Viewer](https://app.lideguang.com/query-params-viewer/)
parser directly, instead of a human pasting a URL into the web page.

It speaks [MCP](https://modelcontextprotocol.io) over stdio: your assistant spawns it as a local
child process. There is no hosted service to sign up for and no API key — and, as on the web page,
the URLs you pass it never leave your machine.

## Tools

### `parse_url`

Breaks a URL's query string into its key/value params. Accepts a full URL, a hash route
(`#/path?a=1`) or a bare query string (`a=1&b=2`).

```jsonc
{ "url": "https://example.com/search?q=shoes&page=2&tags=a&tags=b" }
```

Returns the input split into `base` / `queryString` / `fragment` / `style`, a `summary`
(`total`, `unique`, `duplicates`, `duplicateKeys`, `json`), and a `params` array where each entry
carries:

| field | meaning |
| --- | --- |
| `key`, `value` | the URL-decoded pair |
| `type` | `string`, `number`, `boolean`, `empty` or `json` |
| `occurrence`, `totalOccurrences` | which repeat of a duplicated key this is, e.g. 2 of 2 |
| `parsed` | the decoded object, for `json` values only |
| `nested` | the same shape again, when a value is itself an encoded URL or query string (up to three levels deep) |

### `compare_urls`

Diffs two URLs' query params key by key.

```jsonc
{ "urlA": "https://example.com/?a=1&z=9", "urlB": "https://example.com/?a=2&c=3" }
```

Returns both sides described as above, a `rows` array of `{ key, valuesA, valuesB, status }` where
`status` is `same`, `diff`, `onlyA` or `onlyB`, and a `summary` counting each status. Duplicate
values are compared as a set, so reordering them still counts as `same`.

Both tools return their result as pretty-printed JSON text *and* as `structuredContent`, so clients
can use whichever they prefer.

## Install

Nothing to clone or build — `npx` fetches and runs it. The server command is:

```bash
npx -y github:Deguang/query-params-viewer
```

MCP is a protocol rather than one vendor's feature, so any MCP-capable client
can run it. Most take a JSON block like this — Claude Desktop, Cursor, Cline,
Windsurf, Zed and VS Code all use the same `command` / `args` shape, they differ
only in which file it goes in and whether the top-level key is `mcpServers` or
`servers`:

```json
{
  "mcpServers": {
    "query-params": {
      "command": "npx",
      "args": ["-y", "github:Deguang/query-params-viewer"]
    }
  }
}
```

Some clients offer a shortcut instead of hand-editing the file. Claude Code, for
instance:

```bash
claude mcp add query-params -- npx -y github:Deguang/query-params-viewer
```

**From a local checkout**, which is what you want when changing the code — point
the client at the file rather than at `npx`:

```bash
git clone https://github.com/Deguang/query-params-viewer
cd query-params-viewer && npm install
# then use: "command": "node", "args": ["<repo>/mcp-server/index.js"]
```

Requires Node 18 or newer.

## Development

```bash
npm test   # builds the pages, then runs both the page suite and mcp-server/test.js
npm run mcp  # start the server on stdio (it will sit waiting for JSON-RPC on stdin)
```

To drive it by hand:

```bash
npx @modelcontextprotocol/inspector node mcp-server/index.js
```

### How it relates to the web page

The parsing itself is not reimplemented here. [`scripts/core.js`](../scripts/core.js) holds the
primitives — splitting a URL, detecting value types, sniffing nested URLs, diffing two sets of
params — and has two consumers:

- `scripts/build.js` inlines it into the static pages, which is why they still ship with zero
  runtime dependencies;
- [`lib.js`](lib.js) `require`s it and shapes the results into the JSON the tools return.

So a tool call and the web page always answer the same way for the same input. Behaviour changes
belong in `core.js`; anything about *presentation* stays in `scripts/template.html`.

`index.js` is deliberately thin — it registers the two tools and connects the transport. Note that
stdout carries the JSON-RPC protocol, so nothing here may `console.log`; use `console.error`.
