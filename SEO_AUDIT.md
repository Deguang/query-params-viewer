# SEO / GEO / 转化审计台账

维护规则：新条目追加在最上面；每条记录做了什么、为什么、怎么验证、结果如何、怎么回滚。不改历史条目，只新增。

---

## 2026-08-05　第二轮：GSC 首批数据 + 落地 P3/P4

### 输入：用户转述的 GSC 数据（非本环境直接接入 API 核实）
| 指标 | 数值 | 来源 |
|---|---|---|
| 平均排名 | 26.8 | 用户粘贴的 GSC 效果报告摘要 |
| "query params" 排名 | 53.0 | 同上 |
| "query parameter" 排名 | 61.0 | 同上 |
| 曝光 / 点击 | 31 / 1 | 同上 |

这满足了第一轮「九、下一轮优化条件」第 4 条的触发门槛，但标注为「用户转述」而非「本环境验证」——本次会话没有连 GSC API，不清楚这几个数字的聚合口径（时间窗口、是否分国家/设备），不能当成可交叉核实的「已知事实」写死，只作为发起本轮的输入依据。

### 本轮执行：P3、P4（仓库内，低风险，已完成）

#### P3　`og:image`/`twitter:image` 从 SVG 换成 1200×630 PNG
- **做了什么**：新增 `og-image.png`（1200×630），`scripts/template.html` 的 `og:image`/`twitter:image` 改指向它并补上 `og:image:width`/`og:image:height`；`twitter:card` 从 `summary` 升级为 `summary_large_image`。
- **怎么生成的**：本环境没有任何 SVG→PNG 或截图工具（第一轮已确认）。在仓库外的 `/tmp` 临时目录 `npm install --no-save puppeteer`（不触碰本仓库 `package.json`/`package-lock.json`），用无头 Chromium 渲染 `scripts/og-image.html` 并截图成 `og-image.png`，用完即删除临时安装。源 HTML 保留在 `scripts/og-image.html`，文件头注释写了原样复现的命令，供以后改文案/配色时重新生成——它不进 `build.js` 的生成流程，是手工资源。
- **设计依据**：配色取自 `template.html` 里 `:root` 的 `--page`/`--surface-1`/`--text-primary`/`--series-1`（"blueprint/cyanotype"主题），卡片内容直接复用本站差异化功能（重复 key 标注 `dup 1/2`、JSON 值识别）而不是纯 logo+标语，让分享预览图本身也是一次功能说明。
- **怎么验证**：`npm test` 295 用例通过；生成的各语言 `index.html` 里 `og:image` 标签已指向 `og-image.png`（grep 确认）。**没有做**的验证：Facebook Sharing Debugger / Twitter Card Validator 这类第三方 unfurl 实测——这两个工具需要目标 URL 公网可达且不被 P0 记录里提到的 Cloudflare 挑战页拦截，建议部署后你本人跑一次。
- **怎么回滚**：`git revert` 这次改 `scripts/template.html`、新增 `og-image.png`/`scripts/og-image.html` 的提交，重新 `npm run build`。

#### P4　sitemap 补 `<lastmod>`
- **做了什么**：`scripts/langs.js` 新增 `UPDATED_AT` 映射（每语言一个日期，手动维护，注释写明维护规则）；`scripts/build.js` 的 `buildSitemap()` 按语言输出 `<lastmod>`。
- **初始值怎么定的**：没有编造成"构建当天"。查了 `git log -1 -- scripts/i18n.js`，最后一次改动是 `f4c8e84`（2026-07-23，一次性给全部 7 个语言同时加了 About/FAQ 内容），确认这是目前为止 7 个语言共同的最后一次真实内容改动，于是 `updatedAt` 统一填 `2026-07-23`，不是今天的日期。
- **维护规则**：以后改某个语言在 `i18n.js` 里的文案时，同步手动把该语言的 `UPDATED_AT` 日期改掉；没改的语言不要跟着动——第一轮审计特意没做「每次 build 打今日戳」，就是怕这种全员误报「有更新」的信号长期拖累 Google 对本站 lastmod 的信任度，这次维持同一原则。
- **怎么验证**：`npm test` 通过；`sitemap.xml` 里全部 7 个 `<url>` 都带了 `<lastmod>2026-07-23</lastmod>`（cat 确认）。
- **怎么回滚**：`git revert` 对应改动，重新 `npm run build`。

