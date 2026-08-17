import {
  Agent,
  Connector,
  DocumentInfo,
  AuditLogItem,
  SkillItem
} from './types';


export const INITIAL_AGENTS: Agent[] = [
  // ===== 第一期：我的专家（5个） =====
  {
    id: 'agent-gongwen',
    name: '公文写作专家',
    avatar: '📝',
    type: 'my',
    category: '办公',
    domain: 'doc',
    description: '根据用户需求起草通知、请示、报告、批复等公文，并按GB/T 9704标准排版输出.docx文件。',
    connectedSystem: ['doc-SKILL (govdoc)', 'wps-gongwen', 'wps-meeting-minutes', 'wps-report-writer'],
    recommendReason: '整合公文撰写+排版能力，支持6种公文文种和红头格式，政企办公核心入口。',
    isEnabled: true
  },
  {
    id: 'agent-proofread',
    name: '文档校对专家',
    avatar: '🔍',
    type: 'my',
    category: '办公',
    domain: 'doc',
    description: '检查错别字、标点错误、敏感词、公文格式规范，输出校对报告，确保公文质量。',
    connectedSystem: ['wps-proofread', 'wps-gongwen'],
    recommendReason: '公文写作流程的”交付前检查”，有效拦截格式与政治用语错误。',
    isEnabled: true
  },
  {
    id: 'agent-contract',
    name: '合同审核专家',
    avatar: '⚖️',
    type: 'my',
    category: '法律',
    domain: 'legal',
    description: '专业级合同风险审查，自动识别20+类常见风险条款，输出风险等级、修改建议和法律依据。',
    connectedSystem: ['contract-risk-reviewer', 'wps-contract'],
    recommendReason: '政企法务高频刚需，已具备成熟SKILL，可快速上线。',
    isEnabled: true
  },
  {
    id: 'agent-meeting',
    name: '会议纪要专家',
    avatar: '📋',
    type: 'my',
    category: '办公',
    domain: 'doc',
    description: '将会议笔记整理成规范的会议纪要格式，自动提取议定事项、责任人和完成时限。',
    connectedSystem: ['wps-meeting-minutes'],
    recommendReason: '政企日常高频场景，规范会议纪要格式输出。',
    isEnabled: true
  },
  {
    id: 'agent-report',
    name: '报告撰写专家',
    avatar: '📊',
    type: 'my',
    category: '办公',
    domain: 'doc',
    description: '生成年度总结、调研报告、可行性报告等正式报告，含封面、目录和结构化正文。',
    connectedSystem: ['wps-report-writer', 'doc-SKILL (govdoc)'],
    isEnabled: true
  },

  // ===== 通用专家（2个） =====
  {
    id: 'agent-policy',
    name: '政策解读助手',
    avatar: '🏛️',
    type: 'general',
    category: '办公',
    description: '解读最新政策文件，提取与本单位的关联要点，分部门推送影响分析。',
    connectedSystem: ['政策NLP解析引擎', '条款关联匹配模型'],
    isEnabled: true
  },
  {
    id: 'agent-dangjian',
    name: '党建学习助手',
    avatar: '🚩',
    type: 'general',
    category: '办公',
    description: '生成党建学习材料、主题党日方案、学习心得提纲，辅助基层党组织开展组织生活。',
    connectedSystem: ['党建知识库', '学习材料模板引擎'],
    isEnabled: true
  },

  // ===== 场景专家（预留） =====
  {
    id: 'expert-bidding',
    name: '电子招投标预审助手',
    avatar: '🎯',
    type: 'expert',
    category: '电商',
    domain: 'purchase',
    description: '解析招标文件，智能核验供应商资质、投标书响应矩阵，筛查串标、围标风险。',
    connectedSystem: ['电子招采平台', '数据中台'],
    isEnabled: false
  },
  {
    id: 'expert-safety',
    name: '安全生产管理助手',
    avatar: '🛡️',
    type: 'expert',
    category: '办公',
    description: '生成安全检查清单、整改通知书、应急预案，辅助安全生产标准化管理。',
    connectedSystem: ['安检知识库', '法规条款匹配'],
    isEnabled: false
  },
  {
    id: 'expert-audit',
    name: '督查督办助手',
    avatar: '📌',
    type: 'expert',
    category: '办公',
    description: '跟踪重点工作任务进展，自动生成督办报告和逾期预警通知。',
    connectedSystem: ['任务管理引擎', '预警规则配置'],
    isEnabled: false
  },
];

