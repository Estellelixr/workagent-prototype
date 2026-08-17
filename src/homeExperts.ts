import type { AgentCategory } from './types';

export type HomeExpertId = 'doc' | 'summary' | 'meeting' | 'speech' | 'policy' | 'data' | 'weekly-report' | 'web-ppt';
export type HomeExpertMarketCategory = '政务' | '办公' | '写作' | '数据' | '法律' | '金融';

export const DEFAULT_HOME_EXPERT_ID: HomeExpertId = 'doc';

export const HOME_EXPERTS: Array<{
  id: HomeExpertId;
  name: string;
  shortName: string;
  description: string;
  category: AgentCategory;
  marketCategories: HomeExpertMarketCategory[];
  tags: string[];
  avatar: string;
  icon: string;
  tone: string;
  answerTitle: string;
  answerIntro: string;
  processFocus: string[];
}> = [
  {
    id: 'doc',
    name: '智能公文专家',
    shortName: '公文',
    description: '面向通知、请示、报告、纪要等政务公文，支持问答、写作、仿写和审校。',
    category: '办公',
    marketCategories: ['政务', '办公', '写作'],
    tags: ['公文写作', '审校', '知识检索'],
    avatar: '文',
    icon: 'doc',
    tone: 'red',
    answerTitle: '政务公文综合处理建议',
    answerIntro: '已结合政务办公常见规范、材料口径和任务目标，形成结构化处理建议。',
    processFocus: ['识别文种与办理目标', '检索政策和历史材料', '组织公文结构与表达', '校验规范和交付口径']
  },
  {
    id: 'summary',
    name: '工作总结专家',
    shortName: '总结',
    description: '适合周报、月报、季度总结、年度总结和专项工作复盘。',
    category: '办公',
    marketCategories: ['政务', '办公', '写作'],
    tags: ['工作总结', '亮点提炼', '问题复盘'],
    avatar: '总',
    icon: 'summary',
    tone: 'blue',
    answerTitle: '工作总结撰写思路',
    answerIntro: '已按工作进展、成效亮点、问题不足和下一步计划梳理总结框架。',
    processFocus: ['抽取阶段性工作事项', '归纳成效与亮点', '梳理问题和原因', '形成下一步工作安排']
  },
  {
    id: 'meeting',
    name: '会议纪要专家',
    shortName: '纪要',
    description: '将会议记录整理为纪要、议定事项、待办清单和责任分工。',
    category: '办公',
    marketCategories: ['政务', '办公', '写作'],
    tags: ['会议纪要', '议题提炼', '待办追踪'],
    avatar: '会',
    icon: 'meeting',
    tone: 'teal',
    answerTitle: '会议纪要整理方案',
    answerIntro: '已按会议主题、讨论要点、议定事项和责任分工提取核心信息。',
    processFocus: ['识别会议主题与参会角色', '提炼讨论要点', '归并议定事项', '输出责任清单']
  },
  {
    id: 'speech',
    name: '讲话稿专家',
    shortName: '讲话',
    description: '面向领导讲话、动员会发言、开幕致辞和总结讲话。',
    category: '办公',
    marketCategories: ['政务', '办公', '写作'],
    tags: ['讲话稿', '表达润色', '层次组织'],
    avatar: '讲',
    icon: 'speech',
    tone: 'amber',
    answerTitle: '讲话稿组织建议',
    answerIntro: '已围绕发言场景、受众对象、主题立意和表达层次规划讲话稿结构。',
    processFocus: ['确认发言场景和对象', '建立主题立意', '组织层次和金句', '统一语气与节奏']
  },
  {
    id: 'policy',
    name: '政策解读专家',
    shortName: '政策',
    description: '适合政策问答、条款解读、影响分析和落实建议。',
    category: '办公',
    marketCategories: ['政务', '办公', '法律'],
    tags: ['政策解读', '法规检索', '影响分析'],
    avatar: '策',
    icon: 'policy',
    tone: 'violet',
    answerTitle: '政策解读与落实建议',
    answerIntro: '已围绕政策背景、核心条款、适用范围和落实路径进行解读。',
    processFocus: ['识别政策主题', '拆解关键条款', '判断适用范围', '形成执行建议']
  },
  {
    id: 'data',
    name: '数据分析专家',
    shortName: '数据',
    description: '支持材料数据提取、指标解释、趋势分析和汇报口径组织。',
    category: '数据',
    marketCategories: ['数据'],
    tags: ['数据分析', '指标解读', '汇报图表'],
    avatar: '数',
    icon: 'data',
    tone: 'green',
    answerTitle: '数据分析结论',
    answerIntro: '已按指标口径、变化趋势、异常原因和管理建议组织分析结果。',
    processFocus: ['识别数据口径', '抽取关键指标', '分析趋势与异常', '生成结论和建议']
  },
  {
    id: 'weekly-report',
    name: '周报生成专家',
    shortName: '周报',
    description: '面向周报、双周报和月度例行材料，支持数据汇总、变化分析和汇报口径生成。',
    category: '数据',
    marketCategories: ['数据', '写作'],
    tags: ['周报生成', '数据汇总', '趋势说明'],
    avatar: '周',
    icon: 'weekly-report',
    tone: 'cyan',
    answerTitle: '周报生成建议',
    answerIntro: '已按本期数据、同比环比、重点变化和后续建议组织周报内容。',
    processFocus: ['汇总周期数据', '识别重点变化', '生成同比环比说明', '组织周报结论']
  },
  {
    id: 'web-ppt',
    name: '网页PPT生成专家',
    shortName: 'PPT',
    description: '根据网页链接、材料内容或主题信息，提炼结构并生成适合汇报演示的PPT大纲。',
    category: '数据',
    marketCategories: ['数据', '办公'],
    tags: ['网页解析', 'PPT大纲', '汇报生成'],
    avatar: '演',
    icon: 'web-ppt',
    tone: 'purple',
    answerTitle: '网页PPT生成方案',
    answerIntro: '已按网页内容要点、受众场景和汇报逻辑整理演示结构。',
    processFocus: ['解析网页内容', '提炼核心观点', '组织演示结构', '生成PPT页纲']
  }
];

export function getHomeExpertById(id: HomeExpertId) {
  return HOME_EXPERTS.find((expert) => expert.id === id) ?? HOME_EXPERTS[0];
}
