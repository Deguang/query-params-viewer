# query-params-viewer

拆解 URL 中的 query params 并可视化展示，支持 English / 简体中文 / 繁體中文 / 日本語 / Русский / Deutsch / हिन्दी。

- 每个语言页面都是自包含的单个 HTML（无外部依赖、纯前端，Google Analytics 除外）
- 支持完整 URL、hash 路由（`#/path?a=1`）、裸 query string（`a=1&b=2`）
- 自动识别重复 key、JSON 值、空值等类型
- 值本身如果是一个嵌套的 URL 或 encode 过的 query string（如 `redirect=https%3A%2F%2F...%3Ftoken%3Dabc`），可以展开查看内层 key/value（最多 3 层）
- 编辑模式：table 变成可编辑表单（增删改 key/value），Base URL + 完整 URL 实时预览并可一键复制
- 对比模式：粘贴两个 URL，按 key 生成相同 / 不同 / 仅 A 有 / 仅 B 有的 diff 表
- 分享：解析结果 / 对比结果都能一键生成分享链接，状态编码在**片段（`#`）里而不是 query string**，
  纯客户端、不经过任何后端或第三方短链服务，详见下方「分享链接格式」
- 支持亮/暗主题切换
- 语言切换收在一个下拉菜单里（用原生 `<details>` 而不是 JS 弹层，因此无 JS 也能展开，链接照样可被抓取），
  菜单里每种语言用自己的语言写自己的名字；切换本身是渐进增强：无 JS 时是普通链接跳转到对应语言的静态页；
  有 JS 时原地替换文案、不刷新页面，已输入的 URL 和解析结果不会丢失
- 首次访问根路径时按浏览器语言自动跳转到对应语言页，详见下方「语言自动选择」
- 页面底部有一段「关于 + 常见问题（FAQ）」说明文字，随语言切换实时重译；同一份 FAQ 数据同时生成
  `FAQPage` 结构化数据，供搜索引擎和 AI 答案引擎摘录，详见下方「面向 AI 的优化（GEO）」
- 关键交互（解析、复制、编辑、对比、语言/主题切换等）都打了 GA4 埋点

## 目录结构

```
index.html         English（默认语言，根路径）
zh/index.html      简体中文
zh-hant/index.html 繁體中文
ja/index.html      日本語
ru/index.html      Русский
de/index.html      Deutsch
hi/index.html      हिन्दी
en/index.html      旧地址的桩页，canonical + 跳转到根路径（见下方「为什么根路径是英文」）
sitemap.xml        站点地图（生成产物）
llms.txt           面向 AI 答案引擎的站点摘要（生成产物，见下方「面向 AI 的优化（GEO）」）
robots.txt         放行所有爬虫（含 AI 爬虫），并声明 sitemap
favicon.svg        图标（所有语言页面共用）
scripts/           构建脚本，页面由此生成，不要直接改生成出来的 index.html
  langs.js         语言清单：有哪些语言、谁在根路径、兜底语言、菜单里各语言的自称
  template.html    共享的 HTML/CSS/JS 模板，翻译文案用 __TOKEN__ 占位
  i18n.js          各语言的翻译文案 + TDK（title/description/keywords）
  build.js         读取 langs.js + template.html + i18n.js，生成各语言 index.html 和 sitemap.xml
  test.js          回归测试，用 jsdom 跑生成产物
package.json       只有构建/测试脚本；jsdom 是 devDependency，不进产物
```

各语言的 `index.html` 和 `sitemap.xml` 都是**生成产物**（HTML 文件顶部有注释标注），
每份 HTML 仍然是可以直接部署的静态单文件；改动逻辑或文案时改 `scripts/` 下的源文件，然后跑：

```
node scripts/build.js
```

**新增一门语言**：在 `i18n.js` 里加一份词典（含 UI 文案、TDK，以及 `aboutHeading` / `aboutHtml` /
`features` / `faqHeading` / `faq` 这几项正文与 FAQ），再把语言代码加进 `langs.js` 的 `LANGS` 和 `LANG_NAMES`。
目录、canonical、hreflang、sitemap、语言切换器、语言自动选择、以及前端的路径识别都由这两个文件推导出来，
不需要再改别的地方（语言代码即目录名，`langs.js` 里 `DEFAULT_LANG` 指定的那个放在根路径）。
`langs.js` 同时被 `build.js` 和 `test.js` 引用，所以测试和构建不会各持一份语言清单而跑偏。
注意语言代码是**目录名**所以用小写（`zh-hant`），而 hreflang / `<html lang>` 用词典里的 `htmlLang`
（`zh-Hant`），两者故意分开。

## 测试

```
npm install    # 只装 jsdom，仅测试用
npm test       # 先构建，再跑 scripts/test.js
```

测试直接在 jsdom 里**驱动生成好的 HTML**，而不是对模板做文本匹配。这么做是因为踩过的坑
（分享卡片被渲染到长表格下方看不见、复制时的 `textContent` 把内联 `<svg>` 图标永久抹掉、
长度警告在能被重译之前就被清掉、`?a=1&b=2` 这类常见参数被误判成分享链接）**静态检查一个都发现不了**，
只有页面真跑起来才会暴露。

