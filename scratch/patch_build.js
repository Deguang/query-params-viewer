const fs = require('fs');
let content = fs.readFileSync('scripts/build.js', 'utf8');
content = content.replace('__COPY_URL_BTN__: dict.copyUrlBtn,', '__SORT_BTN__: dict.sortBtn,\n    __COPY_URL_BTN__: dict.copyUrlBtn,');
fs.writeFileSync('scripts/build.js', content);
