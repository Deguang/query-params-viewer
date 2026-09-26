const fs = require('fs');
let code = fs.readFileSync('scripts/template.html', 'utf8');

// Insert button
const btnHtml = '<button class="btn btn-ghost" id="sortBtn" type="button"><svg class="icon" aria-hidden="true" style="width:14px;height:14px;margin-right:4px;"><path fill="currentColor" d="M3 13h6v-2H3v2zm0-7v2h10V6H3zm0 4h8v-2H3v2z"/></svg> <span id="sortBtnLabel">__SORT_BTN__</span></button>\n              ';
code = code.replace('<button class="btn btn-ghost" id="copyUrlBtn"', btnHtml + '<button class="btn btn-ghost" id="copyUrlBtn"');

// Insert logic
const logicJs = `
  var sortAscending = true;
  var sortBtn = document.getElementById("sortBtn");

  sortBtn.addEventListener("click", function () {
    if (editMode) return; // disable in edit mode
    if (!currentEntries || !currentEntries.length) return;
    
    var sorted = currentEntries.slice().sort(function(a, b) {
      return sortAscending ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key);
    });
    sortAscending = !sortAscending;
    render(sorted);
  });
`;

code = code.replace('var copyUrlBtn = document.getElementById("copyUrlBtn");', 'var copyUrlBtn = document.getElementById("copyUrlBtn");' + logicJs);
fs.writeFileSync('scripts/template.html', code);
