import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const outDir = new URL('./', import.meta.url);
const iconsDir = new URL('./icons/', outDir);

const palette = {
  red: { color: '#E84D63', soft: '#FFF2F5', soft2: '#FFE5EA', deep: '#B51F33' },
  blue: { color: '#58A9EE', soft: '#EFF8FF', soft2: '#DCEFFF', deep: '#2D78C5' },
  teal: { color: '#53B7AA', soft: '#ECFBF8', soft2: '#DDF6F0', deep: '#198376' },
  green: { color: '#51B77A', soft: '#EFFBF4', soft2: '#DDF4E8', deep: '#277E51' },
  orange: { color: '#EF8A55', soft: '#FFF5EE', soft2: '#FFE6D6', deep: '#BA5626' },
  violet: { color: '#8B79E6', soft: '#F7F5FF', soft2: '#E9E6FF', deep: '#5E50BA' },
  slate: { color: '#7D899A', soft: '#F5F7FA', soft2: '#E8EEF5', deep: '#526070' },
  gold: { color: '#D99A00', soft: '#FFF8E5', soft2: '#FFEDBD', deep: '#9A6700' },
  cyan: { color: '#42A7C4', soft: '#EFFBFF', soft2: '#D9F3FA', deep: '#14758D' },
};

const iconSet = [
  ['nav-home', 'Home', 'navigation', 'blue', 'home'],
  ['nav-new-task', 'New task', 'navigation', 'red', 'penSpark'],
  ['nav-smart-doc', 'Smart document', 'navigation', 'red', 'documentAi'],
  ['nav-ai-write', 'AI writing', 'navigation', 'red', 'pen'],
  ['nav-ai-copy', 'AI imitation', 'navigation', 'violet', 'layers'],
  ['nav-ai-polish', 'AI polish', 'navigation', 'orange', 'spark'],
  ['nav-layout', 'Smart layout', 'navigation', 'teal', 'stamp'],
  ['nav-proofread', 'Proofread', 'navigation', 'green', 'checkDoc'],
  ['nav-knowledge', 'Knowledge base', 'navigation', 'blue', 'folder'],
  ['nav-expert', 'Expert management', 'navigation', 'violet', 'briefcase'],
  ['nav-admin', 'Admin console', 'navigation', 'slate', 'settings'],
  ['nav-history', 'History', 'navigation', 'slate', 'history'],

  ['feature-smart-qa', 'Smart Q&A', 'feature', 'cyan', 'message'],
  ['feature-ai-write', 'AI write card', 'feature', 'red', 'penSpark'],
  ['feature-ai-copy', 'AI imitate card', 'feature', 'violet', 'copyStyle'],
  ['feature-ai-polish', 'AI polish card', 'feature', 'orange', 'spark'],
  ['feature-proofread', 'Proofread card', 'feature', 'green', 'shieldCheck'],
  ['feature-layout', 'Layout card', 'feature', 'teal', 'stamp'],
  ['feature-ppt', 'PPT creation', 'feature', 'orange', 'presentation'],
  ['feature-table', 'Smart table', 'feature', 'green', 'table'],
  ['feature-web-office', 'WebOffice editor', 'feature', 'blue', 'editor'],
  ['feature-red-template', 'Red header template', 'feature', 'red', 'template'],

  ['write-mode-full', 'Generate full text', 'writing', 'red', 'documentAi'],
  ['write-mode-outline', 'Generate outline', 'writing', 'blue', 'list'],
  ['write-mode-outline-to-text', 'Outline to text', 'writing', 'teal', 'mergeDoc'],
  ['write-mode-continue', 'Continue writing', 'writing', 'violet', 'continueWrite'],
  ['write-mode-conclusion', 'Conclusion', 'writing', 'orange', 'ending'],
  ['write-step-mode', 'Writing mode step', 'writing', 'red', 'target'],
  ['write-step-scene', 'Scene selection step', 'writing', 'blue', 'compass'],
  ['write-step-info', 'Basic info step', 'writing', 'teal', 'clipboard'],
  ['write-step-materials', 'Reference material step', 'writing', 'orange', 'folderPlus'],
  ['write-step-result', 'Generate result step', 'writing', 'violet', 'rocket'],

  ['knowledge-personal', 'Personal knowledge', 'knowledge', 'blue', 'userFolder'],
  ['knowledge-department', 'Department knowledge', 'knowledge', 'violet', 'orgFolder'],
  ['knowledge-resource', 'Resource library', 'knowledge', 'teal', 'archive'],
  ['knowledge-public', 'Public library', 'knowledge', 'green', 'globe'],
  ['knowledge-recent', 'Recent files', 'knowledge', 'slate', 'clock'],
  ['knowledge-folder', 'Folder', 'knowledge', 'blue', 'folder'],
  ['knowledge-folder-open', 'Open folder', 'knowledge', 'blue', 'folderOpen'],
  ['knowledge-new-file', 'New file', 'knowledge', 'red', 'filePlus'],
  ['knowledge-import', 'Import file', 'knowledge', 'green', 'upload'],
  ['knowledge-smart-search', 'Smart retrieval', 'knowledge', 'violet', 'smartSearch'],
  ['knowledge-readonly', 'Readonly public', 'knowledge', 'slate', 'lock'],
  ['knowledge-storage', 'Storage usage', 'knowledge', 'cyan', 'database'],

  ['admin-users', 'Users', 'admin', 'blue', 'users'],
  ['admin-org', 'Organization', 'admin', 'teal', 'org'],
  ['admin-role', 'Role management', 'admin', 'violet', 'badge'],
  ['admin-menu', 'Menu management', 'admin', 'slate', 'menuTree'],
  ['admin-model', 'Model management', 'admin', 'cyan', 'cpu'],
  ['admin-prompt', 'Prompt management', 'admin', 'red', 'prompt'],
  ['admin-template', 'Template management', 'admin', 'orange', 'template'],
  ['admin-material', 'Material library', 'admin', 'blue', 'library'],
  ['admin-agent', 'Agent management', 'admin', 'violet', 'bot'],
  ['admin-connector', 'Connector management', 'admin', 'teal', 'link'],
  ['admin-audit', 'Audit log', 'admin', 'gold', 'audit'],
  ['admin-system', 'System settings', 'admin', 'slate', 'settings'],

  ['model-main', 'Main model', 'model', 'cyan', 'cpu'],
  ['model-deep-thinking', 'Deep thinking', 'model', 'violet', 'brain'],
  ['model-reasoning', 'Reasoning chain', 'model', 'red', 'network'],
  ['model-test', 'Connectivity test', 'model', 'green', 'pulse'],
  ['model-key', 'API key', 'model', 'gold', 'key'],
  ['model-secure', 'Secure model', 'model', 'green', 'shieldCheck'],

  ['action-add', 'Add', 'action', 'red', 'plus'],
  ['action-upload', 'Upload', 'action', 'green', 'upload'],
  ['action-download', 'Download', 'action', 'blue', 'download'],
  ['action-save', 'Save', 'action', 'teal', 'save'],
  ['action-edit', 'Edit', 'action', 'orange', 'edit'],
  ['action-delete', 'Delete', 'action', 'red', 'trash'],
  ['action-search', 'Search', 'action', 'slate', 'search'],
  ['action-refresh', 'Refresh', 'action', 'blue', 'refresh'],
  ['action-send', 'Send', 'action', 'red', 'send'],
  ['action-back', 'Back', 'action', 'slate', 'back'],
  ['action-next', 'Next', 'action', 'red', 'next'],
  ['action-close', 'Close', 'action', 'slate', 'close'],
  ['action-more', 'More', 'action', 'slate', 'more'],
  ['action-filter', 'Filter', 'action', 'violet', 'filter'],
  ['action-pin', 'Pin', 'action', 'gold', 'pin'],
  ['action-copy', 'Copy', 'action', 'blue', 'copy'],

  ['status-success', 'Success', 'status', 'green', 'check'],
  ['status-warning', 'Warning', 'status', 'gold', 'warning'],
  ['status-error', 'Error', 'status', 'red', 'error'],
  ['status-info', 'Info', 'status', 'blue', 'info'],
  ['status-loading', 'Loading', 'status', 'cyan', 'loading'],
  ['security-shield', 'Security shield', 'security', 'green', 'shield'],
  ['security-lock', 'Lock', 'security', 'slate', 'lock'],
  ['security-trusted', 'Trusted intranet', 'security', 'red', 'trusted'],
  ['user-avatar', 'User avatar', 'user', 'blue', 'user'],
  ['expert-avatar', 'Expert avatar', 'user', 'violet', 'expert'],
];