### 本轮未执行
- **P1**（AI 爬虫是否受 Cloudflare 挑战页影响）、**P2**（域名根 `robots.txt`/`sitemap` 合并）——不在仓库代码范围内，等你确认 Cloudflare/域名根侧的操作权限。
- **P5**（新增 FAQ 长尾内容）——你这轮贴的通用建议里提到的"JS 里怎么解析 query string""UTM 参数提取"等方向，和第一轮「关键词与页面机会清单」基本重合，还没拍板要不要写，等你确认后再落成 `i18n.js` 里的 `faq` 条目。
- **反向链接、长尾关键词挖掘**——站外运营动作，不是仓库改动，本轮不涉及。
- 你贴的分析里"新站点通常经历评估期""纯功能性页面竞争难度较高"这类判断是通用假设，不是这个站点的实测数据，后续决策不建议当"已知事实"用。

### 下一轮触发条件
沿用第一轮「九、下一轮优化条件」；额外补一条：等你能直接从 GSC 导出或接 API 核实这轮转述的 26.8 平均排名等数字（尤其是聚合口径），再把它们从"用户转述"升级为本台账的"已知事实"。

---

## 2026-08-03　首轮全站审计（mode: 持续优化闭环）

### 输入口径（可追溯）
| 变量 | 取值 | 来源 |
|---|---|---|
| `website_url` | `https://app.lideguang.com/query-params-viewer/` | 代码 README / sitemap.xml / robots.txt，非用户填写的示例值 |
| `site_type` | 工具站（免费、纯前端、无账号） | 代码事实：package.json 描述、无后端/数据库依赖 |
| `core_business` | URL query params 解析 / 编辑 / 对比 / 分享，7 语言 | README |
| `target_users` | 全球开发者/技术从业者 | 用户确认 |
| `target_region` | 7 种语言均等优先级，不分主次 | 用户确认 |
| `languages` | en(根路径,默认) / zh / zh-hant / ja / ru / de / hi | langs.js |
| `conversion` | 站外分发/引用（自然搜索曝光、AI 答案引擎引用、分享外链），非购买/注册 | 用户确认（该站无账号体系，模板默认的转化定义不适用） |
| `tech_stack` | 静态单文件 HTML，`scripts/build.js` 从 `i18n.js`+`template.html`+`langs.js` 生成；无框架、无数据库；GitHub Pages 部署，经 `app.lideguang.com` 反向代理到 `/query-params-viewer/` 子路径；GA4 埋点 | 代码事实（README + 直接读源码） |
| `available_data` | Google Search Console、GA4（用户确认可提供，但本次会话没有直接 API/导出接入，见下方「待确认」） | 用户确认 |
| `mode` | 持续优化闭环 | 用户确认 |

### 已知事实 / 合理假设 / 待确认信息

**已知事实**（代码或实测确认）
- `npm test` 本地跑通，295 passed 0 failed，`build.js` 重新生成的产物与已提交文件字节级一致（无漂移）。
- 站点无图片（`grep -c '<img'` = 0），无外部字体，唯一外部资源是异步加载的 GA4 `gtag.js`；CWV 层面天然风险很低。
- 每语言页面 canonical / hreflang（含 `x-default`）在源码层面完整且与 sitemap 一致；`en/` 旧地址桩页用 canonical+meta refresh 正确处理（未与 noindex 冲突）。
- JSON-LD 的 `FAQPage` 与页面可见 FAQ 文案逐条比对一致；`WebApplication` 声明了 `isAccessibleForFree`、`featureList`、`inLanguage`。
- `robots.txt`（子路径版本，仓库内）显式放行 GPTBot / ClaudeBot / PerplexityBot / Google-Extended 等。
- 实测（2026-08-03，curl + WebFetch，各 3 次+）：`https://app.lideguang.com/query-params-viewer/`、`/en/`、`/zh/` 全部返回 **HTTP 403**，响应体是 Cloudflare 的 "Just a moment..." 挑战页，其中 `<meta name="robots" content="noindex,nofollow">`。用真实浏览器 UA、`Googlebot/2.1` UA、`GPTBot/1.0` UA 结果一致。响应头 `cf-mitigated: challenge`、`server: cloudflare`。
- 域名根 `https://app.lideguang.com/robots.txt` 可访问（200），但内容是通用版本（只有 `User-agent: * / Allow: /`），**不包含**本项目 `robots.txt` 里对 AI 爬虫的显式放行条目；其 `Sitemap:` 指向 `https://app.lideguang.com/sitemap.xml`，该地址本次同样返回 403（同一挑战页）。
- 本项目自己的子路径 `robots.txt`（`.../query-params-viewer/robots.txt`）和 `llms.txt` 可直接访问（200）；子路径 `sitemap.xml` 返回 403（同一挑战页拦截）。
- `sitemap.xml` 生成逻辑（`scripts/build.js:130-149`）不输出 `<lastmod>`（0 处）。
- `og:image` / `twitter:image` 指向 `favicon.svg`（SVG），没有任何位图资源。