export const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'conn-1',
    name: '致远OA系统',
    icon: '🏢',
    purpose: '审批流流转、请示公文呈批、内部流程节点监听、合同呈审流。',
    status: 'connected',
    syncTime: '5分钟前',
    dataReadPermission: '仅限岗位法务会签链，读取合同主体、履约要素等34个字段。',
    category: '协作',
    metrics: '↓ 4.8万',
    developer: '致远互联'
  },
  {
    id: 'conn-2',
    name: '用友ERP财务系统',
    icon: '📉',
    purpose: '财务报账、年度科目预算限额、应收应付往来账、凭证同步。',
    status: 'connected',
    syncTime: '12分钟前',
    dataReadPermission: '集团差旅与接待项目明细、项目限额执行率，脱敏不包含敏感组织明细。',
    category: '金融',
    metrics: '↓ 8.2万',
    developer: '用友网络'
  },
  {
    id: 'conn-4',
    name: '数据中台',
    icon: '💾',
    purpose: '核心数据底盘存储。存放审计底稿、合规索引文件库、历史表底和数据脱敏词典。',
    status: 'connected',
    syncTime: '实时同步',
    dataReadPermission: '限制在 `LAW_SCHEMA_2026` 生产实例视图中，不涉及机要保密视图。',
    category: '分析',
    metrics: '↓ 12.5万',
    developer: '数据中台'
  },
  {
    id: 'conn-7',
    name: '金山协作',
    icon: '🤝',
    purpose: '即时跨部门消息联动、安全国产化工作群协作、审批助手消息及工作日程秒级直传。',
    status: 'connected',
    syncTime: '实时同步',
    dataReadPermission: '绑定部门白名单及全流程SSL安全防泄漏协议，只读访问办公域信息。',
    category: '协作',
    metrics: '↓ 6.1万',
    developer: '金山办公'
  },
  {
    id: 'conn-8',
    name: '金山文档',
    icon: '📄',
    purpose: '企业多端实时协作在线Word/Excel承载、政务网公文多人多轮会签协同及安全防搬、私有文档存储。',
    status: 'connected',
    syncTime: '3分钟前',
    dataReadPermission: '通过专属密级密钥挂载，具备国密SSO会话防落盘安全遮罩，仅限授权人进行协同。',
    category: '文件管理',
    metrics: '↓ 15.3万',
    developer: '金山办公'
  },
  {
    id: 'conn-5',
    name: '国资委监管数据交互平台',
    icon: '🏛️',
    purpose: '向上报送企业产权数据、大额资金去向、安全生产常态化数据、国企改革硬指标。',
    status: 'pending',
    syncTime: '待授权',
    dataReadPermission: '依据“国资办发规〔2023〕14号”开展单点报送，目前身份校验尚未完全通过。',
    category: '自动化',
    metrics: '↓ 1.2万',
    developer: '国务院国资委'
  },
  {
    id: 'conn-6',
    name: '全集团电子招采平台',
    icon: '🤝',
    purpose: '采购招标技术响应对标、商务偏差值提取、评标委员库随机调用和信息存证。',
    status: 'connected',
    syncTime: '30分钟前',
    dataReadPermission: '仅读取供应商公开及经脱敏的竞标标书材料，禁止接触保密控制价字段。',
    category: '生产力',
    metrics: '↓ 3.2万',
    developer: '集团采购部'
  }
];

