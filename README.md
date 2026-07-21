# query-params-viewer

拆解 URL 中的 query params 并可视化展示。

- 单文件（`index.html`），无外部依赖，纯前端
- 支持完整 URL、hash 路由（`#/path?a=1`）、裸 query string（`a=1&b=2`）
- 自动识别重复 key、JSON 值、空值等类型，并按值长度做图表可视化
- 支持亮/暗主题切换

## 使用

直接用浏览器打开 `index.html`，或部署到 GitHub Pages：

1. Settings → Pages → Source 选择 `main` 分支 `/ (root)`
2. 访问 `https://<username>.github.io/query-params-viewer/`

也可以直接把带参数的链接拼到站点地址后面共享，例如
`https://<username>.github.io/query-params-viewer/?foo=bar&baz=1`，
页面会自动解析并展示。