**合理假设**（未直接验证，标注依据）
- 挑战页很可能是 Cloudflare 对**数据中心/云端出口 IP** 的 Bot Fight Mode 反应，而非对所有访客（含真实 Googlebot、真实用户浏览器）的无差别拦截——这是 Cloudflare 的常见行为模式（依据：Cloudflare 官方文档说明 Bot Fight Mode 通常放行经反向 DNS 验证的「Verified Bots」，包括 Googlebot）。但本次测试环境（本沙箱 + WebFetch 基础设施）大概率落在被判定为数据中心/代理的 IP 段，因此仅凭这几次测试**不能**排除真实 Googlebot 也被拦截的可能。
- 目标用户以开发者为主，这类用户使用 VPN、公司代理、云端 IDE/Codespaces 出口 IP 的比例显著高于一般消费者站点访客，因此即便 Googlebot 本身能通过，**相当一部分真实目标用户仍可能撞到同一挑战页**。

**待确认信息**（最关键、直接决定后续所有工作是否有意义）
1. **Googlebot 是否真的被挡**——需要你在 GSC 里对根 URL 跑一次「网址检查 → 测试实际网址」，看渲染出来的是真实页面还是挑战页，以及「页面编入索引」状态。这是本轮唯一无法由我代劳验证的关键项。
   - **补充证据（2026-08-03，用户实测）**：用户反馈真实浏览器访问 `/query-params-viewer`（不带斜杠）会正常重定向到带斜杠的规范地址，说明真实浏览器流量没有撞上 Cloudflare 挑战页——支持「挑战页主要针对数据中心/代理出口 IP，而非无差别拦截所有访客」这条假设，是好消息，但仍不能替代 GSC Live Test 对 Googlebot 本身的确认（爬虫和浏览器的信任评分机制不同，不能互相替代）。
zhe ge2. GSC/GA4 的真实点击、曝光、CTR、排名、事件数据——你确认可以提供，但本次会话没有连上 GSC/GA4 的 API 或收到导出文件，所以「第一阶段基线」目前是空的，下方指标部分先给口径和需要你导出的具体报表，不编造数字。
3. `app.lideguang.com` 域名根的 Cloudflare 设置、WAF 规则由谁管理——如果就是你本人/团队，P0 可以直接改；如果是第三方，需要先确认联系路径。

---

### 一、结论摘要

代码层面的技术 SEO 底子做得相当扎实（hreflang/canonical 互相自洽、结构化数据与可见内容一致、GEO 三件套齐全、无图无字体的极轻页面、295 个回归测试兜底）。上一版结论摘要曾把「Cloudflare 挑战页可能拦截 Googlebot」列为头号风险——**2026-08-03 用户在 GSC「网址检查 → 测试实际网址」上直接验证：`URL is available to Google` / `Page can be indexed` / 重定向状态码 `301`**，Googlebot 本身没有被挡，之前的挑战页只命中了我这边测试用的数据中心出口 IP，不影响 Google 的真实抓取。这条 P0 降级为已解决；但 GSC 只能代表 Google，GPTBot/ClaudeBot/PerplexityBot 是否同样不受影响仍待验证（见下方 P1-0）。

### 二、P0–P3 问题清单

