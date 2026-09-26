const fs = require('fs');
let code = fs.readFileSync('scripts/template.html', 'utf8');

// 1. Replace the SVG to split the paths and give them IDs
const oldSvg = '<svg class="icon" aria-hidden="true" style="width:12px;height:12px;vertical-align:middle;margin-left:4px;opacity:0.6;" viewBox="0 0 24 24"><path fill="currentColor" d="M7 14l5 5 5-5zM7 10l5-5 5 5z"/></svg>';
const newSvg = '<svg class="icon" aria-hidden="true" style="width:12px;height:12px;vertical-align:middle;margin-left:4px;" viewBox="0 0 24 24"><path id="sortUp" fill="currentColor" opacity="0.4" d="M7 10l5-5 5 5z"/><path id="sortDown" fill="currentColor" opacity="0.4" d="M7 14l5 5 5-5z"/></svg>';
code = code.replace(oldSvg, newSvg);

// 2. Replace the sort logic
const oldLogic = `var sortAscending = true;
  var sortBtn = document.getElementById("sortKeyBtn");

  sortBtn.addEventListener("click", function () {
    if (editMode) return; // disable in edit mode
    if (!currentEntries || !currentEntries.length) return;
    
    var sorted = currentEntries.slice().sort(function(a, b) {
      return sortAscending ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key);
    });
    sortAscending = !sortAscending;
    render(sorted);
  });`;

const newLogic = `var sortState = 0; // 0=unsorted, 1=asc, 2=desc
  var sortBtn = document.getElementById("sortKeyBtn");
  var sortUp = document.getElementById("sortUp");
  var sortDown = document.getElementById("sortDown");

  function resetSortState() {
    sortState = 0;
    if (sortUp) sortUp.style.opacity = "0.4";
    if (sortDown) sortDown.style.opacity = "0.4";
  }

  sortBtn.addEventListener("click", function () {
    if (editMode) return;
    if (!currentEntries || !currentEntries.length) return;
    
    sortState = (sortState + 1) % 3;
    
    if (sortState === 0) {
      doParse();
      return;
    }
    
    if (sortState === 1) {
      sortUp.style.opacity = "1";
      sortDown.style.opacity = "0.4";
      var sorted = currentEntries.slice().sort(function(a, b) { return a.key.localeCompare(b.key); });
      render(sorted);
    } else if (sortState === 2) {
      sortUp.style.opacity = "0.4";
      sortDown.style.opacity = "1";
      var sorted = currentEntries.slice().sort(function(a, b) { return b.key.localeCompare(a.key); });
      render(sorted);
    }
  });`;
code = code.replace(oldLogic, newLogic);

// 3. Insert resetSortState() into doParse, clearBtn listener, and exitEditMode
code = code.replace('function doParse() {\n    editMode = false;', 'function doParse() {\n    resetSortState();\n    editMode = false;');
code = code.replace('urlInput.value = "";\n    track("clear");\n    resetShareError();\n    render([]);', 'urlInput.value = "";\n    track("clear");\n    resetShareError();\n    resetSortState();\n    render([]);');
code = code.replace('track("edit_mode_exit", { param_count: cleaned.length });\n    render(annotateOccurrences(cleaned));', 'track("edit_mode_exit", { param_count: cleaned.length });\n    resetSortState();\n    render(annotateOccurrences(cleaned));');

fs.writeFileSync('scripts/template.html', code);
