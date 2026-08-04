# 政务 AI 原型图标 SVG 全量包

本包是当前原型除文件类型图标外的全量 UI 图标设计稿，已按“知识库目录”中的图标样式统一重绘。

## 风格标准

- 64 x 64 SVG 画布。
- 46 x 46 圆角色块，浅色渐变底与白色内描边。
- 主题色线面结合图形，保持和知识库目录图标一致的轻量、柔和、易识别。
- 主色沿用红色，同时扩展蓝、绿、青、紫、橙、金、灰，避免所有图标都过度单一。

## 内容

- `icons/`：单个 SVG 图标。
- `prototype-icons-sprite.svg`：整包 sprite。
- `prototype-icon-manifest.json`：图标映射 JSON，含每个图标的使用位置。
- `ICON_USAGE.md`：中文说明书，适合直接给设计或前端研发对照。
- `preview.html`：图标预览页面。
- `generate-prototype-icons.mjs`：后续增补图标的生成脚本。

## 分类

- `navigation`（左侧导航 / 主入口）：12 个
- `feature`（首页与功能卡片）：10 个
- `writing`（智能公文写作流程）：10 个
- `knowledge`（知识库目录与素材管理）：12 个
- `admin`（后台管理）：12 个
- `model`（模型配置与深度思考）：6 个
- `action`（通用操作按钮）：16 个
- `status`（状态提示）：5 个
- `security`（安全与可信标识）：3 个
- `user`（用户与专家头像）：2 个

## 前端使用

```tsx
const iconUrl = `/prototype-icons-svg/icons/nav-ai-write.svg`;
```

Sprite usage:

```html
<svg width="24" height="24">
  <use href="./prototype-icons-sprite.svg#prototype-icon-nav-ai-write"></use>
</svg>
```

完整位置映射请看 `prototype-icon-manifest.json` 或 `ICON_USAGE.md`。
