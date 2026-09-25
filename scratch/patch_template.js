const fs = require('fs');

// Patch build.js
let buildJs = fs.readFileSync('scripts/build.js', 'utf8');

// Add the rendering function for use cases
const useCasesFunc = `
function buildUseCasesHtml(dict) {
  if (!dict.useCases) return "";
  return dict.useCases.map(function (item) {
    return '<div class="usecase-item"><h4>' + escapeAttr(item.title) + '</h4><p>' + escapeAttr(item.desc) + '</p></div>';
  }).join("\\n        ");
}
`;
buildJs = buildJs.replace('function buildFaqHtml(dict) {', useCasesFunc + '\nfunction buildFaqHtml(dict) {');

// Add replacements in build.js
buildJs = buildJs.replace('__FAQ_HEADING__: escapeAttr(dict.faqHeading),', '__USE_CASES_HEADING__: escapeAttr(dict.useCasesHeading),\n    __USE_CASES_HTML__: buildUseCasesHtml(dict),\n    __FAQ_HEADING__: escapeAttr(dict.faqHeading),');
fs.writeFileSync('scripts/build.js', buildJs);

// Patch template.html
let template = fs.readFileSync('scripts/template.html', 'utf8');

const useCasesHtml = `
  <section class="section-about" id="useCases" aria-labelledby="useCasesHeading">
    <h2 id="useCasesHeading">__USE_CASES_HEADING__</h2>
    <div class="usecases-grid">
        __USE_CASES_HTML__
    </div>
  </section>
`;

template = template.replace('<section class="section-about" id="faq"', useCasesHtml + '\n  <section class="section-about" id="faq"');

// Add styles
const css = `
  .usecases-grid {
    display: grid;
    gap: 16px;
    margin-top: 16px;
  }
  @media (min-width: 640px) {
    .usecases-grid { grid-template-columns: 1fr 1fr; }
  }
  .usecase-item {
    background: var(--page);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
  }
  .usecase-item h4 {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: var(--text);
  }
  .usecase-item p {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.5;
  }
`;
template = template.replace('.faq-a code { background: var(--page); }', '.faq-a code { background: var(--page); }' + css);

fs.writeFileSync('scripts/template.html', template);