#### ~~P0-1　边缘挑战页可能拦截真实爬虫~~ —— 已解决（2026-08-03 确认），但发现一条历史记录需要追踪
- **结论**：GSC Live Test 显示 Googlebot 可正常抓取并索引，之前 curl/WebFetch 遇到的 Cloudflare 挑战页只针对本次测试所用的数据中心/代理出口 IP，不代表 Googlebot 或普通浏览器访客受影响（用户实测真实浏览器访问也拿到正常的 301 重定向，与此一致）。
- **不需要**再对 Cloudflare Bot Fight Mode / WAF 做任何改动——**不要移除 `/query-params-viewer` → `/query-params-viewer/` 这条 301**。
- **补充排查（2026-08-03）**：GSC 索引覆盖面板（非 Live Test，是历史抓取记录）显示同一个 bare URL 在 `Last crawl: Jul 27, 2026` 被标记 `Page fetch: Failed: Redirect error`，referring page 是 `https://www.v2ex.com/t/1231175`。用户用浏览器 DevTools Network 面板复现了这一跳重定向：单跳、`301 Moved Permanently`、`location: https://app.lideguang.com/query-params-viewer/`，链路本身干净，没有成环或多跳。
  - **判断**：重定向链路本身没问题，不是「加了斜杠」导致的错误。真正需要解释的是「为什么 7 月 27 日那次真实抓取失败了，而今天的 Live Test 又成功了」——最可能的解释是 Cloudflare 当时对 Googlebot 的请求也做了同款机器人质询（和我这边沙箱 IP 遇到的是同一机制），之后自然变化或配置调整让今天的请求放行了；但也不能排除是一次偶发的、间歇性的拦截，以后还会再发生。
  - **下一步（不需要改代码）**：① 在 GSC 里对这个 URL 点 **Request Indexing**，强制触发一次新抓取，看状态是否翻正；② 如果之后 Google 真实抓取（不是 Live Test）又出现同样的 `Redirect error`，说明是间歇性问题，需要 Cloudflare 后台的 Bot Management/Firewall Events 日志按 Googlebot 的已验证 IP 段筛查，才能真正抓到现场——这一步同样超出本仓库代码范围，我这边也测不出来（同样会被挑战页拦住）。
  - **测试方法的边界（2026-08-03 补充）**：追加测试发现，同一时刻用「Googlebot 桌面版」「Googlebot smartphone（移动版，GSC 报告里写的正是这个）」两种精确 UA 字符串各测一次，结果都是 403+挑战页，和几小时前那次 UA 测试成功时的结果不一致。说明 Cloudflare 的机器人质询大概率是按**来源 IP / TLS 指纹**判定，而不是按 `User-Agent` 字符串——任何人都能在 curl 里把 UA 改成「Googlebot」，一个配置正确的 Cloudflare 不会仅凭这个字符串放行，而是按真实来源 IP 反查验证。也就是说，从本沙箱环境用 curl 伪装任何 UA，都无法真正验证「真实 Googlebot 是否被挡」——唯一可信的信号只有 GSC 自己的工具（Live Test / 真实抓取记录），这条排查路径到此为止，无法再靠本环境的请求测试进一步收窄。

#### P1　GPTBot / ClaudeBot / PerplexityBot 等 AI 爬虫是否同样不受挑战页影响——待验证
- **证据**：本项目 `robots.txt` 显式放行这些爬虫（`已知事实`第 30 条），但 GSC 的验证只覆盖 Google，不能代表其他答案引擎爬虫的真实抓取效果——它们各自的 IP 段、Cloudflare 里的 Verified Bot 名单覆盖情况都和 Googlebot 不同，不能类推。
- **影响**：如果这些爬虫和我的测试环境一样被判定为「非受信任来源」而挨挑战页，GEO（AI 答案引擎引用）这条转化路径仍可能受损，即使传统搜索这条已经确认没问题。
- **修改建议**：如果 Cloudflare 后台能看到 Bot Management / Firewall Events 日志，按 User-Agent 或 Cloudflare 的 Bot Category 筛选 GPTBot / ClaudeBot / PerplexityBot / Google-Extended，看是否有 `Managed Challenge` 或 `Block` 动作命中；没有日志权限的话，只能等这些爬虫自然来访后，从服务端日志或第三方引用结果里间接判断。
- **风险**：低（只读页面，若需要放宽同样是扩大 Verified Bot 允许名单）。
- **优先级**：从 P0 降为 P1——不再是「整个站点可能零收录」级别的风险，而是「一个次要分发渠道效果打折」级别。

#### P2　域名根 robots.txt / sitemap 尚未收纳本项目规则（README 已知风险，现已实测确认未合并）
- **证据**：域名根 `robots.txt` 内容与本项目子路径版本不同，未包含 AI 爬虫放行条目；其 `Sitemap:` 指向的 `https://app.lideguang.com/sitemap.xml` 本次请求仍是数据中心 IP 触发的挑战页，需要用真实/受信任来源重新确认该 sitemap 地址本身是否可达（和 Googlebot 是否被挡是两件独立的事，不能因为 P0-1 解决就默认这条也没问题）。
- **影响**：搜索引擎按惯例只认域名根 `robots.txt`，即使 Googlebot 能抓页面，也可能读不到本项目 sitemap，影响新页面的发现速度（不影响已被直接抓取的页面）。
- **位置**：域名根，不在本仓库；README 已经写明这是已知限制。
- **修改建议**：请负责 `app.lideguang.com` 根路径的一方，在域名根 `robots.txt` 追加一行 `Sitemap: https://app.lideguang.com/query-params-viewer/sitemap.xml`（多个 Sitemap 行合法，不需要替换现有内容），并视情况合并 AI 爬虫放行规则。
- **风险**：低，纯追加。
- **验证**：`curl https://app.lideguang.com/robots.txt` 能看到新增的 Sitemap 行；GSC Sitemaps 报告里提交并确认「成功」。