const categoryLabels = {
  navigation: '左侧导航 / 主入口',
  feature: '首页与功能卡片',
  writing: '智能公文写作流程',
  knowledge: '知识库目录与素材管理',
  admin: '后台管理',
  model: '模型配置与深度思考',
  action: '通用操作按钮',
  status: '状态提示',
  security: '安全与可信标识',
  user: '用户与专家头像',
};

const usageMap = {
  'nav-home': '首页入口、顶部或侧边栏首页图标',
  'nav-new-task': '新建任务入口',
  'nav-smart-doc': '智能公文一级菜单',
  'nav-ai-write': 'AI写作菜单项',
  'nav-ai-copy': 'AI仿写菜单项',
  'nav-ai-polish': 'AI润色菜单项',
  'nav-layout': '智能排版菜单项',
  'nav-proofread': '智能校对菜单项',
  'nav-knowledge': '知识库主菜单入口',
  'nav-expert': '专家管理入口',
  'nav-admin': '后台管理入口',
  'nav-history': '历史对话入口',

  'feature-smart-qa': '首页问答输入区或智能问答能力卡片',
  'feature-ai-write': '首页 AI 写作功能卡片',
  'feature-ai-copy': '首页 AI 仿写功能卡片',
  'feature-ai-polish': '首页 AI 润色功能卡片',
  'feature-proofread': '首页智能校对功能卡片',
  'feature-layout': '首页智能排版功能卡片',
  'feature-ppt': 'PPT汇报大纲 / PPT生成入口',
  'feature-table': '表格数据提取 / 智能表格入口',
  'feature-web-office': 'WebOffice 编辑器入口',
  'feature-red-template': '红头模板、公文模板入口',

  'write-mode-full': 'AI写作第一步：生成全文卡片',
  'write-mode-outline': 'AI写作第一步：生成大纲卡片',
  'write-mode-outline-to-text': 'AI写作第一步：大纲成文卡片',
  'write-mode-continue': 'AI写作第一步：继续写卡片',
  'write-mode-conclusion': 'AI写作第一步：生成结语卡片',
  'write-step-mode': '起草公文流程步骤：写作模式',
  'write-step-scene': '起草公文流程步骤：场景选择',
  'write-step-info': '起草公文流程步骤：基础信息',
  'write-step-materials': '起草公文流程步骤：参考素材',
  'write-step-result': '起草公文流程步骤：生成结果',

  'knowledge-personal': '知识库目录：个人知识库一级节点',
  'knowledge-department': '知识库目录：部门知识库一级节点',
  'knowledge-resource': '知识库目录：资源素材库一级节点',
  'knowledge-public': '知识库目录：公共素材库一级节点',
  'knowledge-recent': '知识库目录：最近入口',
  'knowledge-folder': '知识库目录：普通文件夹',
  'knowledge-folder-open': '知识库目录：展开状态文件夹',
  'knowledge-new-file': '知识库：添加文件 / 新建文件',
  'knowledge-import': '知识库：导入文件',
  'knowledge-smart-search': '知识库搜索框：智能检索开关',
  'knowledge-readonly': '知识库：只读公共资料标识',
  'knowledge-storage': '知识库：存储容量、资料库统计',

  'admin-users': '后台管理：用户管理',
  'admin-org': '后台管理：组织架构',
  'admin-role': '后台管理：角色权限',
  'admin-menu': '后台管理：菜单管理',
  'admin-model': '后台管理：模型管理',
  'admin-prompt': '后台管理：提示词管理',
  'admin-template': '后台管理：模板管理',
  'admin-material': '后台管理：素材管理',
  'admin-agent': '后台管理：智能体管理',
  'admin-connector': '后台管理：接口 / 连接器管理',
  'admin-audit': '后台管理：审计日志',
  'admin-system': '后台管理：系统设置',

  'model-main': '模型选择下拉框：主模型',
  'model-deep-thinking': '深度思考开关',
  'model-reasoning': '推理链 / 解析过程',
  'model-test': '模型连通性测试',
  'model-key': 'API Key / 密钥配置',
  'model-secure': '安全模型 / 内网可信模型',

  'action-add': '通用操作：新增',
  'action-upload': '通用操作：上传',
  'action-download': '通用操作：下载',
  'action-save': '通用操作：保存',
  'action-edit': '通用操作：编辑',
  'action-delete': '通用操作：删除',
  'action-search': '通用操作：搜索',
  'action-refresh': '通用操作：刷新',
  'action-send': '通用操作：发送',
  'action-back': '通用操作：返回',
  'action-next': '通用操作：下一步',
  'action-close': '通用操作：关闭',
  'action-more': '通用操作：更多',
  'action-filter': '通用操作：筛选',
  'action-pin': '通用操作：置顶 / 固定',
  'action-copy': '通用操作：复制',

  'status-success': '状态提示：成功',
  'status-warning': '状态提示：警告',
  'status-error': '状态提示：错误',
  'status-info': '状态提示：信息',
  'status-loading': '状态提示：加载中',
  'security-shield': '安全办公、安全防护标识',
  'security-lock': '权限锁定、私密内容',
  'security-trusted': '安全办公 · 内网可信徽标',
  'user-avatar': '侧边栏用户头像 / 默认用户',
  'expert-avatar': '专家头像 / 专家库默认头像',
};

