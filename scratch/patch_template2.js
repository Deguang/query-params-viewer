const fs = require('fs');
let template = fs.readFileSync('scripts/template.html', 'utf8');

const useCasesHtml = `
  <section class="section-about" aria-labelledby="useCasesHeading">
    <h2 class="about-heading" id="useCasesHeading">__USE_CASES_HEADING__</h2>
    <div class="usecases-grid">
        __USE_CASES_HTML__
    </div>
  </section>
`;

template = template.replace('<h2 class="about-heading" id="faqHeading">', useCasesHtml + '\n    <h2 class="about-heading" id="faqHeading">');
fs.writeFileSync('scripts/template.html', template);
