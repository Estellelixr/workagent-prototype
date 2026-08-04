# 政务 AI 原型图标使用说明

这套图标按照知识库目录截图中的图标标准重绘：圆角色块、浅色渐变底、轻阴影、主题色线面结合图形。红色为主品牌色，同时补充蓝、绿、青、紫、橙、金和灰色，便于区分不同业务模块。

## 交付文件

- `icons/`：单个 SVG，64 x 64。
- `prototype-icons-sprite.svg`：SVG Symbol Sprite。
- `prototype-icon-manifest.json`：研发映射 JSON，包含分类、色系、文件路径、使用位置说明。
- `ICON_USAGE.md`：当前说明书。
- `preview.html`：图标总览预览页。

## 图标映射

| 图标 Key | 中文位置说明 | 分类 | 文件 |
| --- | --- | --- | --- |
| `nav-home` | 首页入口、顶部或侧边栏首页图标 | 左侧导航 / 主入口 | `icons/nav-home.svg` |
| `nav-new-task` | 新建任务入口 | 左侧导航 / 主入口 | `icons/nav-new-task.svg` |
| `nav-smart-doc` | 智能公文一级菜单 | 左侧导航 / 主入口 | `icons/nav-smart-doc.svg` |
| `nav-ai-write` | AI写作菜单项 | 左侧导航 / 主入口 | `icons/nav-ai-write.svg` |
| `nav-ai-copy` | AI仿写菜单项 | 左侧导航 / 主入口 | `icons/nav-ai-copy.svg` |
| `nav-ai-polish` | AI润色菜单项 | 左侧导航 / 主入口 | `icons/nav-ai-polish.svg` |
| `nav-layout` | 智能排版菜单项 | 左侧导航 / 主入口 | `icons/nav-layout.svg` |
| `nav-proofread` | 智能校对菜单项 | 左侧导航 / 主入口 | `icons/nav-proofread.svg` |
| `nav-knowledge` | 知识库主菜单入口 | 左侧导航 / 主入口 | `icons/nav-knowledge.svg` |
| `nav-expert` | 专家管理入口 | 左侧导航 / 主入口 | `icons/nav-expert.svg` |
| `nav-admin` | 后台管理入口 | 左侧导航 / 主入口 | `icons/nav-admin.svg` |
| `nav-history` | 历史对话入口 | 左侧导航 / 主入口 | `icons/nav-history.svg` |
| `feature-smart-qa` | 首页问答输入区或智能问答能力卡片 | 首页与功能卡片 | `icons/feature-smart-qa.svg` |
| `feature-ai-write` | 首页 AI 写作功能卡片 | 首页与功能卡片 | `icons/feature-ai-write.svg` |
| `feature-ai-copy` | 首页 AI 仿写功能卡片 | 首页与功能卡片 | `icons/feature-ai-copy.svg` |
| `feature-ai-polish` | 首页 AI 润色功能卡片 | 首页与功能卡片 | `icons/feature-ai-polish.svg` |
| `feature-proofread` | 首页智能校对功能卡片 | 首页与功能卡片 | `icons/feature-proofread.svg` |
| `feature-layout` | 首页智能排版功能卡片 | 首页与功能卡片 | `icons/feature-layout.svg` |
| `feature-ppt` | PPT汇报大纲 / PPT生成入口 | 首页与功能卡片 | `icons/feature-ppt.svg` |
| `feature-table` | 表格数据提取 / 智能表格入口 | 首页与功能卡片 | `icons/feature-table.svg` |
| `feature-web-office` | WebOffice 编辑器入口 | 首页与功能卡片 | `icons/feature-web-office.svg` |
| `feature-red-template` | 红头模板、公文模板入口 | 首页与功能卡片 | `icons/feature-red-template.svg` |
| `write-mode-full` | AI写作第一步：生成全文卡片 | 智能公文写作流程 | `icons/write-mode-full.svg` |
| `write-mode-outline` | AI写作第一步：生成大纲卡片 | 智能公文写作流程 | `icons/write-mode-outline.svg` |
| `write-mode-outline-to-text` | AI写作第一步：大纲成文卡片 | 智能公文写作流程 | `icons/write-mode-outline-to-text.svg` |
| `write-mode-continue` | AI写作第一步：继续写卡片 | 智能公文写作流程 | `icons/write-mode-continue.svg` |
| `write-mode-conclusion` | AI写作第一步：生成结语卡片 | 智能公文写作流程 | `icons/write-mode-conclusion.svg` |
| `write-step-mode` | 起草公文流程步骤：写作模式 | 智能公文写作流程 | `icons/write-step-mode.svg` |
| `write-step-scene` | 起草公文流程步骤：场景选择 | 智能公文写作流程 | `icons/write-step-scene.svg` |
| `write-step-info` | 起草公文流程步骤：基础信息 | 智能公文写作流程 | `icons/write-step-info.svg` |
| `write-step-materials` | 起草公文流程步骤：参考素材 | 智能公文写作流程 | `icons/write-step-materials.svg` |
| `write-step-result` | 起草公文流程步骤：生成结果 | 智能公文写作流程 | `icons/write-step-result.svg` |
| `knowledge-personal` | 知识库目录：个人知识库一级节点 | 知识库目录与素材管理 | `icons/knowledge-personal.svg` |
| `knowledge-department` | 知识库目录：部门知识库一级节点 | 知识库目录与素材管理 | `icons/knowledge-department.svg` |
| `knowledge-resource` | 知识库目录：资源素材库一级节点 | 知识库目录与素材管理 | `icons/knowledge-resource.svg` |
| `knowledge-public` | 知识库目录：公共素材库一级节点 | 知识库目录与素材管理 | `icons/knowledge-public.svg` |
| `knowledge-recent` | 知识库目录：最近入口 | 知识库目录与素材管理 | `icons/knowledge-recent.svg` |
| `knowledge-folder` | 知识库目录：普通文件夹 | 知识库目录与素材管理 | `icons/knowledge-folder.svg` |
| `knowledge-folder-open` | 知识库目录：展开状态文件夹 | 知识库目录与素材管理 | `icons/knowledge-folder-open.svg` |
| `knowledge-new-file` | 知识库：添加文件 / 新建文件 | 知识库目录与素材管理 | `icons/knowledge-new-file.svg` |
| `knowledge-import` | 知识库：导入文件 | 知识库目录与素材管理 | `icons/knowledge-import.svg` |
| `knowledge-smart-search` | 知识库搜索框：智能检索开关 | 知识库目录与素材管理 | `icons/knowledge-smart-search.svg` |
| `knowledge-readonly` | 知识库：只读公共资料标识 | 知识库目录与素材管理 | `icons/knowledge-readonly.svg` |
| `knowledge-storage` | 知识库：存储容量、资料库统计 | 知识库目录与素材管理 | `icons/knowledge-storage.svg` |
| `admin-users` | 后台管理：用户管理 | 后台管理 | `icons/admin-users.svg` |
| `admin-org` | 后台管理：组织架构 | 后台管理 | `icons/admin-org.svg` |
| `admin-role` | 后台管理：角色权限 | 后台管理 | `icons/admin-role.svg` |
| `admin-menu` | 后台管理：菜单管理 | 后台管理 | `icons/admin-menu.svg` |
| `admin-model` | 后台管理：模型管理 | 后台管理 | `icons/admin-model.svg` |
| `admin-prompt` | 后台管理：提示词管理 | 后台管理 | `icons/admin-prompt.svg` |
| `admin-template` | 后台管理：模板管理 | 后台管理 | `icons/admin-template.svg` |
| `admin-material` | 后台管理：素材管理 | 后台管理 | `icons/admin-material.svg` |
| `admin-agent` | 后台管理：智能体管理 | 后台管理 | `icons/admin-agent.svg` |
| `admin-connector` | 后台管理：接口 / 连接器管理 | 后台管理 | `icons/admin-connector.svg` |
| `admin-audit` | 后台管理：审计日志 | 后台管理 | `icons/admin-audit.svg` |
| `admin-system` | 后台管理：系统设置 | 后台管理 | `icons/admin-system.svg` |
| `model-main` | 模型选择下拉框：主模型 | 模型配置与深度思考 | `icons/model-main.svg` |
| `model-deep-thinking` | 深度思考开关 | 模型配置与深度思考 | `icons/model-deep-thinking.svg` |
| `model-reasoning` | 推理链 / 解析过程 | 模型配置与深度思考 | `icons/model-reasoning.svg` |
| `model-test` | 模型连通性测试 | 模型配置与深度思考 | `icons/model-test.svg` |
| `model-key` | API Key / 密钥配置 | 模型配置与深度思考 | `icons/model-key.svg` |
| `model-secure` | 安全模型 / 内网可信模型 | 模型配置与深度思考 | `icons/model-secure.svg` |
| `action-add` | 通用操作：新增 | 通用操作按钮 | `icons/action-add.svg` |
| `action-upload` | 通用操作：上传 | 通用操作按钮 | `icons/action-upload.svg` |
| `action-download` | 通用操作：下载 | 通用操作按钮 | `icons/action-download.svg` |
| `action-save` | 通用操作：保存 | 通用操作按钮 | `icons/action-save.svg` |
| `action-edit` | 通用操作：编辑 | 通用操作按钮 | `icons/action-edit.svg` |
| `action-delete` | 通用操作：删除 | 通用操作按钮 | `icons/action-delete.svg` |
| `action-search` | 通用操作：搜索 | 通用操作按钮 | `icons/action-search.svg` |
| `action-refresh` | 通用操作：刷新 | 通用操作按钮 | `icons/action-refresh.svg` |
| `action-send` | 通用操作：发送 | 通用操作按钮 | `icons/action-send.svg` |
| `action-back` | 通用操作：返回 | 通用操作按钮 | `icons/action-back.svg` |
| `action-next` | 通用操作：下一步 | 通用操作按钮 | `icons/action-next.svg` |
| `action-close` | 通用操作：关闭 | 通用操作按钮 | `icons/action-close.svg` |
| `action-more` | 通用操作：更多 | 通用操作按钮 | `icons/action-more.svg` |
| `action-filter` | 通用操作：筛选 | 通用操作按钮 | `icons/action-filter.svg` |
| `action-pin` | 通用操作：置顶 / 固定 | 通用操作按钮 | `icons/action-pin.svg` |
| `action-copy` | 通用操作：复制 | 通用操作按钮 | `icons/action-copy.svg` |
| `status-success` | 状态提示：成功 | 状态提示 | `icons/status-success.svg` |
| `status-warning` | 状态提示：警告 | 状态提示 | `icons/status-warning.svg` |
| `status-error` | 状态提示：错误 | 状态提示 | `icons/status-error.svg` |
| `status-info` | 状态提示：信息 | 状态提示 | `icons/status-info.svg` |
| `status-loading` | 状态提示：加载中 | 状态提示 | `icons/status-loading.svg` |
| `security-shield` | 安全办公、安全防护标识 | 安全与可信标识 | `icons/security-shield.svg` |
| `security-lock` | 权限锁定、私密内容 | 安全与可信标识 | `icons/security-lock.svg` |
| `security-trusted` | 安全办公 · 内网可信徽标 | 安全与可信标识 | `icons/security-trusted.svg` |
| `user-avatar` | 侧边栏用户头像 / 默认用户 | 用户与专家头像 | `icons/user-avatar.svg` |
| `expert-avatar` | 专家头像 / 专家库默认头像 | 用户与专家头像 | `icons/expert-avatar.svg` |