const pathData = {
  home: ['M18 31 32 19l14 12v17a3 3 0 0 1-3 3h-7V39h-8v12h-7a3 3 0 0 1-3-3V31Z'],
  penSpark: ['M22 43l3-10 16-16a5 5 0 0 1 7 7L32 40l-10 3Z', 'M41 13l2-5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z'],
  documentAi: ['M21 13h17l8 8v28a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3Z', 'M38 13v8h8', 'M24 31h16M24 38h12M25 45h17'],
  pen: ['M20 44l4-12 19-19a5 5 0 0 1 7 7L31 39l-11 5Z', 'M36 17l11 11'],
  layers: ['M32 14 49 23 32 32 15 23 32 14Z', 'M15 32l17 9 17-9', 'M15 41l17 9 17-9'],
  spark: ['M32 13l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12Z', 'M47 12l1.8 5.2L54 19l-5.2 1.8L47 26l-1.8-5.2L40 19l5.2-1.8L47 12Z'],
  stamp: ['M27 15h10v15l5 8v4H22v-4l5-8V15Z', 'M19 48h26', 'M24 42h16'],
  checkDoc: ['M21 13h17l8 8v28a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3Z', 'M38 13v8h8', 'M24 39l6 6 13-15'],
  folder: ['M13 23a4 4 0 0 1 4-4h11l4 4h15a4 4 0 0 1 4 4v3H13Z', 'M13 29h38l-4 18a5 5 0 0 1-5 4H20a5 5 0 0 1-5-4L13 29Z'],
  briefcase: ['M22 24v-5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v5', 'M15 24h34v23a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V24Z', 'M15 33h34M28 33v4h8v-4'],
  settings: ['M32 24a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'M32 12v7M32 45v7M18 18l5 5M41 41l5 5M12 32h7M45 32h7M18 46l5-5M41 23l5-5'],
  history: ['M18 30a14 14 0 1 1 4 10', 'M18 30h-8v-8', 'M32 22v11l8 5'],
  message: ['M16 18h32a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H28l-11 7v-7h-1a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4Z', 'M23 29h18M23 36h12'],
  copyStyle: ['M21 19h21a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V23a4 4 0 0 1 4-4Z', 'M28 13h21v26', 'M25 31h14M25 39h10'],
  shieldCheck: ['M32 13l17 6v12c0 10-7 18-17 22-10-4-17-12-17-22V19l17-6Z', 'M24 33l6 6 12-14'],
  presentation: ['M16 16h32v23H16V16Z', 'M32 39v12M24 51h16', 'M25 32l5-6 5 4 5-8'],
  table: ['M16 17h32v30H16V17Z', 'M16 27h32M16 37h32M27 17v30M38 17v30'],
  editor: ['M17 15h30v34H17V15Z', 'M23 24h18M23 32h18M23 40h10', 'M40 42l8-8 4 4-8 8-6 2 2-6Z'],
  template: ['M18 14h28v36H18V14Z', 'M24 23h16M24 31h8M36 31h4M24 39h16'],
  list: ['M22 22h24M22 32h24M22 42h24', 'M15 22h1M15 32h1M15 42h1'],
  mergeDoc: ['M20 14h17l7 7v13', 'M37 14v8h7', 'M21 44h20', 'M36 37l8 7-8 7'],
  continueWrite: ['M18 38c6-13 13-18 23-14', 'M40 18l8 8-8 8', 'M22 46h23'],
  ending: ['M19 18h26v28H19V18Z', 'M25 27h14M25 35h9', 'M39 42l5 5 8-11'],
  target: ['M32 15a17 17 0 1 0 0 34 17 17 0 0 0 0-34Z', 'M32 23a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M32 29v6M29 32h6'],
  compass: ['M32 14a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z', 'M39 25l-5 12-10 4 5-12 10-4Z'],
  clipboard: ['M24 18h16M25 14h14v8H25v-8Z', 'M21 18h-2a4 4 0 0 0-4 4v25a4 4 0 0 0 4 4h26a4 4 0 0 0 4-4V22a4 4 0 0 0-4-4h-2', 'M23 32h18M23 40h13'],
  folderPlus: ['M13 24h15l4 4h19v19a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V24Z', 'M32 34v12M26 40h12'],
  rocket: ['M32 45c11-6 17-17 17-31-14 0-25 6-31 17l7 7 7 7Z', 'M39 22a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z', 'M23 39l-7 9 9-7'],
  userFolder: ['M13 25h14l4 4h20v18a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V25Z', 'M31 34a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M23 49c2-5 14-5 16 0'],
  orgFolder: ['M13 25h14l4 4h20v18a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V25Z', 'M32 33v12M24 45h16M24 39h16'],
  archive: ['M15 21h34v8H15V21Z', 'M18 29h28v20H18V29Z', 'M27 36h10'],
  globe: ['M32 14a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z', 'M14 32h36M32 14c5 5 8 11 8 18s-3 13-8 18M32 14c-5 5-8 11-8 18s3 13 8 18'],
  clock: ['M32 14a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z', 'M32 23v10l8 5'],
  folderOpen: ['M12 27h16l4 4h20l-5 17a4 4 0 0 1-4 3H18a4 4 0 0 1-4-3L12 27Z', 'M14 24h14l4 4h17'],
  filePlus: ['M22 14h16l8 8v28H22V14Z', 'M38 14v8h8', 'M32 31v14M25 38h14'],
  upload: ['M32 45V22', 'M23 31l9-9 9 9', 'M18 48h28'],
  smartSearch: ['M28 17a12 12 0 1 0 0 24 12 12 0 0 0 0-24Z', 'M37 37l10 10', 'M44 15l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z'],
  lock: ['M22 29v-6a10 10 0 0 1 20 0v6', 'M19 29h26v20H19V29Z', 'M32 37v5'],
  database: ['M17 21c0-4 7-7 15-7s15 3 15 7-7 7-15 7-15-3-15-7Z', 'M17 21v20c0 4 7 7 15 7s15-3 15-7V21', 'M17 31c0 4 7 7 15 7s15-3 15-7'],
  users: ['M25 30a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'M13 49c2-9 22-9 24 0', 'M42 30a6 6 0 1 0 0-12', 'M40 37c6 1 10 5 11 12'],
  org: ['M32 15v11M22 32h20M22 32v13M42 32v13', 'M25 15h14v10H25V15Z', 'M15 45h14v8H15v-8Z', 'M35 45h14v8H35v-8Z'],
  badge: ['M32 14l14 8v15c0 8-6 13-14 17-8-4-14-9-14-17V22l14-8Z', 'M25 31h14M25 38h14'],
  menuTree: ['M18 18h12v10H18V18Z', 'M34 18h12v10H34V18Z', 'M18 38h12v10H18V38Z', 'M34 38h12v10H34V38Z', 'M30 23h4M30 43h4'],
  cpu: ['M22 22h20v20H22V22Z', 'M28 28h8v8h-8V28Z', 'M18 26h4M18 34h4M42 26h4M42 34h4M26 18v4M34 18v4M26 42v4M34 42v4'],
  prompt: ['M17 18h30v28H17V18Z', 'M23 27l6 5-6 5', 'M32 38h9'],
  library: ['M18 18h10v30H18V18Z', 'M28 18h10v30H28V18Z', 'M39 21l8 25', 'M21 26h4M31 26h4'],
  bot: ['M22 24h20a7 7 0 0 1 7 7v11a7 7 0 0 1-7 7H22a7 7 0 0 1-7-7V31a7 7 0 0 1 7-7Z', 'M32 15v9', 'M25 35h.1M39 35h.1', 'M26 43h12'],
  link: ['M27 39l-3 3a8 8 0 0 1-11-11l5-5a8 8 0 0 1 11 0', 'M37 25l3-3a8 8 0 0 1 11 11l-5 5a8 8 0 0 1-11 0', 'M25 37l14-14'],
  audit: ['M20 15h24v36H20V15Z', 'M26 25h12M26 33h12M26 41h7', 'M39 43l3 3 6-9'],
  brain: ['M25 18c-6 2-8 12-3 17-5 6 0 15 8 14M39 18c6 2 8 12 3 17 5 6 0 15-8 14', 'M31 18v31M26 30h10M28 39h8'],
  network: ['M20 24a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M44 24a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M32 50a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M24 22l6 18M40 22l-6 18M25 19h14'],
  pulse: ['M15 35h9l4-13 8 24 4-11h9'],
  key: ['M24 38a10 10 0 1 1 8-4l17 17-5 0v-5h-5v-5h-5l-4-4a10 10 0 0 1-6 1Z', 'M22 26h.1'],
  plus: ['M32 17v30M17 32h30'],
  download: ['M32 17v26', 'M23 34l9 9 9-9', 'M18 49h28'],
  save: ['M18 16h24l6 6v26H18V16Z', 'M24 16v12h16V16', 'M25 40h14'],
  edit: ['M20 44l4-11 18-18 7 7-18 18-11 4Z', 'M37 20l7 7'],
  trash: ['M20 23h24', 'M26 23v-6h12v6', 'M24 23l2 27h12l2-27', 'M30 30v13M36 30v13'],
  search: ['M28 18a11 11 0 1 0 0 22 11 11 0 0 0 0-22Z', 'M37 37l10 10'],
  refresh: ['M44 24a14 14 0 0 0-24-5l-4 5', 'M16 24h10', 'M20 40a14 14 0 0 0 24 5l4-5', 'M48 40H38'],
  send: ['M15 32l35-16-10 32-8-13-17-3Z', 'M32 35l18-19'],
  back: ['M38 20 26 32l12 12', 'M27 32h24'],
  next: ['M26 20l12 12-12 12', 'M13 32h25'],
  close: ['M22 22l20 20M42 22 22 42'],
  more: ['M21 32h.1M32 32h.1M43 32h.1'],
  filter: ['M17 20h30L36 33v14l-8 4V33L17 20Z'],
  pin: ['M35 13l16 16-8 2-8 12-5-5 12-8-7-7Z', 'M29 39 18 50'],
  copy: ['M24 20h22v26H24V20Z', 'M18 28v18h18'],
  check: ['M20 33l8 8 17-18'],
  warning: ['M32 15l20 35H12L32 15Z', 'M32 27v10M32 43h.1'],
  error: ['M32 14a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z', 'M25 25l14 14M39 25 25 39'],
  info: ['M32 14a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z', 'M32 29v12M32 23h.1'],
  loading: ['M32 14a18 18 0 0 1 18 18', 'M32 50a18 18 0 0 1-18-18', 'M45 19l5 1-1-5'],
  shield: ['M32 13l17 6v12c0 10-7 18-17 22-10-4-17-12-17-22V19l17-6Z'],
  trusted: ['M17 24h30v20a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V24Z', 'M24 24v-4a8 8 0 0 1 16 0v4', 'M27 36l4 4 8-9'],
  user: ['M32 31a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M18 50c3-12 25-12 28 0'],
  expert: ['M32 30a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M18 50c3-12 25-12 28 0', 'M44 15l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z'],
};

const makeGlyph = (glyph, color) => {
  const paths = pathData[glyph] ?? pathData.info;
  return paths.map((d, index) => {
    const fill = ['home', 'folder', 'folderOpen', 'archive', 'userFolder', 'orgFolder', 'database', 'shield'].includes(glyph) && index === 0 ? ` fill="${color}" fill-opacity=".18"` : ' fill="none"';
    return `    <path d="${d}"${fill} stroke="${color}" stroke-width="2.65" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('\n');
};

const iconSvg = ([key, label, category, tone, glyph]) => {
  const theme = palette[tone];
  return `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label} icon">
  <defs>
    <linearGradient id="${key}-bg" x1="12" y1="9" x2="52" y2="55" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset=".48" stop-color="${theme.soft}"/>
      <stop offset="1" stop-color="${theme.soft2}"/>
    </linearGradient>
    <radialGradient id="${key}-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(28 24) rotate(47) scale(28 24)">
      <stop stop-color="#FFFFFF" stop-opacity=".92"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="${key}-shadow" x="0" y="0" width="64" height="64" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="${theme.deep}" flood-opacity=".12"/>
    </filter>
  </defs>
  <g filter="url(#${key}-shadow)">
    <rect x="9" y="8" width="46" height="46" rx="15" fill="url(#${key}-bg)"/>
    <rect x="9.8" y="8.8" width="44.4" height="44.4" rx="14.2" stroke="#FFFFFF" stroke-opacity=".86" stroke-width="1.6"/>
    <rect x="10.4" y="9.4" width="43.2" height="43.2" rx="13.6" stroke="${theme.color}" stroke-opacity=".10" stroke-width=".8"/>
    <rect x="9" y="8" width="46" height="46" rx="15" fill="url(#${key}-glow)"/>
${makeGlyph(glyph, theme.color)}
  </g>
</svg>
`;
};

const symbolSvg = ([key, , , tone, glyph]) => {
  const theme = palette[tone];
  return `  <symbol id="prototype-icon-${key}" viewBox="0 0 64 64">
    <rect x="9" y="8" width="46" height="46" rx="15" fill="${theme.soft}"/>
    <rect x="9.8" y="8.8" width="44.4" height="44.4" rx="14.2" stroke="#FFFFFF" stroke-opacity=".86" stroke-width="1.6"/>
    <rect x="10.4" y="9.4" width="43.2" height="43.2" rx="13.6" stroke="${theme.color}" stroke-opacity=".10" stroke-width=".8"/>
${makeGlyph(glyph, theme.color)}
  </symbol>`;
};

const byCategory = iconSet.reduce((acc, [key, label, category, tone]) => {
  if (!acc[category]) acc[category] = [];
  acc[category].push({ key, label, tone, usageZh: usageMap[key] });
  return acc;
}, {});

const preview = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prototype UI Icon Pack</title>
  <style>
    body { margin: 0; background:
      radial-gradient(circle at 10% 8%, rgba(232,77,99,.10), transparent 28%),
      radial-gradient(circle at 82% 12%, rgba(139,121,230,.12), transparent 30%),
      linear-gradient(180deg, #f8fafc 0%, #f5f7fb 100%);
      color: #1f2937; font: 14px/1.5 Inter, Arial, "PingFang SC", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px 56px; }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { margin: 0 0 28px; color: #667085; }
    h2 { margin: 30px 0 14px; font-size: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(178px, 1fr)); gap: 14px; }
    .card { border: 1px solid rgba(31,41,55,.08); border-radius: 14px; background: rgba(255,255,255,.88); padding: 16px 12px 14px; text-align: center; box-shadow: 0 12px 34px rgba(30,57,94,.07); backdrop-filter: blur(8px); }
    img { width: 56px; height: 56px; }
    strong { display: block; margin-top: 9px; font-size: 12px; }
    code { display: block; margin-top: 3px; color: #98a2b3; font-size: 10px; }
    span { display: block; min-height: 34px; margin-top: 6px; color: #667085; font-size: 11px; }
  </style>
</head>
<body>
  <main>
    <h1>政务 AI 原型图标全量包</h1>
    <p>统一按“知识库目录”图标风格重绘：柔和彩色底座、轻渐变、轻阴影、线面结合。JSON 与说明文档已标注每个图标的使用位置。</p>
    ${Object.entries(byCategory).map(([category, items]) => `<h2>${categoryLabels[category] ?? category}</h2><div class="grid">${items.map((item) => `<div class="card"><img src="./icons/${item.key}.svg" alt="${item.label}" /><strong>${item.label}</strong><code>${item.key}</code><span>${item.usageZh}</span></div>`).join('')}</div>`).join('\n')}
  </main>
</body>
</html>
`;

const iconRows = iconSet.map(([key, label, category, tone, glyph]) => ({
  key,
  label,
  category,
  categoryZh: categoryLabels[category] ?? category,
  tone,
  glyph,
  file: `icons/${key}.svg`,
  usageZh: usageMap[key] ?? `${categoryLabels[category] ?? category}相关图标`,
}));

const usageDoc = `# 政务 AI 原型图标使用说明

这套图标按照知识库目录截图中的图标标准重绘：圆角色块、浅色渐变底、轻阴影、主题色线面结合图形。红色为主品牌色，同时补充蓝、绿、青、紫、橙、金和灰色，便于区分不同业务模块。

## 交付文件

- \`icons/\`：单个 SVG，64 x 64。
- \`prototype-icons-sprite.svg\`：SVG Symbol Sprite。
- \`prototype-icon-manifest.json\`：研发映射 JSON，包含分类、色系、文件路径、使用位置说明。
- \`ICON_USAGE.md\`：当前说明书。
- \`preview.html\`：图标总览预览页。

## 图标映射

| 图标 Key | 中文位置说明 | 分类 | 文件 |
| --- | --- | --- | --- |
${iconRows.map((icon) => `| \`${icon.key}\` | ${icon.usageZh} | ${icon.categoryZh} | \`${icon.file}\` |`).join('\n')}
`;

const readme = `# 政务 AI 原型图标 SVG 全量包

本包是当前原型除文件类型图标外的全量 UI 图标设计稿，已按“知识库目录”中的图标样式统一重绘。

## 风格标准

- 64 x 64 SVG 画布。
- 46 x 46 圆角色块，浅色渐变底与白色内描边。
- 主题色线面结合图形，保持和知识库目录图标一致的轻量、柔和、易识别。
- 主色沿用红色，同时扩展蓝、绿、青、紫、橙、金、灰，避免所有图标都过度单一。

## 内容

- \`icons/\`：单个 SVG 图标。
- \`prototype-icons-sprite.svg\`：整包 sprite。
- \`prototype-icon-manifest.json\`：图标映射 JSON，含每个图标的使用位置。
- \`ICON_USAGE.md\`：中文说明书，适合直接给设计或前端研发对照。
- \`preview.html\`：图标预览页面。
- \`generate-prototype-icons.mjs\`：后续增补图标的生成脚本。

## 分类

${Object.entries(byCategory).map(([category, items]) => `- \`${category}\`（${categoryLabels[category] ?? category}）：${items.length} 个`).join('\n')}

