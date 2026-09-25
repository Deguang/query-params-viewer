import re

with open('scripts/i18n.js', 'r', encoding='utf-8') as f:
    content = f.read()

additions = {
  "zh": {
    "useCasesHeading": '"典型使用场景"',
    "useCases": '[\n      { title: "营销 UTM 分析", desc: "快速拆解并校验广告投放的长链接（如 utm_source, utm_campaign 等），确保追踪参数准确无误。" },\n      { title: "OAuth 回调调试", desc: "在调试微信、Google 等第三方登录时，一键展开嵌套的 redirect_uri 和 state 参数，看清内层结构。" },\n      { title: "数据埋点校验", desc: "查看和格式化分析工具（如 GA、Pixel）通过超长 Query String 发送的 JSON 格式追踪数据（Payloads）。" },\n      { title: "API 接口比对", desc: "利用“对比 (Compare)”功能排查重构前后的接口请求差异，逐行高亮修改过、新增或丢失的参数。" }\n    ]',
    "faqAdd": '      { q: "URL 里的空格是被编码成 %20 还是 + ？", a: "这取决于编码标准。标准的 URI 编码（如 <code>encodeURIComponent</code>）会将空格编码为 <code>%20</code>，而在 <code>application/x-www-form-urlencoded</code> 规范中，表单提交的空格会被转为 <code>+</code>。本工具能同时兼容并正确解码这两种形式。" },\n      { q: "可以用它做接口回归测试吗？", a: "完全可以。你可以直接把重构前后的两个长 URL 丢进“对比 (Compare)”面板，它会按 key 逐行高亮出不同之处，是排查请求差异的利器。" }\n    ],'
  },
  "zh-hant": {
    "useCasesHeading": '"典型使用情境"',
    "useCases": '[\n      { title: "行銷 UTM 分析", desc: "快速拆解並驗證廣告投放的長連結（如 utm_source, utm_campaign 等），確保追蹤參數正確無誤。" },\n      { title: "OAuth 回呼除錯", desc: "在除錯第三方登入時，一鍵展開巢狀的 redirect_uri 與 state 參數，看清內層結構。" },\n      { title: "數據追蹤驗證", desc: "查看和格式化分析工具透過超長 Query String 發送的 JSON 格式追蹤資料（Payloads）。" },\n      { title: "API 介面比對", desc: "利用「比較 (Compare)」功能排查重構前後的 API 請求差異，逐行標示修改過、新增或遺失的參數。" }\n    ]',
    "faqAdd": '      { q: "URL 裡的空白是被編碼成 %20 還是 + ？", a: "這取決於編碼標準。標準的 URI 編碼（如 <code>encodeURIComponent</code>）會將空白編碼為 <code>%20</code>，而在 <code>application/x-www-form-urlencoded</code> 規範中，表單提交的空白會被轉為 <code>+</code>。本工具能同時相容並正確解碼這兩種形式。" },\n      { q: "可以用它做介面迴歸測試嗎？", a: "完全可以。你可以直接把重構前後的兩個長 URL 丟進「比較 (Compare)」面板，它會按 key 逐行標示出不同之處，是排查請求差異的利器。" }\n    ],'
  },
  "en": {
    "useCasesHeading": '"Typical Use Cases"',
    "useCases": '[\n      { title: "UTM Campaign Analysis", desc: "Quickly break down and verify marketing campaign URLs (e.g., utm_source, utm_campaign) to ensure tracking parameters are correct." },\n      { title: "OAuth Redirect Debugging", desc: "Easily expand nested redirect_uri and state parameters when debugging third-party logins." },\n      { title: "Analytics Payload Inspection", desc: "Inspect and format JSON tracking payloads sent via lengthy query strings by analytics tools like Google Analytics or Meta Pixel." },\n      { title: "API Regression Testing", desc: "Use the Compare feature to troubleshoot API request differences before and after refactoring by highlighting modified, added, or missing parameters." }\n    ]',
    "faqAdd": '      { q: "Are spaces encoded as %20 or + in URLs?", a: "It depends on the encoding standard. Standard URI encoding (like <code>encodeURIComponent</code>) encodes spaces as <code>%20</code>, while the <code>application/x-www-form-urlencoded</code> specification converts spaces to <code>+</code> for form submissions. This tool correctly decodes both formats." },\n      { q: "Can I use this for API regression testing?", a: "Absolutely. You can paste two lengthy URLs from before and after a refactor into the Compare panel. It highlights the differences key by key, making it an excellent tool for troubleshooting request discrepancies." }\n    ],'
  },
  "ja": {
    "useCasesHeading": '"主なユースケース"',
    "useCases": '[\n      { title: "UTM パラメータ解析", desc: "マーケティングキャンペーンの URL（utm_source、utm_campaign など）をすばやく分解して検証し、トラッキングパラメータが正しいことを確認します。" },\n      { title: "OAuth リダイレクトのデバッグ", desc: "サードパーティログインをデバッグする際、ネストされた redirect_uri や state パラメータをワンクリックで展開して内部構造を確認できます。" },\n      { title: "アナリティクスのデータ検証", desc: "GA などの分析ツールが長いクエリ文字列を介して送信する JSON 形式のトラッキングデータを展開して整形します。" },\n      { title: "API リグレッションテスト", desc: "「比較 (Compare)」機能を使用して、リファクタリング前後の API リクエストの違い（変更、追加、削除されたパラメータ）をハイライトしてトラブルシューティングします。" }\n    ]',
    "faqAdd": '      { q: "URL 内のスペースは %20 と + のどちらにエンコードされますか？", a: "エンコード標準によって異なります。標準の URI エンコード（<code>encodeURIComponent</code> など）ではスペースは <code>%20</code> にエンコードされますが、<code>application/x-www-form-urlencoded</code> 仕様ではフォーム送信時にスペースが <code>+</code> に変換されます。このツールは両方の形式に互換性があり、正しくデコードします。" },\n      { q: "APIのリグレッションテストに使用できますか？", a: "はい、可能です。リファクタリング前後の 2 つの長い URL を「比較 (Compare)」パネルに貼り付けるだけで、キーごとに違いがハイライトされるため、リクエストの不一致を調査するのに最適です。" }\n    ],'
  },
  "ru": {
    "useCasesHeading": '"Типичные случаи использования"',
    "useCases": '[\n      { title: "Анализ UTM-меток", desc: "Быстро разбирайте и проверяйте URL-адреса маркетинговых кампаний (например, utm_source, utm_campaign), чтобы убедиться в правильности параметров отслеживания." },\n      { title: "Отладка перенаправлений OAuth", desc: "Легко разворачивайте вложенные параметры redirect_uri и state при отладке сторонних входов." },\n      { title: "Проверка данных аналитики", desc: "Форматируйте данные отслеживания в формате JSON, передаваемые через длинные строки запросов аналитическими инструментами." },\n      { title: "Регрессионное тестирование API", desc: "Используйте функцию сравнения (Compare) для устранения различий в запросах API до и после рефакторинга." }\n    ]',
    "faqAdd": '      { q: "Кодируются ли пробелы как %20 или + в URL?", a: "Это зависит от стандарта кодирования. Стандартное кодирование URI (как <code>encodeURIComponent</code>) кодирует пробелы как <code>%20</code>, тогда как спецификация <code>application/x-www-form-urlencoded</code> преобразует пробелы в <code>+</code>. Этот инструмент корректно декодирует оба формата." },\n      { q: "Могу ли я использовать это для регрессионного тестирования API?", a: "Абсолютно. Вы можете вставить два длинных URL до и после рефакторинга в панель сравнения. Инструмент подсвечивает отличия по ключам, что делает его отличным средством для поиска расхождений." }\n    ],'
  },
  "de": {
    "useCasesHeading": '"Typische Anwendungsfälle"',
    "useCases": '[\n      { title: "UTM-Kampagnenanalyse", desc: "Zerlegen und überprüfen Sie schnell Marketing-URLs (z. B. utm_source, utm_campaign), um sicherzustellen, dass die Tracking-Parameter korrekt sind." },\n      { title: "OAuth-Redirect-Debugging", desc: "Erweitern Sie verschachtelte redirect_uri- und state-Parameter beim Debuggen von Drittanbieter-Logins ganz einfach mit einem Klick." },\n      { title: "Überprüfung von Analyse-Daten", desc: "Untersuchen und formatieren Sie JSON-Tracking-Payloads, die über lange Query-Strings von Analyse-Tools gesendet werden." },\n      { title: "API-Regressionstests", desc: "Verwenden Sie die Vergleichsfunktion (Compare), um API-Anfrageunterschiede vor und nach einem Refactoring zu analysieren." }\n    ]',
    "faqAdd": '      { q: "Werden Leerzeichen in URLs als %20 oder als + kodiert?", a: "Das hängt vom Kodierungsstandard ab. Die Standard-URI-Kodierung (wie <code>encodeURIComponent</code>) kodiert Leerzeichen als <code>%20</code>, während die <code>application/x-www-form-urlencoded</code>-Spezifikation Leerzeichen bei Formularübermittlungen in <code>+</code> umwandelt. Dieses Tool dekodiert beide Formate korrekt." },\n      { q: "Kann ich das für API-Regressionstests verwenden?", a: "Absolut. Sie können zwei lange URLs vor und nach einem Refactoring in das Compare-Panel einfügen. Es hebt die Unterschiede Schlüssel für Schlüssel hervor." }\n    ],'
  },
  "hi": {
    "useCasesHeading": '"सामान्य उपयोग के मामले"',
    "useCases": '[\n      { title: "UTM अभियान विश्लेषण", desc: "मार्केटिंग अभियान URL (जैसे, utm_source, utm_campaign) को जल्दी से तोड़ें और सत्यापित करें ताकि ट्रैकिंग पैरामीटर सही हों।" },\n      { title: "OAuth रीडायरेक्ट डिबगिंग", desc: "थर्ड-पार्टी लॉगिन डिबग करते समय नेस्टेड redirect_uri और state पैरामीटर को आसानी से विस्तारित करें।" },\n      { title: "एनालिटिक्स डेटा निरीक्षण", desc: "एनालिटिक्स टूल द्वारा लंबी क्वेरी स्ट्रिंग के माध्यम से भेजे गए JSON ट्रैकिंग डेटा का निरीक्षण और स्वरूपण करें।" },\n      { title: "API रिग्रेशन टेस्टिंग", desc: "रीफैक्टरिंग से पहले और बाद में API अनुरोध में अंतर का निवारण करने के लिए तुलना (Compare) सुविधा का उपयोग करें।" }\n    ]',
    "faqAdd": '      { q: "क्या URL में रिक्त स्थान (spaces) को %20 या + के रूप में एन्कोड किया जाता है?", a: "यह एन्कोडिंग मानक पर निर्भर करता है। मानक URI एन्कोडिंग (जैसे <code>encodeURIComponent</code>) रिक्त स्थान को <code>%20</code> के रूप में एन्कोड करती है, जबकि <code>application/x-www-form-urlencoded</code> फॉर्म सबमिशन के लिए रिक्त स्थान को <code>+</code> में परिवर्तित करता है। यह टूल दोनों स्वरूपों को सही ढंग से डीकोड करता है।" },\n      { q: "क्या मैं API रिग्रेशन टेस्टिंग के लिए इसका उपयोग कर सकता हूँ?", a: "बिल्कुल। आप रीफैक्टरिंग से पहले और बाद के दो लंबे URL को तुलना (Compare) पैनल में पेस्ट कर सकते हैं। यह एक-एक करके अंतरों को उजागर करता है।" }\n    ],'
  }
}

