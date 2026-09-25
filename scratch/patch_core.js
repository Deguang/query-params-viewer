const fs = require('fs');
let code = fs.readFileSync('scripts/core.js', 'utf8');

const regex = /function detectType\(value\) \{[\s\S]*?\n\}/;
const newDetectType = `function detectType(value) {
  if (value === "") return "empty";
  if (value === "true" || value === "false") return "boolean";
  if (/^-?\\d+(\\.\\d+)?$/.test(value)) return "number";

  if (/^eyJ[A-Za-z0-9-_]+\\.eyJ[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$/.test(value)) {
    return "jwt";
  }

  if (/^eyJ[A-Za-z0-9+/=_-]+$/.test(value)) {
    try {
      var decoded = typeof atob !== 'undefined' ? atob(value.replace(/-/g, '+').replace(/_/g, '/')) : Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('binary');
      var parsed = JSON.parse(decoded);
      if (parsed !== null && typeof parsed === "object") return "base64-json";
    } catch (e) { /* not base64 json */ }
  }

  try {
    var parsed = JSON.parse(value);
    if (parsed !== null && typeof parsed === "object") return "json";
  } catch (e) { /* not json */ }
  return "string";
}`;

code = code.replace(regex, newDetectType);
fs.writeFileSync('scripts/core.js', code);
