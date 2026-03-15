# 04 技术架构与选型

## 总体原则

- **前后一体**：单仓库、统一部署，便于迭代与一致性。
- **托管优先**：认证、数据库、部署尽量用成熟托管服务，减少自建运维。
- **体验优先**：首屏与抽奖页可静态或边缘渲染，接口与脚本按需加载。

## 推荐技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| **框架** | Next.js (App Router) | SSR/SSG、API Routes、中间件、与 Vercel 生态契合 |
| **语言** | TypeScript | 类型安全、接口与配置可维护 |
| **样式** | Tailwind CSS v4 | 原子类、设计 token 易统一、打包可控 |
| **组件/设计系统** | shadcn/ui + Base UI 原语 | 无强依赖、可定制、与 Tailwind 一致；或 Radix 系 |
| **认证** | Clerk | 登录/注册/UserButton 开箱、支持中文、Next 集成好 |
| **数据库** | Supabase (Postgres) | 托管、RLS 可选、REST/实时可选；或 Vercel Postgres |
| **字体** | Geist / 思源黑体 / 霞鹜文楷（中文） | 清晰可读、与产品调性匹配 |
| **图标** | Lucide React | 统一风格、按需引入、与 shadcn 常用搭配 |
| **转盘** | lucky-canvas 或自绘 Canvas/SVG | 满足「转盘 + 随机停」即可；lucky-canvas 现成 |
| **部署** | Vercel | 与 Next 同源、预览与生产环境清晰 |

## 数据模型（核心）

- **lotteries**：id, clerk_user_id, slug(unique), title, **status** (`draft` | `published`), config(JSONB), created_at, updated_at  
  - status：`draft`（新建默认）→ 创建者点击发布后变为 `published`；已发布后可继续编辑（热更新），也可取消发布回到草稿。
  - config：introMessages、emojiList、contactPerson、prizes、avatarUrl 等。
- **prize_logs**：id, lottery_id, time, prize, prize_text, prize_icon, notification, ip, location, user_agent, created_at  
  - 与 lotteries 一对多，按 lottery_id 查记录。

API 设计：REST 风格；列表/单条/创建/更新/删除由 Next API Routes 或 Server Actions 调用 Supabase；`/l/[slug]` 用服务端按 slug 取活动（仅返回 `status = published` 的活动，草稿返回占位页），抽奖结果 POST 到 `/api/lottery/slug/[slug]/log-prize`。工作台编辑采用 **debounced auto-save**（防抖自动保存，间隔 ~800ms），减少手动保存心智负担。

## 安全与性能

- 所有写操作（创建/更新/删除活动、写记录）校验当前用户或 slug 归属。
- 敏感环境变量不落前端；Clerk、Supabase 密钥仅服务端使用。
- 抽奖页：Lucky Canvas 脚本 `afterInteractive` 或懒加载，避免阻塞首屏；关键 CSS 内联或优先加载。

## 扩展预留

- 多活动类型（仅转盘 / 九宫格等）：config 内 type 字段 + 前端分支渲染。
- 数据导出：在记录页增加「导出 CSV」接口与按钮。
- 多语言：i18n key 与路由可先预留，文案先中文。
