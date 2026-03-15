# 礼遇 (LiYu)

一个面向「心意表达 + 互动抽奖」场景的 Web 应用。  
你可以快速创建活动、配置玩法与奖品、设置分享权限，并通过链接邀请参与者完成抽奖互动。

## 核心能力

- 多玩法抽奖：大转盘、老虎机、翻卡牌、盲盒、刮刮卡
- 活动编辑器：文案、奖品、封面、实时预览、自动保存
- 分享权限：公开访问 / 口令访问 / 关闭访问
- 数据统计：访问次数、抽奖次数、中奖记录
- 鉴权与数据：Clerk + Supabase

## 技术栈

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4 + shadcn/ui + Base UI
- Clerk (Auth)
- Supabase (Database + RPC)
- Sonner (Toast)

## 本地开发

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写：

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3) 启动开发环境

```bash
npm run dev
```

默认地址：`http://localhost:3000`

## 常用脚本

- `npm run dev`：开发模式
- `npm run build`：生产构建（含 TypeScript 检查）
- `npm run start`：启动生产服务
- `npm run lint`：项目 lint（当前 Next 16 下可能需按项目实际配置调整）

## 数据结构与关键字段

`lotteries.config` 中建议关注：

- `gameType`: 抽奖玩法
- `gifts`: 奖品列表
- `showPrizeList`: 是否在活动页展示奖品内容
- `shareMode`: `public | passcode | closed`
- `sharePasscode`: 口令访问时使用

## 性能优化（已落地）

- 抽奖组件按需加载，降低单页首屏 JS 负担
- 头像与用户上传图像增加懒加载与异步解码
- 登录/注册页去除多余嵌套结构，减少无效层级
- 保持关键页面样式统一，降低渲染抖动与重排风险

## 品牌与视觉

- 品牌名：**礼遇**
- 站点 Logo：Apple App Icon 风格 — 珊瑚玫瑰渐变底色 + 礼盒星芒图标（`BrandLogo` + `public/favicon.svg`）
- 主题关键词：温暖、精致、惊喜感、清晰可控

## 部署建议

- 平台：Vercel（推荐）
- 确保生产环境 Clerk / Supabase 环境变量完整
- 若启用口令访问，建议结合服务端校验与访问日志策略