#### P3　分享/社交预览图是 SVG，绝大多数平台不渲染
- **证据**：`index.html:128,133`（`og:image`/`twitter:image` 均指向 `favicon.svg`）。
- **影响**：README 里「分享链接一律指向根路径」是本站重要的站外分发路径，但 X/Slack/LinkedIn/微信等平台的 unfurl 普遍不支持 SVG 做预览图，分享出去大概率没有图或图裂——直接削弱「转化=站外分发」这个目标的效果。
- **位置**：`scripts/i18n.js`（TDK 数据源）+ `scripts/template.html`（meta 输出）。
- **修改建议**：制作一张 1200×630 的 PNG/JPEG（可从现有 `favicon.svg` 品牌元素扩展），`og:image`/`twitter:image` 指向新资源，`twitter:card` 可考虑升级为 `summary_large_image`。
- **风险**：无（纯新增资源+改 meta 值，不动 URL/canonical）。
- **本轮未执行**：本环境没有 SVG 转位图工具（检查过 `rsvg-convert`/`cairosvg`/`convert`/`inkscape`，均不存在），且没有现成的 1200×630 设计稿，需要你提供或授权我用其他方式生成后再落地。

#### P4　sitemap 缺 `<lastmod>`
- **证据**：`scripts/build.js:130-149` 从未输出 `lastmod`；`grep -c lastmod sitemap.xml` = 0。
- **影响**：较小——主要影响搜索引擎的重新抓取优先级判断，不影响是否收录。
- **修改建议**：**不要**简单地在每次 build 时写「今天」当 lastmod——这个站是每次改任何语言都会重新生成全部 7 个页面，如果不分语言地打上构建当天日期，会对没有实际内容变化的语言页发出虚假的「有更新」信号，Google 长期会降低对该站 lastmod 的信任度（这是不确定信息不能包装成事实的具体例子）。正确做法需要按语言追踪真实最后改动时间，例如把 `i18n.js` 拆成按语言的文件（这样 git 层面每个文件的最后改动时间才有意义），或者在 `langs.js` 里手动维护一个 `updatedAt` 字段。
- **风险**：如果用「构建日期」这种简化实现，风险是误导抓取信号，比不加更差——所以本轮**不执行**，留给你二选一决定实现方式。

#### P5　产品差异化能力（嵌套 URL 展开、重复 key 保留、JSON 值识别）尚未对应到具体长尾内容
不是缺陷，是内容机会，见下方「关键词与页面机会清单」。

### 三、关键词与页面机会清单

这是免费工具站，模板里「购买意图」的框架按你的产品重新映射为「任务意图强度」：

**高任务意图（对应模板 60% 档）**——已经被首屏标题/描述/关键词覆盖，暂不需要新页面，等 P0 解决、GSC 数据可用后再看真实排名：
`parse url query params online` / `query string parser` / `decode url encoded string`

**产品直接关联的教程向（对应 25% 档，与差异化功能强绑定，非填充内容）**：
- 「如何在 JavaScript 里解析 query string / `URLSearchParams` 用法」——自然带出本工具作为「不用写代码」的替代路径
- 「redirect 参数里嵌套的 URL 怎么展开」——直接对应本站最独特的功能（3 层嵌套展开），竞争度大概率很低
- 「UTM 参数提取/解析」——同一功能换一个受众（增长/营销人员而非开发者），值得作为独立 FAQ 条目验证需求

**新主题实验（对应 15% 档，偏 GEO/答案引擎友好的概念性内容）**：
- 「query string 和 path parameter 的区别」——definition 类问题是 AI 答案引擎最爱引用的内容形态
- 「重复的 query key，浏览器/服务端分别怎么处理」——对应本站的重复 key 保留功能，别的工具通常不讲这个

