## 0.1.4 - 2026-04-05

### Fixes
- 回退 `open-next.config.ts` 中不兼容当前类型定义的发布配置，恢复可通过 TypeScript 构建检查的 Cloudflare 发布链路。

## 0.1.3 - 2026-04-05

### Fixes
- 修复 Cloudflare 发布链路的构建器选择问题，显式指定 `bun run build`，避免 OpenNext 在本仓库误用 `npm run build`。

## 0.1.2 - 2026-04-05

### Fixes
- 修复公开抽奖页的口令访问校验，错误口令现在会明确提示且阻止抽奖记录写入。
- 修复抽奖编辑与删除接口的返回语义，未命中资源时统一返回 404。
- 修复 Supabase `service_role` 被 `FORCE RLS` 误伤的问题，新增迁移恢复服务端应有权限。
- 改进公开页访问计数与 Dashboard 错误处理，减少静默失败。

### UX
- 统一全局 Toast 注入，移除重复挂载。
- 精简编辑器与公开页部分实现，补充更安全的配置迁移与图片上传体验。