export const INITIAL_DOCUMENTS: DocumentInfo[] = [
  {
    id: 'doc-1',
    title: '【中建国投】关于2026年度中原总部园区建设项目总承包框架协议.docx',
    lastModified: '2026-06-14 17:34',
    author: '法务部 - 张三',
    type: 'recent',
    category: '合同',
    content: `中建国投（以下简称“甲方”）与中原建设集团（以下简称“乙方”）遵循《中华人民共和国民法典》及建筑标准，就中原总部园区建设项目总承包框架协议达成如下共识：
第一条 项目概况
项目位于河南省郑州市郑东新区，占地面积180亩。总建设投资预估为人民币 12.8 亿元。
第二条 支付方式与争议解决
2.1 甲方在乙方完成阶段性主体结构验收后5个工作日内向乙方指定账户拨付 15% 形象控制金。
2.2 因本合同引起的或与本合同有关的任何争议，双方应友好协商解决；协商不成的，任何一方均可向乙方所在地有管辖权的人民法院提起诉讼。 (风险提示：此条款将诉讼管辖限定在乙方所在地，将增加甲方的跨区域法律诉讼维权成本，建议修改为原告所在地或合同履行地。)`
  },
  {
    id: 'doc-2',
    title: '国资厅〔2026〕党政行字第042号关于开展全系统网络安全靶向治理的通知.docx',
    lastModified: '2026-06-12 09:15',
    author: '办公室 - 李主任',
    type: 'recent',
    category: '公文',
    content: `国资委办公厅通知
国资厅发〔2026〕42号
关于开展全系统网络安全靶向治理与数据出境自查的紧急通知
各中央企业，各省、自治区、直辖市及计划单列市国资委：
为深入贯彻贯彻落实《数据安全法》《关键信息基础设施安全保护条例》，压实主体安全责任，决定从2026年7月起在全系统范围内启动网络底座靶向治理及常态化数据脱敏审核工作，现就相关要求通知如下：
一、 高度重视，立即开展摸底排查。
二、 围绕数据跨境、系统高危端口、未授权访问等核心内容组织闭环自评估，严禁出现虚报、漏报等不当行政行为。
文面格式备注：排版字号、行距应严格遵循GB/T 9704-2012中政务公文的相关规范。`
  },
  {
    id: 'doc-3',
    title: '《国资委中央企业合规管理办法（最新修订版对标指引）》.pdf',
    lastModified: '2026-05-18 11:20',
    author: '系统更新',
    type: 'recent',
    category: '报送',
    content: `国资委令第42号 《中央企业合规管理办法》
第三章 合规审查制度规范
第十六条 中央企业应当建立健全合规审查机制，合规管理部门应当作为合同呈审、战略决策、重组投资等重大经营决策的必经前置程序。
第十七条 业务部门应当在论证、谈判、起草等前期环节严格遵循。确保关键节点有据可查、一岗双责，对于未经合规审查的，不得提请总经理办公会、董事会研究。
本指引内置于数据中台 `
  },

  // Template Library Items
  {
    id: 'temp-1',
    title: '中央企业“三重一大”重大决策表决请示红头公文标准范本',
    lastModified: '2026-03-01',
    author: '国家标准库',
    type: 'template',
    category: '公文'
  },
  {
    id: 'temp-2',
    title: '关于2026年度地方国有资产管理机构监管数据指标报送表',
    lastModified: '2026-01-15',
    author: '国资委标准化工作组',
    type: 'template',
    category: '报送'
  },
  {
    id: 'temp-3',
    title: '多主体混合所有制高风险物资集中联合招采特设项目标准合同样本',
    lastModified: '2026-04-12',
    author: '法律事务联合会',
    type: 'template',
    category: '合同'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    operator: '张三 (法务专员·SSO登录账号 20040182)',
    agentName: '合同合规审查智能体',
    permissionUsed: '法务专员·岗位一岗双责白名单开启',
    node: '我的工作台 -> 代理市场一键启用',
    dataAccessed: '智能体配置: 合同合规审查智能体 状态变更为 已就绪',
    nationalCryptHash: 'SM3: A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0',
    timestamp: '2026-06-22 09:15:32'
  },
  {
    id: 'log-2',
    operator: '张三 (法务专员·SSO登录账号 20040182)',
    agentName: '公文办公智能体',
    permissionUsed: '法务专员·业务共享数据接口层调用',
    node: '公文写作 -> AI生成全文',
    dataAccessed: '公文内容生成: 安全生产靶向治理通知全文(约2300字)',
    nationalCryptHash: 'SM3: B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1',
    timestamp: '2026-06-22 14:22:18'
  },
  {
    id: 'log-3',
    operator: '李主任 (办公室主任·SSO登录账号 20060321)',
    agentName: '公文办公智能体',
    permissionUsed: '办公室·发文审批流程数据调用',
    node: 'AI审校 -> 格式校验与敏感词扫描',
    dataAccessed: '国资厅〔2026〕042号通知全文格式对标与政治用语校验',
    nationalCryptHash: 'SM3: C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2',
    timestamp: '2026-06-21 16:08:45'
  },
  {
    id: 'log-4',
    operator: '系统管理员 · FDE (SSO: 20000000)',
    agentName: '电子招投标预审助手',
    permissionUsed: '管理员·核心资源调配权',
    node: '统一安全管理中心 -> 系统集成 -> 连接器授权',
    dataAccessed: '全集团电子招采平台 API 密钥轮换与数据读取权限更新',
    nationalCryptHash: 'SM3: D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3',
    timestamp: '2026-06-21 10:44:01'
  },
  {
    id: 'log-5',
    operator: '张三 (法务专员·SSO登录账号 20040182)',
    agentName: '合同合规审查智能体',
    permissionUsed: '法务专员·合同数据合规白名单接口',
    node: 'AI中台 -> AI会话 -> 合同条款审查',
    dataAccessed: '郑州总部园区总承包框架协议第二条2.2款管辖权条款审查',
    nationalCryptHash: 'SM3: E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4',
    timestamp: '2026-06-20 15:33:12'
  }
];

