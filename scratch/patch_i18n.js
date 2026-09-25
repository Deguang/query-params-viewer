const fs = require('fs');
let content = fs.readFileSync('scripts/i18n.js', 'utf8');

const additions = {
  zh: {
    useCasesHeading: "典型使用场景",
    useCases: [
      { title: "营销 UTM 分析", desc: "快速拆解并校验广告投放的长链接（如 utm_source, utm_campaign 等），确保追踪参数准确无误。" },
      { title: "OAuth 回调调试", desc: "在调试微信、Google 等第三方登录时，一键展开嵌套的 redirect_uri 和 state 参数，看清内层结构。" },
      { title: "数据埋点校验", desc: "查看和格式化分析工具（如 GA、Pixel）通过超长 Query String 发送的 JSON 格式追踪数据（Payloads）。" },
      { title: "API 接口比对", desc: "利用“对比 (Compare)”功能排查重构前后的接口请求差异，逐行高亮修改过、新增或丢失的参数。" }
    ]
  },
  "zh-hant": {
    useCasesHeading: "典型使用情境",
    useCases: [
      { title: "行銷 UTM 分析", desc: "快速拆解並驗證廣告投放的長連結（如 utm_source, utm_campaign 等），確保追蹤參數正確無誤。" },
      { title: "OAuth 回呼除錯", desc: "在除錯第三方登入時，一鍵展開巢狀的 redirect_uri 與 state 參數，看清內層結構。" },
      { title: "數據追蹤驗證", desc: "查看和格式化分析工具透過超長 Query String 發送的 JSON 格式追蹤資料（Payloads）。" },
      { title: "API 介面比對", desc: "利用「比較 (Compare)」功能排查重構前後的 API 請求差異，逐行標示修改過、新增或遺失的參數。" }
    ]
  },
  en: {
    useCasesHeading: "Typical Use Cases",
    useCases: [
      { title: "UTM Campaign Analysis", desc: "Quickly break down and verify marketing campaign URLs (e.g., utm_source, utm_campaign) to ensure tracking parameters are correct." },
      { title: "OAuth Redirect Debugging", desc: "Easily expand nested redirect_uri and state parameters when debugging third-party logins." },
      { title: "Analytics Payload Inspection", desc: "Inspect and format JSON tracking payloads sent via lengthy query strings by analytics tools like Google Analytics or Meta Pixel." },
      { title: "API Regression Testing", desc: "Use the Compare feature to troubleshoot API request differences before and after refactoring by highlighting modified, added, or missing parameters." }
    ]
  },
  ja: {
    useCasesHeading: "主なユースケース",
    useCases: [
      { title: "UTM パラメータ解析", desc: "マーケティングキャンペーンの URL（utm_source、utm_campaign など）をすばやく分解して検証し、トラッキングパラメータが正しいことを確認します。" },
      { title: "OAuth リダイレクトのデバッグ", desc: "サードパーティログインをデバッグする際、ネストされた redirect_uri や state パラメータをワンクリックで展開して内部構造を確認できます。" },
      { title: "アナリティクスのデータ検証", desc: "GA などの分析ツールが長いクエリ文字列を介して送信する JSON 形式のトラッキングデータを展開して整形します。" },
      { title: "API リグレッションテスト", desc: "「比較 (Compare)」機能を使用して、リファクタリング前後の API リクエストの違い（変更、追加、削除されたパラメータ）をハイライトしてトラブルシューティングします。" }
    ]
  },
  ru: {
    useCasesHeading: "Типичные случаи использования",
    useCases: [
      { title: "Анализ UTM-меток", desc: "Быстро разбирайте и проверяйте URL-адреса маркетинговых кампаний (например, utm_source, utm_campaign), чтобы убедиться в правильности параметров отслеживания." },
      { title: "Отладка перенаправлений OAuth", desc: "Легко разворачивайте вложенные параметры redirect_uri и state при отладке сторонних входов." },
      { title: "Проверка данных аналитики", desc: "Форматируйте данные отслеживания в формате JSON, передаваемые через длинные строки запросов аналитическими инструментами." },
      { title: "Регрессионное тестирование API", desc: "Используйте функцию сравнения (Compare) для устранения различий в запросах API до и после рефакторинга." }
    ]
  },
  de: {
    useCasesHeading: "Typische Anwendungsfälle",
    useCases: [
      { title: "UTM-Kampagnenanalyse", desc: "Zerlegen und überprüfen Sie schnell Marketing-URLs (z. B. utm_source, utm_campaign), um sicherzustellen, dass die Tracking-Parameter korrekt sind." },
      { title: "OAuth-Redirect-Debugging", desc: "Erweitern Sie verschachtelte redirect_uri- und state-Parameter beim Debuggen von Drittanbieter-Logins ganz einfach mit einem Klick." },
      { title: "Überprüfung von Analyse-Daten", desc: "Untersuchen und formatieren Sie JSON-Tracking-Payloads, die über lange Query-Strings von Analyse-Tools gesendet werden." },
      { title: "API-Regressionstests", desc: "Verwenden Sie die Vergleichsfunktion (Compare), um API-Anfrageunterschiede vor und nach einem Refactoring zu analysieren." }
    ]
  },
  hi: {
    useCasesHeading: "सामान्य उपयोग के मामले",
    useCases: [
      { title: "UTM अभियान विश्लेषण", desc: "मार्केटिंग अभियान URL (जैसे, utm_source, utm_campaign) को जल्दी से तोड़ें और सत्यापित करें ताकि ट्रैकिंग पैरामीटर सही हों।" },
      { title: "OAuth रीडायरेक्ट डिबगिंग", desc: "थर्ड-पार्टी लॉगिन डिबग करते समय नेस्टेड redirect_uri और state पैरामीटर को आसानी से विस्तारित करें।" },
      { title: "एनालिटिक्स डेटा निरीक्षण", desc: "एनालिटिक्स टूल द्वारा लंबी क्वेरी स्ट्रिंग के माध्यम से भेजे गए JSON ट्रैकिंग डेटा का निरीक्षण और स्वरूपण करें।" },
      { title: "API रिग्रेशन टेस्टिंग", desc: "रीफैक्टरिंग से पहले और बाद में API अनुरोध में अंतर का निवारण करने के लिए तुलना (Compare) सुविधा का उपयोग करें।" }
    ]
  }
};

const langs = ['zh', 'zh-hant', 'en', 'ja', 'ru', 'de', 'hi'];

for (let i = langs.length - 1; i >= 0; i--) {
  const lang = langs[i];
  const langKey = lang === 'zh-hant' ? '"zh-hant": {' : lang + ': {';
  const startIndex = content.indexOf(langKey);
  if (startIndex === -1) continue;
  
  const featuresIdx = content.indexOf('features: [', startIndex);
  if (featuresIdx === -1) continue;
  
  const endFeaturesIdx = content.indexOf('],', featuresIdx);
  if (endFeaturesIdx === -1) continue;
  
  const addStr = '\n    useCasesHeading: ' + JSON.stringify(additions[lang].useCasesHeading) + ',\n    useCases: ' + JSON.stringify(additions[lang].useCases, null, 6).replace(/\n/g, '\n    ') + ',';

  content = content.slice(0, endFeaturesIdx + 2) + addStr + content.slice(endFeaturesIdx + 2);
}

fs.writeFileSync('scripts/i18n.js', content);
