const fs = require('fs');
let html = fs.readFileSync('scripts/template.html', 'utf8');

// 1. Remove the old sort button
html = html.replace(/<button class="btn btn-ghost" id="sortBtn"[\s\S]*?__SORT_BTN__<\/span><\/button>\s*/, '');

// 2. Replace <th>Key</th> with clickable header
// Make sure to only replace the first one (in paramsTable)
html = html.replace('<th>Key</th>', '<th id="sortKeyBtn" class="sortable-col" title="__SORT_BTN__">Key <svg class="icon" aria-hidden="true" style="width:12px;height:12px;vertical-align:middle;margin-left:4px;opacity:0.6;"><path fill="currentColor" d="M3 13h6v-2H3v2zm0-7v2h10V6H3zm0 4h8v-2H3v2z"/></svg></th>');

// 3. Add CSS for sortable-col
const css = `
  .sortable-col {
    cursor: pointer;
    user-select: none;
  }
  .sortable-col:hover {
    color: var(--text);
  }
  .sortable-col:hover svg {
    opacity: 1 !important;
  }
`;
html = html.replace('</style>', css + '</style>');

// 4. Update the JavaScript
html = html.replace('var sortBtn = document.getElementById("sortBtn");', 'var sortBtn = document.getElementById("sortKeyBtn");');

fs.writeFileSync('scripts/template.html', html);
