# zbanx-ui

基于 [shadcn registry](https://ui.shadcn.com/docs/registry) 机制的独立组件库，
复用 `shadcn` CLI 分发，开箱即用。

共 **113** 个 registry 项：`ui` 基础组件（49）· `custom` 自研业务组件（8）·
`ai-elements` AI 对话组件（48）· `ai-agents`（2）· `atom` 原子组件（2）·
`hooks`（2）· `lib` 工具函数（2）。

- 组件源码：`registry/zbanx/`（按分类拆分为 7 个 `registry.json` 分片）
- 注册入口：根目录 `registry.json`（`name: zbanx-ui`，通过 `include` 组合各分片）
- 分发方式：GitHub registry，消费方直接从本仓库安装，无需额外部署服务
- 预览站：`/` 分类索引 + `/preview/[name]` 组件文档（安装命令、依赖、文件落点、源码），新增组件自动收录

## 安装组件

```bash
# 方式一：GitHub 直装（无需任何配置）
bunx --bun shadcn@latest add zbanx-ai/zbanx-ui/<name>

# 方式二：命名空间（每个项目只需配置一次）
bunx --bun shadcn@latest registry add @zbanx=https://zbanx-ai.github.io/zbanx-ui/r/{name}.json
bunx --bun shadcn@latest add @zbanx/<name>
```

示例：

```bash
bunx --bun shadcn@latest add zbanx-ai/zbanx-ui/popover-confirm
bunx --bun shadcn@latest add zbanx-ai/zbanx-ui/button
bunx --bun shadcn@latest add zbanx-ai/zbanx-ui/use-mobile
```

安装时 CLI 会自动处理 `dependencies`（npm 包）、`registryDependencies`
（依赖的其他组件）以及文件落点（`@ui` / `@components` / `@hooks` /
`@lib` 按消费方 `components.json` 解析）。

## 本地开发

```bash
bun install
bun dev            # 预览站：/ 索引 + /preview/[name] 文档
bunx --bun shadcn@latest build  # 校验 registry，重新生成 public/r/
bun run build      # 预览站生产构建
```

## 新增组件

1. 把源码放到 `registry/zbanx/` 对应分类下：
   - 基础单文件组件 → `registry/zbanx/ui/<name>.tsx`
   - 复合/业务组件 → `registry/zbanx/custom/<name>/index.tsx`
   - Hook → `registry/zbanx/hooks/<name>.ts`
   - 工具函数 → `registry/zbanx/lib/<name>.ts`
2. 在同目录的 `registry.json` 分片中追加一项（参考同类条目）：
   - `name` 全局唯一；`type` 按种类填写
    （`registry:ui` / `registry:component` / `registry:hook` / `registry:lib`）
   - `files[].path` 相对分片所在目录；`target` 使用 `@ui` / `@components` /
     `@hooks` / `@lib` 占位符
   - `dependencies` 声明 npm 包；`registryDependencies` 声明依赖的站内组件
3. 源码内的站内引用统一使用 `@/registry/zbanx/...`，
   工具函数使用 `@/lib/utils`（CLI 安装时会自动重写为消费方路径）
4. 运行 `bunx --bun shadcn@latest build` 校验，通过后预览站会自动出现新组件文档页

## 目录结构

```
registry.json                  # 注册入口（name/homepage/include）
registry/zbanx/
  ui/registry.json             # 基础组件 + 各组件源码
  custom/registry.json         # 自研组件（每组件一目录）
  ai-elements/registry.json    # AI 对话组件
  ai-agents/registry.json
  atom/registry.json
  hooks/registry.json          # use-mobile、use-countdown
  lib/registry.json            # utils（cn）、color
lib/
  utils.ts                     # cn()，本地开发与预览用
  registry.ts                  # 预览站读取 registry 的服务端工具
app/
  page.tsx                     # 分类索引页
  preview/[name]/page.tsx      # 组件文档页（构建时静态生成）
```

## 相关文档

- [Registry: Getting Started](https://ui.shadcn.com/docs/registry/getting-started)
- [GitHub Registries](https://ui.shadcn.com/docs/registry/github)
- [Namespaces](https://ui.shadcn.com/docs/registry/namespace)
- [registry.json 规范](https://ui.shadcn.com/docs/registry/registry-json)
- [registry-item.json 规范](https://ui.shadcn.com/docs/registry/registry-item-json)
