const fs = require('fs');
let code = fs.readFileSync('scripts/template.html', 'utf8');

const regex = /function renderValueCell\(value\) \{[\s\S]*?return escapeHtml\(value\);\n  \}/;
const newRenderValueCell = `function renderValueCell(value) {
    var type = detectType(value);
    if (type === "empty") {
      return '<span class="val-empty">' + escapeHtml(t("valEmpty")) + '</span>';
    }
    if (type === "json") {
      try {
        var pretty = JSON.stringify(JSON.parse(value), null, 2);
        return '<pre>' + escapeHtml(pretty) + '</pre>';
      } catch (e) { /* fall through */ }
    }
    if (type === "base64-json") {
      try {
        var decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
        var pretty = JSON.stringify(JSON.parse(decoded), null, 2);
        return '<div style="font-size:11px;color:var(--text-light);word-break:break-all;margin-bottom:4px;">' + escapeHtml(value) + '</div><pre>/* Base64 Decoded */\\n' + escapeHtml(pretty) + '</pre>';
      } catch (e) { /* fall through */ }
    }
    if (type === "jwt") {
      try {
        var parts = value.split('.');
        var header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
        var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return '<div style="font-size:11px;color:var(--text-light);word-break:break-all;margin-bottom:4px;">' + escapeHtml(value) + '</div><pre>/* JWT Header */\\n' + escapeHtml(JSON.stringify(header, null, 2)) + '\\n\\n/* JWT Payload */\\n' + escapeHtml(JSON.stringify(payload, null, 2)) + '</pre>';
      } catch (e) { /* fall through */ }
    }
    return escapeHtml(value);
  }`;

code = code.replace(regex, newRenderValueCell);
fs.writeFileSync('scripts/template.html', code);