**执行方式的约束**：本站架构是「每语言一个自包含单文件」，不建议为了这几条内容新开一套博客系统（属于中/高风险的架构变更，超出本轮低风险范围）。建议以新增 FAQ 条目的形式并入现有「关于 + FAQ」区块（`i18n.js` 里每语言的 `faq` 数组），这样结构化数据、可摘录正文、GEO 三件套自动复用，不需要新页面类型。是否要做，等你确认后再排进下一轮。

### 四、低风险执行顺序（本轮实际执行情况）

1. **P0（Googlebot 抓取）** —— 已通过 GSC Live Test 确认解决，无需操作。
2. **P1（AI 爬虫是否受挑战页影响）／P2（域名根 robots.txt/sitemap）** —— 不在本仓库代码范围内，需要你在 Cloudflare/域名根侧操作或查日志，我可以在你确认权限后协助起草具体规则文案。
3. **P3（og:image）** —— 需要一张新设计资源，本环境无法生成，本轮未执行。
4. **P4（lastmod）** —— 需要你先决定实现方式（拆分 i18n.js 按语言 vs 手动维护 updatedAt），本轮未执行。
5. **P5（新 FAQ 内容）** —— 需要你确认是否要新增这几条 FAQ，本轮未执行。

**本轮没有对仓库做任何代码改动**——不是因为没发现问题，而是发现的问题要么在仓库外（P0），要么需要一个新资源或一次设计决策才能算「低风险」（P1/P2/P3）。这是刻意的：宁可不动，也不做一个看似低风险实则可能误导抓取信号或交付半成品占位图的改动。

### 五、需要新增或更新的内容
见「三、关键词与页面机会清单」——三条 FAQ 候选，等你拍板后我来改 `scripts/i18n.js` 并跑 `npm test` 验证。

### 六、预计影响与风险
- P0 已确认解决：Googlebot 抓取无阻碍，站点具备被正常收录的前提条件，但具体流量/排名表现仍要等 GSC 历史数据积累后才能评估（不编造数字）。
- P1（AI 爬虫）：如果成立，影响的是 GEO/AI 引用这条相对新的分发渠道，不影响已确认无恙的传统搜索。
- P2/P3/P4/P5：影响相对边际，主要是 sitemap 发现速度、分享转化率和长尾内容覆盖的渐进提升。

### 七、测试、发布和回滚方案
- 本仓库已有 `npm test`（build + jsdom 回归，295 用例）作为发布前必过关卡，后续任何 `i18n.js`/`template.html`/`build.js` 改动都按此跑一遍。
- 生成文件（`index.html` 各语言版本、`sitemap.xml`、`llms.txt`）都是可重现产物，回滚 = `git revert` 对应的源文件改动后重新 `npm run build`。
- Cloudflare/域名根侧的改动不受本仓库回滚控制，操作前建议截图/导出当前规则作为回滚依据。

### 八、7/14/28 天监测指标
待你接入 GSC/GA4 后按以下口径导出（不编造具体数字）：
- **曝光/点击/CTR/平均排名**：GSC 效果报告，按页面+国家维度，作为本轮之后的基线起点（P0 已确认无抓取问题，此后曝光量应能正常积累，如长期接近 0 需回头重新排查）。
- **索引状态**：GSC 索引报告，7 个语言 URL 是否都是「已编入索引」。
- **分享/GA4 事件**：`share_link_generated`（如埋点里有对应事件名，需核对实际事件名）的次数变化，作为「站外分发」这个转化定义的直接代理指标。
- 明确区分：曝光（GSC impressions）≠ 点击（GSC clicks）≠ 站外引用（第三方反链/AI 引用，目前没有自动化监测手段，只能人工抽查）。

### 九、下一轮优化条件
P0 已解决。满足以下任一条件即可开始下一轮：
1. 你确认 Cloudflare 是否有 Bot Management/Firewall Events 日志可查，用于验证 P1（AI 爬虫），或
2. 域名根 robots.txt 完成 P2 的 Sitemap 行追加并可重新验证，或
3. 你对 P3（图片资源）/P4（lastmod 实现方式）/P5（新增 FAQ）任一项给出决定，或
4. GSC 积累出真实曝光/点击数据，可以开始按「已知事实」而非「待确认」做下一轮基线分析。

数据没有改善时，先确认是否是 P1/P2 这类次要分发渠道问题，而不是回头怀疑已经用 GSC Live Test 确认过的 Googlebot 抓取能力，避免做盲目的批量内容改动。