## 前端使用

\`\`\`tsx
const iconUrl = \`/prototype-icons-svg/icons/nav-ai-write.svg\`;
\`\`\`

Sprite usage:

\`\`\`html
<svg width="24" height="24">
  <use href="./prototype-icons-sprite.svg#prototype-icon-nav-ai-write"></use>
</svg>
\`\`\`

完整位置映射请看 \`prototype-icon-manifest.json\` 或 \`ICON_USAGE.md\`。
`;

await mkdir(iconsDir, { recursive: true });

for (const icon of iconSet) {
  await writeFile(new URL(`./icons/${icon[0]}.svg`, outDir), iconSvg(icon), 'utf8');
}

await writeFile(new URL('./prototype-icons-sprite.svg', outDir), `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${iconSet.map(symbolSvg).join('\n')}\n</svg>\n`, 'utf8');
await writeFile(new URL('./prototype-icon-manifest.json', outDir), JSON.stringify({
  version: '2.0.0',
  size: 64,
  style: 'knowledge-directory-soft-tile',
  designReference: '知识库目录图标风格：圆角色块、浅渐变、轻阴影、线面结合',
  icons: iconRows,
  categories: byCategory,
}, null, 2) + '\n', 'utf8');
await writeFile(new URL('./preview.html', outDir), preview, 'utf8');
await writeFile(new URL('./README.md', outDir), readme, 'utf8');
await writeFile(new URL('./ICON_USAGE.md', outDir), usageDoc, 'utf8');

console.log(`Generated ${iconSet.length} prototype SVG icons in ${fileURLToPath(iconsDir)}`);