覆盖：分享链接往返还原（解析 / 对比两种模式）、点击落在图标上仍能触发、复制闪烁后图标还在、
长度警告分档与跨语言重译、query string 不被当作分享链接、畸形分享链接不中断初始化、
主题三档循环与存储、diff 行着色、语言切换路径不累积、语言下拉的开合（选中后关闭、点外部 / Esc 关闭、
按钮文案跟随切换）、语言自动选择（各种 `navigator.languages` 的匹配结果、zh 按文种（Hant/Hans）而非主语言判定、
英语和冷门语言都留在根路径、query/fragment 不丢、记住的选择优先、每会话只跳一次、子路径页面不跳）、
分享链接不带语言段（含页内切换后）、每个语言页面无未替换 token、i18n key 齐全、
每种语言在所有页面都有切换链接和 hreflang 且被 sitemap 收录、旧地址桩页有 canonical 且不进 sitemap、
关于/FAQ 正文渲染在静态 DOM 且随语言切换重译、FAQPage 结构化数据与可见问答一致、WebApplication 声明
`inLanguage`/`featureList`、`llms.txt` 列出全部语言 canonical。

jsdom 没有 `CompressionStream`，测试会注入 Node 的原生实现，以便覆盖压缩分支。
jsdom 也不能真的跳转，所以自动选择的判定结果会在跳转前写进 `<html data-lang-redirect>`，测试断言这个属性；
`navigator.languages` 由测试统一注入（默认取根路径自己的语言，即根页面原地不动）。

## 使用

直接用浏览器打开 `index.html`，或部署到 GitHub Pages：

1. Settings → Pages → Source 选择 `main` 分支 `/ (root)`
2. `app.lideguang.com` 是多个项目共享的域名，通过反向代理等方式将 `/query-params-viewer/` 路径映射到本仓库的 Pages 站点，因此仓库内**不加** `CNAME` 文件
3. 访问 `https://app.lideguang.com/query-params-viewer/`（English），其余语言在各自子路径下：
   `.../zh/`（简体中文）、`.../zh-hant/`（繁體中文）、`.../ja/`（日本語）、`.../ru/`（Русский）、
   `.../de/`（Deutsch）、`.../hi/`（हिन्दी）；`.../en/` 是旧地址，会跳回根路径

也可以直接把带参数的链接拼到站点地址后面，例如
`https://app.lideguang.com/query-params-viewer/?foo=bar&baz=1`，页面会自动解析并展示。

## 语言自动选择

首次访问**根路径**时，页面会按 `navigator.languages` 跳到对应语言的子路径。
判定脚本放在 `<head>` 最前面（早于 GA、样式和 body），所以不会先闪一下英文再跳走。

匹配规则：先整串精确匹配（`de` → `/de/`），再按主语言匹配（`de-AT` → `/de/`）；中文特殊，
按**文种**而不是主语言判定 —— `zh-Hant` / `zh-TW` / `zh-HK` / `zh-MO` 去 `/zh-hant/`，
其余 `zh-*` 去 `/zh/`。按 `navigator.languages` 顺序取第一个能匹配上的，
全都匹配不上则留在根路径（兜底语言就是根路径的英文，所以这种情况是「不跳」而不是「跳到某处」）。

三条约束是为了不和用户对着干：

1. **只在根路径跳。** `/zh/`、`/ja/` 这些本身就是明确的选择，任何情况下都不会被自动改写。
2. **手动选过的语言优先且长期有效**，存在 `localStorage.qpv-lang`（点语言菜单时写入，包括点当前语言），
   之后再访问根路径一律按存的走，不再看浏览器语言。
3. **自动跳转每个会话只发生一次**（`sessionStorage.qpv-lang-auto`），所以被跳到 `/de/` 之后再手动回到
   根路径，不会又被弹走。

query string 和片段（`#`，分享 payload 所在）都会原样带到目标页，用 `location.replace` 跳转，
不会在历史里留下一层导致返回键卡住。无 JS 时整个机制不生效，根路径就是英文页面。

### 为什么根路径是英文

不是审美问题，是这个自动跳转和搜索引擎的相互作用决定的：Google 渲染页面时会执行这段脚本，
`location.replace` 会被当成跳转信号。如果根路径是中文，以 `en` 抓取的 Googlebot 一进来就被跳走，
**站点最强的那个 URL 很可能被合并掉、不再作为独立页面收录**。

把英文放在根路径正好解掉这一点：Googlebot 匹配到 `en` → 判定结果是「不跳」→ 根路径作为主页面被正常收录，
跳转只对真实的非英语访客生效。兜底语言同样设成 `en`（`langs.js` 的 `FALLBACK_LANG`），
所以匹配不上的冷门语言也不会把爬虫或访客甩到别处。

