const dict = require('./scripts/i18n.js')['en'];
const buildJs = require('fs').readFileSync('./scripts/build.js', 'utf8');
const vm = require('vm');
const context = { console: console, dict: dict, escapeAttr: (str) => str };
vm.runInNewContext(buildJs.match(/function buildUseCasesHtml[\s\S]*?\}/)[0], context);
console.log(context.buildUseCasesHtml(dict));
