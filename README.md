# query-params-viewer

拆解 URL 中的 query params 并可视化展示，支持中文 / English / 日本語。

- 每个语言页面都是自包含的单个 HTML（无外部依赖、纯前端，Google Analytics 除外）
- 支持完整 URL、hash 路由（`#/path?a=1`）、裸 query string（`a=1&b=2`）
- 自动识别重复 key、JSON 值、空值等类型
- 值本身如果是一个嵌套的 URL 或 encode 过的 query string（如 `redirect=https%3A%2F%2F...%3Ftoken%3Dabc`），可以展开查看内层 key/value（最多 3 层）
- 支持亮/暗主题切换
- 中文 / EN / 日本語切换是渐进增强：无 JS 时是普通链接跳转到对应语言的静态页；有 JS 时原地替换文案、不刷新页面，已输入的 URL 和解析结果不会丢失

## 目录结构

```
index.html       中文版（默认语言，根路径）
en/index.html    English
ja/index.html    日本語
favicon.svg      图标（三个语言页面共用）
scripts/         构建脚本，三个页面由此生成，不要直接改 index.html / en / ja
  template.html  共享的 HTML/CSS/JS 模板，翻译文案用 __TOKEN__ 占位
  i18n.js        三种语言的翻译文案 + TDK（title/description/keywords）
  build.js       读取 template.html + i18n.js，生成上面三个 index.html
```

`index.html`、`en/index.html`、`ja/index.html` 都是**生成产物**（文件顶部有注释标注），
每份仍然是可以直接部署的静态单文件；改动逻辑或文案时改 `scripts/` 下的源文件，然后跑：

```
node scripts/build.js
```

## 使用

直接用浏览器打开 `index.html`，或部署到 GitHub Pages：

1. Settings → Pages → Source 选择 `main` 分支 `/ (root)`
2. `app.lideguang.com` 是多个项目共享的域名，通过反向代理等方式将 `/query-params-viewer/` 路径映射到本仓库的 Pages 站点，因此仓库内**不加** `CNAME` 文件
3. 访问 `https://app.lideguang.com/query-params-viewer/`（中文）、`.../en/`（English）、`.../ja/`（日本語）

也可以直接把带参数的链接拼到站点地址后面共享，例如
`https://app.lideguang.com/query-params-viewer/?foo=bar&baz=1`，页面会自动解析并展示。

## SEO

三个语言各是独立可抓取的静态页面，互相以 `hreflang` 声明为翻译版本（`x-default` 指向中文根路径），
并在 `sitemap.xml` 中一并列出。`robots.txt` / `sitemap.xml` 位于仓库根目录，但由于站点实际挂在
`/query-params-viewer/` 子路径下，搜索引擎默认只认域名根路径的 `robots.txt`，如需生效需由负责
`app.lideguang.com` 根路径的一方统一配置或收录本 sitemap。