英文原本在 `/en/`，改动后那个目录保留成一个桩页：`canonical` 指向根路径（搜索引擎据此合并），
外加 `meta refresh` 和一个普通链接（访客和无 JS 客户端据此跳转）。GitHub Pages 发不了 301，这是替代方案。
桩页**不进 sitemap、也不在 hreflang 集合里**——它是旧地址，不是一个语言版本。
`langs.js` 的 `LEGACY_ALIASES` 记着这件事；哪天英文不在根路径了，桩页会自动不再生成。

## 分享链接格式

页面内的「分享」按钮生成的链接，状态一律编码在**片段（`#`）**里：

```
https://app.lideguang.com/query-params-viewer/#s=<base64url(gzip(json))>   压缩
https://app.lideguang.com/query-params-viewer/#p=<encodeURIComponent(json)> 明文回退
```

**为什么用 `#` 而不是 query string**，两个原因缺一不可：

1. **避免和上面那种「把参数拼到地址后面」的用法撞车。** query string 已经被那个约定占用了，
   如果分享链接用 `?z=` / `?u=` / `?a=`，那么想分析一个恰好含有这些 key 的 URL 时就会被误判成
   分享链接——而 `a` `b` `u` `z` 都是极常见的短参数名，`?a=1&b=2` 更是本页面 hint 文案里的示例。
   片段和 query string 是两个独立命名空间，互不干扰。识别用严格前缀 `^#[sp]=`，所以用户粘贴
   `#/path?a=1` 这类 hash 路由进来分析时也不会被误判。
2. **片段不会发给服务器**，因此长 payload 不会撞上反向代理的请求行长度上限（nginx 默认 8KB，
   超了直接 414）。上限只剩浏览器自身能处理的 URL 长度。

**压缩策略**：支持 `CompressionStream` 的浏览器用原生 gzip 压缩后 base64url 编码。但压缩并非
总是划算——gzip 压不动 token / JWT 这类高熵内容，而 base64 还要额外 +33%，反而会让链接变长。
所以两种形式都会构造，**取较短者**，保证分享链接永远不劣于明文形式。

链接长度会分三档提示（绿 ≤2000 / 黄 / 红 >32000）。注意这**不是硬上限**——压缩只能缩短、不能封顶，
真要封顶只能上后端短链服务。无法解码的链接（损坏、被截断、浏览器不支持解压）会明确说明原因，
而不是当成普通参数解析。

隐私上，payload 不会出现在服务器访问日志里；但 GA4 的 `page_location` 取的是完整 `href`，
**包含片段**，所以埋点数据里仍然会记录到。

## SEO

每种语言各是独立可抓取的静态页面，互相以 `hreflang` 声明为翻译版本（`x-default` 指向英文根路径），
并在 `sitemap.xml` 中一并列出。根路径为什么是英文、以及它和自动跳转的关系，见上面「为什么根路径是英文」。
分享链接一律指向根路径（不带语言段），所以社交平台 unfurl 出来的标题和描述取的是英文页面的 TDK。`robots.txt` / `sitemap.xml` 位于仓库根目录，但由于站点实际挂在
`/query-params-viewer/` 子路径下，搜索引擎默认只认域名根路径的 `robots.txt`，如需生效需由负责
`app.lideguang.com` 根路径的一方统一配置或收录本 sitemap。

## 面向 AI 的优化（GEO）

GEO（Generative Engine Optimization）的目标是被 ChatGPT / Perplexity / Google AI Overviews / Claude
这类**答案引擎**读懂并引用，和传统 SEO 是两套（但很多手段重叠）。答案引擎引用一个页面的前提是页面里有
**干净、可直接摘录的文字**在回答某个具体问题——纯 UI 控件对它没有价值。为此本项目做了三件事：

1. **可摘录正文 + FAQ。** 每个语言页面底部有一段「关于」说明和一节 FAQ（各语言独立撰写，代码示例保持一致）。
   这段内容写在静态 HTML 里，无 JS、爬虫、AI 抓取都能读到；页内切换语言时由 `renderFaq()` 用同一份 `i18n.js`
   数据实时重建。
2. **结构化数据。** `<head>` 里有两段 JSON-LD：一段 `WebApplication`（含 `featureList`、`inLanguage`、
   `isAccessibleForFree`），一段 `FAQPage`。FAQPage 由 `build.js` 从上面同一份 `faq` 数据生成，所以结构化数据
   **永远和页面上可见的问答一致**（Google 要求二者匹配）。
3. **`llms.txt` + 放行 AI 爬虫。** `llms.txt`（见 [llmstxt.org](https://llmstxt.org)）是给 LLM 的站点摘要，
   由 `build.js` 从语言清单生成，列出各语言 canonical 及要点。`robots.txt` 里显式放行了 GPTBot / ClaudeBot /
   PerplexityBot / Google-Extended 等答案引擎爬虫。

**子路径注意事项**：`llms.txt` 和 `robots.txt` 都在仓库根，按约定被抓取的位置是**域名根**
（`https://app.lideguang.com/llms.txt` 等），而本站挂在 `/query-params-viewer/` 子路径下。要让这两个文件真正
生效，需由负责 `app.lideguang.com` 根路径的一方把它们发布（或把规则合并）到域名根。放在仓库根是就近能做的部分，
剩下的映射得部署后确认。
