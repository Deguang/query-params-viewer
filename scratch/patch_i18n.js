const fs = require('fs');
let content = fs.readFileSync('scripts/i18n.js', 'utf8');

const additions = {
  "zh": "A-Z 排序",
  "zh-hant": "A-Z 排序",
  "en": "Sort A-Z",
  "ja": "A-Z 並べ替え",
  "ru": "А-Я Сортировка",
  "de": "A-Z Sortieren",
  "hi": "A-Z सॉर्ट"
};

for (const lang of Object.keys(additions)) {
  const langKey = lang === 'zh-hant' ? '"zh-hant": {' : lang + ': {';
  const startIdx = content.indexOf(langKey);
  if (startIdx !== -1) {
    const copyUrlIdx = content.indexOf('copyUrlBtn:', startIdx);
    if (copyUrlIdx !== -1) {
      const line = '    sortBtn: "' + additions[lang] + '",\n';
      content = content.slice(0, copyUrlIdx) + line + content.slice(copyUrlIdx);
    }
  }
}

fs.writeFileSync('scripts/i18n.js', content);