export const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 'skill-contract-review',
    name: '合同条款多维合规审查引擎',
    description: '基于《民法典》及国资委合规管理办法，对合同主体、履约要素、争议解决等34个关键字段进行自动对标审查，输出风险等级与修改建议。',
    category: '法务合规',
    mountedAgentsCount: 3
  },
  {
    id: 'skill-doc-format',
    name: '党政公文格式自动校验',
    description: '严格遵循GB/T 9704-2012国家党政机关公文格式标准，自动检测版头、主体、版记等要素的排版规范性与政治用语合规性。',
    category: '办公自动化',
    mountedAgentsCount: 2
  },
  {
    id: 'skill-procurement-audit',
    name: '招投标供应商资质核验',
    description: '多维交叉比对供应商工商注册、行政处罚、失信被执行等公开数据，自动生成供应商风险画像与投标响应矩阵。',
    category: '采购管理',
    mountedAgentsCount: 2
  },
  {
    id: 'skill-data-desensitization',
    name: '数据脱敏与分级分类',
    description: '依据《数据安全法》《个人信息保护法》，对导出数据进行自动分级分类脱敏处理，支持国密SM4加密与SM3哈希上链存证。',
    category: '安全防护',
    mountedAgentsCount: 4
  },
  {
    id: 'skill-policy-parsing',
    name: '监管政策结构化解析',
    description: '自动抓取国资委、发改委等监管机构最新政策文件，提取关键指标与合规要点，生成结构化政策摘要与对标检查清单。',
    category: '政策研究',
    mountedAgentsCount: 2
  },
  {
    id: 'skill-finance-reimbursement',
    name: '财务报销智能预审',
    description: '关联用友ERP预算科目与发票验真接口，自动识别重复报销、超标消费与发票真伪，生成合规预审报告。',
    category: '财务管理',
    mountedAgentsCount: 1
  }
];
