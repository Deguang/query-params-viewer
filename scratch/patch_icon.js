const fs = require('fs');
let html = fs.readFileSync('scripts/template.html', 'utf8');

const oldIcon = '<path fill="currentColor" d="M3 13h6v-2H3v2zm0-7v2h10V6H3zm0 4h8v-2H3v2z"/>';
const newIcon = '<path fill="currentColor" d="M7 14l5 5 5-5zM7 10l5-5 5 5z"/>';

html = html.replace(oldIcon, newIcon);
// Add viewBox to the SVG in the th if it doesn't have it
html = html.replace('<svg class="icon" aria-hidden="true" style="width:12px;height:12px;vertical-align:middle;margin-left:4px;opacity:0.6;">', '<svg class="icon" aria-hidden="true" style="width:12px;height:12px;vertical-align:middle;margin-left:4px;opacity:0.6;" viewBox="0 0 24 24">');

fs.writeFileSync('scripts/template.html', html);