# The languages appear in order: zh, "zh-hant", en, ja, ru, de, hi
for lang, data in additions.items():
    # 1. Insert useCases after features array
    # Look for the features array in the block for this language
    # We can split the content by `faqHeading:`
    lang_key = f'"{lang}":' if '-' in lang else f'{lang}:'
    
    start_idx = content.find(lang_key)
    if start_idx == -1:
        continue
    
    # find next language to limit search
    next_idx = len(content)
    # just search inside the rest
    search_area = content[start_idx:]
    
    # Insert useCases
    features_match = re.search(r'(features:\s*\[.*?\]\,)', search_area, re.DOTALL)
    if features_match:
        replacement = features_match.group(1) + f'\n    useCasesHeading: {data["useCasesHeading"]},\n    useCases: {data["useCases"]},'
        content = content[:start_idx + features_match.start()] + replacement + content[start_idx + features_match.end():]
        
    # Re-evaluate search_area for second replacement
    search_area = content[start_idx:]
    # Append to FAQ
    # We find the end of the faq array: it's a `],` after `faq:`
    faq_match = re.search(r'(faq:\s*\[.*?)(    \],)', search_area, re.DOTALL)
    if faq_match:
        # replace the closing tag with our new items + closing tag
        new_items = ",\n" + data["faqAdd"]
        replacement = faq_match.group(1) + new_items
        content = content[:start_idx + faq_match.start()] + replacement + content[start_idx + faq_match.end():]

with open('scripts/i18n.js', 'w', encoding='utf-8') as f:
    f.write(content)
