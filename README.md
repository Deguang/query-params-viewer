# query-params-viewer

拆解 URL 中的 query params 并可视化展示，支持中文 / English / 日本語 / Русский / Deutsch / हिन्दी。

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
- 关键交互（解析、复制、编辑、对比、语言/主题切换等）都打了 GA4 埋点

## 目录结构

```
index.html       中文版（默认语言，根路径）
en/index.html    English
ja/index.html    日本語
ru/index.html    Русский
de/index.html    Deutsch
hi/index.html    हिन्दी
sitemap.xml      站点地图（生成产物）
favicon.svg      图标（所有语言页面共用）
scripts/         构建脚本，页面由此生成，不要直接改 index.html / en / ja / ru / de / hi
  template.html  共享的 HTML/CSS/JS 模板，翻译文案用 __TOKEN__ 占位
  i18n.js        各语言的翻译文案 + TDK（title/description/keywords）
  build.js       读取 template.html + i18n.js，生成各语言 index.html 和 sitemap.xml
  test.js        回归测试，用 jsdom 跑生成产物
package.json     只有构建/测试脚本；jsdom 是 devDependency，不进产物
```

各语言的 `index.html` 和 `sitemap.xml` 都是**生成产物**（HTML 文件顶部有注释标注），
每份 HTML 仍然是可以直接部署的静态单文件；改动逻辑或文案时改 `scripts/` 下的源文件，然后跑：

```
node scripts/build.js
```

**新增一门语言**：在 `i18n.js` 里加一份词典，再把语言代码加进 `build.js` 的 `LANGS`。
目录、canonical、hreflang、sitemap、语言切换器、以及前端的路径识别都由这两处推导出来，
不需要再改别的地方（语言代码即目录名，默认语言 `zh` 放在根路径）。

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
按钮文案跟随切换）、每个语言页面无未替换 token、
i18n key 齐全、每种语言在所有页面都有切换链接和 hreflang 且被 sitemap 收录。

jsdom 没有 `CompressionStream`，测试会注入 Node 的原生实现，以便覆盖压缩分支。

## 使用

直接用浏览器打开 `index.html`，或部署到 GitHub Pages：

1. Settings → Pages → Source 选择 `main` 分支 `/ (root)`
2. `app.lideguang.com` 是多个项目共享的域名，通过反向代理等方式将 `/query-params-viewer/` 路径映射到本仓库的 Pages 站点，因此仓库内**不加** `CNAME` 文件
3. 访问 `https://app.lideguang.com/query-params-viewer/`（中文），其余语言在各自子路径下：
   `.../en/`（English）、`.../ja/`（日本語）、`.../ru/`（Русский）、`.../de/`（Deutsch）、`.../hi/`（हिन्दी）

也可以直接把带参数的链接拼到站点地址后面，例如
`https://app.lideguang.com/query-params-viewer/?foo=bar&baz=1`，页面会自动解析并展示。

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

每种语言各是独立可抓取的静态页面，互相以 `hreflang` 声明为翻译版本（`x-default` 指向中文根路径），
并在 `sitemap.xml` 中一并列出。`robots.txt` / `sitemap.xml` 位于仓库根目录，但由于站点实际挂在
`/query-params-viewer/` 子路径下，搜索引擎默认只认域名根路径的 `robots.txt`，如需生效需由负责
`app.lideguang.com` 根路径的一方统一配置或收录本 sitemap。
