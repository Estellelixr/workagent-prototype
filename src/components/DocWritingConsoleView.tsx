import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Compass,
  Copy,
  Cpu,
  Download,
  File,
  FileCheck2,
  FilePlus,
  FileSearch,
  FileText,
  FileUp,
  Folder,
  HelpCircle,
  Home,
  Layers,
  Loader2,
  MessageCircle,
  Network,
  Paperclip,
  PenTool,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Stamp,
  Trash2,
  X,
} from 'lucide-react';
import WebOfficeEditor from './WebOfficeEditor';
import PrototypeIcon from './PrototypeIcon';
import { DocumentInfo } from '../types';
import { DEFAULT_HOME_EXPERT_ID, HOME_EXPERTS, HomeExpertId, getHomeExpertById } from '../homeExperts';
import { DEFAULT_PRODUCT_ICON_URL, resolvePublicAssetUrl } from '../utils/publicAsset';

interface DocWritingConsoleViewProps {
  role: string;
  onOpenDocReview: () => void;
  documents?: DocumentInfo[];
  onSaveToDocumentCenter?: (doc: DocumentInfo) => void;
  navigationView?: Exclude<WritingView, 'recent-editor'>;
  navigationKey?: number;
  selectedExpertId?: HomeExpertId;
  onSelectedExpertChange?: (expertId: HomeExpertId) => void;
  onNavigationSync?: (view: WritingNavigationSyncView) => void;
  appearance?: {
    logoUrl: string;
    productName: string;
    productSubtitle?: string;
    slogan: string;
  };
}

type WritingView = 'home' | 'quick-create' | 'write' | 'copy' | 'polish' | 'check' | 'template-layout' | 'ppt' | 'table' | 'weboffice' | 'recent-editor' | 'conversation-detail';
type WritingNavigationSyncView = 'home' | 'quick-create' | 'write' | 'copy' | 'polish' | 'check' | 'template-layout' | 'weboffice';
type WriteStep = 'mode' | 'source' | 'outline-parse' | 'scenario' | 'form' | 'style' | 'outline' | 'full-confirm' | 'full';
type WritingMode = '生成全文' | '生成大纲' | '大纲成文' | '继续写' | '生成结语';
type WriteGenerationContext = {
  topic: string;
  requirements: string;
  wordCount: string;
  draftingUnit: string;
};
type OutlineParseStatus = 'idle' | 'processing' | 'success' | 'empty';
type OutlineInputMode = 'ai' | 'manual';
type CopyStep = 'upload' | 'extract' | 'requirements' | 'materials' | 'result';
type PolishStep = 'upload' | 'requirements' | 'preview' | 'result';
type PolishDocumentFolder = 'my-cloud';
type DocumentPickerTarget = 'home' | 'write-source' | 'copy' | 'polish' | 'check' | 'layout';
type TextPasteTarget = 'write-source' | 'copy' | 'polish' | 'check' | 'layout';
type CheckStep = 'vendor' | 'upload' | 'result';
type LayoutStep = 'upload' | 'requirements' | 'result';
type DraftStatus = 'draft' | 'reviewed' | 'needs-refine';

interface WritingScenario {
  id: string;
  title: string;
  desc?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  suggestedTitle?: string;
  children?: WritingScenario[];
}

interface OutlineSubSection {
  id: string;
  title: string;
  content: string;
  subsections?: OutlineSubSection[];
  originalTitle?: string;
  sourceLine?: number;
}

interface OutlineSection {
  id: string;
  title: string;
  content: string;
  subsections: OutlineSubSection[];
  originalTitle?: string;
  sourceLine?: number;
}

export interface ReferenceArticle {
  id: string;
  title: string;
  sourceUrl: string;
  content: string;
}

interface RecentDoc {
  title: string;
  type: string;
  time: string;
  tag: string;
  status: DraftStatus;
  wordCount: number;
  content: string;
}

interface UploadedMockFile {
  name: string;
  size: string;
  type: string;
  sourceKind?: 'local' | 'knowledge';
  sourceId?: string;
  sourceLabel?: string;
}

interface CopyDocumentAttributes {
  docType: string;
}

interface CopyStructureItem {
  id: string;
  title: string;
  writingFunction: string;
  pattern: string;
  skeleton: string;
  phrases: string[];
}

interface QATurn {
  id: number;
  prompt: string;
  sources: UploadedMockFile[];
  versions: QATurnVersion[];
  activeVersionIndex: number;
  status: 'processing' | 'done';
}

interface QATurnVersion {
  id: number;
  answer: string;
  createdAt: number;
}

const DEFAULT_COPY_ATTRIBUTES: CopyDocumentAttributes = {
  docType: '通知',
};

const COPY_DOC_TYPE_OPTIONS = ['通知', '报告', '请示', '批复', '函', '纪要', '新闻稿', '媒体稿', '宣传稿', '通稿', '讲话稿', '简报', '工作方案', '调研材料'];
const DEFAULT_COPY_DIRECTIONS = ['下行'];
const DEFAULT_COPY_TONES = ['正式稳妥'];
const DEFAULT_COPY_KEYWORDS = ['责任分工', '任务闭环', '时限反馈', '督导问效'];
const DEFAULT_COPY_NORM_PHRASES = ['围绕', '重点抓好', '确保', '切实'];

const DEFAULT_COPY_STRUCTURE_ITEMS: CopyStructureItem[] = [
  {
    id: 'position',
    title: '统一思想认识，明确总体要求',
    writingFunction: '政治站位定调，说明任务背景和总体要求',
    pattern: '总分总，先定调再提出整体要求',
    skeleton: '为深入贯彻[上级部署/核心目标]，现就[工作事项]提出如下要求。',
    phrases: ['深入贯彻', '统一思想', '总体要求'],
  },
  {
    id: 'task',
    title: '聚焦重点任务，强化过程管理',
    writingFunction: '任务部署与执行管控，明确重点动作',
    pattern: '分条列述，每条带目标+措施+时限',
    skeleton: '围绕[核心目标]，重点抓好以下工作：（一）[任务]。[目标+措施+时限]',
    phrases: ['围绕', '重点抓好', '闭环落实'],
  },
  {
    id: 'responsibility',
    title: '压紧压实责任，确保工作实效',
    writingFunction: '责任督导与结果闭环，强调组织保障',
    pattern: '层层递进，从责任压实到督导问效',
    skeleton: '各单位要[责任要求]，建立[机制]，确保[结果目标]。',
    phrases: ['压紧压实', '督导问效', '确保实效'],
  },
];

const cloneCopyStructureItems = () => DEFAULT_COPY_STRUCTURE_ITEMS.map((item) => ({
  ...item,
  phrases: [...item.phrases],
}));

const TASK_ENTRIES: Array<{
  id: Exclude<WritingView, 'home'>;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconKey: string;
  accent: string;
}> = [
  {
    id: 'write',
    title: '快速创作',
    subtitle: '根据主题快速生成通知、请示、纪要等规范初稿',
    icon: PenTool,
    iconKey: 'feature-ai-write',
    accent: 'from-[#F8FBFF] to-[#EEF5FF] border-[#CFE0FF] text-[#2563EB]'
  },
  {
    id: 'ppt',
    title: 'PPT创作',
    subtitle: '根据主题、文档或大纲生成演示文稿',
    icon: FileText,
    iconKey: 'feature-ppt',
    accent: 'from-[#FFF7ED] to-[#FFEDD5] border-[#FED7AA] text-[#EA580C]'
  },
  {
    id: 'table',
    title: '智能表格',
    subtitle: '上传文档后提取结构化数据并生成表格',
    icon: FileSearch,
    iconKey: 'feature-table',
    accent: 'from-[#F0FDF4] to-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
  },
  {
    id: 'copy',
    title: '以稿写稿',
    subtitle: '参考既有范文，快速复用结构、语气和行文组织',
    icon: Layers,
    iconKey: 'feature-ai-copy',
    accent: 'from-[#FFF8F8] to-[#FFF0F0] border-[#F4CACA] text-[#C8102E]'
  },
  {
    id: 'polish',
    title: '文风润色',
    subtitle: '提升严谨度、压缩口语化表达、统一正式口径',
    icon: Sparkles,
    iconKey: 'feature-ai-polish',
    accent: 'from-[#FFF8F8] to-[#FFF0F0] border-[#F4CACA] text-[#C8102E]'
  },
  {
    id: 'check',
    title: '公文校对',
    subtitle: '检查错别字、敏感用语和 GB/T 9704 格式问题',
    icon: FileCheck2,
    iconKey: 'feature-proofread',
    accent: 'from-[#FFF8F8] to-[#FFF0F0] border-[#F4CACA] text-[#DC2626]'
  },
  {
    id: 'template-layout',
    title: '智能排版',
    subtitle: '支持一键规范排版与公文套红，完成输出前版式处理',
    icon: Stamp,
    iconKey: 'feature-layout',
    accent: 'from-[#FFF8F8] to-[#FFF0F0] border-[#F4CACA] text-[#C8102E]'
  }
];

const HOME_QUICK_START = [
  { id: 'write' as const, title: '快速创作', desc: '从空白页快速起草通知、请示、纪要等正式公文', icon: PenTool, iconKey: 'feature-ai-write', tag: '主入口' },
  { id: 'copy' as const, title: '以稿写稿', desc: '参考范文延续结构、语气和口径，快速生成成稿', icon: Layers, iconKey: 'feature-ai-copy', tag: '高频任务' },
  { id: 'polish' as const, title: '文风润色', desc: '统一正式表达，压缩口语化语句，提升成稿严谨度', icon: Sparkles, iconKey: 'feature-ai-polish', tag: '提质优化' },
  { id: 'template-layout' as const, title: '智能排版', desc: '一键规范排版或套入红头模板，直接进入输出前版式处理', icon: Stamp, iconKey: 'feature-layout', tag: '版式整理' },
  { id: 'check' as const, title: '智能校对', desc: '检查错别字、敏感用语和国家公文格式规范问题', icon: FileCheck2, iconKey: 'feature-proofread', tag: '交付前' }
] satisfies Array<{
  id: WritingView;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconKey: string;
  tag: string;
}>;

const POLISH_DOCUMENT_FOLDERS: Array<{
  id: PolishDocumentFolder;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'my-cloud', label: '知识库文档', icon: Folder },
];

const DOC_CENTER_MY_CLOUD_WORD_DOCS: DocumentInfo[] = [
  {
    id: 'doc-center-my-office-test',
    title: '智能办公测试.docx',
    lastModified: '昨天 11:04',
    author: '我',
    type: 'recent',
    category: '公文',
    content: `政企智能办公模块自研功能测试

当前状态：草稿
作者：我 (SSO岗位一岗双责白名单授权)

已成功测试致远办公底座API的自动唤醒和公文纠错反馈能力。整体排版完全对标 GB/T 9704-2012 政务公文标准体系。`
  },
  {
    id: 'doc-center-my-flood-control',
    title: '北京政务云-防汛重保-2026.docx',
    lastModified: '2026-06-12',
    author: '我',
    type: 'recent',
    category: '公文',
    content: `北京政务云-防汛重保-2026

北京市行政系统保障处公文草案：

为切实做好2026年度汛期政务数据云底座的容灾和高可用，经研究决定，于2026年6月中旬对以下系统进行靶向治理排查：
1. 防汛调度大屏直联数据库高可用切换
2. 金山协同系统防洪防淹备用机房双因子阻断测试`
  }
];

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  '通知': FileText,
  '讲话稿': PenTool,
  '方案': Layers,
  '报告': FileSearch,
  '函': FilePlus,
  '会议纪要': FileCheck2,
  '请示': HelpCircle,
  '批复': FileUp,
  '决定': Stamp,
  '意见': Compass,
  '通告': File,
  '通报': FileText,
  '学习心得': PenTool,
  '命令': FileCheck2,
  '通用公文': File,
  '新闻': FileText,
  '总结': FileSearch,
  '书信': FilePlus,
  '规范应用模版': Layers,
};

export const WRITING_CATEGORIES: WritingScenario[] = [
  {
    id: 'd44caf79a1a84680abe471aae845292a', title: '通知', children: [
      { id: '3a08bce30d444265904326e06d5270a9', title: '工作事务通知', suggestedTitle: '（单位/部门名称）关于做好XXX工作事务的通知' },
      { id: 'c20cd170c0824057b2faa1f5702a5372', title: '开展活动通知', suggestedTitle: '（单位/部门名称）关于开展/组织/举办/召开XXX活动的通知' },
      { id: '8aecdfaa9f4546c59cdf09168d7f9ce0', title: '召开会议通知', suggestedTitle: '（单位/部门名称）关于召开XXX会议的通知' },
      { id: '48d8e0cb10be4a0bb6065dfb3f7b5d89', title: '举办比赛通知', suggestedTitle: '（单位/部门名称）关于举办/开展/组织XXX比赛的通知' },
      { id: '3051a07f88e04e5aad7457e3de12d83f', title: '人事任免通知', suggestedTitle: '（单位/部门名称）关于XXX同志的任免通知' },
      { id: 'a642d9793d674f879f31392c45227b4f', title: '转发类通知', suggestedTitle: '（单位/部门名称）关于转发《XXX》的通知' },
      { id: '5d4376964b164f579cd0ec26273b37c4', title: '批转类通知', suggestedTitle: '（单位/部门名称）关于批转《XXX》的通知' },
      { id: '3a5e1cd559e44c368eaee34787b4f400', title: '印发类通知', suggestedTitle: '（单位/部门名称）关于印发《XXX》的通知' },
      { id: '50582db7cadb40c4bbb1cebde6c9cb80', title: '其它通知', suggestedTitle: '（单位/部门名称）关于XXX的通知' },
    ]
  },
  {
    id: 'a223ba91722d4f08a3efec697f23f66e', title: '讲话稿', children: [
      { id: 'be2a2b9e28e84953be9930296a1a8ecd', title: '会议活动受邀致辞', suggestedTitle: 'XXX同志在XXX（会议/活动）上的讲话/致辞' },
      { id: '3f65aff062414d59ae09301b7657f461', title: '会议总结讲话', suggestedTitle: 'XXX同志在XXX会议上的总结讲话' },
      { id: '1051dcd66bca4cc3862b5437fec4824f', title: '工作报告讲话', suggestedTitle: 'XXX同志在XXX工作会议上作报告讲话' },
      { id: '38c07e33f49d47e98ff376c933e778bd', title: '工作部署讲话', suggestedTitle: 'XXX同志在XXX工作部署会上的讲话' },
      { id: '2f920cb840ea4d8ba6fab522b0f7a6e1', title: '社会问题评论', suggestedTitle: 'XXX同志对XXX社会生活问题的点评' },
      { id: '133208c888104b7987d117e7ef339399', title: '节日庆典讲话', suggestedTitle: 'XXX同志在XXX（节日/庆典）上的致辞/讲话' },
      { id: '1b809c2372e24cc1b08ab35515883449', title: '政策解读讲话', suggestedTitle: 'XXX同志对《XXX》的解读讲话' },
      { id: 'aeccc64ddffb46a3ba98c45a08111ba5', title: '学术会议讲话', suggestedTitle: 'XXX同志在XXX学术研讨会上的致辞' },
      { id: '4960007f00c049fba5628efd9f7a4398', title: '开幕式致辞', suggestedTitle: 'XXX同志在XXX（活动/会议名称）开幕式上的讲话' },
      { id: '36733cb4e9424391bc2674ab2295ca28', title: '闭幕式致辞', suggestedTitle: 'XXX同志在XXX（活动/会议名称）闭幕式上的讲话' },
      { id: 'a64def87931a430d91265800f07cb48c', title: '追悼会致辞', suggestedTitle: 'XXX同志在XXX同志追悼大会上的悼词' },
      { id: 'dccaad1ed68e443d9b2f02f2d892c412', title: '纪念会致辞', suggestedTitle: 'XXX同志在纪念XXX同志大会上的讲话' },
      { id: '67b3cda01bfe490d85a9820f4f9a4bae', title: '动员讲话稿', suggestedTitle: 'XXX同志在XXX（活动/会议）动员部署会上的发言' },
      { id: 'ee6a3083ea1e428787ee2727f8a607d9', title: '其它讲话稿', suggestedTitle: '在XXX大会/活动/会议上的发言' },
    ]
  },
  {
    id: '95b9f23e39024733b1ce73a89b5840eb', title: '方案', children: [
      { id: '456975fb5b3b4607a5cf0e64740a7ca1', title: '工作方案', suggestedTitle: '关于XXX工作的行动/实施方案' },
      { id: '8af198ff7f42497388ad706afc4a86f5', title: '活动方案', suggestedTitle: '关于XXX工作的活动方案' },
      { id: 'ccec4bc8655b4e079711401c8a2df499', title: '整治方案', suggestedTitle: '关于XXX问题/不合规事件的专项整治方案' },
      { id: '6ae8574cd5fd47569e44203e3829f2d3', title: '调研方案', suggestedTitle: '关于组织开展XXX的调研行动方案' },
      { id: '9c306b54cfba464ea43e83383af50872', title: '会议方案', suggestedTitle: '关于XXXX的会议工作方案' },
      { id: '9465193380ba484ab948d18d8af354db', title: '其它方案', suggestedTitle: '关于XXXX的方案' },
    ]
  },
  {
    id: '61c90a15a2984ed683d71de9a040e54f', title: '报告', children: [
      { id: 'c56c113a7fcf4c0f9c23598b6dac5296', title: '年度报告', suggestedTitle: '（单位/部门名称）XXXX年XXX工作事项的年度报告' },
      { id: '054a7fec09884335a4b88cbab05e2082', title: '季度报告', suggestedTitle: '（单位/部门名称）XXXX年XX季度XXX工作事项的报告' },
      { id: 'f0d9e41104db48e0882b9785f7cb5ca9', title: '专项工作报告', suggestedTitle: '（单位/部门名称）关于XXX专项工作事项的报告' },
      { id: 'e181902978b149b98e56ab441fde50cd', title: '答复报告', suggestedTitle: '（单位/部门名称）关于XXX工作事项的答复/回复报告' },
      { id: 'f97f6ea9ca85472d87b6792e633e3051', title: '报送报告', suggestedTitle: '关于报送《XXX》的报告' },
      { id: '39aa6253fbfd46b787d940645e35f067', title: '会议情况报告', suggestedTitle: '关于XXX会议情况的报告' },
      { id: '7607b0344eba4ab68e115fb9a3174d99', title: '紧急报告', suggestedTitle: '关于XXX紧急事件的紧急报告' },
      { id: 'a12e8fb2959248c19c273b971cacacaa', title: '行业发展报告', suggestedTitle: 'XXX行业发展报告' },
      { id: '7006ff1cc1e74d65a44f0bf25b40acbd', title: '其它报告', suggestedTitle: '（单位/部门名称）关于XXX的报告' },
    ]
  },
  {
    id: '7dd28835ea4f4a7c8805d686db6ba705', title: '函', children: [
      { id: '4ce8d6c731464c3b95d05f3aba73638e', title: '工作商洽函', suggestedTitle: '（部门/单位名称）关于商请XXX事宜的函' },
      { id: 'eb08837f34fa44c59edbb014b1be7f37', title: '参观拜访函', suggestedTitle: '（部门/单位名称）关于赴XXX（参观拜访地点）拜访的函' },
      { id: 'ae64f19e4d554ee9ba849420174b1357', title: '问题询问函', suggestedTitle: '（部门/单位名称）关于咨询/询问XXX事宜的函' },
      { id: 'd56320a070fc4b32b71c9782d38680b4', title: '问题答复函', suggestedTitle: '（部门/单位名称）关于回复XXX问题的答复函' },
      { id: '613f612607de4150860a214c1c349fc3', title: '请求批准函', suggestedTitle: '（部门/单位名称）关于请求/申请XXX事宜的函' },
      { id: 'c5f78763f5ba4c22b7fb647355fc0ec5', title: '审批答复函', suggestedTitle: '（部门/单位名称）关于（同意/不同意）XXX事项的复函' },
      { id: 'ab58805dc63649b6aecc17124577c90e', title: '告知函', suggestedTitle: '（部门/单位名称）关于XXX事项的告知函' },
      { id: '622bb3c98be6456cb0e78501b801c3d8', title: '公开征求意见函', suggestedTitle: '（部门/单位名称）关于公开征求《XXX（征求意见稿）》意见的函' },
      { id: '9ba3954170f94d14a4ed0fa3c7a03e66', title: '面向司局征求意见函', suggestedTitle: '（部门/单位名称）关于征求《XXX（征求意见稿）》意见的函' },
      { id: 'ada823e3afe848cf9fdee647f3dd7c58', title: '邀请函', suggestedTitle: '（活动/会议名称）+邀请函' },
      { id: '7da56658654648afb776c8e49370eeae', title: '复函', suggestedTitle: '（XXX单位）关于对XXX事项意见的回复/的复函' },
      { id: 'b01a04dad6da45828e48b1c6b90bb824', title: '人大建议复文', suggestedTitle: '对XXX会议第XXX号建议的答复' },
      { id: '81b29aa2d5ea491599c539d5948561da', title: '政协提案复文', suggestedTitle: '关于XXX会议XXX号提案答复的函' },
      { id: '5469820fb77b40eaaff96a12a156f063', title: '其它函', suggestedTitle: '（部门/单位名称）关于XXX事项的函' },
    ]
  },
  {
    id: '90d981f44fe64850b128974663ecb578', title: '会议纪要', children: [
      { id: 'd5d7ed43915b4827be0eafcd0436efc3', title: '工作例会会议纪要', suggestedTitle: 'XXX单位XXX年度工作例会会议纪要' },
      { id: '19420e32d2fa4e53a9f840abc66b118c', title: '专项工作会议纪要', suggestedTitle: '（专项工作会议名称）+专题会议纪要' },
      { id: '18e644e2e2c0428e9ea93cce95408a63', title: '问题研讨会会议纪要', suggestedTitle: '关于XXX问题的会议纪要' },
      { id: '86eeb714e65c4d7ab312aef80d3fbb25', title: '主题座谈会会议纪要', suggestedTitle: 'XXX工作/调研座谈会会议纪要' },
      { id: '9eff41fafd6549d1ba441d0ea2272613', title: '培训会议纪要', suggestedTitle: 'XXX培训会议纪要' },
      { id: '11ac8bf9f8c940159a2ff7b3d0aa13f2', title: '常务会议纪要', suggestedTitle: '会议名称+常务会议纪要' },
      { id: 'd8e8158420ed49db98d185e846c0d80c', title: '办公会议纪要', suggestedTitle: '会议名称+办公会会议纪要' },
      { id: '80753700256a4b19bc0ba7df1d327ad2', title: '党组会议纪要', suggestedTitle: '会议名称+党组会议纪要' },
      { id: '8a3d9fac42b5456d9be008ba6ca91113', title: '党政联席会议纪要', suggestedTitle: '会议名称+党政联席会议纪要' },
      { id: 'fe030b44166c431489774f9a7470dbc3', title: '党组（扩大）会议纪要', suggestedTitle: '会议名称+党组（扩大）会议纪要' },
      { id: '07e61d15e50b4532ab8bf8b5dd96431a', title: '专题会议纪要', suggestedTitle: '关于XXX事宜的专题会议纪要' },
      { id: '96d0c85e9b2043548d0633091742214e', title: '协调性会议纪要', suggestedTitle: 'XXX单位关于XXX事宜的协调会议纪要' },
      { id: 'bcfec03a62ce436db365f0b3232fdbdb', title: '其它会议纪要', suggestedTitle: '会议名称/会议事项+纪要' },
    ]
  },
  {
    id: '7df598df00d14c6bb746e58845daf252', title: '请示', children: [
      { id: '1d697fa0ad8c4978ab63062f5c868767', title: '资金费用申请请示', suggestedTitle: '（单位/部门名称）关于申请拨付XXXX经费的请示' },
      { id: '65ad87ec446b4ebfa57c49e1e416a4ad', title: '材料上报审定印发请示', suggestedTitle: '（单位/部门名称）关于提请印发《XXX》的请示' },
      { id: '5a0cab6808a046ff8f9fb8ca8dc0fd69', title: '重大决策事项请求审定请示', suggestedTitle: '（单位/部门名称）关于提请审议/审批《XXX》的请示' },
      { id: '931d87a0dcff4d9ca4855070e91b99cf', title: '回复意见请示', suggestedTitle: '（单位/部门名称）关于回复《XXX》的请示' },
      { id: 'caa98407b0034a5e959bbb9c412cb65f', title: '组织成立请示', suggestedTitle: '（单位/部门名称）关于成立XXX组织机构的请示' },
      { id: '6b6ed1cff6294701b97e25812f3c2cc4', title: '其它请示', suggestedTitle: '（部门/单位名称）关于XXX事项的请示' },
    ]
  },
  {
    id: '580b76e529fa4b89ae50dc7884b0975b', title: '批复', suggestedTitle: '（部门/单位名称）关于对XXX事项的批复', children: [
      { id: '6f86aa4add4f4d9398b088f95ce979ba', title: '表态式批复', suggestedTitle: 'XXX单位关于同意XXX事宜的批复' },
      { id: '3587ca7126e0439783a7a8bbc64624b8', title: '阐发式批复', suggestedTitle: '关于XXX的批复' },
      { id: '323b144d33e3428580ead820ef508b4d', title: '否定性批复', suggestedTitle: 'XXX单位关于不同意XXX事宜的批复' },
    ]
  },
  { id: '09fb6a030cd14cf080f6c4a6cef0e563', title: '决定', suggestedTitle: '（部门/单位名称）关于对XXX事项的决定' },
  { id: 'b0eeaef4ec9849c2a8f2141ec1c1b035', title: '意见', suggestedTitle: '（部门/单位名称）关于XXX事项的意见' },
  { id: 'f6d1c16242644ae7837e077b370a0859', title: '通告', suggestedTitle: '（部门/单位名称）关于对XXX事项名称的通告' },
  {
    id: 'c51cf27b2794470f9b2aefb588470475', title: '通报', children: [
      { id: '0f31ae03c38448b696c6ba7a24a19d11', title: '表彰性通报', suggestedTitle: '（部门/单位名称）关于对XXX事项名称的通报' },
      { id: 'f43def2347414135ad33835628508857', title: '批评性通报', suggestedTitle: 'XXX单位关于对XXX予以批评的通报' },
      { id: 'bdfd55d8af47495896af89cce2710003', title: '工作事务类情况通报', suggestedTitle: 'XXX单位关于XXX事宜的情况通报' },
      { id: 'db46e1847ead40bb951e1bb9caac2032', title: '事故处理类通报', suggestedTitle: 'XXXX单位关于对XXXX事故的通报' },
      { id: 'c4788d379f284b8d951d5b0dc5ea2892', title: '巡查整改情况通报', suggestedTitle: 'XXX单位关于巡查整改情况的通报' },
    ]
  },
  { id: '8fdc185f7b8b423098501b1eabc32d7f', title: '学习心得', suggestedTitle: '关于XXX事项的心得体会' },
  {
    id: '97e554617bb146fbafa5a35b9e4e57a1', title: '命令', children: [
      { id: '0bc2f70da3084961bf6d244936edb931', title: '公布令', suggestedTitle: 'XXX单位令' },
      { id: '1e0ebd38463d455caedd7131881a5ac2', title: '嘉奖令', suggestedTitle: 'XXX单位关于对XXX的嘉奖令' },
      { id: 'bcc2fbd7cec548918cfa2b38fd774be5', title: '任免令', suggestedTitle: 'XXX单位任免令' },
    ]
  },
  { id: 'c7c05e749c7a4dcb8cf5e8ea372c093c', title: '通用公文', suggestedTitle: '关于XXX工作的行动/实施方案' },
  {
    id: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', title: '新闻', children: [
      { id: 'n01a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5', title: '新闻发言稿', suggestedTitle: '（单位/部门名称）关于XXX的新闻发布会发言稿' },
      { id: 'n02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5', title: '新闻消息', suggestedTitle: '（单位/部门名称）关于XXX的新闻消息' },
    ]
  },
  {
    id: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7', title: '总结', children: [
      { id: 'z01b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', title: '年度总结', suggestedTitle: '（单位/部门名称）XXXX年度工作总结' },
      { id: 'z02b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', title: '半年总结', suggestedTitle: '（单位/部门名称）XXXX年上半年工作总结' },
      { id: 'z03b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', title: '季度总结', suggestedTitle: '（单位/部门名称）XXXX年第X季度工作总结' },
      { id: 'z04b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', title: '述职述廉', suggestedTitle: 'XXX同志XXXX年度述职述廉报告' },
    ]
  },
  {
    id: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8', title: '书信', children: [
      { id: 's01c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', title: '倡议书', suggestedTitle: '（单位/部门名称）关于XXX的倡议书' },
      { id: 's02c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', title: '决心书', suggestedTitle: 'XXX同志关于XXX的决心书' },
      { id: 's03c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', title: '表扬信', suggestedTitle: '（单位/部门名称）关于表扬XXX的信' },
      { id: 's04c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', title: '感谢信', suggestedTitle: '（单位/部门名称）致XXX的感谢信' },
      { id: 's05c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', title: '慰问信', suggestedTitle: '（单位/部门名称）致XXX的慰问信' },
      { id: 's06c3d4e5f6a7b8c9d0e1f2a3b4c5d6e', title: '贺信', suggestedTitle: '（单位/部门名称）致XXX的贺信' },
    ]
  },
  {
    id: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', title: '规范应用模版', children: [
      { id: 'g01d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '条例', suggestedTitle: '（单位/部门名称）XXX管理条例' },
      { id: 'g02d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '规定', suggestedTitle: '（单位/部门名称）关于XXX的规定' },
      { id: 'g03d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '章程', suggestedTitle: '（单位/部门名称）XXX章程' },
      { id: 'g04d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '办法', suggestedTitle: '（单位/部门名称）XXX管理办法' },
      { id: 'g05d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '守则', suggestedTitle: '（单位/部门名称）XXX守则' },
      { id: 'g06d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '细则', suggestedTitle: '（单位/部门名称）XXX实施细则' },
      { id: 'g07d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '启事', suggestedTitle: '（单位/部门名称）关于XXX的启事' },
      { id: 'g08d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '声明', suggestedTitle: '（单位/部门名称）关于XXX的声明' },
      { id: 'g09d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '公示', suggestedTitle: '（单位/部门名称）关于XXX的公示' },
      { id: 'g10d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '安排', suggestedTitle: '（单位/部门名称）关于XXX的工作安排' },
      { id: 'g11d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '规划', suggestedTitle: '（单位/部门名称）XXX发展规划' },
      { id: 'g12d4e5f6a7b8c9d0e1f2a3b4c5d6e7f', title: '计划', suggestedTitle: '（单位/部门名称）XXX工作计划' },
    ]
  },
];

export const INTERNET_STYLE_TEMPLATES: ReferenceArticle[] = [
  {
    id: 'ref-1',
    title: '国务院办公厅关于加强安全生产监管执法的通知',
    sourceUrl: 'www.gov.cn',
    content: '为贯彻党中央、国务院关于安全生产的决策部署，落实"党政同责、一岗双责、齐抓共管"的要求，现就加强安全生产监管执法有关事项通知如下：一、健全完善安全生产法规制度体系。各地区、各有关部门要对照新修订的《安全生产法》，及时清理、修改、完善配套规章制度...',
  },
  {
    id: 'ref-2',
    title: '关于进一步规范公文处理工作的若干意见',
    sourceUrl: '中国行政管理杂志',
    content: '公文是党政机关实施领导、履行职能、处理公务的重要工具。为进一步规范公文处理工作，提高公文质量和办理效率，提出以下意见：一、严格公文格式标准。各单位应严格按照《党政机关公文格式》国家标准执行，确保公文的严肃性和规范性...',
  },
  {
    id: 'ref-3',
    title: '新华社：关于推动高质量发展的政策解读',
    sourceUrl: 'xinhuanet.com',
    content: '高质量发展是全面建设社会主义现代化国家的首要任务。必须完整、准确、全面贯彻新发展理念，始终以创新、协调、绿色、开放、共享的内在统一来把握发展、衡量发展、推动发展。各地区要结合实际情况，因地制宜制定实施方案，确保各项政策落地见效...',
  },
  {
    id: 'ref-4',
    title: '人民日报：加强作风建设 力戒形式主义官僚主义',
    sourceUrl: 'people.com.cn',
    content: '作风建设永远在路上。要坚决纠治形式主义、官僚主义突出问题，切实为基层减负。各级领导干部要带头深入一线、深入群众，察实情、出实招、求实效。要坚持问题导向，聚焦群众反映强烈的突出问题，一件一件抓落实，一项一项见成效...',
  },
  {
    id: 'ref-5',
    title: '应急管理部关于印发《企业安全生产标准化建设定级办法》的通知',
    sourceUrl: 'mem.gov.cn',
    content: '为规范和加强企业安全生产标准化建设，提升企业安全管理水平，根据《中华人民共和国安全生产法》等法律法规，制定本办法。企业安全生产标准化建设定级工作坚持"企业自主、政府推动、社会参与"的原则，旨在推动企业落实安全生产主体责任...',
  },
  {
    id: 'ref-6',
    title: '中共中央办公厅关于在全党大兴调查研究的工作方案',
    sourceUrl: 'cpcnews.cn',
    content: '调查研究是我们党的传家宝。为深入学习贯彻习近平新时代中国特色社会主义思想，全面贯彻落实党的二十大精神，党中央决定在全党大兴调查研究，作为在全党开展主题教育的重要内容。各级党委（党组）要高度重视调查研究工作，作出专门部署，精心组织实施...',
  },
  {
    id: 'ref-7',
    title: '住建部关于推进建筑行业数字化转型的指导意见',
    sourceUrl: 'mohurd.gov.cn',
    content: '推动建筑行业数字化转型是实现建筑业高质量发展的必由之路。要以BIM技术为核心，以智慧工地为抓手，全面推进设计、施工、运维全过程的数字化管理。鼓励企业加大科技研发投入，培育数字化人才队伍，打造一批标杆示范项目...',
  },
  {
    id: 'ref-8',
    title: '求是：坚定不移走中国特色金融发展之路',
    sourceUrl: 'qstheory.cn',
    content: '金融是国民经济的血脉，是国家核心竞争力的重要组成部分。必须坚持党中央对金融工作的集中统一领导，坚持以人民为中心的价值取向，坚持把金融服务实体经济作为根本宗旨。要统筹发展和安全，牢牢守住不发生系统性金融风险的底线...',
  },
];

const KNOWLEDGE_LIBRARY_GROUPS = [
  {
    id: 'personal',
    title: '个人知识库',
    desc: '个人沉淀资料',
    folders: [
      {
        id: 'personal-drafts',
        title: '我的公文素材',
        files: [
          { id: 'p-file-1', title: '季度汇报材料整理.docx', type: 'docx', size: '128KB', owner: '张三', updated: '今天' },
          { id: 'p-file-2', title: '领导讲话语料库.txt', type: 'txt', size: '36KB', owner: '张三', updated: '昨天' },
          { id: 'p-file-3', title: '近期政策摘编.pdf', type: 'pdf', size: '2.1MB', owner: '张三', updated: '一周前' },
        ],
      },
      {
        id: 'personal-history',
        title: '历史写作参考',
        files: [
          { id: 'p-file-4', title: '防汛值班通知复盘.docx', type: 'docx', size: '96KB', owner: '张三', updated: '两周前' },
          { id: 'p-file-5', title: '安全生产月总结.docx', type: 'docx', size: '84KB', owner: '张三', updated: '一个月前' },
        ],
      },
    ],
  },
  {
    id: 'department',
    title: '部门知识库',
    desc: '部门共享资料',
    folders: [
      {
        id: 'dept-office',
        title: '办公室常用材料',
        files: [
          { id: 'd-file-1', title: '政府工作报告重点摘编.docx', type: 'docx', size: '210KB', owner: '办公室', updated: '今天' },
          { id: 'd-file-2', title: '会议纪要格式样例.docx', type: 'docx', size: '76KB', owner: '办公室', updated: '三天前' },
          { id: 'd-file-3', title: '督查整改报告模板.docx', type: 'docx', size: '112KB', owner: '办公室', updated: '一周前' },
        ],
      },
      {
        id: 'dept-policy',
        title: '政策制度汇编',
        files: [
          { id: 'd-file-4', title: '高质量发展政策口径.pdf', type: 'pdf', size: '1.8MB', owner: '政策处', updated: '一周前' },
          { id: 'd-file-5', title: '公文处理规范说明.docx', type: 'docx', size: '146KB', owner: '政策处', updated: '两周前' },
        ],
      },
    ],
  },
  {
    id: 'resource',
    title: '资源素材库',
    desc: '通用素材资源',
    folders: [
      {
        id: 'resource-cases',
        title: '优秀范文案例',
        files: [
          { id: 'r-file-1', title: '关于北京市政府工作方案.docx', type: 'docx', size: '180KB', owner: '素材库', updated: '今天' },
          { id: 'r-file-2', title: '重点任务推进方案.docx', type: 'docx', size: '156KB', owner: '素材库', updated: '一周前' },
          { id: 'r-file-3', title: '年度工作总结优秀样例.docx', type: 'docx', size: '203KB', owner: '素材库', updated: '一个月前' },
        ],
      },
      {
        id: 'resource-data',
        title: '数据与图表',
        files: [
          { id: 'r-file-4', title: '重点项目数据表.xlsx', type: 'xlsx', size: '92KB', owner: '素材库', updated: '两周前' },
          { id: 'r-file-5', title: '民生指标统计汇总.xlsx', type: 'xlsx', size: '118KB', owner: '素材库', updated: '一个月前' },
        ],
      },
    ],
  },
];

const renderReferenceFolderIcon = (variant: 'tree' | 'row' | 'empty' = 'row') => (
  <span className={`knowledge-folder-icon knowledge-folder-icon-${variant}`}>
    <svg viewBox="0 0 28 24" aria-hidden="true">
      <path className="knowledge-folder-back" d="M2.5 7.2a2.2 2.2 0 0 1 2.2-2.2h6.2l2.2 2.4h10.2a2.2 2.2 0 0 1 2.2 2.2v1.1h-23Z" />
      <path className="knowledge-folder-front" d="M2.5 9.7h23l-1.7 8.8a2.4 2.4 0 0 1-2.4 1.9H5.2a2.4 2.4 0 0 1-2.4-2.1Z" />
    </svg>
  </span>
);

const renderReferenceFileIcon = (fileType: string) => {
  const isSheet = fileType === 'xlsx' || fileType === 'xls';
  const isPdf = fileType === 'pdf';
  const iconClassName = isSheet ? 'knowledge-file-icon-xls' : isPdf ? 'knowledge-file-icon-ppt' : 'knowledge-file-icon-doc';
  const badge = isSheet ? 'X' : isPdf ? 'P' : 'W';

  return (
    <span className={`knowledge-file-icon ${iconClassName}`}>
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path className="knowledge-file-page" d="M7 3.5h9.2L22 9.3v14.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-18a2 2 0 0 1 2-2Z" />
        <path className="knowledge-file-fold" d="M16.2 3.5v5.8H22" />
        {isSheet ? (
          <path className="knowledge-file-grid" d="M9 12h10M9 16h10M9 20h10M12.4 12v8M16 12v8" />
        ) : isPdf ? (
          <path className="knowledge-file-chart" d="M9.5 13.5h9M9.5 17.2h7M9.5 20.8h9" />
        ) : (
          <path className="knowledge-file-mark" d="M9 13.2h10M9 17h8M9 20.8h6" />
        )}
      </svg>
      <span className="knowledge-file-type-badge">{badge}</span>
    </span>
  );
};

const WRITE_STEP_META: Array<{ id: WriteStep; label: string; stepNumber: number }> = [
  { id: 'mode', label: '写作模式', stepNumber: 1 },
  { id: 'source', label: '上传文本', stepNumber: 2 },
  { id: 'scenario', label: '场景选择', stepNumber: 3 },
  { id: 'form', label: '基础信息', stepNumber: 4 },
  { id: 'style', label: '参考素材', stepNumber: 5 },
  { id: 'outline', label: '生成大纲', stepNumber: 6 },
  { id: 'full-confirm', label: '生成确认', stepNumber: 7 },
  { id: 'full', label: '生成全文', stepNumber: 8 },
];

const WRITING_MODE_OPTIONS: Array<{ id: WritingMode; desc: string; icon: typeof FileText; iconKey: string }> = [
  { id: '生成全文', desc: '根据主题、要求和参考素材直接生成完整正文', icon: FileText, iconKey: 'write-mode-full' },
  { id: '生成大纲', desc: '先生成结构化大纲，便于逐级调整内容框架', icon: Layers, iconKey: 'write-mode-outline' },
  { id: '大纲成文', desc: '根据已有大纲扩写为规范公文正文', icon: FileCheck2, iconKey: 'write-mode-outline-to-text' },
  { id: '继续写', desc: '接续已有内容，延展后续段落和工作要求', icon: PenTool, iconKey: 'write-mode-continue' },
  { id: '生成结语', desc: '为现有稿件补齐正式收束段和落款语气', icon: Sparkles, iconKey: 'write-mode-conclusion' },
];

const MODEL_OPTIONS = ['金山政务办公大模型', 'DeepSeek-V4-Pro', 'Qwen3-235B-A22B', 'Claude-4.5-Opus'];

const HOME_PROMPT_MAX_LENGTH = 10000;
const HOME_SOURCE_TEXT_MAX_LENGTH = 500;

const HOME_SOURCE_REQUIRED_WRITING_MODES: WritingMode[] = ['大纲成文', '继续写', '生成结语'];

const HOME_WRITING_PROMPT_COPY: Record<WritingMode, {
  inlineLead: string;
  submitLead: string;
  sourceLabel?: string;
}> = {
  生成全文: {
    inlineLead: '帮我起草一篇完整公文',
    submitLead: '请起草一篇完整公文'
  },
  生成大纲: {
    inlineLead: '帮我生成一份公文大纲',
    submitLead: '请生成一份公文大纲'
  },
  大纲成文: {
    inlineLead: '请基于已有大纲扩写成完整公文',
    submitLead: '请基于已有大纲扩写成完整公文',
    sourceLabel: '已有大纲'
  },
  继续写: {
    inlineLead: '请基于已有正文继续写',
    submitLead: '请基于已有正文继续写',
    sourceLabel: '已有正文'
  },
  生成结语: {
    inlineLead: '请为已有正文补写结语',
    submitLead: '请为已有正文补写结语',
    sourceLabel: '已有正文'
  }
};

const HOME_QUICK_PROMPT_COPY: Record<WritingMode, {
  placeholder: string;
  hint?: string;
}> = {
  生成全文: {
    placeholder: '一句话说明要写什么，例如：写一篇关于防汛工作的通知'
  },
  生成大纲: {
    placeholder: '一句话说明大纲主题，例如：生成一份数字政府建设汇报大纲'
  },
  大纲成文: {
    placeholder: '一句话说明成文要求，发送后补充已有大纲',
    hint: '该任务需要已有大纲，发送后将在智能公文页面确认大纲结构。'
  },
  继续写: {
    placeholder: '一句话说明续写方向，发送后选择已有正文',
    hint: '该任务需要已有正文，发送后将在智能公文页面选择续写来源。'
  },
  生成结语: {
    placeholder: '一句话说明结语用途，发送后补充正文或大纲',
    hint: '可基于正文、大纲或标题生成结语，发送后继续完善上下文。'
  }
};

const HOME_EXPERT_GUIDE_COPY: Record<HomeExpertId, string> = {
  doc: '可以直接描述要处理的公文任务、标题、背景或参考材料。',
  summary: '可以输入工作事项、阶段进展、亮点问题，我来帮你整理成总结。',
  meeting: '可以粘贴会议记录、议题和参会信息，我来提炼纪要和待办。',
  speech: '可以说明发言场景、对象和主题，我来组织讲话稿思路。',
  policy: '可以输入政策名称、条款或问题，我来解读影响和落实建议。',
  data: '可以上传数据表或描述指标口径，我来分析趋势、异常和汇报结论。'
};

const DOCUMENT_FORMAT_LABEL = '党政机关公文格式（GB/T9702-202）';

const FORMAT_TEMPLATE_STYLE_OPTIONS = [
  { id: 'party-standard', label: DOCUMENT_FORMAT_LABEL, desc: '标题、正文、版记、页边距与行距统一规范' },
  { id: 'notice-compact', label: '通知类公文紧凑版式', desc: '适合短通知、工作提醒、会议安排' },
  { id: 'report-formal', label: '报告请示正式版式', desc: '适合请示、报告、方案等长文稿' },
  { id: 'meeting-minutes', label: '会议纪要版式', desc: '适合纪要、议定事项、任务清单' },
];

export const RED_TEMPLATE_STYLE_OPTIONS = [
  {
    id: 'standard',
    label: '标准红头',
    templateTitle: '中国智海建设集团文件',
    documentNo: '智海发〔2026〕18号',
    signer: '张三',
  },
  {
    id: 'party',
    label: '党委红头',
    templateTitle: '中共中国智海建设集团委员会文件',
    documentNo: '智海党发〔2026〕12号',
    signer: '李明',
  },
  {
    id: 'office',
    label: '办公室红头',
    templateTitle: '中国智海建设集团办公室文件',
    documentNo: '智海办〔2026〕18号',
    signer: '王静',
  },
  {
    id: 'meeting',
    label: '会议纪要红头',
    templateTitle: '中国智海建设集团会议纪要',
    documentNo: '第 8 期',
    signer: '会议主持人',
  },
];

const SAMPLE_POLISH_DOCUMENT = `各分公司、集团各部室：

  为深入贯彻落实国家关于加强网络安全工作的决策部署，进一步提升集团整体网络安全防护能力，切实保障关键信息基础设施和重要数据安全，经研究决定，现就在全集团范围内开展网络安全专项排查整治工作通知如下：

一、提高政治站位，充分认识网络安全工作重要性

  各单位要从维护政治安全和经济社会发展大局的高度，深刻认识网络安全工作的极端重要性。近期行业内安全事件多发，网络攻击手段不断翻新，安全形势日益严峻。各级领导干部要切实增强责任感和紧迫感，将网络安全纳入本单位重点工作统筹推进。

二、全面排查隐患，摸清网络安全底数

  各单位应于收到本通知起十个工作日内，对本单位及下属机构的所有网络资产进行全面排查。重点检查服务器、终端设备、应用系统、数据库、网络边界防护设备等关键环节。建立完整的资产台账和安全基线清单，对发现的问题逐项登记、分类定级。

三、聚焦重点问题，扎实推进整改落实

  针对排查发现的隐患和薄弱环节，各单位要制定详实的整改方案，明确责任人和完成时限。重点解决弱口令、漏洞未修复、访问控制不严格、数据备份不完善等问题。集团网络安全中心将提供技术指导和支持，对整改不力的单位予以通报批评。

四、健全长效机制，提升常态化防护水平

  各单位要以此专项行动为契机，进一步完善网络安全管理制度和应急预案。落实网络安全责任制，定期开展安全培训和应急演练。建立常态化监测预警机制，确保安全事件早发现、早报告、早处置。

  特此通知。

中国智海建设集团网络安全中心
二〇二六年六月二十二日`;

export default function DocWritingConsoleView({ role: _role, onOpenDocReview: _onOpenDocReview, documents = [], onSaveToDocumentCenter, navigationView, navigationKey, selectedExpertId, onSelectedExpertChange, onNavigationSync, appearance }: DocWritingConsoleViewProps) {
  const [currentView, setCurrentView] = useState<WritingView>('home');
  const [searchQuery] = useState('');
  const [writeTopic, setWriteTopic] = useState('');
  const [writeRequirements, setWriteRequirements] = useState('');
  const [outlineGenerationContext, setOutlineGenerationContext] = useState<WriteGenerationContext | null>(null);
  const [writeWordCount, setWriteWordCount] = useState('1500');
  const [writeDraftingUnit, setWriteDraftingUnit] = useState('');
  const [sourceOutlineText, setSourceOutlineText] = useState('');
  const [selectedWritingMode, setSelectedWritingMode] = useState<WritingMode>('生成全文');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState('');
  const [referenceMaterial, setReferenceMaterial] = useState('');
  const [imitateTopic, setImitateTopic] = useState('');
  const [copyWordCount, setCopyWordCount] = useState('1500');
  const [copyDraftingUnit, setCopyDraftingUnit] = useState('');
  const [proofreadResult, setProofreadResult] = useState<{
    score: number;
    issues: { type: string; original: string; suggested: string; reason: string; level: 'critical' | 'warn' | 'info' }[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToCenter, setSavedToCenter] = useState(false);
  const [needOutline, setNeedOutline] = useState(false);
  const [selectedModel, setSelectedModel] = useState('金山政务办公大模型');
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>(['致远OA', '金山文档']);
  const [activeDropdown, setActiveDropdown] = useState<'model' | 'connector' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMockFile[]>([]);
  const [writeSourceFile, setWriteSourceFile] = useState<UploadedMockFile | null>(null);
  const [outlineParseStatus, setOutlineParseStatus] = useState<OutlineParseStatus>('idle');
  const [outlineParseSections, setOutlineParseSections] = useState<OutlineSection[]>([]);
  const [outlineInputMode, setOutlineInputMode] = useState<OutlineInputMode>('ai');
  const [writeStep, setWriteStep] = useState<WriteStep>('mode');
  const [selectedScenario, setSelectedScenario] = useState<WritingScenario | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedRefArticles, setSelectedRefArticles] = useState<string[]>([]);
  const [referenceSource, setReferenceSource] = useState<'local' | 'knowledge'>('knowledge');
  const [referenceReturnStep, setReferenceReturnStep] = useState<WriteStep | null>(null);
  const [activeKnowledgeRoot, setActiveKnowledgeRoot] = useState(KNOWLEDGE_LIBRARY_GROUPS[0].id);
  const [activeKnowledgeFolder, setActiveKnowledgeFolder] = useState(KNOWLEDGE_LIBRARY_GROUPS[0].folders[0].id);
  const [selectedKnowledgeItems, setSelectedKnowledgeItems] = useState<string[]>([]);
  const [isFullTextInserted, setIsFullTextInserted] = useState(false);
  const [writeAutoFormat, setWriteAutoFormat] = useState(true);
  const [copyAutoFormat, setCopyAutoFormat] = useState(true);
  const [showSourceTrace, setShowSourceTrace] = useState(false);
  const [showThoughtTrace, setShowThoughtTrace] = useState(false);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [styleSearchQuery, setStyleSearchQuery] = useState('');
  const [generatedOutline, setGeneratedOutline] = useState<OutlineSection[]>([]);
  const [generatedFullText, setGeneratedFullText] = useState('');
  const [fullTextVersions, setFullTextVersions] = useState<string[]>([]);
  const [activeFullTextVersionIndex, setActiveFullTextVersionIndex] = useState(0);
  const [polishResultText, setPolishResultText] = useState('');
  const [polishStep, setPolishStep] = useState<PolishStep>('upload');
  const [polishDirections, setPolishDirections] = useState<string[]>(['通顺表达', '增强感情']);
  const [polishStyles, setPolishStyles] = useState<string[]>(['正式']);
  const [polishLength, setPolishLength] = useState<'尽量保持' | '尽量精简' | '尽量扩写'>('尽量保持');
  const [polishRequirementText, setPolishRequirementText] = useState('');
  const [polishSourceFile, setPolishSourceFile] = useState<UploadedMockFile | null>(null);
  const [polishSourceText, setPolishSourceText] = useState('');
  const [selectedPolishDocumentId, setSelectedPolishDocumentId] = useState<string | null>(null);
  const [polishDocumentSearch, setPolishDocumentSearch] = useState('');
  const [isPolishDocumentPickerOpen, setIsPolishDocumentPickerOpen] = useState(false);
  const [activePolishDocumentFolder, setActivePolishDocumentFolder] = useState<PolishDocumentFolder>('my-cloud');
  const [documentPickerTarget, setDocumentPickerTarget] = useState<DocumentPickerTarget | null>(null);
  const [textPasteTarget, setTextPasteTarget] = useState<TextPasteTarget | null>(null);
  const [textPasteValue, setTextPasteValue] = useState('');
  const [copyStep, setCopyStep] = useState<CopyStep>('upload');
  const [copySourceFile, setCopySourceFile] = useState<UploadedMockFile | null>(null);
  const [copySourceText, setCopySourceText] = useState('');
  const [copyExtractedKeywords, setCopyExtractedKeywords] = useState('责任分工、任务闭环、时限反馈、督导问效');
  const [copyExtractedStructure, setCopyExtractedStructure] = useState('一、总体要求\n二、重点任务\n三、组织保障');
  const [copyDocumentAttributes, setCopyDocumentAttributes] = useState<CopyDocumentAttributes>(DEFAULT_COPY_ATTRIBUTES);
  const [copyKeywordChips, setCopyKeywordChips] = useState<string[]>(DEFAULT_COPY_KEYWORDS);
  const [copyKeywordDraft, setCopyKeywordDraft] = useState('');
  const [copyDirectionChips, setCopyDirectionChips] = useState<string[]>(DEFAULT_COPY_DIRECTIONS);
  const [copyDirectionDraft, setCopyDirectionDraft] = useState('');
  const [copyToneChips, setCopyToneChips] = useState<string[]>(DEFAULT_COPY_TONES);
  const [copyToneDraft, setCopyToneDraft] = useState('');
  const [copyNormPhraseChips, setCopyNormPhraseChips] = useState<string[]>(DEFAULT_COPY_NORM_PHRASES);
  const [copyNormPhraseDraft, setCopyNormPhraseDraft] = useState('');
  const [copyStructureItems, setCopyStructureItems] = useState<CopyStructureItem[]>(cloneCopyStructureItems);
  const [copyExpandedStructureIds, setCopyExpandedStructureIds] = useState<string[]>([]);
  const [copyDraggingStructureId, setCopyDraggingStructureId] = useState<string | null>(null);
  const [copyResultText, setCopyResultText] = useState('');
  const [checkStep, setCheckStep] = useState<CheckStep>('vendor');
  const [checkVendor, setCheckVendor] = useState<'黑马校对' | '人民校对'>('黑马校对');
  const [checkSourceFile, setCheckSourceFile] = useState<UploadedMockFile | null>(null);
  const [checkSourceText, setCheckSourceText] = useState('');
  const [layoutStep, setLayoutStep] = useState<LayoutStep>('upload');
  const [layoutSourceFile, setLayoutSourceFile] = useState<UploadedMockFile | null>(null);
  const [layoutSourceText, setLayoutSourceText] = useState('');
  const [layoutEnableFormat, setLayoutEnableFormat] = useState(true);
  const [layoutEnableRedTemplate, setLayoutEnableRedTemplate] = useState(false);
  const [selectedRedTemplateStyle, setSelectedRedTemplateStyle] = useState('standard');
  const [selectedFormatTemplateStyle, setSelectedFormatTemplateStyle] = useState('party-standard');
  const [recentDocumentTitle, setRecentDocumentTitle] = useState('');
  const [recentDocumentContent, setRecentDocumentContent] = useState('');
  const [homePrompt, setHomePrompt] = useState('');
  const [homeSelectedSkill, setHomeSelectedSkill] = useState<'AI写作' | 'AI仿写' | 'AI润色'>('AI写作');
  const [homeActiveCapability, setHomeActiveCapability] = useState<'qa' | 'write' | 'material' | null>('qa');
  const [homeDraftTitle, setHomeDraftTitle] = useState('');
  const [homeDraftScenario, setHomeDraftScenario] = useState('');
  const [homeDraftRequirement, setHomeDraftRequirement] = useState('');
  const [homeDraftWordCount, setHomeDraftWordCount] = useState('');
  const [writingPreflightConfirmed, setWritingPreflightConfirmed] = useState(false);
  const [writingReferenceDecision, setWritingReferenceDecision] = useState<'pending' | 'added' | 'skip'>('pending');
  const [isHomeUploadMenuOpen, setIsHomeUploadMenuOpen] = useState(false);
  const [isHomeExpertMenuOpen, setIsHomeExpertMenuOpen] = useState(false);
  const [internalHomeExpertId, setInternalHomeExpertId] = useState<HomeExpertId>(DEFAULT_HOME_EXPERT_ID);
  const [homeConversation, setHomeConversation] = useState<{ prompt: string; skill: string; result: string; sources: UploadedMockFile[] } | null>(null);
  const [qaTurns, setQaTurns] = useState<QATurn[]>([]);
  const [qaFollowup, setQaFollowup] = useState('');
  const [qaProcessingStep, setQaProcessingStep] = useState(0);
  const [qaRunNonce, setQaRunNonce] = useState(0);
  const [qaProcessExpanded, setQaProcessExpanded] = useState(true);
  const [qaSourcesOpen, setQaSourcesOpen] = useState(false);
  const [qaActiveSource, setQaActiveSource] = useState(0);
  const [qaActiveCitation, setQaActiveCitation] = useState<number | null>(null);
  const [qaCopiedTurn, setQaCopiedTurn] = useState<number | null>(null);
  const activeHomeExpertId = selectedExpertId ?? internalHomeExpertId;
  const selectedHomeExpert = useMemo(() => getHomeExpertById(activeHomeExpertId), [activeHomeExpertId]);
  const isDefaultHomeExpert = activeHomeExpertId === DEFAULT_HOME_EXPERT_ID;

  const createQaVersion = (answer: string) => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    answer,
    createdAt: Date.now(),
  });

  const buildFullTextDraft = (versionIndex = 0) => {
    const topic = writeTopic || '北京市政府工作方案';
    const introVariants = [
      `为深入贯彻落实党中央、国务院关于首都发展的重大决策部署，全面推进重点工作落地见效，现结合前期材料和参考素材，起草形成如下内容。`,
      `为进一步贯彻落实集团高质量发展要求，结合前期工作基础和有关参考材料，现就相关事项形成如下正式文本。`,
      `围绕当前工作目标和重点任务，结合既有材料与实践需求，现起草形成如下正文内容，供进一步完善和使用。`,
    ];
    const middleVariants = [
      `一、提高政治站位，充分认识工作重要性\n　  各单位要切实把思想和行动统一到集团部署上来，统筹推进重点任务落地见效。各级领导干部要带头担当作为，聚焦主责主业，确保各项工作有人抓、有人管、有人负责。\n\n二、聚焦重点环节，抓好任务落实\n　  围绕制度执行、风险防控、过程跟踪等关键环节，明确节点安排和责任分工。各单位应于收文之日起三个工作日内制定落实方案，并报集团办公室备案。要建立工作台账，实行销号管理，确保件件有着落、事事有回音。\n\n三、强化督导问效，确保形成闭环\n　  各责任单位要按时反馈进展情况，形成可检查、可追踪、可复盘的工作机制。集团办公室将定期通报工作进展，对推进不力、落实不到位的单位予以通报批评，并纳入年度绩效考核。`,
      `一、明确总体目标，压实工作责任\n　  各单位要牢固树立大局意识，准确把握任务要求，围绕重点事项细化分工、倒排工期、挂图推进，确保责任压实到岗、任务落实到人。\n\n二、突出重点任务，提升推进质效\n　  重点围绕制度执行、协同配合、节点反馈等方面持续发力，及时梳理问题清单和任务清单，强化过程督办和闭环管理，确保工作推进有序顺畅。\n\n三、加强保障措施，推动落实见效\n　  各责任单位要加强信息沟通和统筹协调，按时反馈进展情况，形成上下联动、左右协同的工作机制，确保各项部署落到实处。`,
      `一、进一步统一思想认识，明确目标方向\n　  各单位要充分认识当前工作的紧迫性和重要性，立足职责分工细化目标任务，把工作要求转化为具体行动和实际成效。\n\n二、围绕关键环节，推动任务落实\n　  聚焦制度执行、节点管理、过程跟踪等重点环节，健全台账管理和督办机制，确保每项工作有人负责、每个节点有人盯办。\n\n三、强化结果导向，确保工作闭环\n　  对重点事项实行动态跟踪、及时反馈和定期复盘，推动形成部署、落实、检查、反馈的闭环机制，确保工作质效持续提升。`,
    ];
    const endingVariants = [
      `特此通知。\n\n${writeDraftingUnit.trim() || '中国智海建设集团办公室'}\n${new Date().toLocaleString('zh-CN', { hour12: false })}`,
      `以上通知，请认真贯彻执行。\n\n${writeDraftingUnit.trim() || '中国智海建设集团办公室'}\n${new Date().toLocaleString('zh-CN', { hour12: false })}`,
      `请各单位结合实际抓好落实，并及时反馈工作推进情况。\n\n${writeDraftingUnit.trim() || '中国智海建设集团办公室'}\n${new Date().toLocaleString('zh-CN', { hour12: false })}`,
    ];
    const intro = introVariants[versionIndex % introVariants.length];
    const middle = middleVariants[versionIndex % middleVariants.length];
    const ending = endingVariants[versionIndex % endingVariants.length];
    return `关于${topic}\n\n各有关单位：\n${intro}\n\n${middle}\n\n${ending}`;
  };

  const buildConclusionDraft = (versionIndex = 0) => {
    const variants = [
      `综上，相关工作既是落实上级部署的重要举措，也是提升政务办公质效、完善责任闭环的现实需要。下一步，各责任单位应继续坚持目标导向、问题导向和结果导向，细化任务分工，强化协同联动，确保各项要求落地见效。\n\n请各单位结合实际抓好贯彻执行，并及时反馈推进情况。`,
      `综上，本次工作部署既体现了任务导向，也体现了落实导向。下一步，各责任单位应持续压实责任、细化措施、加强协同，确保各项要求真正转化为工作成效。\n\n请各单位按照职责分工认真贯彻落实，并及时报送进展情况。`,
      `综上，相关事项已经明确了目标、路径和责任要求。下一步，请各责任单位紧扣关键环节，抓好推进落实，形成上下联动、闭环管理的工作机制，推动各项任务按期完成。\n\n请结合实际认真执行，并持续反馈工作推进情况。`,
    ];
    return variants[versionIndex % variants.length];
  };

  const commitFullTextVersion = (nextText: string, resetHistory = false) => {
    setFullTextVersions((current) => {
      const nextVersions = resetHistory ? [nextText] : [...current, nextText].slice(-5);
      setActiveFullTextVersionIndex(nextVersions.length - 1);
      setGeneratedFullText(nextVersions[nextVersions.length - 1] ?? nextText);
      return nextVersions;
    });
  };

  const resetOutlineParse = () => {
    setOutlineParseStatus('idle');
    setOutlineParseSections([]);
  };

  const createManualOutlineSections = (): OutlineSection[] => [
    {
      id: `manual-${Date.now()}-1`,
      title: '一、请填写一级大纲',
      content: '',
      subsections: [
        { id: `manual-${Date.now()}-1-1`, title: '（一）请填写二级大纲', content: '', subsections: [] },
      ],
    },
    {
      id: `manual-${Date.now()}-2`,
      title: '二、请填写一级大纲',
      content: '',
      subsections: [],
    },
  ];

  const serializeOutlineNode = (node: OutlineSection | OutlineSubSection, depth = 0): string[] => {
    const prefix = '  '.repeat(depth);
    const current = node.title.trim() ? [`${prefix}${node.title.trim()}`] : [];
    const children = node.subsections?.flatMap((child) => serializeOutlineNode(child, depth + 1)) ?? [];
    return [...current, ...children];
  };

  const serializeOutline = (sections: OutlineSection[]) => sections
    .map((section) => serializeOutlineNode(section).join('\n'))
    .filter(Boolean)
    .join('\n\n');

  const createParsedOutline = (source: string, fileName = ''): OutlineSection[] => {
    const normalizedLines = source
      .split('\n')
      .map((line, index) => ({ text: line.trim(), sourceLine: index + 1 }))
      .filter((line) => Boolean(line.text));
    const sectionPattern = /^(?:第[一二三四五六七八九十百]+[章节篇部分]|[一二三四五六七八九十百]+[、.．]|[1-9]\d*[、.．](?!\d))/;
    const subsectionPattern = /^(?:[（(][一二三四五六七八九十百]+[）)]|\d+\.\d+(?!\.\d))/;
    const thirdLevelPattern = /^(?:[（(]\d+[）)]|\d+\.\d+\.\d+|[①②③④⑤⑥⑦⑧⑨⑩]|[a-zA-Z][.)）])/;
    const sections: OutlineSection[] = [];
    normalizedLines.forEach(({ text, sourceLine }) => {
      if (thirdLevelPattern.test(text) && sections.length > 0) {
        const current = sections[sections.length - 1];
        const parent = current.subsections[current.subsections.length - 1];
        if (parent) {
          parent.subsections = [
            ...(parent.subsections ?? []),
            {
              id: `${parent.id}-third-${(parent.subsections?.length ?? 0) + 1}`,
              title: text,
              content: '',
              subsections: [],
              originalTitle: text,
              sourceLine,
            },
          ];
        }
        return;
      }
      if (sectionPattern.test(text)) {
        sections.push({ id: `parsed-${sections.length + 1}`, title: text, content: '', subsections: [], originalTitle: text, sourceLine });
        return;
      }
      if (subsectionPattern.test(text) && sections.length > 0) {
        const current = sections[sections.length - 1];
        current.subsections.push({ id: `${current.id}-sub-${current.subsections.length + 1}`, title: text, content: '', subsections: [], originalTitle: text, sourceLine });
      }
    });
    if (sections.length >= 2) {
      return sections;
    }
    if (!source.trim() && /(大纲|提纲|纲要|框架)/.test(fileName)) {
      const subject = fileName.replace(/\.[^.]+$/, '').replace(/(大纲|提纲|纲要|框架)/g, '').trim() || '相关工作';
      return [
        { id: 'parsed-1', title: '一、工作背景与总体目标', content: subject, subsections: [{ id: 'parsed-1-sub-1', title: '（一）现状基础', content: '', subsections: [], originalTitle: '（一）现状基础' }], originalTitle: '一、工作背景与总体目标' },
        { id: 'parsed-2', title: '二、重点任务与推进安排', content: '', subsections: [{ id: 'parsed-2-sub-1', title: '（一）主要任务', content: '', subsections: [{ id: 'parsed-2-sub-1-third-1', title: '1.1.1 责任分工', content: '', subsections: [], originalTitle: '1.1.1 责任分工' }], originalTitle: '（一）主要任务' }], originalTitle: '二、重点任务与推进安排' },
        { id: 'parsed-3', title: '三、责任分工与保障措施', content: '', subsections: [], originalTitle: '三、责任分工与保障措施' },
      ];
    }
    return [];
  };

  const handleRecognizeOutlineSource = () => {
    setOutlineParseStatus('processing');
    window.setTimeout(() => {
      const parsed = createParsedOutline(sourceOutlineText, writeSourceFile?.name);
      if (parsed.length < 2) {
        setOutlineParseSections([]);
        setOutlineParseStatus('empty');
        return;
      }
      setOutlineParseSections(parsed);
      setOutlineParseStatus('success');
    }, 550);
  };

  const updateParsedOutlineSection = (id: string, title: string) => {
    setOutlineParseSections((sections) => sections.map((section) => section.id === id ? { ...section, title } : section));
  };

  const updateParsedOutlineSubsection = (sectionId: string, subsectionId: string, title: string) => {
    setOutlineParseSections((sections) => sections.map((section) => section.id === sectionId
      ? { ...section, subsections: section.subsections.map((subsection) => subsection.id === subsectionId ? { ...subsection, title } : subsection) }
      : section));
  };

  const updateParsedOutlineThirdLevel = (sectionId: string, subsectionId: string, thirdLevelId: string, title: string) => {
    setOutlineParseSections((sections) => sections.map((section) => section.id === sectionId
      ? {
        ...section,
        subsections: section.subsections.map((subsection) => subsection.id === subsectionId
          ? {
            ...subsection,
            subsections: (subsection.subsections ?? []).map((thirdLevel) => thirdLevel.id === thirdLevelId ? { ...thirdLevel, title } : thirdLevel),
          }
          : subsection),
      }
      : section));
  };

  const addParsedOutlineSubsection = (sectionId: string) => {
    setOutlineParseSections((sections) => sections.map((section) => section.id === sectionId
      ? { ...section, subsections: [...section.subsections, { id: `${sectionId}-sub-${Date.now()}`, title: '（一）请填写二级要点', content: '', subsections: [] }] }
      : section));
  };

  const addParsedOutlineThirdLevel = (sectionId: string, subsectionId: string) => {
    setOutlineParseSections((sections) => sections.map((section) => section.id === sectionId
      ? {
        ...section,
        subsections: section.subsections.map((subsection) => subsection.id === subsectionId
          ? {
            ...subsection,
            subsections: [
              ...(subsection.subsections ?? []),
              { id: `${subsectionId}-third-${Date.now()}`, title: '1.1.1 请填写三级要点', content: '', subsections: [] },
            ],
          }
          : subsection),
      }
      : section));
  };

  const removeParsedOutlineSection = (id: string) => {
    setOutlineParseSections((sections) => sections.length <= 2 ? sections : sections.filter((section) => section.id !== id));
  };

  const addParsedOutlineSection = () => {
    setOutlineParseSections((sections) => [...sections, {
      id: `parsed-${Date.now()}`,
      title: `${sections.length + 1}、请填写大纲章节`,
      content: '',
      subsections: [],
    }]);
  };

  const startManualOutlineEntry = () => {
    setOutlineInputMode('manual');
    setWriteSourceFile(null);
    setSourceOutlineText('');
    setOutlineParseSections(createManualOutlineSections());
    setOutlineParseStatus('success');
    setWriteStep('outline-parse');
  };

  const handleSelectHomeExpert = (expertId: HomeExpertId) => {
    setInternalHomeExpertId(expertId);
    onSelectedExpertChange?.(expertId);
    setIsHomeExpertMenuOpen(false);
    setHomeActiveCapability('qa');
    if (expertId !== DEFAULT_HOME_EXPERT_ID) {
      setHomeSelectedSkill('AI写作');
    }
  };

  const recentDocs: RecentDoc[] = [
    {
      title: '国庆长假消防先行，安全防范不容松懈',
      type: '通知',
      time: '2026/06/18 09:59',
      tag: '安全防范',
      status: 'reviewed',
      wordCount: 2564,
      content: `关于进一步强化节假日期间消防安全和值班值守工作的通知

各分公司、各部门、各在建项目经理部：
为确保公共安全，全面强化消防安全管理，社企单位应压实主体责任，节前开展全面自查，确保消防设施完好、疏散通道畅通，严禁违章用火用电。`
    },
    {
      title: '未命名文稿',
      type: '草稿',
      time: '2026/06/17 23:25',
      tag: '综合事务',
      status: 'draft',
      wordCount: 0,
      content: '关于进一步规范集团各单位请示报批流程的通知（草稿）'
    },
    {
      title: '牢记嘱托担使命，实干争先谱新篇',
      type: '讲话稿',
      time: '2026/06/17 23:23',
      tag: '党建理论',
      status: 'needs-refine',
      wordCount: 0,
      content: '围绕高质量发展、党建引领与作风建设三条主线，形成会议讲话稿框架。'
    },
    {
      title: '关于2026年端午节期间值班安排的通知',
      type: '通知',
      time: '2026/06/16 18:12',
      tag: '后勤保障',
      status: 'reviewed',
      wordCount: 1842,
      content: `关于2026年端午节期间值班及安全合规巡查工作的通知

各部室、全资二级子公司：
根据国家有关法定节假日放假安排，为巩固无安全漏洞防线，现就做好端午节放假期间值班及保卫巡视工作通告如下。`
    }
  ];

  const filteredDocs = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return recentDocs;
    }
    return recentDocs.filter((doc) => `${doc.title} ${doc.tag} ${doc.type}`.toLowerCase().includes(keyword));
  }, [searchQuery]);

  const polishDocumentOptions = useMemo(() => {
    const keyword = polishDocumentSearch.trim().toLowerCase();
    const isWordDocument = (doc: DocumentInfo) => {
      const title = doc.title.toLowerCase();
      const hasKnownNonWordExtension = /\.(pdf|xlsx?|pptx?|csv|ofd)$/i.test(title);
      return !hasKnownNonWordExtension && (/\.(docx?|wps)$/i.test(title) || !/\.[a-z0-9]+$/i.test(title) || doc.category === '公文');
    };
    const isMyCloudDocument = (doc: DocumentInfo) => doc.author.includes('张三') || doc.author === '我';
    const mergedDocs = [...DOC_CENTER_MY_CLOUD_WORD_DOCS, ...documents.filter((doc) => isMyCloudDocument(doc))];
    const seenIds = new Set<string>();
    const options = mergedDocs.filter((doc) => {
      if (seenIds.has(doc.id)) return false;
      seenIds.add(doc.id);
      return doc.type === 'recent' && doc.content?.trim() && isWordDocument(doc) && isMyCloudDocument(doc);
    });
    if (!keyword) {
      return options.slice(0, 8);
    }
    return options
      .filter((doc) => `${doc.title} ${doc.author} ${doc.category ?? ''} ${doc.content ?? ''}`.toLowerCase().includes(keyword))
      .slice(0, 8);
  }, [documents, polishDocumentSearch]);

  const selectedPolishDocument = useMemo(
    () => [...DOC_CENTER_MY_CLOUD_WORD_DOCS, ...documents].find((doc) => doc.id === selectedPolishDocumentId) ?? null,
    [documents, selectedPolishDocumentId]
  );

  const polishSourceReady = Boolean(polishSourceFile || selectedPolishDocument);
  const isSourceBasedWritingMode = HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode);
  const isConclusionWritingMode = selectedWritingMode === '生成结语';
  const writeSourceReady = Boolean(writeSourceFile || sourceOutlineText.trim());
  const polishWordDocumentCount = useMemo(
    () => [...DOC_CENTER_MY_CLOUD_WORD_DOCS, ...documents.filter((doc) => doc.author.includes('张三') || doc.author === '我')].filter((doc, index, array) => {
      const title = doc.title.toLowerCase();
      const hasKnownNonWordExtension = /\.(pdf|xlsx?|pptx?|csv|ofd)$/i.test(title);
      return array.findIndex((item) => item.id === doc.id) === index && doc.type === 'recent' && Boolean(doc.content?.trim()) && !hasKnownNonWordExtension && (/\.(docx?|wps)$/i.test(title) || !/\.[a-z0-9]+$/i.test(title) || doc.category === '公文');
    }).length,
    [documents]
  );

  const currentTaskMeta = TASK_ENTRIES.find((entry) => entry.id === currentView);

  const resetResults = () => {
    setIsProcessing(false);
    setResultText('');
    setProofreadResult(null);
    setCopied(false);
  };

  const resetWriteFlow = () => {
    setIsProcessing(false);
    setWriteStep('mode');
    setSelectedWritingMode('生成全文');
    setNeedOutline(false);
    setSelectedScenario(null);
    setSelectedRefArticles([]);
    setReferenceSource('knowledge');
    setReferenceReturnStep(null);
    setActiveKnowledgeRoot(KNOWLEDGE_LIBRARY_GROUPS[0].id);
    setActiveKnowledgeFolder(KNOWLEDGE_LIBRARY_GROUPS[0].folders[0].id);
    setSelectedKnowledgeItems([]);
    setIsFullTextInserted(false);
    setShowSourceTrace(false);
    setStyleSearchQuery('');
    setGeneratedOutline([]);
    setGeneratedFullText('');
    setWriteTopic('');
    setWriteRequirements('');
    setOutlineGenerationContext(null);
    setSourceOutlineText('');
    setWriteSourceFile(null);
    setOutlineInputMode('ai');
    resetOutlineParse();
    setWriteWordCount('1500');
    setWriteAutoFormat(true);
    setSavedToCenter(false);
  };

  const resetCopyExtraction = () => {
    setCopyDocumentAttributes(DEFAULT_COPY_ATTRIBUTES);
    setCopyKeywordChips(DEFAULT_COPY_KEYWORDS);
    setCopyKeywordDraft('');
    setCopyDirectionChips(DEFAULT_COPY_DIRECTIONS);
    setCopyDirectionDraft('');
    setCopyToneChips(DEFAULT_COPY_TONES);
    setCopyToneDraft('');
    setCopyNormPhraseChips(DEFAULT_COPY_NORM_PHRASES);
    setCopyNormPhraseDraft('');
    setCopyStructureItems(cloneCopyStructureItems());
    setCopyExpandedStructureIds([]);
    setCopyDraggingStructureId(null);
    setCopyExtractedKeywords(DEFAULT_COPY_KEYWORDS.join('、'));
    setCopyExtractedStructure(DEFAULT_COPY_STRUCTURE_ITEMS.map((item, index) => `${index + 1}. ${item.title}`).join('\n'));
  };

  const openView = (view: WritingView) => {
    resetResults();
    if (view === 'quick-create') {
      setHomeActiveCapability('write');
      setHomeSelectedSkill('AI写作');
      setSelectedWritingMode('生成全文');
      setNeedOutline(false);
      setOutlineInputMode('ai');
      setIsHomeExpertMenuOpen(false);
      setIsHomeUploadMenuOpen(false);
      resetOutlineParse();
    }
    if (view === 'write') {
      resetWriteFlow();
    }
    if (view === 'copy') {
      setCopyStep('upload');
      setCopySourceFile(null);
      setCopySourceText('');
      resetCopyExtraction();
      setCopyResultText('');
      setImitateTopic('');
      setReferenceMaterial('');
      setCopyWordCount('1500');
      setCopyDraftingUnit('');
      setUploadedFiles([]);
      setSelectedKnowledgeItems([]);
      setShowSourceTrace(false);
      setShowThoughtTrace(false);
      setActiveCitation(null);
    }
    if (view === 'polish') {
      setPolishStep('upload');
      setPolishSourceFile(null);
      setSelectedPolishDocumentId(null);
      setPolishDocumentSearch('');
      setIsPolishDocumentPickerOpen(false);
      setPolishResultText('');
    }
    if (view === 'check') {
      setCheckStep('vendor');
      setCheckSourceFile(null);
      setProofreadResult(null);
    }
    if (view === 'template-layout') {
      setLayoutStep('upload');
      setLayoutSourceFile(null);
      setResultText('');
    }
    if (view === 'weboffice') {
      setRecentDocumentTitle('未命名文档');
      setRecentDocumentContent('');
    }
    setCurrentView(view);
  };

  const openScenarioWritingShortcut = () => {
    resetResults();
    resetWriteFlow();
    onNavigationSync?.('write');
    setSelectedWritingMode('生成大纲');
    setNeedOutline(true);
    setOutlineInputMode('ai');
    setWriteStep('scenario');
    setCurrentView('write');
  };

  const openHomeFeature = (view: WritingNavigationSyncView) => {
    onNavigationSync?.(view);
    openView(view);
  };

  const buildHomeResult = (prompt: string, skill: string) => {
    if (skill === '智能问答') {
      if (!isDefaultHomeExpert) {
        return `【${selectedHomeExpert.name}】已收到你的问题：“${prompt}”。\n\n一、处理判断\n${selectedHomeExpert.answerIntro}\n\n二、核心结论\n建议先明确任务对象、时间范围和输出用途，再按“事实依据、关键判断、执行建议”的顺序组织内容，确保回复既有依据又便于落地。\n\n三、下一步建议\n如果你愿意继续补充材料，我可以围绕当前问题继续追问、提炼要点，或直接形成一版可用于汇报的文字。`;
      }
      return `已根据“${prompt}”完成问题分析。\n\n一、问题理解\n系统已识别你的咨询意图，并结合政务办公、公文写作和知识库材料进行检索。\n\n二、处理过程\n已完成问题拆解、相关政策与历史材料匹配，并整理出可执行的回复口径。\n\n三、建议动作\n如需形成正式材料，可继续选择快速创作、文风润色或智能校对进入专项处理流程。`;
    }
    if (skill === 'AI仿写') {
      return `已根据“${prompt}”完成仿写任务。\n\n一、整体口径\n延续参考材料的结构节奏和正式表达，保留“背景说明、重点任务、工作要求”的层次，确保文本风格统一、语气稳健。\n\n二、生成内容\n围绕当前工作目标补充年度重点、责任分工与落实要求，避免直接复制原文表述，并对关键措辞做了政务化处理。\n\n三、后续建议\n建议进入编辑器补充具体单位名称、时间安排和数字材料，再进行最终校对。`;
    }
    if (skill === 'AI润色') {
      return `已根据“${prompt}”完成润色处理。\n\n一、表达优化\n已压缩重复句式，统一正式公文语气，并将口语化表达调整为规范书面表达。\n\n二、规范检查\n已检查标题层级、段落衔接、敏感措辞和常见错别字，当前文本可继续进入编辑器精修。\n\n三、输出建议\n建议下载前再确认附件、落款、日期和具体政策名称。`;
    }
    return `已根据“${prompt}”生成公文初稿。\n\n一、工作背景\n为提升公文办理效率，围绕当前任务目标，系统已完成材料理解、结构规划和初稿生成。\n\n二、重点内容\n初稿包含任务背景、工作安排、责任分工和落实要求，语气保持正式、稳健、清晰，适用于政务办公场景。\n\n三、下一步\n建议点击“去编辑”进入编辑器补充本单位具体信息，或点击“下载”保存当前文本到本地。`;
  };

  const buildHomePrompt = () => {
    if (homeActiveCapability === 'write') {
      const isSourceBasedWritingMode = HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode);
      const copy = HOME_WRITING_PROMPT_COPY[selectedWritingMode];
      if (isSourceBasedWritingMode) {
        const sourceText = sourceOutlineText.trim();
        const requirement = homeDraftRequirement.trim();
        const wordCount = homeDraftWordCount.trim();
        if (!sourceText || (!requirement && !wordCount)) return '';
        const sourceLabel = copy.sourceLabel ?? '原始文本';
        const referenceCount = uploadedFiles.length + selectedKnowledgeItems.length;
        return [
          copy.submitLead,
          `${sourceLabel}：${sourceText.slice(0, 80)}`,
          referenceCount > 0 ? `参考素材：${referenceCount}份` : '',
          requirement ? `生成要求：${requirement}` : '',
          wordCount ? `字数：${wordCount}字` : ''
        ].filter(Boolean).join('，');
      }
      const title = homeDraftTitle.trim();
      const requirement = homeDraftRequirement.trim();
      const wordCount = homeDraftWordCount.trim();
      if (!title && !requirement && !wordCount) return '';
      return [
        copy.submitLead,
        title ? `标题：${title}` : '标题未填写',
        requirement ? `写作要求：${requirement}` : '',
        wordCount ? `字数：${wordCount}字` : ''
      ].filter(Boolean).join('，');
    }
    return homePrompt.trim();
  };

  const handleHomeSubmit = () => {
    const prompt = buildHomePrompt();
    if (!prompt) return;
    const activeSkill = homeActiveCapability === 'qa' ? '智能问答' : homeSelectedSkill;
    if (activeSkill === 'AI写作' && HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode) && selectedWritingMode !== '大纲成文') {
      const sourceText = sourceOutlineText.trim();
      if (!sourceText) return;
      setWriteTopic('');
      setWriteRequirements(homeDraftRequirement.trim());
      setWriteWordCount(homeDraftWordCount.trim() || '1500');
      setWriteSourceFile({
        name: selectedWritingMode === '大纲成文' ? '首页粘贴大纲.txt' : '首页粘贴正文.txt',
        size: `${sourceText.replace(/\s/g, '').length}字`,
        type: 'txt'
      });
      setSourceOutlineText(sourceText);
      setOutlineInputMode('ai');
      resetOutlineParse();
      setWriteStep('source');
      setCurrentView('write');
      return;
    }
    const result = buildHomeResult(prompt, activeSkill);
    const sources = buildHomeConversationSources();
    setHomeConversation({ prompt, skill: activeSkill, result, sources });
    if (activeSkill === 'AI写作' && selectedWritingMode === '大纲成文') {
      setQaTurns([{ id: Date.now(), prompt, sources, versions: [createQaVersion(result)], activeVersionIndex: 0, status: 'processing' }]);
      setWritingPreflightConfirmed(true);
      setQaProcessingStep(0);
      setQaRunNonce((value) => value + 1);
      setWritingReferenceDecision(sources.length > 0 ? 'added' : 'skip');
      setQaProcessExpanded(true);
      setQaSourcesOpen(false);
      setQaActiveCitation(null);
    } else if (activeSkill === 'AI写作') {
      setQaTurns([]);
      setQaRunNonce(0);
      setWritingPreflightConfirmed(false);
      setWritingReferenceDecision(sources.length > 0 ? 'added' : 'pending');
      setQaProcessExpanded(true);
      setQaSourcesOpen(false);
      setQaActiveCitation(null);
    } else if (activeSkill === '智能问答') {
      setQaTurns([{ id: Date.now(), prompt, sources, versions: [createQaVersion(result)], activeVersionIndex: 0, status: 'processing' }]);
      setQaProcessingStep(0);
      setQaRunNonce((value) => value + 1);
      setQaProcessExpanded(true);
      setQaSourcesOpen(false);
      setQaActiveCitation(null);
    }
    setRecentDocumentTitle(`${activeSkill}生成稿件`);
    setRecentDocumentContent(result);
    setCurrentView('conversation-detail');
  };

  const handleConfirmWritingPreflight = () => {
    const title = homeDraftTitle.trim();
    const scenario = homeDraftScenario.trim();
    const wordCount = homeDraftWordCount.trim();
    const requirement = homeDraftRequirement.trim();
    const needsSourceText = HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode);
    if ((!needsSourceText && (!title || !scenario)) || !wordCount || !requirement || writingReferenceDecision === 'pending') return;
    const copy = HOME_WRITING_PROMPT_COPY[selectedWritingMode];
    const sourceLabel = copy.sourceLabel ?? '已有材料';
    const prompt = needsSourceText
      ? `${copy.submitLead}，${sourceLabel}已提供，目标字数：${wordCount}字，处理要求：${requirement}${writingReferenceDecision === 'skip' ? '，本次不添加参考文档' : ''}`
      : `${copy.submitLead}，场景：${scenario}，标题：《${title}》，字数：${wordCount}字，写作要求：${requirement}${writingReferenceDecision === 'skip' ? '，本次不添加参考文档' : ''}`;
    const sources = buildHomeConversationSources();
    const result = buildHomeResult(prompt, 'AI写作');
    setHomeConversation({ prompt, skill: 'AI写作', result, sources });
    setQaTurns([{ id: Date.now(), prompt, sources, versions: [createQaVersion(result)], activeVersionIndex: 0, status: 'processing' }]);
    setWritingPreflightConfirmed(true);
    setQaProcessingStep(0);
    setQaRunNonce((value) => value + 1);
    setQaProcessExpanded(true);
    setRecentDocumentTitle(needsSourceText ? `${selectedWritingMode}文档` : title);
    setRecentDocumentContent(result);
  };

  const handleQAFollowupSubmit = () => {
    const prompt = qaFollowup.trim();
    if (!prompt) return;
    const sources = buildHomeConversationSources();
    const activeSkill = homeConversation?.skill ?? '智能问答';
    setQaTurns((turns) => [
      ...turns,
      { id: Date.now(), prompt, sources, versions: [createQaVersion(buildHomeResult(prompt, activeSkill))], activeVersionIndex: 0, status: 'processing' }
    ]);
    setQaFollowup('');
    setQaProcessingStep(0);
    setQaRunNonce((value) => value + 1);
    setQaProcessExpanded(true);
    setQaActiveCitation(null);
  };

  useEffect(() => {
    if (!qaRunNonce || currentView !== 'conversation-detail') return;
    const timers = [
      window.setTimeout(() => setQaProcessingStep(1), 450),
      window.setTimeout(() => setQaProcessingStep(2), 950),
      window.setTimeout(() => setQaProcessingStep(3), 1450),
      window.setTimeout(() => {
        setQaProcessingStep(4);
        setQaTurns((turns) => turns.map((turn, index) => (
          index === turns.length - 1
            ? { ...turn, status: 'done', activeVersionIndex: Math.max(turn.versions.length - 1, 0) }
            : turn
        )));
      }, 1950)
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [qaRunNonce, currentView]);

  useEffect(() => {
    if (currentView !== 'check' || checkStep !== 'upload' || !checkSourceFile || proofreadResult || isProcessing) return;
    const timer = window.setTimeout(() => handleRunCheck(), 120);
    return () => window.clearTimeout(timer);
  }, [currentView, checkStep, checkSourceFile, proofreadResult, isProcessing]);

  useEffect(() => {
    if (currentView !== 'write' || writeStep !== 'source' || selectedWritingMode !== '大纲成文' || outlineInputMode !== 'ai' || !writeSourceReady || outlineParseStatus !== 'idle') return;
    const timer = window.setTimeout(() => handleRecognizeOutlineSource(), 160);
    return () => window.clearTimeout(timer);
  }, [currentView, writeStep, selectedWritingMode, outlineInputMode, writeSourceReady, outlineParseStatus, sourceOutlineText, writeSourceFile?.name]);

  const handleHomeEdit = () => {
    if (!homeConversation) return;
    setRecentDocumentTitle(`${homeConversation.skill}生成稿件`);
    setRecentDocumentContent(homeConversation.result);
    openView('recent-editor');
  };

  const handleHomeDownload = () => {
    if (!homeConversation) return;
    const blob = new Blob([homeConversation.result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${homeConversation.skill}生成稿件.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!navigationView) return;
    openView(navigationView);
  }, [navigationKey]);

  const handleWriteBack = () => {
    if (writeStep === 'mode') {
      openView('home');
    } else if (writeStep === 'source') {
      setWriteStep('mode');
    } else if (writeStep === 'outline-parse') {
      setWriteStep('source');
    } else if (writeStep === 'scenario') {
      setWriteStep('mode');
    } else if (writeStep === 'form') {
      setWriteStep(isSourceBasedWritingMode ? 'source' : 'scenario');
    } else if (writeStep === 'style') {
      if (referenceReturnStep === 'full-confirm') {
        setReferenceReturnStep(null);
        setWriteStep('full-confirm');
      } else {
        setWriteStep('form');
      }
    } else if (writeStep === 'outline') {
      setWriteStep('style');
    } else if (writeStep === 'full-confirm') {
      setWriteStep('outline');
    } else {
      setWriteStep(isConclusionWritingMode ? 'form' : needOutline ? 'full-confirm' : 'style');
    }
  };

  const handleSimulateUpload = () => {
    const mockFiles: UploadedMockFile[] = [
      { name: '二季度安全生产大检查通知_印发版.docx', size: '156 KB', type: 'docx' },
      { name: '防汛防台风紧急值班轮班表_办公室.xlsx', size: '48 KB', type: 'xlsx' },
      { name: '2026在建项目框架协议_沙箱审计稿.pdf', size: '2.1 MB', type: 'pdf' },
      { name: '采购合同_v3.1_法务审核版.docx', size: '320 KB', type: 'docx' }
    ];
    const available = mockFiles.filter((file) => !uploadedFiles.some((uploaded) => uploaded.name === file.name));
    if (available.length > 0) {
      setUploadedFiles((prev) => [...prev, available[0]]);
    } else {
      setUploadedFiles([]);
    }
  };

  const handleClearFile = (index: number) => {
    const nextFiles = uploadedFiles.filter((_, currentIndex) => currentIndex !== index);
    setUploadedFiles(nextFiles);
    if (nextFiles.length === 0 && writingReferenceDecision === 'added') setWritingReferenceDecision('pending');
  };

  const handleGenerateWritingRequirements = () => {
    const scenario = selectedScenario?.title || '正式公文';
    const topic = writeTopic.trim() || selectedScenario?.suggestedTitle || '本次重点工作';
    const wordCount = writeWordCount.trim() || '1500';
    setWriteRequirements(
      `请围绕“${topic}”起草${scenario}，采用${selectedWritingMode}模式，篇幅控制在${wordCount}字左右。要求结构完整、层次清晰，语言正式严谨，突出工作背景、目标任务、责任分工和落实要求；结合参考素材提炼关键政策口径，避免空泛表述，符合党政机关公文表达规范。`
    );
  };

  const handleToggleConnector = (name: string) => {
    setSelectedConnectors((prev) => (prev.includes(name) ? prev.filter((connector) => connector !== name) : [...prev, name]));
  };

  const handleSelectRecent = (doc: RecentDoc) => {
    resetResults();
    setRecentDocumentTitle(doc.title);
    setRecentDocumentContent(doc.content);
    setCurrentView('recent-editor');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateOutline = () => {
    if (!writeTopic.trim()) return;
    setOutlineGenerationContext({
      topic: writeTopic.trim(),
      requirements: writeRequirements.trim(),
      wordCount: writeWordCount.trim(),
      draftingUnit: writeDraftingUnit.trim(),
    });
    setIsProcessing(true);
    window.setTimeout(() => {
      setIsProcessing(false);
      setGeneratedOutline([
        {
          id: 's1',
          title: '一、发文背景与目的',
          content: '',
          subsections: [
            { id: 's1-1', title: '1.1 政策背景', content: '' },
            { id: 's1-2', title: '1.2 现实需求', content: '' },
          ],
        },
        {
          id: 's2',
          title: '二、核心指导思想',
          content: '',
          subsections: [
            { id: 's2-1', title: '2.1 总体原则', content: '' },
            { id: 's2-2', title: '2.2 工作目标', content: '' },
          ],
        },
        {
          id: 's3',
          title: '三、重点任务与执行路径',
          content: '',
          subsections: [
            { id: 's3-1', title: '3.1 第一阶段：组织动员与自查摸底', content: '' },
            { id: 's3-2', title: '3.2 第二阶段：集中整改与重点攻坚', content: '' },
            { id: 's3-3', title: '3.3 第三阶段：成果验收与总结评估', content: '' },
          ],
        },
        {
          id: 's4',
          title: '四、保障机制与督导问效',
          content: '',
          subsections: [
            { id: 's4-1', title: '4.1 组织领导', content: '' },
            { id: 's4-2', title: '4.2 督导检查', content: '' },
          ],
        },
      ]);
      setWriteStep('outline');
    }, 1200);
  };

  const buildOutlineText = () => generatedOutline
    .map((section) => [
      section.title,
      ...section.subsections.map((sub) => `  ${sub.title}`),
    ].filter(Boolean).join('\n'))
    .join('\n\n');

  const handleInsertOutline = () => {
    const outlineText = buildOutlineText() || `一、工作背景\n二、重点任务\n三、保障措施`;
    setGeneratedFullText(outlineText);
    setIsFullTextInserted(true);
    setWriteStep('full');
  };

  const handleContinueFullTextFromOutline = () => {
    if (outlineGenerationContext) {
      setWriteTopic((prev) => prev.trim() || outlineGenerationContext.topic);
      setWriteRequirements((prev) => prev.trim() || outlineGenerationContext.requirements);
      setWriteWordCount((prev) => prev.trim() || outlineGenerationContext.wordCount || '1500');
      setWriteDraftingUnit((prev) => prev.trim() || outlineGenerationContext.draftingUnit);
    }
    setWriteStep('full-confirm');
  };

  const handleGenerateFullText = () => {
    setIsProcessing(true);
    setSavedToCenter(false);
    setIsFullTextInserted(false);
    setShowSourceTrace(false);
    setWriteStep('full');
    setGeneratedFullText('正在生成全文...');
    window.setTimeout(() => {
      setIsProcessing(false);
      commitFullTextVersion(buildFullTextDraft(0), true);
      setWriteStep('full');
    }, 1200);
  };

  const handleRegenerateCurrentFullText = () => {
    if (isConclusionWritingMode) {
      handleGenerateConclusionVersion(false);
      return;
    }
    setIsProcessing(true);
    const nextIndex = fullTextVersions.length;
    window.setTimeout(() => {
      setIsProcessing(false);
      commitFullTextVersion(buildFullTextDraft(nextIndex), false);
    }, 1200);
  };

  const handleGenerateConclusionVersion = (resetHistory: boolean) => {
    if (!writeRequirements.trim()) return;
    setIsProcessing(true);
    setSavedToCenter(false);
    setIsFullTextInserted(false);
    setShowSourceTrace(false);
    setShowThoughtTrace(false);
    setActiveCitation(null);
    setWriteStep('full');
    setGeneratedFullText('正在根据已有正文语境生成正式结语...');
    window.setTimeout(() => {
      setIsProcessing(false);
      commitFullTextVersion(buildConclusionDraft(resetHistory ? 0 : fullTextVersions.length), resetHistory);
    }, 1000);
  };

  const handleGenerateConclusion = () => {
    handleGenerateConclusionVersion(true);
  };

  const updateCopyAttribute = (key: keyof CopyDocumentAttributes, value: string) => {
    if (key === 'docType' && value !== copyDocumentAttributes.docType) {
      window.setTimeout(() => {
        // In a real product this would be a toast; using a native title-less hint keeps the prototype lightweight.
        console.info('文体类型已调整，结尾用语和语气会随之变化。');
      }, 0);
    }
    setCopyDocumentAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const addCopyChips = (value: string, target: 'keywords' | 'phrases' | 'directions' | 'tones') => {
    const items = value
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!items.length) return;
    if (target === 'keywords') {
      setCopyKeywordChips((prev) => [...prev, ...items.filter((item) => !prev.includes(item))].slice(0, 10));
      setCopyKeywordDraft('');
      return;
    }
    if (target === 'directions') {
      setCopyDirectionChips((prev) => [...prev, ...items.filter((item) => !prev.includes(item))].slice(0, 6));
      setCopyDirectionDraft('');
      return;
    }
    if (target === 'tones') {
      setCopyToneChips((prev) => [...prev, ...items.filter((item) => !prev.includes(item))].slice(0, 8));
      setCopyToneDraft('');
      return;
    }
    setCopyNormPhraseChips((prev) => [...prev, ...items.filter((item) => !prev.includes(item))].slice(0, 10));
    setCopyNormPhraseDraft('');
  };

  const removeCopyChip = (target: 'keywords' | 'phrases' | 'directions' | 'tones', chip: string) => {
    if (target === 'keywords') {
      setCopyKeywordChips((prev) => prev.filter((item) => item !== chip));
      return;
    }
    if (target === 'directions') {
      setCopyDirectionChips((prev) => prev.filter((item) => item !== chip));
      return;
    }
    if (target === 'tones') {
      setCopyToneChips((prev) => prev.filter((item) => item !== chip));
      return;
    }
    setCopyNormPhraseChips((prev) => prev.filter((item) => item !== chip));
  };

  const updateCopyChip = (target: 'keywords' | 'phrases' | 'directions' | 'tones', index: number, value: string) => {
    const nextValue = value.trim();
    const updater = (prev: string[]) => prev.map((item, itemIndex) => (itemIndex === index ? nextValue : item)).filter(Boolean).slice(0, 10);
    if (target === 'keywords') {
      setCopyKeywordChips(updater);
      return;
    }
    if (target === 'directions') {
      setCopyDirectionChips((prev) => updater(prev).slice(0, 6));
      return;
    }
    if (target === 'tones') {
      setCopyToneChips((prev) => updater(prev).slice(0, 8));
      return;
    }
    setCopyNormPhraseChips(updater);
  };

  const updateCopyStructureItem = (id: string, patch: Partial<CopyStructureItem>) => {
    setCopyStructureItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const moveCopyStructureItem = (id: string, direction: -1 | 1) => {
    setCopyStructureItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const reorderCopyStructureItem = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    setCopyStructureItems((prev) => {
      const from = prev.findIndex((item) => item.id === dragId);
      const to = prev.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [dragged] = next.splice(from, 1);
      next.splice(to, 0, dragged);
      return next;
    });
  };

  const removeCopyStructureItem = (id: string) => {
    setCopyStructureItems((prev) => {
      if (prev.length <= 1) {
        return [{ ...prev[0], title: '', writingFunction: '', pattern: '', skeleton: '', phrases: [] }];
      }
      return prev.filter((item) => item.id !== id);
    });
    setCopyExpandedStructureIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  const addCopyStructureItem = () => {
    const id = `custom-${Date.now()}`;
    setCopyStructureItems((prev) => [
      ...prev,
      {
        id,
        title: '请填写结构提纲',
        writingFunction: '请填写这一段在全文中的写作功能',
        pattern: '请填写行文展开逻辑',
        skeleton: '请填写可复用句式骨架，[方括号] 标出填充位',
        phrases: [],
      },
    ]);
    setCopyExpandedStructureIds((prev) => [...prev, id]);
  };

  const toggleCopyStructureExpanded = (id: string) => {
    setCopyExpandedStructureIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const copyExtractionValid = copyKeywordChips.length > 0 && copyStructureItems.some((item) => item.title.trim());
  const copyKeywordSummary = copyKeywordChips.join('、');
  const copyDirectionSummary = copyDirectionChips.join('、');
  const copyToneSummary = copyToneChips.join('、');
  const copyAttributeSummary = [copyDocumentAttributes.docType, copyDirectionSummary, copyToneSummary].filter(Boolean).join(' / ');
  const copyStructureSummary = copyStructureItems
    .map((item, index) => `${index + 1}. ${item.title}\n- 写作功能：${item.writingFunction}\n- 行文模式：${item.pattern}\n- 句式骨架：${item.skeleton}`)
    .join('\n');

  const handleRunImitate = () => {
    if (!imitateTopic.trim() || !referenceMaterial.trim() || !copySourceFile) {
      return;
    }
    setIsProcessing(true);
    setProofreadResult(null);
    setShowSourceTrace(false);
    setShowThoughtTrace(true);
    setActiveCitation(null);
    setCopyStep('result');
    setCopyResultText(`各分公司、集团各部室：\n\n　　正在根据仿写样稿、任务要求与参考素材生成“${imitateTopic}”文稿。`);
    window.setTimeout(() => {
      setIsProcessing(false);
      const draftingUnit = copyDraftingUnit.trim() || '中国智海建设集团办公室';
      const targetWordCount = copyWordCount.trim() || '1500';
      setCopyResultText(`各分公司、集团各部室：

　　为深入贯彻落实集团年度重点工作部署，进一步规范“${imitateTopic}”相关工作，结合参考文稿的结构层次和行文口径，并按照约 ${targetWordCount} 字的篇幅要求，经研究，现就有关事项通知如下：

一、统一思想认识，明确总体要求

　　各单位要充分认识做好此项工作的重要意义，坚持目标导向与问题导向相结合，紧扣集团发展大局，细化工作安排，压实主体责任，确保各项部署衔接有序、执行有力。

二、聚焦重点任务，强化过程管理

　　（一）全面梳理现状。对照工作要求开展自查，形成问题清单、责任清单和任务清单。

　　（二）完善推进机制。明确牵头部门、责任人员和完成时限，实行台账管理、动态跟踪。

　　（三）及时总结反馈。各单位应于本月底前报送阶段性进展，对重要情况和突出问题及时请示报告。

三、压紧压实责任，确保工作实效

　　各单位主要负责人要认真履行第一责任人职责，加强统筹协调和督促检查。集团办公室将适时开展专项督导，对工作推进不力、落实不到位的单位予以通报并限期整改。

　　特此通知。

${draftingUnit}
二〇二六年六月二十三日`);
    }, 1200);
  };

  const handleExtractCopyDraft = () => {
    if (!copySourceFile) return;
    setIsProcessing(true);
    window.setTimeout(() => {
      setIsProcessing(false);
      const keywords = copySourceText.trim() ? ['工作部署', '阶段总结', '责任分工', '闭环落实'] : DEFAULT_COPY_KEYWORDS;
      const structure = copySourceText.trim()
        ? [
          { ...DEFAULT_COPY_STRUCTURE_ITEMS[0], id: 'position', title: '明确工作背景，统一落实口径' },
          { ...DEFAULT_COPY_STRUCTURE_ITEMS[1], id: 'task', title: '梳理重点事项，形成任务清单' },
          { ...DEFAULT_COPY_STRUCTURE_ITEMS[2], id: 'responsibility', title: '压实责任链条，强化反馈闭环' },
        ]
        : cloneCopyStructureItems();
      setCopyDocumentAttributes({
        docType: copySourceText.trim() ? '新闻稿' : DEFAULT_COPY_ATTRIBUTES.docType,
      });
      setCopyKeywordChips(keywords);
      setCopyDirectionChips(copySourceText.trim() ? [] : DEFAULT_COPY_DIRECTIONS);
      setCopyToneChips(copySourceText.trim() ? ['正式稳妥', '工作化'] : DEFAULT_COPY_TONES);
      setCopyNormPhraseChips(DEFAULT_COPY_NORM_PHRASES);
      setCopyStructureItems(structure.map((item) => ({ ...item, phrases: [...item.phrases] })));
      setCopyExpandedStructureIds([]);
      setCopyKeywordDraft('');
      setCopyDirectionDraft('');
      setCopyToneDraft('');
      setCopyNormPhraseDraft('');
      setCopyExtractedKeywords(keywords.join('、'));
      setCopyExtractedStructure(structure.map((item, index) => `${index + 1}. ${item.title}`).join('\n'));
      setCopyStep('extract');
    }, 900);
  };

  const handleCopySourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setCopySourceFile({ name: file.name, size, type: file.name.split('.').pop()?.toLowerCase() || 'file' });
    setCopySourceText('');
    event.target.value = '';
  };

  const handleHomeSourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const sourceFile: UploadedMockFile = {
      name: file.name,
      size,
      type: file.name.split('.').pop()?.toLowerCase() || 'file',
      sourceKind: 'local',
      sourceId: `local-${file.name}`,
      sourceLabel: '本地上传',
    };
    setUploadedFiles((prev) => (prev.some((item) => item.name === sourceFile.name) ? prev : [...prev, sourceFile]));
    setWritingReferenceDecision('added');
    event.target.value = '';
  };

  const buildHomeConversationSources = () => {
    const localSources = uploadedFiles.map((file) => ({
      ...file,
      sourceKind: file.sourceKind ?? 'local',
      sourceId: file.sourceId ?? `local-${file.name}`,
      sourceLabel: file.sourceLabel ?? '本地上传',
    }));
    const knowledgeSources = KNOWLEDGE_LIBRARY_GROUPS.flatMap((group) =>
      group.folders.flatMap((folder) => [
        selectedKnowledgeItems.includes(folder.id)
          ? {
              name: folder.title,
              size: `${folder.files.length}个文件`,
              type: 'folder',
              sourceKind: 'knowledge' as const,
              sourceId: folder.id,
              sourceLabel: `${group.title}`,
            }
          : null,
        ...folder.files.map((file) => selectedKnowledgeItems.includes(file.id)
          ? {
              name: file.title,
              size: file.size,
              type: file.type,
              sourceKind: 'knowledge' as const,
              sourceId: file.id,
              sourceLabel: `${group.title}/${folder.title}`,
            }
          : null),
      ])
    ).filter(Boolean) as UploadedMockFile[];

    return [...localSources, ...knowledgeSources].filter((source, index, sources) => {
      const key = `${source.sourceKind ?? 'local'}-${source.sourceId ?? source.name}`;
      return sources.findIndex((item) => `${item.sourceKind ?? 'local'}-${item.sourceId ?? item.name}` === key) === index;
    });
  };

  const handleWriteSourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setWriteSourceFile({ name: file.name, size, type: file.name.split('.').pop()?.toLowerCase() || 'file' });
    setSourceOutlineText('');
    setOutlineInputMode('ai');
    resetOutlineParse();
    event.target.value = '';
  };

  const handlePolishSourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setPolishSourceFile({ name: file.name, size, type: file.name.split('.').pop()?.toLowerCase() || 'file' });
    setPolishSourceText('');
    setSelectedPolishDocumentId(null);
    event.target.value = '';
  };

  const buildPolishedText = () => {
    const sourceTitle = selectedPolishDocument?.title || polishSourceFile?.name || '待润色公文';
    const sourceContent = selectedPolishDocument?.content?.trim() || polishSourceText.trim();
    const baseText = sourceContent || SAMPLE_POLISH_DOCUMENT;
    const normalized = baseText
      .replace(/贯彻贯彻/g, '深入贯彻')
      .replace(/不当行政行为/g, '不规范办理情形')
      .replace(/完全公开流转/g, '严格履行审批后按权限流转')
      .replace(/突法/g, '突发')
      .replace(/15分内/g, '15分钟内');

    return `【文风润色稿】${sourceTitle.replace(/\.(docx?|pdf|txt)$/i, '')}\n\n${normalized}\n\n润色处理说明：\n一、已统一正式公文表述，压缩口语化和重复用语。\n二、已按公文行文习惯补强“责任闭环、时限反馈、督办问效”表达。\n三、建议进入智能校对环节继续检查格式、敏感表述和发文字号规范。`;
  };

  const handleCheckSourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setCheckSourceFile({ name: file.name, size, type: file.name.split('.').pop()?.toLowerCase() || 'file' });
    setCheckSourceText('');
    event.target.value = '';
  };

  const handleLayoutSourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setLayoutSourceFile({ name: file.name, size, type: file.name.split('.').pop()?.toLowerCase() || 'file' });
    setLayoutSourceText('');
    event.target.value = '';
  };

  const handleToggleLayoutCapability = (capability: 'format' | 'red-template') => {
    if (capability === 'format') {
      if (layoutEnableFormat && !layoutEnableRedTemplate) return;
      setLayoutEnableFormat((prev) => !prev);
      return;
    }

    if (layoutEnableRedTemplate && !layoutEnableFormat) return;
    setLayoutEnableRedTemplate((prev) => !prev);
  };

  const handleRunPolish = () => {
    if (!polishSourceReady) return;
    setIsProcessing(true);
    setPolishResultText('');
    setPolishStep('result');
    setProofreadResult(null);
    window.setTimeout(() => {
      setIsProcessing(false);
      setPolishResultText(buildPolishedText());
    }, 1200);
  };

  const handleRunCheck = () => {
    setIsProcessing(true);
    setResultText('');
    setCheckStep('result');
    setProofreadResult(null);
    window.setTimeout(() => {
      setIsProcessing(false);
      setProofreadResult({
        score: 82,
        issues: [
          {
            type: '拼写/标点误用',
            original: '一、突法应急报修应于15分内口头报告。',
            suggested: '一、 突发应急报修应于15分钟内口头报告。',
            reason: '“突法”属于严重错别字，且标题序号与正文之间需要补齐规范间距。',
            level: 'critical'
          },
          {
            type: '政治/敏感用语',
            original: '对保密材料实行完全公开流转。',
            suggested: '对保密材料实行严格保密审批流转。',
            reason: '涉密材料不能采用“完全公开”表述，需改为符合保密要求的审批流转口径。',
            level: 'critical'
          },
          {
            type: '公文格式字号规定',
            original: '正文排版（采用小五号字）',
            suggested: '正文排版（采用三号仿宋体）',
            reason: 'GB/T 9704-2012 对公文正文排版有明确要求，正文应采用三号仿宋体。',
            level: 'warn'
          }
        ]
      });
      setCheckStep('result');
    }, 1200);
  };

  const handleRunTemplate = () => {
    setIsProcessing(true);
    setResultText('');
    setProofreadResult(null);
    window.setTimeout(() => {
      setIsProcessing(false);
      const redTemplateStyle = RED_TEMPLATE_STYLE_OPTIONS.find((style) => style.id === selectedRedTemplateStyle) ?? RED_TEMPLATE_STYLE_OPTIONS[0];
      const formatTemplateStyle = FORMAT_TEMPLATE_STYLE_OPTIONS.find((style) => style.id === selectedFormatTemplateStyle) ?? FORMAT_TEMPLATE_STYLE_OPTIONS[0];
      const resultSummary = [
        layoutEnableFormat ? `已按 ${formatTemplateStyle.label} 排版。` : '',
        layoutEnableRedTemplate ? `已完成公文套红：${redTemplateStyle.label}。` : '',
      ].filter(Boolean).join('\n');
      const documentHeader = layoutEnableRedTemplate
        ? `【公文套红 · ${redTemplateStyle.label}】\n\n${redTemplateStyle.templateTitle}\n\n签发人：${redTemplateStyle.signer}\n编号：${redTemplateStyle.documentNo}`
        : `【${formatTemplateStyle.label}】`;
      setResultText(`${documentHeader}

${SAMPLE_POLISH_DOCUMENT}

${resultSummary}

抄送：集团各部室、各分子公司
中国智海建设集团办公室
2026年6月18日`);
      setLayoutStep('result');
    }, 1200);
  };

  const openMyCloudDocumentPicker = (target: DocumentPickerTarget) => {
    setDocumentPickerTarget(target);
    setPolishDocumentSearch('');
    setActivePolishDocumentFolder('my-cloud');
  };

  const handleSelectMyCloudDocument = (doc: DocumentInfo) => {
    const sourceFile: UploadedMockFile = { name: doc.title, size: '知识库', type: 'docx', sourceKind: 'knowledge', sourceId: `doc-${doc.id}`, sourceLabel: '知识库选择' };
    if (documentPickerTarget === 'home') {
      setUploadedFiles((prev) => (prev.some((item) => item.name === sourceFile.name) ? prev : [...prev, sourceFile]));
      setWritingReferenceDecision('added');
    } else if (documentPickerTarget === 'write-source') {
      setWriteSourceFile(sourceFile);
      setSourceOutlineText(doc.content || '');
      setOutlineInputMode('ai');
      resetOutlineParse();
    } else if (documentPickerTarget === 'copy') {
      setCopySourceFile(sourceFile);
      setCopySourceText('');
    } else if (documentPickerTarget === 'polish') {
      setSelectedPolishDocumentId(doc.id);
      setPolishSourceFile(null);
      setPolishSourceText('');
    } else if (documentPickerTarget === 'check') {
      setCheckSourceFile(sourceFile);
      setCheckSourceText('');
    } else if (documentPickerTarget === 'layout') {
      setLayoutSourceFile(sourceFile);
      setLayoutSourceText('');
    }
    setDocumentPickerTarget(null);
  };

  const openTextPasteModal = (target: TextPasteTarget) => {
    setTextPasteTarget(target);
    setTextPasteValue('');
  };

  const handleApplyTextPaste = () => {
    const text = textPasteValue.trim();
    if (!text || !textPasteTarget) return;
    const sourceFile: UploadedMockFile = {
      name: '粘贴文本内容.txt',
      size: `${text.replace(/\s/g, '').length}字`,
      type: 'txt',
    };
    if (textPasteTarget === 'copy') {
      setCopySourceFile(sourceFile);
      setCopySourceText(text);
    } else if (textPasteTarget === 'write-source') {
      setWriteSourceFile(sourceFile);
      setSourceOutlineText(text);
      setOutlineInputMode('ai');
      resetOutlineParse();
    } else if (textPasteTarget === 'polish') {
      setPolishSourceFile(sourceFile);
      setPolishSourceText(text);
      setSelectedPolishDocumentId(null);
    } else if (textPasteTarget === 'check') {
      setCheckSourceFile(sourceFile);
      setCheckSourceText(text);
    } else if (textPasteTarget === 'layout') {
      setLayoutSourceFile(sourceFile);
      setLayoutSourceText(text);
    }
    setTextPasteTarget(null);
    setTextPasteValue('');
  };

  const renderDocumentPickerModal = () => (
    <AnimatePresence>
      {documentPickerTarget ? (
        <motion.div
          key="knowledge-document-picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6"
          onClick={() => setDocumentPickerTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="gov-panel flex max-h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/[0.04] px-5 py-4">
              <div>
                <h3 className="text-[15px] font-extrabold text-gray-800">从知识库选择</h3>
                <p className="mt-1 text-[11px] leading-[18px] text-stone-500">
                  从知识库中选择可用文档，系统会读取正文内容作为参考或待处理材料。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDocumentPickerTarget(null)}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label="关闭文档选择弹窗"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 border-b border-black/[0.04] px-5 py-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={polishDocumentSearch}
                  onChange={(event) => setPolishDocumentSearch(event.target.value)}
                  placeholder="搜索知识库文档标题、正文"
                  className="gov-input w-full rounded-lg py-2.5 pl-8 pr-3 text-[12px]"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-black/[0.06] bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 shadow-4xs">
                  <FileText size={12} className="text-[var(--gov-red)]" />
                  文字 (.doc/.docx)
                </div>
                <div className="grid grid-cols-[72px_72px_88px_18px] gap-3 pr-2 text-[11px] font-medium text-gray-400 select-none">
                  <span className="hidden sm:inline text-center">文件位置</span>
                  <span className="hidden sm:inline text-center">创建者</span>
                  <span className="text-right">最后修改</span>
                  <span />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="flex h-full min-h-[360px]">
                <aside className="w-[190px] shrink-0 border-r border-black/[0.04] bg-stone-50/50 p-3">
                  <div className="mb-2 px-2 text-[10px] font-semibold tracking-[0.12em] text-stone-400">目录</div>
                  <div className="space-y-1">
                    {POLISH_DOCUMENT_FOLDERS.map((folder) => {
                      const IconComponent = folder.icon;
                      return (
                        <button
                          key={folder.id}
                          type="button"
                          className="gov-nav-item gov-nav-item-active flex w-full items-center gap-2.5 px-3 py-2 text-left font-bold"
                        >
                          <IconComponent size={14} className="text-[var(--gov-red)]" />
                          <span className="text-[12px]">{folder.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="min-w-0 flex-1 overflow-y-auto px-5 py-3">
                  {polishDocumentOptions.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 px-1 text-[10.5px] font-extrabold uppercase tracking-wide text-gray-400">
                        <Folder size={11} />
                        知识库文档
                      </div>
                      <div className="divide-y divide-black/[0.03]">
                        {polishDocumentOptions.map((doc) => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => handleSelectMyCloudDocument(doc)}
                            className="gov-list-hover group grid w-full grid-cols-[minmax(0,1fr)_72px_72px_88px_18px] items-center gap-3 rounded-[4px] border border-transparent bg-white px-2 py-2.5 text-left transition"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red)] shadow-3xs">
                                <FileText size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-xs font-bold leading-[17px] text-gray-700 transition-colors group-hover:text-[var(--gov-red)]">{doc.title}</p>
                                <p className="mt-0.5 line-clamp-1 text-[10px] leading-[14px] text-gray-400">{doc.content}</p>
                              </div>
                            </div>
                            <span className="hidden text-center text-[11px] font-medium text-gray-400 sm:inline-block">知识库</span>
                            <span className="hidden text-center text-[11px] font-semibold text-gray-500 sm:inline-block">{doc.author}</span>
                            <span className="text-right text-[11px] font-mono text-gray-400">{doc.lastModified}</span>
                            <span />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 text-center">
                      <Folder size={24} className="text-stone-300" />
                      <p className="mt-3 text-[13px] font-medium text-stone-600">知识库暂无可选文档</p>
                      <p className="mt-1 text-[11px] text-stone-400">可通过搜索标题、分类或正文定位需要的参考材料。</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const renderTextPasteModal = () => (
    <AnimatePresence>
      {textPasteTarget ? (
        <motion.div
          key="text-paste-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6"
          onClick={() => setTextPasteTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-2xl overflow-hidden rounded-[16px] border border-black/[0.06] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-5 py-4">
              <div>
                <h3 className="text-[15px] font-bold text-[#202124]">粘贴文本内容</h3>
                <p className="mt-1 text-[12px] leading-5 text-[#8a8f98]">可直接粘贴正文、参考材料或待处理内容，系统会作为一份文本来源解析。</p>
              </div>
              <button
                type="button"
                onClick={() => setTextPasteTarget(null)}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label="关闭文本输入弹窗"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <textarea
                value={textPasteValue}
                onChange={(event) => setTextPasteValue(event.target.value)}
                rows={10}
                autoFocus
                placeholder="请粘贴文本内容，例如会议通知、讲话稿片段、待润色正文、需要校对的材料等。"
                className="gov-input w-full resize-none px-4 py-3 text-[13px] leading-6"
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#98a2b3]">{textPasteValue.replace(/\s/g, '').length} 字</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTextPasteTarget(null)}
                    className="rounded-lg px-4 py-2 text-[12px] font-semibold text-[#667085] transition hover:bg-[#f4f5f7]"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={!textPasteValue.trim()}
                    onClick={handleApplyTextPaste}
                    className="rounded-lg bg-[var(--gov-red)] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    确认添加
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const renderHome = (variant: 'default' | 'quick-create' = 'default') => {
    const isQuickCreateHome = variant === 'quick-create';
    const homeSubmitPrompt = buildHomePrompt();
    const selectedHomeExpertGuide = HOME_EXPERT_GUIDE_COPY[selectedHomeExpert.id];
    const isSourceBasedHomeWriting = homeActiveCapability === 'write' && HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode);
    const selectedHomeWritingCopy = HOME_WRITING_PROMPT_COPY[selectedWritingMode];
    const selectedHomeQuickCopy = isSourceBasedHomeWriting ? HOME_QUICK_PROMPT_COPY[selectedWritingMode] : null;
    const useDefaultHomeWritingControl = isQuickCreateHome || isDefaultHomeExpert;
    const shouldUseStructuredHomeWriting = useDefaultHomeWritingControl && homeActiveCapability === 'write';
    const homePromptPlaceholder = useDefaultHomeWritingControl
      ? homeActiveCapability === 'write'
        ? selectedHomeQuickCopy?.placeholder ?? '一句话描述你的写作任务'
        : '请输入你的问题，支持政策、公文、材料相关问答'
      : selectedHomeExpertGuide;
    const homePromptHint = isSourceBasedHomeWriting ? selectedHomeQuickCopy?.hint : null;
    const homePromptLength = homePrompt.length;
    const homeSourceTextLength = sourceOutlineText.length;
    const homeSourceLabel = selectedWritingMode === '大纲成文' ? '已有大纲' : selectedWritingMode === '生成结语' ? '原文/大纲' : '已有正文';
    const homePromotedFeatures = [
      { id: 'copy' as const, title: '以稿写稿', desc: '参考范文延续结构、语气和口径', hint: '稿子为蓝本，二次创作', iconKey: 'feature-ai-copy', tone: 'from-[#f7f3ff] via-[#f4f6ff] to-[#edf4ff]', iconTone: 'bg-[#f0eaff] text-[#7a5cff]', glow: 'bg-[#9272ff]/18' },
      { id: 'scenario-writing' as const, title: '场景写作', desc: '按具体场景先生成结构化大纲', hint: '围绕文种和场景起草', iconKey: 'write-mode-outline', tone: 'from-[#fff6f5] via-[#fff2f5] to-[#f9f2ff]', iconTone: 'bg-[#fff0e8] text-[#ff7a45]', glow: 'bg-[#ff8a5c]/18' },
      { id: 'template-layout' as const, title: '智能排版', desc: '模板样式一键规范排版', hint: '套模板、控格式、快交付', iconKey: 'feature-layout', tone: 'from-[#effaf7] via-[#eef8ff] to-[#f6f4ff]', iconTone: 'bg-[#e7faf2] text-[#16a085]', glow: 'bg-[#1abc9c]/16' },
      { id: 'check' as const, title: '智能校对', desc: '检查错漏、敏感表述与格式问题', hint: '交付前查错和规范检查', iconKey: 'feature-proofread', tone: 'from-[#f2f7ff] via-[#f5f1ff] to-[#fff4f6]', iconTone: 'bg-[#eaf1ff] text-[#4169d8]', glow: 'bg-[#6384ff]/16' },
    ];
    const homeSkillTabs = [
      { id: 'qa' as const, label: '智能问答', iconKey: 'qa', color: '#0f96b8' },
      ...WRITING_MODE_OPTIONS.map((mode) => ({
        id: mode.id,
        label: mode.id,
        iconKey: mode.iconKey,
        color:
          mode.id === '生成大纲'
            ? '#3b82f6'
            : mode.id === '大纲成文'
              ? '#3ab7a2'
              : mode.id === '继续写'
                ? '#8b5cf6'
                : mode.id === '生成结语'
                  ? '#f97316'
                  : '#e74d5e'
      }))
    ];
    const handleSelectHomeSkill = (skillId: 'qa' | WritingMode) => {
      if (skillId === 'qa') {
        setHomeActiveCapability('qa');
        setIsHomeUploadMenuOpen(false);
        return;
      }
      setHomeActiveCapability('write');
      setHomeSelectedSkill('AI写作');
      setSelectedWritingMode(skillId);
      setNeedOutline(skillId === '生成大纲');
      setOutlineInputMode('ai');
      resetOutlineParse();
      setIsHomeUploadMenuOpen(false);
    };
    return (
      <motion.div
        key={isQuickCreateHome ? 'quick-create' : 'home'}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="ai-workspace-bg ai-home-bg relative flex h-full flex-col overflow-hidden"
      >
        <section className="mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col items-center justify-start px-[clamp(28px,4vw,72px)] pb-5 pt-[clamp(48px,9vh,96px)]">
          <div className="mb-5 flex shrink-0 flex-col items-center text-center">
            <div className="relative"><div className="absolute -inset-2 rounded-[24px] border border-[var(--gov-red-line)] bg-white/60" /><img src={resolvePublicAssetUrl(appearance?.logoUrl ?? DEFAULT_PRODUCT_ICON_URL)} alt="产品 logo" className="relative h-20 w-20 rounded-[20px] border border-white object-cover shadow-[0_18px_38px_rgba(176,64,70,0.18)]" /><span className="absolute -bottom-2 -right-3 flex h-8 w-8 items-center justify-center rounded-[10px] border-2 border-white bg-[var(--gov-red)] text-white shadow-[0_7px_16px_rgba(181,47,61,0.28)]"><Sparkles size={15} /></span></div>
            <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-normal">
              <span className="text-[#202124]">全能助手，</span>
              <span className="text-[var(--gov-red-deep)]">{appearance?.slogan ?? '一步开启高效公文写作新体验'}</span>
            </h1>
          </div>

          {useDefaultHomeWritingControl ? (
            <div className="home-skill-tabs relative z-30 mb-5 grid w-full max-w-[980px] grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {homeSkillTabs.map((skill) => {
                const isSelected =
                  skill.id === 'qa'
                    ? homeActiveCapability === 'qa'
                    : homeActiveCapability === 'write' && selectedWritingMode === skill.id;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleSelectHomeSkill(skill.id)}
                    className={`group flex h-14 items-center justify-center gap-3 rounded-[14px] border bg-white px-4 text-[15px] font-bold transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.10)] ${
                      isSelected
                        ? 'border-[var(--gov-red-line)] text-[var(--gov-red-deep)] shadow-[0_18px_38px_rgba(190,51,62,0.13)] ring-4 ring-[rgba(231,77,94,0.07)]'
                        : 'border-black/[0.06] text-[#344054] shadow-[0_12px_28px_rgba(15,23,42,0.06)] hover:border-black/[0.10]'
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]"
                      style={{ color: skill.color }}
                    >
                      {skill.id === 'qa' ? (
                        <MessageCircle size={19} strokeWidth={2.1} />
                      ) : (
                        <PrototypeIcon name={skill.iconKey} size={30} alt={`${skill.label}图标`} />
                      )}
                    </span>
                    <span className="truncate">{skill.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="ai-prompt-shell relative z-30 w-full max-w-[980px] shrink-0 overflow-visible rounded-[16px] p-4 text-left">
            <div className={`home-prompt-main-row relative z-50 flex gap-4 ${isSourceBasedHomeWriting ? 'flex-col items-stretch' : 'items-start'}`}>
              {!useDefaultHomeWritingControl ? (
                <div className="flex shrink-0 justify-start">
                  <span className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-[var(--gov-red-line)] bg-white px-3 text-[13px] font-semibold text-[var(--gov-red-deep)] shadow-[0_8px_22px_rgba(190,51,62,0.08)]">
                    <Bot size={15} />
                    {selectedHomeExpert.name}
                  </span>
                </div>
              ) : null}
              <div className={`min-w-0 flex-1 ${isSourceBasedHomeWriting ? '-mt-1' : ''}`}>
                {shouldUseStructuredHomeWriting ? (
                  <div className={`${isSourceBasedHomeWriting ? 'min-h-[118px]' : 'min-h-[104px]'} px-1 py-1`}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[15px] leading-8 text-[#30343b]">
                      <span className={`${isSourceBasedHomeWriting ? 'hidden' : ''} text-[#4b5563]`}>{selectedHomeWritingCopy.inlineLead}</span>
                      {isSourceBasedHomeWriting ? (
                        <div className="basis-full rounded-[12px] border border-black/[0.06] bg-[#fafbfc] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[12px] leading-5">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#596170]">{homeSourceLabel}</span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#8a93a3] ring-1 ring-black/[0.05]">
                                <HelpCircle size={12} className="text-[#a0a7b2]" />
                                短文本粘贴
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setWriteRequirements(homeDraftRequirement.trim());
                                  setWriteWordCount(homeDraftWordCount.trim() || '1500');
                                  setWriteSourceFile(null);
                                  setSourceOutlineText('');
                                  setUploadedFiles([]);
                                  setSelectedKnowledgeItems([]);
                                  setOutlineInputMode('ai');
                                  resetOutlineParse();
                                  setWriteStep('source');
                                  setCurrentView('write');
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-3 py-0.5 text-[11px] font-bold text-[var(--gov-red-deep)] shadow-[0_6px_16px_rgba(231,77,94,0.08)] transition hover:-translate-y-0.5 hover:bg-white"
                              >
                                <FileUp size={12} />
                                文档或长文本进入完整流程
                              </button>
                            </div>
                            <span className="shrink-0 text-[11px] font-medium text-[#98a2b3]">
                              {homeSourceTextLength}/{HOME_SOURCE_TEXT_MAX_LENGTH} 字
                            </span>
                          </div>
                          <textarea
                            value={sourceOutlineText}
                            maxLength={HOME_SOURCE_TEXT_MAX_LENGTH}
                            onChange={(event) => setSourceOutlineText(event.target.value.slice(0, HOME_SOURCE_TEXT_MAX_LENGTH))}
                            placeholder={selectedWritingMode === '大纲成文'
                              ? '粘贴 500 字以内的大纲内容，长大纲或文档请进入完整流程'
                              : selectedWritingMode === '继续写'
                                ? '粘贴 500 字以内的待续写正文，长文档请进入完整流程'
                                : '粘贴 500 字以内的正文或大纲，长文档请进入完整流程'}
                            rows={2}
                            className="h-[58px] w-full resize-none bg-transparent text-[13px] leading-6 text-[#202124] outline-none placeholder:text-[#a0a7b2]"
                          />
                        </div>
                      ) : (
                        <>
                          <span className="text-[#4b5563]">，标题是</span>
                          <input
                            value={homeDraftTitle}
                            onChange={(event) => setHomeDraftTitle(event.target.value)}
                            placeholder="输入标题"
                            style={{ width: `${Math.min(Math.max(homeDraftTitle.length + 6, 12), 40)}ch` }}
                            className="inline-flex h-7 min-w-[118px] max-w-full rounded-[6px] bg-[#f0f3f7] px-2 text-[13px] font-semibold text-[#202124] outline-none transition-[width,background-color,box-shadow] duration-200 placeholder:text-[#9aa3b2] focus:bg-white focus:ring-2 focus:ring-[var(--gov-red-line)]"
                          />
                        </>
                      )}
                      <span className="text-[#4b5563]">，{isSourceBasedHomeWriting && selectedWritingMode === '生成结语' ? '结语字数' : '字数'}</span>
                      <input
                        value={homeDraftWordCount}
                        onChange={(event) => setHomeDraftWordCount(event.target.value.replace(/\D/g, ''))}
                        placeholder="填写字数"
                        inputMode="numeric"
                        className="inline-flex h-7 w-[86px] rounded-[6px] bg-[#f0f3f7] px-2 text-[13px] font-semibold text-[#202124] outline-none placeholder:text-[#9aa3b2] focus:bg-white focus:ring-2 focus:ring-[var(--gov-red-line)]"
                      />
                      <span className="text-[#4b5563]">字左右，{isSourceBasedHomeWriting ? '生成要求' : '其他要求'}</span>
                      <input
                        value={homeDraftRequirement}
                        onChange={(event) => setHomeDraftRequirement(event.target.value)}
                        placeholder={isSourceBasedHomeWriting
                          ? selectedWritingMode === '大纲成文'
                            ? '例如：扩写重点任务，保持正式稳健'
                            : selectedWritingMode === '继续写'
                              ? '例如：接着写落实措施和工作要求'
                              : '例如：收束有力，强调后续落实'
                          : '请输入'}
                        className="inline-flex h-7 min-w-[110px] flex-1 rounded-[6px] bg-[#f0f3f7] px-2 text-[13px] font-semibold text-[#202124] outline-none placeholder:text-[#9aa3b2] focus:bg-white focus:ring-2 focus:ring-[var(--gov-red-line)]"
                      />
                      <span className="text-[#4b5563]">。</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <textarea
                        value={homePrompt}
                        maxLength={HOME_PROMPT_MAX_LENGTH}
                        onChange={(event) => setHomePrompt(event.target.value.slice(0, HOME_PROMPT_MAX_LENGTH))}
                        onKeyDown={(event) => {
                          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                            handleHomeSubmit();
                          }
                        }}
                        rows={3}
                        className="h-[150px] w-full resize-none bg-transparent px-1 py-2 pr-16 text-[15px] leading-7 text-[#202124] outline-none placeholder:text-[#9aa0a6]"
                        placeholder={homePromptPlaceholder}
                      />
                      <span
                        className={`absolute bottom-2 right-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                          homePromptLength > 9000
                            ? 'bg-[#fff1f0] text-[var(--gov-red)]'
                            : 'bg-[#f5f6f8] text-[#98a2b3]'
                        }`}
                      >
                        {homePromptLength}/{HOME_PROMPT_MAX_LENGTH}
                      </span>
                    </div>
                    {homePromptHint ? (
                      <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/45 px-3 py-2 text-[12px] font-medium text-[var(--gov-red-deep)]">
                        <Sparkles size={13} />
                        <span>{homePromptHint}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            <div className="home-prompt-toolbar relative z-[160] mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
              <div className="flex flex-wrap items-center gap-2">
                {homeActiveCapability === 'write' || homeActiveCapability === 'qa' ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsHomeUploadMenuOpen((value) => !value)}
                      className="inline-flex h-9 items-center justify-center rounded-[8px] border border-black/[0.06] bg-white px-3 text-[13px] font-semibold text-[#444950] transition hover:bg-[#f7f7f7]"
                    >
                      {isHomeUploadMenuOpen ? <X size={15} /> : <Plus size={16} />}
                      <span className="ml-1.5">{isSourceBasedHomeWriting ? '添加参考素材' : '添加参考文档'}</span>
                    </button>
                    {isHomeUploadMenuOpen ? (
                      <div className="home-prompt-reference-menu absolute bottom-11 left-0 z-[320] w-[190px] rounded-[14px] border border-black/[0.08] bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
                        <label className="flex h-10 w-full cursor-pointer items-center justify-between rounded-[10px] px-3 text-left text-[13px] font-semibold text-[#344054] transition hover:bg-[#f7f7f7] hover:text-[var(--gov-red-deep)]">
                          <span className="flex items-center gap-2.5">
                            <FileUp size={15} className="text-[#7a808a]" />
                            <span>{isSourceBasedHomeWriting ? '上传本地素材' : '上传本地文件'}</span>
                          </span>
                          <ChevronDown size={13} className="-rotate-90 text-[#b0b5bd]" />
                          <input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={(event) => {
                            handleHomeSourceUpload(event);
                            setIsHomeUploadMenuOpen(false);
                          }} />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsHomeUploadMenuOpen(false);
                            openMyCloudDocumentPicker('home');
                          }}
                          className="mt-1 flex h-10 w-full items-center justify-between rounded-[10px] px-3 text-left text-[13px] font-semibold text-[#344054] transition hover:bg-[#f7f7f7] hover:text-[var(--gov-red-deep)]"
                        >
                          <span className="flex items-center gap-2.5">
                            <Folder size={15} className="text-[#7a808a]" />
                            <span>{isSourceBasedHomeWriting ? '从知识库选素材' : '知识库上传'}</span>
                          </span>
                          <ChevronDown size={13} className="-rotate-90 text-[#b0b5bd]" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!isQuickCreateHome ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsHomeExpertMenuOpen((value) => !value)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-black/[0.06] bg-white px-3 text-[13px] font-semibold text-[#444950] shadow-[0_6px_16px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:bg-white hover:text-[var(--gov-red-deep)] hover:shadow-[0_10px_26px_rgba(15,23,42,0.08)]"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[linear-gradient(145deg,var(--gov-red-soft),#fff)] text-[var(--gov-red-deep)] shadow-[inset_0_-3px_8px_rgba(190,51,62,0.08)]">
                        <Bot size={14} />
                      </span>
                      <span>专家</span>
                      <span className="max-w-[112px] truncate text-[#667085]">{selectedHomeExpert.name}</span>
                      <ChevronDown size={14} className={`text-[#98a2b3] transition ${isHomeExpertMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isHomeExpertMenuOpen ? (
                      <div className="home-prompt-expert-menu absolute bottom-12 left-0 z-[320] w-[244px] overflow-hidden rounded-[14px] border border-black/[0.08] bg-white p-1.5 shadow-[0_18px_46px_rgba(15,23,42,0.14)]">
                        <p className="px-3 py-2 text-[12px] font-semibold text-[#98a2b3]">推荐专家</p>
                        <div className="max-h-[312px] space-y-1 overflow-y-auto">
                        {HOME_EXPERTS.map((expert, index) => {
                          const isSelected = expert.id === activeHomeExpertId;
                          const ExpertIcon = [FileText, ClipboardList, FileCheck2, PenTool, FileSearch, Layers][index] ?? Bot;
                          return (
                            <button
                              key={expert.id}
                              type="button"
                              onClick={() => handleSelectHomeExpert(expert.id)}
                              className={`group flex h-11 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left transition ${
                                isSelected
                                  ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]'
                                  : 'text-[#344054] hover:bg-[#f7f7f7]'
                              }`}
                            >
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] shadow-[inset_0_-5px_12px_rgba(15,23,42,0.04)] ${isSelected ? 'bg-white text-[var(--gov-red-deep)]' : 'bg-[#f3f5f8] text-[#667085]'}`}>
                                <ExpertIcon size={16} />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                                {expert.name}
                              </span>
                              {isSelected ? <CheckCircle size={14} className="shrink-0" /> : <ChevronDown size={13} className="-rotate-90 text-[#b0b5bd]" />}
                            </button>
                          );
                        })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {uploadedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.slice(0, 2).map((file, index) => (
                      <span key={file.name} className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#f4f5f7] px-3 text-[11px] font-medium text-[#667085]">
                        <File size={12} />
                        <span className="max-w-[160px] truncate">{file.name}</span>
                        <button type="button" onClick={() => handleClearFile(index)} className="text-[#98a2b3] hover:text-[#d92d20]">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {uploadedFiles.length > 2 ? (
                      <span className="inline-flex h-9 items-center rounded-[10px] bg-[#f4f5f7] px-2.5 text-[11px] font-semibold text-[#8a8f98]">+{uploadedFiles.length - 2}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <DeepThinkingToggle enabled={deepThinkingEnabled} onChange={setDeepThinkingEnabled} />
                <ModelSelectControl selectedModel={selectedModel} onChange={setSelectedModel} />
                <button
                  type="button"
                  onClick={handleHomeSubmit}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gov-red)] text-white shadow-[0_8px_18px_rgba(231,77,94,0.18)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-[#d1d5db] disabled:shadow-none"
                  title="发送"
                  disabled={!homeSubmitPrompt.trim()}
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          </div>

          {!isQuickCreateHome ? (
            <>
              <div className="relative z-10 mt-7 flex w-full max-w-[980px] items-end justify-start gap-4">
                <div>
                  <p className="text-[18px] font-extrabold text-[#202124]">更多创作方式</p>
                  <p className="mt-1 text-[12px] text-[#8a93a3]">按材料来源、写作场景和交付动作快速进入对应流程</p>
                </div>
              </div>

              <div className="relative z-10 mt-4 grid w-full max-w-[980px] grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {homePromotedFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => {
                      if (feature.id === 'scenario-writing') {
                        openScenarioWritingShortcut();
                        return;
                      }
                      openHomeFeature(feature.id);
                    }}
                    className={`group relative min-h-[132px] overflow-hidden rounded-[18px] border border-white/85 bg-gradient-to-br ${feature.tone} px-5 py-5 text-left shadow-[0_18px_42px_rgba(43,69,97,0.10)] transition hover:-translate-y-1 hover:border-[var(--gov-red-line)] hover:bg-white hover:shadow-[0_26px_56px_rgba(43,69,97,0.14)] active:scale-[0.99]`}
                  >
                    <span className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${feature.glow} blur-xl transition group-hover:scale-125`} />
                    <span className="pointer-events-none absolute bottom-0 right-0 h-20 w-24 rounded-tl-[42px] bg-white/24" />
                    <span className="relative flex h-full flex-col justify-between gap-4">
                      <span className="flex items-start justify-between gap-3">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] ${feature.iconTone} shadow-[inset_0_-5px_12px_rgba(15,23,42,0.04),0_12px_24px_rgba(15,23,42,0.06)]`}>
                          <PrototypeIcon name={feature.iconKey} size={34} alt={`${feature.title}图标`} />
                        </span>
                        <ChevronDown size={17} className="-rotate-90 text-[#98a2b3] transition group-hover:translate-x-0.5 group-hover:text-[var(--gov-red-deep)]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[17px] font-extrabold text-[#202124]">{feature.title}</span>
                        <span className="mt-1.5 block text-[12px] leading-5 text-[#7a8392]">{feature.desc}</span>
                        <span className="mt-3 inline-flex rounded-full bg-white/58 px-2.5 py-1 text-[11px] font-semibold text-[#667085] ring-1 ring-white/70">{feature.hint}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

        </section>
      </motion.div>
    );
  };

  const renderConversationDetail = () => {
    if (!homeConversation) {
      return renderHome();
    }

    if (homeConversation.skill === '智能问答' || homeConversation.skill === 'AI写作') {
      const isWritingConversation = homeConversation.skill === 'AI写作';
      const processSteps = isWritingConversation
        ? [
            { title: '理解写作要求', detail: '已识别写作模式、文章主题、篇幅和补充要求', icon: PenTool },
            { title: '规划公文结构', detail: '正在组织标题、正文层级、重点事项和结尾口径', icon: Network },
            { title: '调用写作技能', detail: homeConversation.sources.length > 0 ? '已调用参考材料精读、公文起草和规范表达技能' : '已调用公文起草、政务表达和格式规范技能', icon: FileSearch },
            { title: '生成并检查初稿', detail: '正在统一表述口径并检查段落衔接与公文规范', icon: Sparkles },
          ]
        : isDefaultHomeExpert ? [
            { title: '识别问题与目标', detail: '已确认咨询主题、回答范围和期望输出', icon: HelpCircle },
            { title: '拆解处理任务', detail: '形成资料检索、要点归纳和答案组织三个步骤', icon: Network },
            { title: '调用任务技能', detail: homeConversation.sources.length > 0 ? '已调用知识检索与材料精读技能' : '已调用政务知识检索与政策口径分析技能', icon: FileSearch },
            { title: '整合并生成答案', detail: '正在核对事实依据、组织结构化回复', icon: Sparkles },
          ] : selectedHomeExpert.processFocus.map((focus, index) => ({
            title: focus,
            detail: index === 0
              ? `由${selectedHomeExpert.name}识别问题边界和输出目标`
              : index === 1
                ? '结合可用材料和知识库信息进行归纳判断'
                : index === 2
                  ? '组织可执行、可复用的结构化回复'
                  : '完成口径校验并输出最终答案',
            icon: [HelpCircle, FileSearch, Network, Sparkles][index] ?? Sparkles,
          }));
      const getSourceKey = (source: UploadedMockFile) => `${source.sourceKind ?? 'local'}-${source.sourceId ?? source.name}`;
      const currentReferenceSources = buildHomeConversationSources();
      const allSources = qaTurns.reduce<UploadedMockFile[]>((files, turn) => {
        turn.sources.forEach((source) => {
          if (!files.some((file) => getSourceKey(file) === getSourceKey(source))) files.push(source);
        });
        return files;
      }, [...homeConversation.sources, ...currentReferenceSources].filter((source, index, sources) => (
        sources.findIndex((item) => getSourceKey(item) === getSourceKey(source)) === index
      )));
      const activeSource = allSources[qaActiveSource] ?? allSources[0];
      const handleRemoveConversationSource = (source: UploadedMockFile) => {
        const sourceKey = getSourceKey(source);
        setHomeConversation((conversation) => conversation
          ? { ...conversation, sources: conversation.sources.filter((item) => getSourceKey(item) !== sourceKey) }
          : conversation);
        setQaTurns((turns) => turns.map((turn) => ({
          ...turn,
          sources: turn.sources.filter((item) => getSourceKey(item) !== sourceKey),
        })));
        if ((source.sourceKind ?? 'local') === 'local') {
          setUploadedFiles((files) => files.filter((file) => getSourceKey(file) !== sourceKey && file.name !== source.name));
        } else if (source.sourceId) {
          setSelectedKnowledgeItems((items) => items.filter((item) => item !== source.sourceId));
        }
        setQaActiveSource(0);
        setQaActiveCitation(null);
      };
      const sourceExcerpt = activeSource
        ? `摘录自《${activeSource.name.replace(/\.[^.]+$/, '')}》：围绕当前事项，应先明确目标边界和责任主体，再结合现有政策、历史材料与执行条件形成可落地的工作建议。`
        : '';
      const preflightNeedsSourceText = HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode);
      const writingPreflightReady = Boolean(
        (preflightNeedsSourceText || homeDraftTitle.trim()) &&
        (preflightNeedsSourceText || homeDraftScenario.trim()) &&
        homeDraftWordCount.trim() &&
        homeDraftRequirement.trim() &&
        writingReferenceDecision !== 'pending'
      );

      return (
        <motion.div
          key="qa-conversation-detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fafafa]"
        >
          <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-5 md:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[#667085] transition hover:bg-[#f4f5f7] hover:text-[#202124]"
                aria-label="返回首页"
              >
                <ArrowLeft size={17} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[#202124]">{isWritingConversation ? '快速创作' : selectedHomeExpert.name}</p>
                <p className="truncate text-[11px] text-[#98a2b3]">{appearance?.productName ?? '金山文澜'} · {appearance?.productSubtitle ?? '智能政务创作平台'} · {isWritingConversation ? '写作任务' : '连续对话'}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => allSources.length > 0 && setQaSourcesOpen(true)}
                disabled={allSources.length === 0}
                className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.06] bg-white text-[#667085] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-black/[0.06] disabled:hover:text-[#667085]"
                title={allSources.length > 0 ? '查看参考文件列表' : '暂无参考文件'}
                aria-label="参考文件列表"
              >
                <ClipboardList size={17} />
                {allSources.length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gov-red)] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(190,51,62,0.22)]">
                    {allSources.length}
                  </span>
                ) : null}
              </button>
              <span className="hidden items-center gap-1.5 text-[11px] font-medium text-[#7a808a] sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#49a36d]" />
                模型服务正常
              </span>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto" data-testid="qa-conversation-scroll">
                <div className="mx-auto w-full max-w-[1120px] space-y-8 px-5 py-7 md:px-9 md:py-8">
                  {isWritingConversation && !writingPreflightConfirmed ? (
                    <div className="space-y-5" data-testid="writing-preflight">
                      <div className="flex justify-end gap-3">
                        <div className="max-w-[78%] rounded-[14px] rounded-tr-[4px] bg-[#f0f1f3] px-4 py-3 text-[14px] leading-6 text-[#30343b]">{homeConversation.prompt}</div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[12px] font-bold text-[var(--gov-red-deep)]">张</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <img src={DEFAULT_PRODUCT_ICON_URL} alt="金山文澜" className="h-9 w-9 shrink-0 rounded-[10px] border border-black/[0.05] object-cover" />
                        <div className="min-w-0 flex-1 rounded-[16px] border border-black/[0.07] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-[16px] font-semibold text-[#202124]">生成前再确认一下</h2>
                              <p className="mt-1.5 text-[12px] leading-5 text-[#7a808a]">为了让初稿更准确，请补全下列写作参数。全部确认后才会开始生成。</p>
                            </div>
                            <span className="hidden rounded-[8px] bg-[var(--gov-red-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--gov-red-deep)] sm:inline-flex">{selectedWritingMode}</span>
                          </div>

                          <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            {!preflightNeedsSourceText ? (
                              <>
                                <label className="block">
                                  <span className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[#475467]"><span>文章标题</span>{!homeDraftTitle.trim() ? <span className="text-[10px] font-medium text-[var(--gov-red)]">待补充</span> : <CheckCircle size={13} className="text-[#49a36d]" />}</span>
                                  <input value={homeDraftTitle} onChange={(event) => setHomeDraftTitle(event.target.value)} placeholder="请输入完整文章标题" className="h-10 w-full rounded-[9px] border border-black/[0.08] bg-[#fafafa] px-3 text-[13px] outline-none transition focus:border-[var(--gov-red-line)] focus:bg-white focus:ring-2 focus:ring-[var(--gov-red-soft)]" />
                                </label>
                                <label className="block">
                                  <span className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[#475467]"><span>写作场景 / 文种</span>{!homeDraftScenario.trim() ? <span className="text-[10px] font-medium text-[var(--gov-red)]">待确认</span> : <CheckCircle size={13} className="text-[#49a36d]" />}</span>
                                  <select value={homeDraftScenario} onChange={(event) => setHomeDraftScenario(event.target.value)} className="h-10 w-full rounded-[9px] border border-black/[0.08] bg-[#fafafa] px-3 text-[13px] text-[#344054] outline-none transition focus:border-[var(--gov-red-line)] focus:bg-white focus:ring-2 focus:ring-[var(--gov-red-soft)]">
                                    <option value="">请选择写作场景</option><option value="通知">通知</option><option value="请示">请示</option><option value="工作报告">工作报告</option><option value="讲话稿">讲话稿</option><option value="会议纪要">会议纪要</option><option value="工作方案">工作方案</option>
                                  </select>
                                </label>
                              </>
                            ) : (
                              <div className="lg:col-span-2 rounded-[12px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/40 p-3">
                                <p className="text-[12px] font-semibold text-[var(--gov-red-deep)]">已有文本已作为本次 {selectedWritingMode} 的输入来源</p>
                                <p className="mt-1 text-[11px] text-[#667085]">{sourceOutlineText.trim() ? sourceOutlineText.trim().slice(0, 90) : uploadedFiles[0]?.name ?? '可继续补充本地文件或知识库素材'}</p>
                              </div>
                            )}
                            <label className="block">
                              <span className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[#475467]"><span>字数</span>{!homeDraftWordCount.trim() ? <span className="text-[10px] font-medium text-[var(--gov-red)]">待补充</span> : <CheckCircle size={13} className="text-[#49a36d]" />}</span>
                              <div className="relative"><input value={homeDraftWordCount} onChange={(event) => setHomeDraftWordCount(event.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="例如：1500" className="h-10 w-full rounded-[9px] border border-black/[0.08] bg-[#fafafa] px-3 pr-10 text-[13px] outline-none transition focus:border-[var(--gov-red-line)] focus:bg-white focus:ring-2 focus:ring-[var(--gov-red-soft)]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#98a2b3]">字</span></div>
                            </label>
                            <label className="block">
                              <span className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[#475467]"><span>生成要求</span>{!homeDraftRequirement.trim() ? <span className="text-[10px] font-medium text-[var(--gov-red)]">待补充</span> : <CheckCircle size={13} className="text-[#49a36d]" />}</span>
                              <input value={homeDraftRequirement} onChange={(event) => setHomeDraftRequirement(event.target.value)} placeholder="例如：突出责任分工和完成时限" className="h-10 w-full rounded-[9px] border border-black/[0.08] bg-[#fafafa] px-3 text-[13px] outline-none transition focus:border-[var(--gov-red-line)] focus:bg-white focus:ring-2 focus:ring-[var(--gov-red-soft)]" />
                            </label>
                          </div>

                          <div className="mt-4 rounded-[11px] border border-black/[0.06] bg-[#fafafa] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div><p className="text-[12px] font-semibold text-[#475467]">是否添加参考文档？</p><p className="mt-1 text-[11px] text-[#98a2b3]">可同时使用本地文件和知识库材料，也可以确认本次暂不添加。</p></div>
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] border border-black/[0.07] bg-white px-2.5 text-[11px] font-semibold text-[#667085] transition hover:text-[var(--gov-red-deep)]"><FileUp size={13} />本地上传<input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={handleHomeSourceUpload} /></label>
                                <button type="button" onClick={() => openMyCloudDocumentPicker('home')} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-black/[0.07] bg-white px-2.5 text-[11px] font-semibold text-[#667085] transition hover:text-[var(--gov-red-deep)]"><Folder size={13} />知识库选择</button>
                                <button type="button" onClick={() => setWritingReferenceDecision('skip')} className={`inline-flex h-8 items-center rounded-[8px] px-2.5 text-[11px] font-semibold transition ${writingReferenceDecision === 'skip' ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'bg-white text-[#667085] ring-1 ring-black/[0.07] hover:text-[#344054]'}`}>暂不添加</button>
                              </div>
                            </div>
                            {uploadedFiles.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{uploadedFiles.map((file, index) => <span key={file.name} className="inline-flex h-8 items-center gap-2 rounded-[8px] bg-white px-2.5 text-[11px] text-[#667085] ring-1 ring-black/[0.06]"><File size={12} /><span className="max-w-[180px] truncate">{file.name}</span><button type="button" onClick={() => handleClearFile(index)} className="text-[#98a2b3] hover:text-[var(--gov-red)]"><X size={12} /></button></span>)}</div> : null}
                          </div>

                          <div className="mt-5 flex items-center justify-between gap-4 border-t border-black/[0.06] pt-4">
                            <span className="text-[11px] text-[#98a2b3]">{writingPreflightReady ? '参数已完整，可以开始生成' : '请补全待确认项目'}</span>
                            <button type="button" onClick={handleConfirmWritingPreflight} disabled={!writingPreflightReady} className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[var(--gov-red)] px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(190,51,62,0.16)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-[#d1d5db] disabled:shadow-none"><Sparkles size={15} />确认并生成全文</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {qaTurns.map((turn, turnIndex) => {
                    const hasSources = turn.sources.length > 0;
                    const activeVersion = turn.versions[turn.activeVersionIndex] ?? turn.versions[turn.versions.length - 1];
                    const isLastTurn = turnIndex === qaTurns.length - 1;
                    const showVersionHistory = isLastTurn && turn.versions.length > 1;
                    const versionCount = turn.versions.length;
                    const activeVersionLabel = `${Math.min(turn.activeVersionIndex + 1, versionCount)}/${versionCount}`;
                    return (
                      <div key={turn.id} className="space-y-5">
                        <div className="flex justify-end gap-3">
                          <div className="max-w-[78%] rounded-[14px] rounded-tr-[4px] bg-[#f0f1f3] px-4 py-3 text-[14px] leading-6 text-[#30343b]">
                            {turn.prompt}
                          </div>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[12px] font-bold text-[var(--gov-red-deep)]">张</span>
                        </div>

                        <div className="flex items-start gap-3">
                          <img src={DEFAULT_PRODUCT_ICON_URL} alt="金山文澜" className="h-9 w-9 shrink-0 rounded-[10px] border border-black/[0.05] object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#4b5563]">
                              {turn.status === 'processing' ? <Loader2 size={15} className="animate-spin text-[var(--gov-red)]" /> : <CheckCircle size={15} className="text-[#49a36d]" />}
                              <span>{turn.status === 'processing' ? (isWritingConversation ? '写作任务已交给模型，正在起草' : '问题已交给模型，正在处理') : (isWritingConversation ? '已完成任务并生成公文初稿' : '已完成分析并生成回答')}</span>
                            </div>

                            <div className="overflow-hidden rounded-[14px] border border-black/[0.07] bg-white" data-testid="qa-process-panel">
                              <button
                                type="button"
                                onClick={() => setQaProcessExpanded((value) => !value)}
                                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#fafafa]"
                              >
                                <span className="flex min-w-0 items-center gap-2.5">
                                  <Cpu size={16} className="shrink-0 text-[var(--gov-red-deep)]" />
                                  <span>
                                    <span className="block text-[13px] font-semibold text-[#30343b]">{isWritingConversation ? '写作任务处理过程' : '任务处理过程'}</span>
                                    <span className="mt-0.5 block text-[11px] text-[#98a2b3]">{turn.status === 'done' ? '4 个步骤已完成' : `正在执行第 ${Math.min(qaProcessingStep + 1, 4)} 个步骤`}</span>
                                  </span>
                                </span>
                                <ChevronDown size={16} className={`shrink-0 text-[#98a2b3] transition ${qaProcessExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              <AnimatePresence initial={false}>
                                {qaProcessExpanded ? (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-black/[0.06]"
                                  >
                                    <div className="grid gap-0 px-4 py-2 sm:grid-cols-2">
                                      {processSteps.map((step, index) => {
                                        const StepIcon = step.icon;
                                        const complete = turn.status === 'done' || index < qaProcessingStep;
                                        const active = turn.status === 'processing' && index === qaProcessingStep;
                                        return (
                                          <div key={step.title} className="flex min-h-[68px] items-start gap-3 border-b border-black/[0.05] py-3 sm:odd:pr-4 sm:even:border-l sm:even:pl-4">
                                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${complete ? 'bg-[#edf7f1] text-[#3d8b5d]' : active ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'bg-[#f4f5f7] text-[#98a2b3]'}`}>
                                              {complete ? <CheckCircle size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : <StepIcon size={14} />}
                                            </span>
                                            <span className="min-w-0">
                                              <span className="block text-[12px] font-semibold text-[#344054]">{step.title}</span>
                                              <span className="mt-1 block text-[11px] leading-5 text-[#8a8f98]">{step.detail}</span>
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>

                            {turn.status === 'done' ? (
                              <motion.article
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 bg-white px-1 py-2"
                                data-testid="qa-answer"
                              >
                                {hasSources ? (
                                  <button
                                    type="button"
                                    onClick={() => setQaSourcesOpen(true)}
                                    className="mb-4 inline-flex h-8 items-center gap-2 rounded-[8px] bg-[var(--gov-red-soft)] px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[#f9e4e6]"
                                  >
                                    <Layers size={14} />
                                    引用 {turn.sources.length} 份资料作为参考
                                    <ChevronDown size={13} className="-rotate-90" />
                                  </button>
                                ) : null}
                                {isWritingConversation ? (
                                  <div className="max-w-[900px]">
                                    <h2 className="text-center text-[21px] font-bold leading-8 text-[#202124]">{homeDraftTitle.trim() || '关于进一步提升政务办公质效的通知'}</h2>
                                    <p className="mt-5 text-[14px] leading-7 text-[#30343b]">各有关单位：</p>
                                    <p className="mt-2 text-[14px] leading-7 text-[#3f4650]">为进一步提升政务办公规范化、协同化和智能化水平，推动各项工作高效有序开展，现就有关事项通知如下：</p>
                                    <div className="mt-4">
                                      <h3 className="text-[15px] font-semibold text-[#202124]">一、提高认识，明确工作目标</h3>
                                      <p className="mt-2 text-[14px] leading-7 text-[#3f4650]">
                                        各单位要立足职责分工，准确把握任务要求，结合实际细化工作目标、办理标准和完成时限，确保各项部署落实到岗、责任落实到人。
                                        {hasSources ? (
                                          <span className="relative ml-1 inline-flex">
                                            <button type="button" onClick={() => { setQaActiveCitation(turn.id); setQaActiveSource(0); }} className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#fdecee] px-1.5 text-[10px] font-bold text-[var(--gov-red-deep)]" aria-label="查看引用 1">1</button>
                                            {qaActiveCitation === turn.id ? (
                                              <div className="absolute left-0 top-7 z-20 w-[330px] rounded-[12px] border border-black/[0.08] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                                                <div className="flex items-center justify-between gap-3"><span className="truncate text-[12px] font-semibold text-[#344054]">{turn.sources[0]?.name}</span><button type="button" onClick={() => setQaActiveCitation(null)} className="text-[#98a2b3] hover:text-[#344054]" aria-label="关闭引用片段"><X size={14} /></button></div>
                                                <p className="mt-2 text-[11px] leading-5 text-[#667085]">{sourceExcerpt}</p>
                                              </div>
                                            ) : null}
                                          </span>
                                        ) : null}
                                      </p>
                                    </div>
                                    <div className="mt-4"><h3 className="text-[15px] font-semibold text-[#202124]">二、聚焦重点，完善推进机制</h3><p className="mt-2 text-[14px] leading-7 text-[#3f4650]">围绕重点任务建立清单化管理机制，明确牵头部门和配合单位，加强过程协同、节点反馈和质量复核，及时解决办理过程中的堵点难点。</p></div>
                                    <div className="mt-4"><h3 className="text-[15px] font-semibold text-[#202124]">三、压实责任，确保工作实效</h3><p className="mt-2 text-[14px] leading-7 text-[#3f4650]">各单位要强化责任意识，严格执行工作规范，定期总结进展情况。对重要事项实行闭环管理，确保事事有落实、件件有反馈。</p></div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-[14px] leading-7 text-[#30343b]">{activeVersion?.answer}</p>
                                    <div className="mt-4 border-t border-black/[0.06] pt-4">
                                      <h3 className="text-[15px] font-semibold text-[#202124]">一、先明确问题边界与办理目标</h3>
                                      <p className="mt-2 text-[14px] leading-7 text-[#3f4650]">
                                        先确认事项涉及的部门、对象和时间范围，区分需要直接答复、补充材料或转入专项办理的内容。
                                        {hasSources ? <button type="button" onClick={() => { setQaActiveCitation(turn.id); setQaActiveSource(0); setQaSourcesOpen(true); }} className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#fdecee] px-1.5 text-[10px] font-bold text-[var(--gov-red-deep)]" aria-label="查看引用 1">1</button> : null}
                                      </p>
                                    </div>
                                    <div className="mt-4"><h3 className="text-[15px] font-semibold text-[#202124]">二、按优先级组织处理动作</h3><p className="mt-2 text-[14px] leading-7 text-[#3f4650]">建议先处理影响范围大、时效要求高的事项，再同步核验政策依据和历史办理记录；对需要协同的内容明确牵头部门、配合部门和完成时限。</p></div>
                                    <div className="mt-4"><h3 className="text-[15px] font-semibold text-[#202124]">三、形成可复用的答复与跟进机制</h3><p className="mt-2 text-[14px] leading-7 text-[#3f4650]">最终答复应包含结论、依据和下一步动作。涉及持续推进的事项，可以补充阶段节点和反馈方式，方便后续追踪与复盘。</p></div>
                                  </>
                                )}
                                <div className="mt-5 flex items-center gap-1 border-t border-black/[0.06] pt-3">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(activeVersion?.answer ?? '');
                                      setQaCopiedTurn(turn.id);
                                      window.setTimeout(() => setQaCopiedTurn(null), 1200);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#7a808a] transition hover:bg-[#f4f5f7] hover:text-[#30343b]"
                                    title={qaCopiedTurn === turn.id ? '已复制' : '复制回答'}
                                    aria-label="复制回答"
                                  >
                                    {qaCopiedTurn === turn.id ? <CheckCircle size={15} /> : <Copy size={15} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const regeneratedAnswer = buildHomeResult(turn.prompt, homeConversation?.skill ?? '智能问答');
                                      setQaTurns((turns) => turns.map((item, index) => {
                                        if (index !== turns.length - 1) return item;
                                        const nextVersions = [...item.versions, createQaVersion(regeneratedAnswer)].slice(-5);
                                        const nextActiveIndex = nextVersions.length - 1;
                                        return {
                                          ...item,
                                          versions: nextVersions,
                                          activeVersionIndex: nextActiveIndex,
                                          status: 'processing',
                                        };
                                      }));
                                      setQaProcessingStep(0);
                                      setQaRunNonce((value) => value + 1);
                                      setQaProcessExpanded(true);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#7a808a] transition hover:bg-[#f4f5f7] hover:text-[#30343b]"
                                    title="重新生成"
                                    aria-label="重新生成回答"
                                  >
                                    <RotateCcw size={15} />
                                  </button>
                                  {showVersionHistory ? (
                                    <div className="ml-2 inline-flex items-center rounded-[8px] border border-black/[0.06] bg-[#fafafa] px-2 py-1 text-[12px] font-semibold text-[#4b5563]">
                                      <button
                                        type="button"
                                        onClick={() => setQaTurns((turns) => turns.map((item, index) => (
                                          index === turnIndex
                                            ? { ...item, activeVersionIndex: Math.max(0, item.activeVersionIndex - 1) }
                                            : item
                                        )))}
                                        disabled={turn.activeVersionIndex === 0}
                                        className="flex h-5 w-5 items-center justify-center rounded-[6px] text-[#98a2b3] transition hover:bg-white hover:text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="查看上一版"
                                      >
                                        <ChevronDown size={13} className="rotate-90" />
                                      </button>
                                      <span className="min-w-[34px] px-1 text-center">{activeVersionLabel}</span>
                                      <button
                                        type="button"
                                        onClick={() => setQaTurns((turns) => turns.map((item, index) => (
                                          index === turnIndex
                                            ? { ...item, activeVersionIndex: Math.min(item.versions.length - 1, item.activeVersionIndex + 1) }
                                            : item
                                        )))}
                                        disabled={turn.activeVersionIndex >= versionCount - 1}
                                        className="flex h-5 w-5 items-center justify-center rounded-[6px] text-[#98a2b3] transition hover:bg-white hover:text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="查看下一版"
                                      >
                                        <ChevronDown size={13} className="-rotate-90" />
                                      </button>
                                    </div>
                                  ) : null}
                                  {isWritingConversation ? (
                                    <>
                                      <span className="mx-1 h-4 w-px bg-black/[0.08]" />
                                      <button type="button" onClick={handleHomeEdit} className="flex h-9 items-center gap-1.5 rounded-[9px] bg-[var(--gov-red-soft)] px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[var(--gov-red-line)] transition hover:bg-[#f9e4e6]" title="进入编辑器"><FileText size={14} />编辑文稿</button>
                                      <button type="button" onClick={handleHomeDownload} className="flex h-9 items-center gap-1.5 rounded-[9px] bg-[var(--gov-red)] px-3 text-[12px] font-semibold text-white shadow-[0_6px_14px_rgba(190,51,62,0.16)] transition hover:bg-[var(--gov-red-deep)]" title="下载稿件"><Download size={14} />下载文稿</button>
                                    </>
                                  ) : null}
                                </div>
                              </motion.article>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(!isWritingConversation || writingPreflightConfirmed) ? (
              <div className="shrink-0 border-t border-black/[0.06] bg-white/95 px-4 py-3 backdrop-blur" data-testid="qa-composer">
                <div className="mx-auto w-full max-w-[1040px] rounded-[15px] border border-black/[0.09] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
                  <textarea
                    value={qaFollowup}
                    onChange={(event) => setQaFollowup(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') handleQAFollowupSubmit();
                    }}
                    rows={2}
                    placeholder={isWritingConversation ? '继续修改这份稿件，或补充新的写作要求…' : '继续追问，或补充新的要求…'}
                    className="max-h-28 min-h-[48px] w-full resize-none bg-transparent px-2 py-1 text-[14px] leading-6 text-[#202124] outline-none placeholder:text-[#a0a5ad]"
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-black/[0.05] pt-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsHomeUploadMenuOpen((value) => !value)}
                          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#667085] transition hover:bg-[#f4f5f7] hover:text-[#30343b]"
                          title="添加参考文档"
                        >
                          <Plus size={17} />
                        </button>
                        {isHomeUploadMenuOpen ? (
                          <div className="absolute bottom-10 left-0 z-30 w-[190px] rounded-[12px] border border-black/[0.08] bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
                            <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-[9px] px-3 text-[12px] font-semibold text-[#344054] transition hover:bg-[#f7f7f7]">
                              <FileUp size={15} /><span>上传本地文件</span>
                              <input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={(event) => { handleHomeSourceUpload(event); setIsHomeUploadMenuOpen(false); }} />
                            </label>
                            <button type="button" onClick={() => { setIsHomeUploadMenuOpen(false); openMyCloudDocumentPicker('home'); }} className="mt-1 flex h-10 w-full items-center gap-2.5 rounded-[9px] px-3 text-left text-[12px] font-semibold text-[#344054] transition hover:bg-[#f7f7f7]">
                              <Folder size={15} /><span>从知识库选择</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {uploadedFiles.length > 0 ? <span className="truncate text-[11px] text-[#8a8f98]">已添加 {uploadedFiles.length} 份参考文档</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="hidden h-8 items-center gap-1.5 rounded-[8px] px-2 text-[11px] font-semibold text-[#667085] transition hover:bg-[#f4f5f7] sm:inline-flex"><Sparkles size={13} />智选模型<ChevronDown size={12} /></button>
                      <button
                        type="button"
                        onClick={handleQAFollowupSubmit}
                        disabled={!qaFollowup.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gov-red)] text-white transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-[#d1d5db]"
                        aria-label="发送追问"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ) : null}
            </main>

            <AnimatePresence>
              {qaSourcesOpen && allSources.length > 0 ? (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 360, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="hidden shrink-0 overflow-hidden border-l border-black/[0.07] bg-white lg:block"
                  data-testid="qa-sources-drawer"
                >
                  <div className="flex h-full w-[360px] flex-col">
                    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-black/[0.06] px-4">
                      <div className="flex items-center gap-2">
                        <Network size={15} className="text-[var(--gov-red-deep)]" />
                        <span className="text-[13px] font-semibold text-[#202124]">参考素材</span>
                        <span className="text-[11px] text-[#98a2b3]">{allSources.length}</span>
                      </div>
                      <button type="button" onClick={() => setQaSourcesOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#98a2b3] hover:bg-[#f4f5f7] hover:text-[#344054]" aria-label="关闭参考素材"><X size={15} /></button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                      <div className="space-y-2">
                        {allSources.map((source, index) => (
                          <div
                            key={`${getSourceKey(source)}-${index}`}
                            className={`rounded-[10px] border p-3 transition ${qaActiveSource === index ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]' : 'border-black/[0.06] bg-white hover:bg-[#fafafa]'}`}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => setQaActiveSource(index)}
                                className="flex min-w-0 flex-1 items-start gap-2 text-left"
                              >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white text-[var(--gov-red-deep)] shadow-sm">
                                  {source.type === 'folder' ? <Folder size={14} /> : <FileText size={14} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[12px] font-semibold text-[#344054]">{source.name}</span>
                                  <span className="mt-1 block truncate text-[10px] text-[#98a2b3]">
                                    {(source.sourceKind ?? 'local') === 'knowledge' ? '知识库文件' : '本地文件'} · {source.sourceLabel ?? '本地上传'} · {source.size}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveConversationSource(source)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[#98a2b3] transition hover:bg-white hover:text-[var(--gov-red)]"
                                aria-label={`删除参考文件 ${source.name}`}
                                title="删除"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {activeSource ? (
                        <div className="mt-3 rounded-[10px] border border-black/[0.06] bg-[#fafafa] p-3">
                          <p className="text-[11px] font-semibold text-[#475467]">相关片段</p>
                          <p className="mt-2 text-[11px] leading-5 text-[#667085]">{sourceExcerpt}</p>
                          <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-[#98a2b3]">
                            <span className="truncate">{activeSource.sourceLabel ?? ((activeSource.sourceKind ?? 'local') === 'knowledge' ? '知识库' : '本地上传')}</span>
                            <span>{activeSource.type.toUpperCase()} · {activeSource.size}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    }

    const agentSteps = [
      '理解任务需求，识别公文类型、目标对象和输出格式',
      '拆解写作任务，规划结构、材料口径和重点表达',
      '调用公文结构生成、政务表达润色、格式规范检查工具',
      '汇总生成结果，准备进入编辑器或下载到本地'
    ];

    return (
      <motion.div
        key="conversation-detail"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="h-full overflow-y-auto bg-white"
      >
        <section className="mx-auto w-full max-w-[980px] px-8 py-7">
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className="mb-6 inline-flex h-9 items-center gap-2 rounded-[10px] px-2.5 text-[13px] font-semibold text-[#667085] transition hover:bg-[#f5f5f5] hover:text-[#202124]"
          >
            <ArrowLeft size={15} />
            返回首页
          </button>

          <div className="space-y-5">
            <div className="flex justify-end">
              <div className="max-w-[78%] rounded-[18px] bg-[#f6f6f6] px-5 py-4 text-left">
                <p className="text-[12px] font-semibold text-[#8a8f98]">我的需求 · {homeConversation.skill}</p>
                <p className="mt-2 text-[15px] leading-7 text-[#202124]">{homeConversation.prompt}</p>
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]">
                  <Sparkles size={17} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[#202124]">Agent 正在独立处理任务</p>
                  <p className="mt-0.5 text-[12px] text-[#8a8f98]">已完成任务拆解、工具调用和结果汇总</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {agentSteps.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[11px] font-semibold text-[var(--gov-red-deep)]">{index + 1}</span>
                    <div>
                      <p className="text-[14px] leading-6 text-[#202124]">{step}</p>
                      {index === 2 ? (
                        <p className="mt-1 text-[12px] text-[#8a8f98]">已使用：知识库检索、结构生成、语气润色、格式校验</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-[#202124]">生成结果</p>
                  <p className="mt-1 text-[12px] text-[#8a8f98]">可继续进入编辑器，也可以直接下载到本地。</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleHomeEdit}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3 text-[13px] font-semibold text-[#202124] ring-1 ring-black/[0.06] transition hover:bg-[#fafafa]"
                  >
                    <FileText size={15} />
                    去编辑
                  </button>
                  <button
                    type="button"
                    onClick={handleHomeDownload}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[var(--gov-red)] px-3 text-[13px] font-semibold text-white transition hover:bg-[var(--gov-red-deep)]"
                  >
                    <Download size={15} />
                    下载
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line rounded-[14px] bg-white px-4 py-4 text-[14px] leading-7 text-[#30343b] ring-1 ring-black/[0.05]">
                {homeConversation.result}
              </p>
            </div>
          </div>
        </section>
      </motion.div>
    );
  };

  const renderWriteFlow = () => {
    const isSourceMode = HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode);
    const isConclusionMode = selectedWritingMode === '生成结语';
    const isContinueMode = selectedWritingMode === '继续写';
    const isOutlineToArticleMode = selectedWritingMode === '大纲成文';
    const shouldShowWriteTitle = !isConclusionMode && !isContinueMode;
    const shouldShowWriteWordCount = !isConclusionMode;
    const shouldShowDraftingUnit = !isConclusionMode && !isContinueMode;
    const outlineManualReady = isOutlineToArticleMode && outlineInputMode === 'manual' && outlineParseStatus === 'success';
    const outlineStructureReady = isOutlineToArticleMode && outlineParseStatus === 'success' && outlineParseSections.length >= 2;
    const baseWriteFormReady = isConclusionMode
      ? Boolean(writeRequirements.trim())
      : isContinueMode
        ? Boolean(writeRequirements.trim() && writeWordCount.trim())
        : Boolean(writeTopic.trim());
    const writeFormReady = (!isSourceMode || writeSourceReady) && baseWriteFormReady;

    return (
      <div className={writeStep === 'full' ? 'flex min-h-full flex-col' : 'space-y-8'}>
        {/* Step: Writing mode */}
        {writeStep === 'mode' && (
          <motion.div key="mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-[22px] font-bold text-[var(--gov-text)]">选择写作模式</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--gov-text-muted)]">
                先确定本次写作目标，默认使用「生成全文」，下一步填写主题、字数和参考素材。
              </p>
            </div>

            <div className="write-mode-grid">
              {WRITING_MODE_OPTIONS.map((mode, index) => {
                const isSelected = selectedWritingMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSelectedWritingMode(mode.id);
                      setNeedOutline(mode.id === '生成大纲');
                      setOutlineInputMode('ai');
                      resetOutlineParse();
                    }}
                    className={`write-mode-card group ${isSelected ? 'write-mode-card-selected' : ''}`}
                  >
                    <span className={`write-mode-card-visual write-mode-card-visual-${index + 1}`} aria-hidden="true">
                      <span className="write-mode-visual-main">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="write-mode-visual-chip" />
                      <span className="write-mode-visual-dot" />
                      <span className="write-mode-visual-orbit" />
                    </span>
                    <span className="write-mode-icon">
                      <PrototypeIcon name={mode.iconKey} size={38} alt={`${mode.id}图标`} />
                    </span>
                    <span className="write-mode-title">{mode.id}</span>
                    <span className="write-mode-desc">{mode.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <span className="text-[11px] text-[var(--gov-text-muted)]">已选择：{selectedWritingMode}</span>
              <button
                type="button"
                onClick={() => {
                  setWriteTopic('');
                  setWriteStep(HOME_SOURCE_REQUIRED_WRITING_MODES.includes(selectedWritingMode) ? 'source' : 'scenario');
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--gov-red)] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#C5282E]"
              >
                下一步
                <ArrowLeft size={14} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step: Source text upload */}
        {writeStep === 'source' && (
          <motion.div key="source" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="workflow-upload-panel copy-upload-panel">
            <div className="mb-6">
              <h3 className="text-[22px] font-bold text-[var(--gov-text)]">
                {selectedWritingMode === '大纲成文' ? '上传或粘贴已有大纲' : selectedWritingMode === '继续写' ? '上传或粘贴已有正文' : '上传或粘贴待补充正文'}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--gov-text-muted)]">
                {selectedWritingMode === '大纲成文'
                  ? 'AI 将根据已有大纲扩写为完整公文正文，支持本地文件、个人知识库文档或直接粘贴文本。'
                  : selectedWritingMode === '继续写'
                    ? '请先提供需要续写的前文内容，后续再补充生成要求、字数和参考素材。'
                    : '请先提供原文上下文，AI 将只生成结语，不添加参考文件和溯源标记。'}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--gov-red-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--gov-red)]">
                <Sparkles size={12} />
                模式：{selectedWritingMode}
              </span>
            </div>

            {isOutlineToArticleMode && !writeSourceReady ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-black/[0.06] bg-white/85 px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
                <div>
                  <p className="text-[13px] font-bold text-[#243042]">大纲录入方式</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#667085]">选择 AI 识别则上传或粘贴大纲；选择手动填写则直接维护大纲层级。</p>
                </div>
                <div className="inline-flex rounded-[10px] bg-[#f2f4f7] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOutlineInputMode('ai');
                      setWriteSourceFile(null);
                      setSourceOutlineText('');
                      resetOutlineParse();
                    }}
                    className={`h-9 rounded-[8px] px-3 text-[12px] font-semibold transition ${outlineInputMode === 'ai' ? 'bg-white text-[var(--gov-red-deep)] shadow-sm' : 'text-[#667085] hover:text-[#344054]'}`}
                  >
                    AI识别
                  </button>
                  <button
                    type="button"
                    onClick={startManualOutlineEntry}
                    className={`h-9 rounded-[8px] px-3 text-[12px] font-semibold transition ${outlineInputMode === 'manual' ? 'bg-[var(--gov-red)] text-white shadow-[0_8px_18px_rgba(232,71,88,0.16)]' : 'text-[#667085] hover:text-[#344054]'}`}
                  >
                    手动填写
                  </button>
                </div>
              </div>
            ) : null}

            {writeSourceReady ? (
              <div className="flex items-center justify-between rounded-xl border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/60 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--gov-red)] shadow-sm"><FileCheck2 size={18} /></div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-stone-800">{writeSourceFile?.name || '粘贴文本内容'}</p>
                    <p className="mt-1 text-[10px] text-stone-400">{writeSourceFile?.size || `${sourceOutlineText.replace(/\s/g, '').length}字`} · {isOutlineToArticleMode ? '已选择 1 份大纲来源' : '已完成内容解析'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWriteSourceFile(null);
                    setSourceOutlineText('');
                    setOutlineInputMode('ai');
                    resetOutlineParse();
                  }}
                  className="rounded p-2 text-stone-400 hover:bg-white hover:text-stone-600"
                  aria-label="移除待处理文本"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <div className="workflow-upload-grid copy-upload-grid">
                <label className="workflow-upload-option workflow-upload-option-primary copy-upload-option copy-upload-option-primary cursor-pointer">
                  <span className="copy-upload-content">
                    <input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={handleWriteSourceUpload} />
                    <span className="copy-upload-visual copy-upload-visual-local" aria-hidden="true">
                      <span className="copy-upload-screen">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="copy-upload-bubble copy-upload-bubble-left" />
                      <span className="copy-upload-bubble copy-upload-bubble-right" />
                      <span className="workflow-upload-icon copy-upload-icon"><FileUp size={19} /></span>
                    </span>
                    <span className="workflow-upload-title">上传本地文件</span>
                    <span className="workflow-upload-description">选择电脑中的 DOCX、PDF 或 TXT 文件。</span>
                  </span>
                  <span className="workflow-upload-action">点击选择文件</span>
                </label>
                <button type="button" onClick={() => openMyCloudDocumentPicker('write-source')} className="workflow-upload-option copy-upload-option">
                  <span className="copy-upload-content">
                    <span className="copy-upload-visual copy-upload-visual-library" aria-hidden="true">
                      <span className="copy-upload-folder-back" />
                      <span className="copy-upload-folder-front" />
                      <span className="copy-upload-note" />
                      <span className="workflow-upload-icon copy-upload-icon"><Folder size={19} /></span>
                    </span>
                    <span className="workflow-upload-title">从知识库选择</span>
                    <span className="workflow-upload-description">从个人或部门知识库中选择已有文档。</span>
                  </span>
                  <span className="workflow-upload-action">打开知识库</span>
                </button>
                <button type="button" onClick={() => openTextPasteModal('write-source')} className="workflow-upload-option copy-upload-option">
                  <span className="copy-upload-content">
                    <span className="copy-upload-visual copy-upload-visual-text" aria-hidden="true">
                      <span className="copy-upload-paper">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="copy-upload-mark" />
                      <span className="workflow-upload-icon copy-upload-icon"><FileText size={19} /></span>
                    </span>
                    <span className="workflow-upload-title">{isOutlineToArticleMode ? '粘贴文本识别' : '粘贴文本内容'}</span>
                    <span className="workflow-upload-description">{isOutlineToArticleMode ? '粘贴已有大纲文本，由 AI 识别章节层级。' : '直接粘贴已有大纲、正文或段落片段。'}</span>
                  </span>
                  <span className="workflow-upload-action">{isOutlineToArticleMode ? 'AI识别' : '输入文本'}</span>
                </button>
              </div>
            )}

            {writeSourceReady && sourceOutlineText.trim() ? (
              <div className="mt-4 rounded-[14px] border border-black/[0.05] bg-white/70 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="line-clamp-3 text-[13px] leading-6 text-[#596170]">{sourceOutlineText}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {isOutlineToArticleMode && writeSourceReady ? (
              <div className="mt-5 overflow-hidden rounded-[16px] border border-[var(--gov-red-line)]/70 bg-[linear-gradient(135deg,rgba(255,247,247,0.96),rgba(248,251,255,0.96))] shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/70 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[var(--gov-red)] shadow-[0_8px_22px_rgba(190,51,62,0.12)]">
                      {outlineParseStatus === 'processing' || outlineParseStatus === 'idle' ? <Loader2 size={17} className="animate-spin" /> : outlineParseStatus === 'success' ? <Network size={17} /> : <FileSearch size={17} />}
                    </span>
                    <div>
                      <p className="text-[15px] font-bold text-[#202124]">
                        {outlineParseStatus === 'empty' ? '未识别到可用大纲' : outlineParseStatus === 'success' ? '已识别大纲结构' : '正在识别大纲结构'}
                      </p>
                      <p className="mt-1 text-[12px] leading-5 text-[#667085]">
                        {outlineParseStatus === 'success'
                          ? '模型只识别层级关系，不改写原文标题；你可以在确认前手动调整。'
                          : outlineParseStatus === 'empty'
                            ? '当前材料缺少明确章节层级，不能直接进入大纲成文。'
                            : '正在按原文逐行定位一级、二级和三级标题，标题内容保持原样。'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5272ad] ring-1 ring-black/[0.06]"><FileCheck2 size={13} />仅限 1 个来源</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1f3] px-3 py-1.5 text-[11px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[var(--gov-red-line)]"><Sparkles size={13} />原文保真</span>
                  </div>
                </div>

                {outlineParseStatus === 'empty' ? (
                  <div className="p-4">
                    <div className="rounded-[12px] border border-[#f0c9c4] bg-white p-4">
                      <p className="text-[13px] font-bold text-[#9f2d27]">大纲成文需要至少识别出 2 个一级章节标题。</p>
                      <p className="mt-1 text-[12px] leading-5 text-[#8f5b58]">建议检查原文是否包含“一、总体要求”“二、重点任务”等清晰层级；也可以直接手动填写大纲结构后继续成文。</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => { setWriteSourceFile(null); setSourceOutlineText(''); setOutlineInputMode('ai'); resetOutlineParse(); }} className="h-9 rounded-[8px] border border-[#eab6af] bg-white px-3 text-[12px] font-semibold text-[#a1392e]">更换大纲文件</button>
                        <button type="button" onClick={startManualOutlineEntry} className="h-9 rounded-[8px] bg-[var(--gov-red)] px-3 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(232,71,88,0.18)]">手动填写大纲结构</button>
                      </div>
                    </div>
                  </div>
                ) : outlineParseStatus === 'success' ? (
                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[12px] font-medium text-[#667085]">确认后，系统会用下方结构进入“基础信息”填写。</p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[11px] font-semibold text-[#027a48]"><CheckCircle size={13} />{outlineParseSections.length} 个一级章节</span>
                    </div>
                    <div className="space-y-3">
                      {outlineParseSections.map((section, index) => {
                        const sectionTag = section.originalTitle ? (section.title.trim() === section.originalTitle.trim() ? '原文保留' : '已编辑') : '手动新增';
                        return (
                          <div key={section.id} className="rounded-[14px] border border-black/[0.06] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
                            <div className="flex items-center gap-3 border-b border-black/[0.05] px-3 py-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--gov-red)] text-[12px] font-bold text-white">{index + 1}</span>
                              <input value={section.title} onChange={(event) => updateParsedOutlineSection(section.id, event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-[#243042] outline-none" aria-label={`大纲章节 ${index + 1}`} />
                              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${sectionTag === '原文保留' ? 'bg-[#ecfdf3] text-[#027a48]' : sectionTag === '已编辑' ? 'bg-[#fff7e6] text-[#b76e00]' : 'bg-[#eef4ff] text-[#3563a4]'}`}>{sectionTag}</span>
                              <button type="button" disabled={outlineParseSections.length <= 2} onClick={() => removeParsedOutlineSection(section.id)} className="rounded-[7px] px-2 py-1 text-[11px] font-semibold text-[#98a2b3] hover:bg-[#f8f8f8] hover:text-[var(--gov-red)] disabled:cursor-not-allowed disabled:opacity-35">删除</button>
                            </div>
                            <div className="px-3 py-2.5">
                              {section.subsections.length ? (
                                <div className="space-y-2 border-l border-[#dce3ec] pl-3">
                                  {section.subsections.map((subsection, subsectionIndex) => {
                                    const subsectionTag = subsection.originalTitle ? (subsection.title.trim() === subsection.originalTitle.trim() ? '原文保留' : '已编辑') : '手动新增';
                                    return (
                                      <div key={subsection.id} className="rounded-[10px] bg-[#f8fafc] px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[11px] font-bold text-[#98a2b3]">{index + 1}.{subsectionIndex + 1}</span>
                                          <input value={subsection.title} onChange={(event) => updateParsedOutlineSubsection(section.id, subsection.id, event.target.value)} className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#526174] outline-none" aria-label={`第${index + 1}章二级要点 ${subsectionIndex + 1}`} />
                                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${subsectionTag === '原文保留' ? 'bg-white text-[#027a48]' : subsectionTag === '已编辑' ? 'bg-white text-[#b76e00]' : 'bg-white text-[#3563a4]'}`}>{subsectionTag}</span>
                                        </div>
                                        {subsection.subsections?.length ? (
                                          <div className="ml-7 mt-2 space-y-1.5 border-l border-[#e1e7ef] pl-3">
                                            {subsection.subsections.map((thirdLevel, thirdIndex) => {
                                              const thirdTag = thirdLevel.originalTitle ? (thirdLevel.title.trim() === thirdLevel.originalTitle.trim() ? '原文保留' : '已编辑') : '手动新增';
                                              return (
                                                <div key={thirdLevel.id} className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold text-[#a4adba]">{index + 1}.{subsectionIndex + 1}.{thirdIndex + 1}</span>
                                                  <input value={thirdLevel.title} onChange={(event) => updateParsedOutlineThirdLevel(section.id, subsection.id, thirdLevel.id, event.target.value)} className="min-w-0 flex-1 bg-transparent py-0.5 text-[12px] font-medium text-[#667085] outline-none" aria-label={`第${index + 1}章三级要点 ${thirdIndex + 1}`} />
                                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${thirdTag === '原文保留' ? 'bg-white text-[#027a48]' : thirdTag === '已编辑' ? 'bg-white text-[#b76e00]' : 'bg-white text-[#3563a4]'}`}>{thirdTag}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : null}
                                        <button type="button" onClick={() => addParsedOutlineThirdLevel(section.id, subsection.id)} className="ml-7 mt-2 text-[11px] font-semibold text-[#667f9f] hover:text-[var(--gov-red-deep)]">+ 添加三级要点</button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}
                              <button type="button" onClick={() => addParsedOutlineSubsection(section.id)} className="mt-2 text-[11px] font-semibold text-[#667f9f] hover:text-[var(--gov-red-deep)]">+ 添加二级要点</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={addParsedOutlineSection} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-dashed border-[#b8c3d7] bg-white px-3 text-[12px] font-semibold text-[#52657e] hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red-deep)]"><Plus size={14} />添加一级章节</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-5 text-[12px] font-medium text-[#667085]">
                    <Loader2 size={15} className="animate-spin text-[var(--gov-red)]" />
                    正在提取章节层级，请稍候…
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={(!writeSourceReady && !outlineManualReady) || (isOutlineToArticleMode && !outlineStructureReady)}
                onClick={() => {
                  if (isOutlineToArticleMode) setSourceOutlineText(serializeOutline(outlineParseSections));
                  setWriteStep('form');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--gov-red)] px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-[#C5282E] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isOutlineToArticleMode ? '确认大纲结构，填写要求' : '下一步'}
                <ChevronDown size={15} className="-rotate-90" />
              </button>
              <span className="text-[11px] text-[var(--gov-text-muted)]">{isOutlineToArticleMode ? '确认后进入基础信息' : '补充生成要求'}</span>
            </div>
          </motion.div>
        )}

        {/* Step: Manual outline structure */}
        {writeStep === 'outline-parse' && (
          <motion.div key="outline-parse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="workflow-upload-panel copy-upload-panel">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[22px] font-bold text-[var(--gov-text)]">填写大纲结构</h3>
                <p className="mt-2 text-[13px] leading-6 text-[var(--gov-text-muted)]">
                  按一级、二级、三级维护大纲层级，确认后进入基础信息填写并继续生成正文。
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1f3] px-3 py-1.5 text-[11px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[var(--gov-red-line)]">
                <FileCheck2 size={13} />
                手动填写
              </span>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-[var(--gov-red-line)]/70 bg-[linear-gradient(135deg,rgba(255,247,247,0.96),rgba(248,251,255,0.96))] shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/70 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[var(--gov-red)] shadow-[0_8px_22px_rgba(190,51,62,0.12)]">
                    <Network size={17} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#202124]">手动维护大纲层级</p>
                    <p className="mt-1 text-[12px] leading-5 text-[#667085]">至少保留 2 个一级章节，可继续添加二级和三级要点。</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[11px] font-semibold text-[#027a48]">
                  <CheckCircle size={13} />
                  {outlineParseSections.length} 个一级章节
                </span>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {outlineParseSections.map((section, index) => (
                    <div key={section.id} className="rounded-[14px] border border-black/[0.06] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
                      <div className="flex items-center gap-3 border-b border-black/[0.05] px-3 py-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--gov-red)] text-[12px] font-bold text-white">{index + 1}</span>
                        <input value={section.title} onChange={(event) => updateParsedOutlineSection(section.id, event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-[#243042] outline-none" aria-label={`一级大纲 ${index + 1}`} />
                        <span className="shrink-0 rounded-full bg-[#eef4ff] px-2 py-1 text-[10px] font-semibold text-[#3563a4]">手动新增</span>
                        <button type="button" disabled={outlineParseSections.length <= 2} onClick={() => removeParsedOutlineSection(section.id)} className="rounded-[7px] px-2 py-1 text-[11px] font-semibold text-[#98a2b3] hover:bg-[#f8f8f8] hover:text-[var(--gov-red)] disabled:cursor-not-allowed disabled:opacity-35">删除</button>
                      </div>
                      <div className="px-3 py-2.5">
                        {section.subsections.length ? (
                          <div className="space-y-2 border-l border-[#dce3ec] pl-3">
                            {section.subsections.map((subsection, subsectionIndex) => (
                              <div key={subsection.id} className="rounded-[10px] bg-[#f8fafc] px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-[#98a2b3]">{index + 1}.{subsectionIndex + 1}</span>
                                  <input value={subsection.title} onChange={(event) => updateParsedOutlineSubsection(section.id, subsection.id, event.target.value)} className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#526174] outline-none" aria-label={`二级大纲 ${subsectionIndex + 1}`} />
                                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#3563a4]">手动新增</span>
                                </div>
                                {subsection.subsections?.length ? (
                                  <div className="ml-7 mt-2 space-y-1.5 border-l border-[#e1e7ef] pl-3">
                                    {subsection.subsections.map((thirdLevel, thirdIndex) => (
                                      <div key={thirdLevel.id} className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-[#a4adba]">{index + 1}.{subsectionIndex + 1}.{thirdIndex + 1}</span>
                                        <input value={thirdLevel.title} onChange={(event) => updateParsedOutlineThirdLevel(section.id, subsection.id, thirdLevel.id, event.target.value)} className="min-w-0 flex-1 bg-transparent py-0.5 text-[12px] font-medium text-[#667085] outline-none" aria-label={`三级大纲 ${thirdIndex + 1}`} />
                                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#3563a4]">手动新增</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                <button type="button" onClick={() => addParsedOutlineThirdLevel(section.id, subsection.id)} className="ml-7 mt-2 text-[11px] font-semibold text-[#667f9f] hover:text-[var(--gov-red-deep)]">+ 添加三级大纲</button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <button type="button" onClick={() => addParsedOutlineSubsection(section.id)} className="mt-2 text-[11px] font-semibold text-[#667f9f] hover:text-[var(--gov-red-deep)]">+ 添加二级大纲</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addParsedOutlineSection} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-dashed border-[#b8c3d7] bg-white px-3 text-[12px] font-semibold text-[#52657e] hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red-deep)]">
                  <Plus size={14} />
                  添加一级大纲
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={outlineParseSections.length < 2 || outlineParseSections.some((section) => !section.title.trim())}
                onClick={() => {
                  setSourceOutlineText(serializeOutline(outlineParseSections));
                  setWriteStep('form');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--gov-red)] px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-[#C5282E] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                确认大纲结构，填写要求
                <ChevronDown size={15} className="-rotate-90" />
              </button>
              <button type="button" onClick={() => { setOutlineInputMode('ai'); setWriteStep('source'); resetOutlineParse(); }} className="text-[12px] font-semibold text-[#667085] hover:text-[var(--gov-red-deep)]">
                返回 AI 识别
              </button>
            </div>
          </motion.div>
        )}

        {/* Step: Scenario selection */}
        {writeStep === 'scenario' && (
          <motion.div key="scenario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <h3 className="text-[22px] font-bold text-[var(--gov-text)]">选择写作场景</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--gov-text-muted)]">
                选择公文类型后，可进一步选择具体文种，AI 将自动匹配格式规范和行文模板。
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--gov-red-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--gov-red)]">
                <Sparkles size={12} />
                模式：{selectedWritingMode}
              </span>
            </div>

            {(() => {
              const selectedParent = WRITING_CATEGORIES.find((category) =>
                category.id === selectedScenario?.id ||
                Boolean(category.children?.some((child) => child.id === selectedScenario?.id))
              );
              const activeCategoryId = expandedCategory || selectedParent?.id || WRITING_CATEGORIES.find((category) => category.children?.length)?.id || null;
              const activeCategory = WRITING_CATEGORIES.find((category) => category.id === activeCategoryId);
              const categoryRows = WRITING_CATEGORIES.reduce<WritingScenario[][]>((rows, category, index) => {
                if (index % 4 === 0) rows.push([]);
                rows[rows.length - 1].push(category);
                return rows;
              }, []);

              return (
                <div className="space-y-3">
                  {categoryRows.map((row, rowIndex) => {
                    const rowHasActiveCategory = Boolean(activeCategory && row.some((category) => category.id === activeCategory.id));
                    return (
                      <div key={`scenario-row-${rowIndex}`} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {row.map((category) => {
                            const isActive = activeCategory?.id === category.id;
                            const hasChildren = Boolean(category.children?.length);
                            const isSelected =
                              selectedScenario?.id === category.id ||
                              Boolean(category.children?.some((child) => child.id === selectedScenario?.id));
                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                  if (hasChildren) {
                                    setExpandedCategory(category.id);
                                    if (!category.children?.some((child) => child.id === selectedScenario?.id)) {
                                      setSelectedScenario(null);
                                    }
                                  } else {
                                    setSelectedScenario({ ...category, icon: CATEGORY_ICONS[category.title] });
                                    setExpandedCategory(null);
                                  }
                                }}
                                className={`flex h-[64px] items-center justify-between rounded-[8px] border px-4 text-left transition ${
                                  isActive || isSelected
                                    ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[#202124] shadow-[0_6px_14px_rgba(190,51,62,0.06)]'
                                    : 'border-black/[0.05] bg-[#f8f9fb] text-[#30343b] hover:border-black/[0.08] hover:bg-white hover:shadow-[0_6px_14px_rgba(15,23,42,0.04)]'
                                }`}
                              >
                                <span className="truncate text-[14px] font-semibold">{category.title}</span>
                                <span className="ml-3 shrink-0 text-[11px] font-medium text-[#9aa3b2]">{category.children?.length ?? 1}个场景</span>
                              </button>
                            );
                          })}
                        </div>

                        <AnimatePresence mode="wait">
                          {rowHasActiveCategory && activeCategory?.children?.length ? (
                            <motion.div
                              key={activeCategory.id}
                              initial={{ opacity: 0, y: -2 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -2 }}
                              transition={{ duration: 0.14 }}
                              className="rounded-[8px] border border-black/[0.05] bg-[#f8f9fb] p-4"
                            >
                              <p className="mb-3 text-[12px] font-medium text-[#7a808a]">{activeCategory.title}</p>
                              <div className="flex flex-wrap gap-2">
                                {activeCategory.children.map((sub) => {
                                  const Icon = CATEGORY_ICONS[activeCategory.title] || FileText;
                                  const isSelected = selectedScenario?.id === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedScenario({ ...activeCategory, id: sub.id, title: sub.title, suggestedTitle: sub.suggestedTitle, icon: CATEGORY_ICONS[activeCategory.title] });
                                        setExpandedCategory(activeCategory.id);
                                      }}
                                      className={`inline-flex h-10 items-center gap-2 rounded-[6px] border px-3 text-[12px] font-semibold transition ${
                                        isSelected
                                          ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]'
                                          : 'border-black/[0.05] bg-white text-[#3f454d] hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red-deep)]'
                                      }`}
                                    >
                                      <Icon size={14} className={isSelected ? 'text-[var(--gov-red-deep)]' : 'text-[#5d79b8]'} />
                                      {sub.title}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-2">
              <span className="text-[11px] text-[var(--gov-text-muted)]">{selectedScenario ? `已选择：${selectedScenario.title}` : '请先选择写作场景'}</span>
              <button
                type="button"
                disabled={!selectedScenario}
                onClick={() => {
                  if (selectedScenario?.suggestedTitle && !writeTopic.trim()) {
                    setWriteTopic(selectedScenario.suggestedTitle);
                  }
                  setWriteStep('form');
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--gov-red)] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#C5282E] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                下一步
                <ArrowLeft size={14} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step: Form — 基础信息 */}
        {writeStep === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-[22px] font-bold text-[var(--gov-text)]">基础信息</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--gov-text-muted)]">
                {isConclusionMode
                  ? '补充结语生成要求，AI 将根据已有正文生成正式收束段。'
                  : isContinueMode
                    ? '补充续写要求和字数，后续可继续添加参考素材。'
                    : '填写公文标题、写作要求和字数，AI 将根据当前模式继续处理。'}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--gov-red-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--gov-red)]">
                <Sparkles size={12} />
                模式：{selectedWritingMode}
              </span>
            </div>

            <div className="space-y-4 rounded-xl border border-stone-200/60 bg-white p-5">
              {isSourceMode ? (
                <div className="flex items-start justify-between gap-4 rounded-[14px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/35 p-4">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[var(--gov-red-deep)]">已解析待处理文本</div>
                    <p className="mt-1 truncate text-[13px] font-semibold text-[#344054]">{writeSourceFile?.name || '粘贴文本内容'}</p>
                    <p className="mt-1 text-[11px] text-[#8a8f98]">{writeSourceFile?.size || `${sourceOutlineText.replace(/\s/g, '').length}字`}</p>
                  </div>
                  <button type="button" onClick={() => setWriteStep('source')} className="shrink-0 rounded-[8px] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[var(--gov-red-line)] transition hover:bg-[var(--gov-red-soft)]">
                    重新选择
                  </button>
                </div>
              ) : null}

              {shouldShowWriteTitle ? (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[var(--gov-text)]">公文标题</label>
                  <input
                    type="text"
                    value={writeTopic}
                    onChange={(e) => setWriteTopic(e.target.value)}
                    placeholder={isOutlineToArticleMode ? '例如：关于推进年度重点工作的通知' : '例如：关于 XXX 工作的行动方案'}
                    className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] font-bold text-[var(--gov-text)]">写作要求</label>
                  <button
                    type="button"
                    onClick={handleGenerateWritingRequirements}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[var(--gov-red-soft)] px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[var(--gov-red-line)]"
                  >
                    <Sparkles size={13} />
                    AI生成
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={writeRequirements}
                  onChange={(e) => setWriteRequirements(e.target.value)}
                  placeholder="例如：文风严谨，语言简洁凝练，适用于集团内部正式发文。"
                  className="gov-input w-full resize-none rounded-lg px-3 py-3 text-[13px] leading-relaxed"
                />
              </div>

              {shouldShowWriteWordCount || shouldShowDraftingUnit ? (
                <div className="rounded-xl border border-stone-200/70 bg-white p-4">
                  {shouldShowWriteWordCount ? (
                    <div className="grid gap-3 md:grid-cols-[110px_1fr] md:items-center">
                      <label className="text-[13px] font-bold text-[var(--gov-text)]">字数</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={writeWordCount}
                        onChange={(event) => setWriteWordCount(event.target.value)}
                        placeholder="例如：1500"
                        className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                      />
                    </div>
                  ) : null}
                  {shouldShowDraftingUnit ? (
                    <div className={`${shouldShowWriteWordCount ? 'mt-4' : ''} grid gap-3 md:grid-cols-[110px_1fr] md:items-center`}>
                      <label className="text-[13px] font-bold text-[var(--gov-text)]">拟文单位</label>
                      <input
                        type="text"
                        value={writeDraftingUnit}
                        onChange={(event) => setWriteDraftingUnit(event.target.value)}
                        placeholder="客户机构(请修改此名称为客户机构名称)"
                        className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-xl border border-stone-200/70 bg-[#fbfbfc] p-4">
                <div className="grid gap-3 md:grid-cols-[110px_1fr] md:items-center">
                  <div>
                    <p className="text-[13px] font-bold text-[var(--gov-text)]">生成配置</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#98a2b3]">选择模型与推理模式</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DeepThinkingToggle enabled={deepThinkingEnabled} onChange={setDeepThinkingEnabled} />
                    <ModelSelectControl selectedModel={selectedModel} onChange={setSelectedModel} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!writeFormReady}
                onClick={() => {
                  if (isConclusionMode) {
                    handleGenerateConclusion();
                  } else {
                    setWriteStep('style');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--gov-red)] px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-[#C5282E] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isConclusionMode ? '生成结语' : '下一步'}
                {isConclusionMode ? <Sparkles size={15} /> : <ChevronDown size={15} className="-rotate-90" />}
              </button>
              <span className="text-[11px] text-[var(--gov-text-muted)]">{isConclusionMode ? '生成后可编辑结语或重新生成' : '选择参考素材'}</span>
            </div>
          </motion.div>
        )}

        {/* Step: Reference materials */}
        {writeStep === 'style' && (
          <motion.div key="style" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {(() => {
              const activeRoot = KNOWLEDGE_LIBRARY_GROUPS.find((group) => group.id === activeKnowledgeRoot) ?? KNOWLEDGE_LIBRARY_GROUPS[0];
              const activeFolder = activeRoot.folders.find((folder) => folder.id === activeKnowledgeFolder) ?? activeRoot.folders[0];
              const selectedKnowledgeEntries = KNOWLEDGE_LIBRARY_GROUPS.flatMap((group) =>
                group.folders.flatMap((folder) => [
                  { id: folder.id, title: folder.title, type: 'folder', size: `${folder.files.length}个文件`, owner: group.title, updated: '-' },
                  ...folder.files,
                ])
              ).filter((item) => selectedKnowledgeItems.includes(item.id));
              const selectedReferenceCount = uploadedFiles.length + selectedKnowledgeItems.length;
              const returningToFullConfirm = referenceReturnStep === 'full-confirm';

              return (
                <>
                  <div className="write-reference-layout grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 space-y-4">
                      <div className="write-reference-strip rounded-[16px] border border-black/[0.06] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.035)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                            <span className="inline-flex h-8 items-center rounded-full bg-[#f6f7f9] px-3 text-[12px] font-semibold text-[#667085]">本地参考文件</span>
                            {uploadedFiles.length > 0 ? (
                              uploadedFiles.map((file, index) => (
                                <span key={file.name} className="inline-flex h-9 max-w-[260px] items-center gap-2 rounded-full bg-[#f5f7fb] px-3 text-[11px] font-medium text-[#667085]">
                                  <File size={12} />
                                  <span className="truncate">{file.name}</span>
                                  <button type="button" onClick={() => handleClearFile(index)} className="text-[#98a2b3] hover:text-[#d92d20]">
                                    <X size={12} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-[12px] text-[#98a2b3]">还未添加本地素材，可与知识库素材一起参与生成</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleSimulateUpload}
                            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[9px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white transition hover:bg-[var(--gov-red-deep)]"
                          >
                            <FileUp size={15} />
                            添加本地参考文件
                          </button>
                        </div>
                      </div>

                      <div className="write-reference-picker grid min-h-[calc(100vh-287px)] overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.04)] lg:grid-cols-[180px_minmax(0,1fr)]">
                      <aside className="write-reference-sidebar min-w-0 border-r border-black/[0.06] bg-[#f7f8fc] p-3">
                        <div className="relative mb-3">
                          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a6b1]" />
                          <input
                            value={styleSearchQuery}
                            onChange={(event) => setStyleSearchQuery(event.target.value)}
                            placeholder="搜索知识库"
                            className="h-9 w-full rounded-[9px] border border-black/[0.06] bg-white pl-9 pr-3 text-[12px] outline-none focus:border-[var(--gov-red-line)]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          {KNOWLEDGE_LIBRARY_GROUPS.map((group) => {
                            const selected = activeKnowledgeRoot === group.id;
                            return (
                              <div key={group.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKnowledgeRoot(group.id);
                                    setActiveKnowledgeFolder(group.folders[0].id);
                                  }}
                                  className={`flex w-full items-center justify-between gap-2 rounded-[11px] px-3 py-2.5 text-left transition ${
                                    selected ? 'bg-white text-[var(--gov-red-deep)] shadow-sm ring-1 ring-[var(--gov-red-line)]' : 'text-[#475467] hover:bg-white hover:shadow-sm'
                                  }`}
                                >
                                  <span className="flex min-w-0 items-center gap-2.5">
                                    {renderReferenceFolderIcon('tree')}
                                    <span className="min-w-0">
                                    <span className="block text-[13px] font-semibold">{group.title}</span>
                                    <span className="mt-0.5 block text-[10px] text-[#9aa3b2]">{group.desc}</span>
                                    </span>
                                  </span>
                                  <ChevronDown size={13} className={`shrink-0 ${selected ? 'rotate-180' : '-rotate-90'}`} />
                                </button>
                                {selected ? (
                                  <div className="mt-1.5 space-y-1 pl-3">
                                    {group.folders.map((folder) => (
                                      <button
                                        key={folder.id}
                                        type="button"
                                        onClick={() => setActiveKnowledgeFolder(folder.id)}
                                        className={`flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[12px] transition ${
                                          activeKnowledgeFolder === folder.id ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'text-[#667085] hover:bg-white'
                                        }`}
                                      >
                                        {renderReferenceFolderIcon('tree')}
                                        <span className="truncate">{folder.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </aside>

                      <main className="write-reference-main min-w-0 overflow-hidden p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-[17px] font-semibold text-[#202124]">{activeFolder.title}</h4>
                            <p className="mt-1 text-[12px] text-[#8a8f98]">{activeRoot.title} / {activeFolder.files.length} 个文件</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedKnowledgeItems((prev) =>
                                prev.includes(activeFolder.id) ? prev.filter((id) => id !== activeFolder.id) : [...prev, activeFolder.id]
                              )
                            }
                            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-semibold transition ${
                              selectedKnowledgeItems.includes(activeFolder.id)
                                ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]'
                                : 'bg-[#f4f5f7] text-[#667085] hover:bg-[#eef0f4]'
                            }`}
                          >
                            {renderReferenceFolderIcon('tree')}
                            {selectedKnowledgeItems.includes(activeFolder.id) ? '已选文件夹' : '选择文件夹'}
                          </button>
                        </div>

                        <div className="relative mb-3">
                          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a6b1]" />
                          <input
                            value={styleSearchQuery}
                            onChange={(event) => setStyleSearchQuery(event.target.value)}
                            placeholder="搜索当前文件夹内的文件"
                            className="h-10 w-full rounded-[11px] border border-black/[0.06] bg-[#fafafa] pl-9 pr-3 text-[12px] outline-none transition focus:border-[var(--gov-red-line)] focus:bg-white"
                          />
                        </div>

                        <div className="write-reference-table min-w-0 overflow-hidden rounded-[14px] border border-black/[0.06]">
                          <div className="grid grid-cols-[minmax(0,1fr)_64px_76px_76px] gap-2 bg-[#fafafa] px-3.5 py-2.5 text-[11px] font-semibold text-[#8a8f98]">
                            <span>文件/文件夹目录</span>
                            <span>大小</span>
                            <span>上传者</span>
                            <span>更新时间</span>
                          </div>
                          <div className="divide-y divide-black/[0.05]">
                            {activeFolder.files
                              .filter((file) => !styleSearchQuery.trim() || file.title.includes(styleSearchQuery))
                              .map((file) => {
                                const selected = selectedKnowledgeItems.includes(file.id);
                                return (
                                  <button
                                    key={file.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedKnowledgeItems((prev) =>
                                        selected ? prev.filter((id) => id !== file.id) : [...prev, file.id]
                                      )
                                    }
                                    className={`grid w-full grid-cols-[minmax(0,1fr)_64px_76px_76px] items-center gap-2 px-3.5 py-3 text-left text-[12px] transition ${
                                      selected ? 'bg-[var(--gov-red-soft)]/70 text-[var(--gov-red-deep)]' : 'bg-white text-[#344054] hover:bg-[#fafafa]'
                                    }`}
                                  >
                                    <span className="flex min-w-0 items-center gap-2.5 font-semibold">
                                      {renderReferenceFileIcon(file.type)}
                                      <span className="truncate">{file.title}</span>
                                    </span>
                                    <span className="truncate text-[#8a8f98]">{file.size}</span>
                                    <span className="truncate text-[#8a8f98]">{file.owner}</span>
                                    <span className="truncate text-[#8a8f98]">{file.updated}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </main>

                      </div>
                    </div>

                    <aside className="write-reference-selected flex max-h-[calc(100vh-190px)] min-h-[calc(100vh-212px)] flex-col self-start rounded-[18px] border border-black/[0.06] bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.04)] xl:sticky xl:top-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[15px] font-semibold text-[#202124]">已选素材</span>
                            <p className="mt-1 text-[11px] leading-5 text-[#98a2b3]">汇总本地上传与知识库选择</p>
                            <p className="mt-1 text-[11px] leading-5 text-[#b35b62]">支持 doc、docx、pdf 文档格式，最多 6 个文档（单个 20M 以内）</p>
                          </div>
                          <span className="inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full bg-[var(--gov-red-soft)] px-3 text-[11px] font-semibold text-[var(--gov-red-deep)]">{selectedReferenceCount} 项</span>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                          {uploadedFiles.map((file, index) => (
                            <div key={file.name} className="flex items-start justify-between gap-2 rounded-[12px] border border-black/[0.06] bg-[#fafafa] p-3">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-[#344054]">{file.name}</p>
                                <p className="mt-1 text-[10px] text-[#98a2b3]">本地文件 · {file.size}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleClearFile(index)}
                                className="shrink-0 text-[#98a2b3] hover:text-[#d92d20]"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          {selectedKnowledgeEntries.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-2 rounded-[12px] border border-black/[0.06] bg-[#fafafa] p-3">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-[#344054]">{item.title}</p>
                                <p className="mt-1 text-[10px] text-[#98a2b3]">知识库 · {item.type} · {item.size}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedKnowledgeItems((prev) => prev.filter((id) => id !== item.id))}
                                className="shrink-0 text-[#98a2b3] hover:text-[#d92d20]"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          {selectedReferenceCount === 0 ? (
                            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[14px] border border-dashed border-black/[0.08] bg-[#fafafa] text-center">
                              {renderReferenceFolderIcon('empty')}
                              <p className="mt-2 text-[12px] font-medium text-[#8a8f98]">尚未选择素材</p>
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-3 shrink-0 border-t border-black/[0.06] pt-3">
                          {selectedReferenceCount > 0 ? (
                            <p className="mb-3 rounded-lg bg-[var(--gov-red-soft)] px-3 py-2 text-[12px] font-medium text-[var(--gov-red-deep)]">
                              已选择 <span className="font-semibold">{selectedReferenceCount}</span> 项参考素材
                              {selectedWritingMode === '生成大纲' ? '，点击「生成大纲」开始' : '，点击「生成全文」开始'}
                            </p>
                          ) : null}
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                if (returningToFullConfirm) {
                                  setReferenceReturnStep(null);
                                  setWriteStep('full-confirm');
                                } else if (selectedWritingMode === '生成大纲') {
                                  handleGenerateOutline();
                                } else {
                                  handleGenerateFullText();
                                }
                              }}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--gov-red)] px-5 text-[12px] font-semibold text-white transition hover:bg-[#C5282E] disabled:cursor-not-allowed disabled:bg-neutral-300"
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              {isProcessing
                                ? (selectedWritingMode === '生成大纲' ? '正在生成大纲...' : '正在生成全文...')
                                : returningToFullConfirm
                                  ? '确认素材，返回生成确认'
                                  : (selectedWritingMode === '生成大纲' ? '确认，生成大纲' : '确认，生成全文')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (returningToFullConfirm) {
                                  setReferenceReturnStep(null);
                                  setWriteStep('full-confirm');
                                } else {
                                  setWriteStep('form');
                                }
                              }}
                              className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[12px] font-semibold text-[#667085] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red-deep)]"
                            >
                              {returningToFullConfirm ? '返回生成确认' : '返回修改要求'}
                            </button>
                          </div>
                        </div>
                    </aside>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* Step: Outline */}
        {writeStep === 'outline' && (
          <motion.div key="outline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-[22px] font-bold text-[var(--gov-text)]">AI 生成大纲</h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--gov-text-muted)]">
                基于「<span className="font-semibold text-[var(--gov-text)]">{writeTopic}</span>」生成结构化大纲，可编辑各章节标题和内容
              </p>
            </div>

            {isProcessing ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center space-y-3 rounded-xl border border-dashed border-[rgba(35,31,32,0.1)] bg-white">
                <Loader2 size={22} className="animate-spin text-[var(--gov-red)]" />
                <p className="text-[13px] font-medium text-[var(--gov-text-muted)]">正在分析主题并生成结构化大纲...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {generatedOutline.map((section, index) => (
                    <div
                      key={section.id}
                      className="group overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-sm transition hover:border-stone-300"
                    >
                      {/* Section header */}
                      <div className="flex items-center gap-3 px-5 py-3.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--gov-red)] text-[11px] font-bold text-white">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            const updated = [...generatedOutline];
                            updated[index] = { ...updated[index], title: e.target.value };
                            setGeneratedOutline(updated);
                          }}
                          className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[var(--gov-text)] outline-none placeholder:text-stone-300"
                          placeholder="输入一级标题"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSub: OutlineSubSection = {
                              id: `s${Date.now()}`,
                              title: '',
                              content: '',
                            };
                            const updated = [...generatedOutline];
                            updated[index] = { ...updated[index], subsections: [...updated[index].subsections, newSub] };
                            setGeneratedOutline(updated);
                          }}
                          className="rounded-md p-1.5 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-500 group-hover:opacity-100"
                          title="添加二级标题"
                        >
                          <FilePlus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGeneratedOutline((prev) => prev.filter((s) => s.id !== section.id));
                          }}
                          className="rounded-md p-1.5 text-stone-300 opacity-0 transition hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                          title="删除章节"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Subsections */}
                      {section.subsections.length > 0 && (
                        <div className="border-t border-stone-100 px-5 py-3 space-y-2.5">
                          {section.subsections.map((sub, subIdx) => (
                            <div key={sub.id} className="group/sub flex items-center gap-2.5 pl-4 border-l-2 border-stone-100">
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-100 text-[10px] font-bold text-stone-400">
                                {subIdx + 1}
                              </div>
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) => {
                                  const updated = [...generatedOutline];
                                  const subs = [...updated[index].subsections];
                                  subs[subIdx] = { ...subs[subIdx], title: e.target.value };
                                  updated[index] = { ...updated[index], subsections: subs };
                                  setGeneratedOutline(updated);
                                }}
                                className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[var(--gov-text)] outline-none placeholder:text-stone-300"
                                placeholder="二级标题"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...generatedOutline];
                                  updated[index] = {
                                    ...updated[index],
                                    subsections: updated[index].subsections.filter((s) => s.id !== sub.id),
                                  };
                                  setGeneratedOutline(updated);
                                }}
                                className="shrink-0 rounded p-1 text-stone-300 opacity-0 transition hover:bg-red-50 hover:text-red-400 group-hover/sub:opacity-100"
                                title="删除"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newSection: OutlineSection = {
                        id: `s${Date.now()}`,
                        title: '',
                        content: '',
                        subsections: [],
                      };
                      setGeneratedOutline((prev) => [...prev, newSection]);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 py-3.5 text-[13px] font-medium text-stone-400 transition hover:border-stone-400 hover:text-stone-600"
                  >
                    <FilePlus size={14} />
                    添加章节
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateOutline}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)] disabled:cursor-not-allowed disabled:text-stone-300"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    {isProcessing ? '正在重新生成...' : '重新生成'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWriteStep('outline')}
                    className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"
                  >
                    <PenTool size={14} />
                    编辑大纲
                  </button>
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-3.5 text-[13px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[#f9e4e6]">
                    <input
                      type="checkbox"
                      checked={writeAutoFormat}
                      onChange={(event) => setWriteAutoFormat(event.target.checked)}
                      className="h-4 w-4 accent-[var(--gov-red)]"
                    />
                    自动排版
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertOutline}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#202124] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black"
                  >
                    <FileText size={14} />
                    插入大纲
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueFullTextFromOutline}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--gov-red)] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#C5282E]"
                  >
                    <Sparkles size={14} />
                    生成全文
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Step: Full text confirmation */}
        {writeStep === 'full-confirm' && (
          (() => {
            const selectedKnowledgeEntries = KNOWLEDGE_LIBRARY_GROUPS.flatMap((group) =>
              group.folders.flatMap((folder) => [
                { id: folder.id, title: folder.title, type: 'folder', size: `${folder.files.length}个文件`, owner: group.title, updated: '-' },
                ...folder.files,
              ])
            ).filter((item) => selectedKnowledgeItems.includes(item.id));
            const selectedReferenceCount = uploadedFiles.length + selectedKnowledgeEntries.length;
            const outlinePreview = generatedOutline.length > 0
              ? generatedOutline.slice(0, 4)
              : [
                { id: 'empty-1', title: '一、工作背景', content: '', subsections: [] },
                { id: 'empty-2', title: '二、重点任务', content: '', subsections: [] },
                { id: 'empty-3', title: '三、保障措施', content: '', subsections: [] },
              ];

            return (
              <motion.div key="full-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[22px] font-bold text-[var(--gov-text)]">确认生成全文</h3>
                    <p className="mt-2 text-[13px] leading-6 text-[var(--gov-text-muted)]">
                      已完成大纲生成，请确认标题、写作要求和参考素材；需要调整大纲时可返回上一环节继续编辑。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWriteStep('outline')}
                    className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-black/[0.08] bg-white px-4 text-[13px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"
                  >
                    <ArrowLeft size={14} />
                    返回编辑大纲
                  </button>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <section className="space-y-5 rounded-[18px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.04)]">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2 lg:col-span-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[13px] font-bold text-[var(--gov-text)]">公文标题</label>
                          <span className="rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[10px] font-semibold text-[#8a8f98]">已带入基础信息</span>
                        </div>
                        <input
                          type="text"
                          value={writeTopic}
                          onChange={(event) => setWriteTopic(event.target.value)}
                          placeholder="请输入公文标题"
                          className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[var(--gov-text)]">字数</label>
                        <input
                          type="number"
                          min="100"
                          step="100"
                          value={writeWordCount}
                          onChange={(event) => setWriteWordCount(event.target.value)}
                          placeholder="例如：1500"
                          className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[var(--gov-text)]">拟文单位</label>
                        <input
                          type="text"
                          value={writeDraftingUnit}
                          onChange={(event) => setWriteDraftingUnit(event.target.value)}
                          placeholder="客户机构(请修改此名称为客户机构名称)"
                          className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[13px] font-bold text-[var(--gov-text)]">生成要求</label>
                            <span className="rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[10px] font-semibold text-[#8a8f98]">已带入基础信息</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleGenerateWritingRequirements}
                            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[var(--gov-red-soft)] px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[var(--gov-red-line)]"
                          >
                            <Sparkles size={13} />
                            AI生成
                          </button>
                        </div>
                        <textarea
                          rows={5}
                          value={writeRequirements}
                          onChange={(event) => setWriteRequirements(event.target.value)}
                          placeholder="补充正文生成要求，例如文风、结构重点、篇幅控制、引用素材方式等。"
                          className="gov-input w-full resize-none rounded-lg px-3 py-3 text-[13px] leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-stone-200/70 bg-[#fbfbfc] p-4">
                      <div className="grid gap-3 md:grid-cols-[110px_1fr] md:items-center">
                        <div>
                          <p className="text-[13px] font-bold text-[var(--gov-text)]">生成配置</p>
                          <p className="mt-1 text-[11px] leading-4 text-[#98a2b3]">确认模型与推理模式</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <DeepThinkingToggle enabled={deepThinkingEnabled} onChange={setDeepThinkingEnabled} />
                          <ModelSelectControl selectedModel={selectedModel} onChange={setSelectedModel} />
                          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-[var(--gov-red-line)] bg-white px-3 text-[12px] font-semibold text-[var(--gov-red-deep)]">
                            <input type="checkbox" checked={writeAutoFormat} onChange={(event) => setWriteAutoFormat(event.target.checked)} className="h-4 w-4 accent-[var(--gov-red)]" />
                            自动排版
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setReferenceReturnStep('full-confirm');
                          setWriteStep('style');
                        }}
                        className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-black/[0.08] bg-white px-4 text-[13px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"
                      >
                        <Folder size={15} />
                        继续调整参考素材
                      </button>
                      <button
                        type="button"
                        disabled={!writeTopic.trim() || isProcessing}
                        onClick={handleGenerateFullText}
                        className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-[var(--gov-red)] px-6 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(196,41,53,0.2)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        {isProcessing ? '正在生成全文...' : '确认生成全文'}
                      </button>
                    </div>
                  </section>

                  <aside className="space-y-4">
                    <section className="rounded-[18px] border border-black/[0.06] bg-white p-4 shadow-[0_18px_46px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-[16px] font-bold text-[#202124]">已选参考素材</h4>
                          <p className="mt-1 text-[11px] text-[#98a2b3]">将作为生成全文的引用依据</p>
                        </div>
                        <span className="inline-flex h-7 items-center rounded-full bg-[var(--gov-red-soft)] px-3 text-[11px] font-semibold text-[var(--gov-red-deep)]">{selectedReferenceCount} 项</span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={handleSimulateUpload}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[9px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[#f9e4e6]"
                        >
                          <FileUp size={14} />
                          补充本地素材
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReferenceReturnStep('full-confirm');
                            setWriteStep('style');
                          }}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[9px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"
                        >
                          <Folder size={14} />
                          从知识库补充
                        </button>
                      </div>
                      <div className="mt-4 max-h-[260px] space-y-2 overflow-y-auto pr-1">
                        {uploadedFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-start justify-between gap-2 rounded-[12px] border border-black/[0.06] bg-[#fafafa] p-3">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-[#344054]">{file.name}</p>
                              <p className="mt-1 text-[10px] text-[#98a2b3]">本地文件 · {file.size}</p>
                            </div>
                            <button type="button" onClick={() => handleClearFile(index)} className="shrink-0 text-[#98a2b3] hover:text-[#d92d20]">
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                        {selectedKnowledgeEntries.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-2 rounded-[12px] border border-black/[0.06] bg-[#fafafa] p-3">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-[#344054]">{item.title}</p>
                              <p className="mt-1 text-[10px] text-[#98a2b3]">知识库 · {item.type === 'folder' ? '文件夹' : item.type.toUpperCase()} · {item.size}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedKnowledgeItems((prev) => prev.filter((id) => id !== item.id))} className="shrink-0 text-[#98a2b3] hover:text-[#d92d20]">
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                        {selectedReferenceCount === 0 ? (
                          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-[14px] border border-dashed border-black/[0.08] bg-[#fafafa] text-center">
                            {renderReferenceFolderIcon('empty')}
                            <p className="mt-2 text-[12px] font-medium text-[#8a8f98]">尚未选择素材</p>
                          </div>
                        ) : null}
                      </div>
                    </section>

                    <section className="rounded-[18px] border border-black/[0.06] bg-white p-4 shadow-[0_18px_46px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-[16px] font-bold text-[#202124]">当前大纲</h4>
                          <p className="mt-1 text-[11px] text-[#98a2b3]">确认后将按该结构展开正文</p>
                        </div>
                        <button type="button" onClick={() => setWriteStep('outline')} className="text-[12px] font-semibold text-[var(--gov-red)] hover:text-[var(--gov-red-deep)]">编辑</button>
                      </div>
                      <div className="mt-4 space-y-2">
                        {outlinePreview.map((section, index) => (
                          <div key={section.id} className="rounded-[12px] border border-black/[0.05] bg-[#fbfbfc] p-3">
                            <p className="flex items-center gap-2 text-[13px] font-bold text-[#344054]">
                              <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[var(--gov-red)] text-[10px] text-white">{index + 1}</span>
                              <span className="min-w-0 truncate">{section.title}</span>
                            </p>
                            {section.subsections?.length ? (
                              <div className="mt-2 space-y-1 pl-7 text-[11px] font-medium text-[#667085]">
                                {section.subsections.slice(0, 3).map((sub) => (
                                  <p key={sub.id} className="truncate">{sub.title}</p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </section>
                  </aside>
                </div>
              </motion.div>
            );
          })()
        )}

        {/* Step: Full text */}
        {writeStep === 'full' && (
          (() => {
            const isConclusionResult = selectedWritingMode === '生成结语';
            const hasFullTextHistory = fullTextVersions.length > 0;
            const activeFullText = fullTextVersions[activeFullTextVersionIndex] ?? generatedFullText;
            const knowledgeEntries = KNOWLEDGE_LIBRARY_GROUPS.flatMap((group) => group.folders.flatMap((folder) => [
              { id: folder.id, title: folder.title, source: group.title, type: '文件夹', date: '知识库' },
              ...folder.files.map((file) => ({ id: file.id, title: file.title, source: `${group.title}/${folder.title}`, type: file.type.toUpperCase(), date: file.updated })),
            ])).filter((item) => selectedKnowledgeItems.includes(item.id));
            const sourceCards = [
              ...uploadedFiles.map((file) => ({ title: file.name, source: '本地上传', type: file.type.toUpperCase(), date: file.size })),
              ...knowledgeEntries,
            ];
            const visibleSources = isConclusionResult ? [] : sourceCards.length > 0 ? sourceCards : [
              { title: `${writeTopic || '北京市政府工作方案'}参考材料`, source: '个人知识库', type: 'DOC', date: '2026-07-21' },
              { title: '公文写作规范与表达口径', source: '资源素材库', type: 'PDF', date: '2026-06-18' },
              { title: '历史讲话稿与通知模板', source: '部门知识库', type: 'DOC', date: '2026-05-12' },
            ];
            const sourceCount = visibleSources.length;
            const articleText = generatedFullText || `尊敬的各位领导、各位来宾、企业家朋友们：

大家上午好！

今天，我们怀着无比喜悦的心情，在这里隆重举行园区开园仪式。值此喜庆时刻，我谨代表园区运营团队，向百忙中莅临现场的各位领导、各位来宾、各位入驻企业和配套服务企业负责人，表示最热烈的欢迎和最衷心的感谢！

在园区的规划设计及施工建设过程中，我们得到了各级政府以及有关部门和社会各界朋友的大力支持和帮助。园区得以在如此短的时间内顺利开园，离不开各级组织的指导和帮助，离不开各职能部门的支持配合，也离不开建设单位、服务单位和入驻企业的共同努力。

园区作为一座集研发、生产、生活于一体的现代化产业园区，充分体现了“科技与人文共生”的设计理念。园区总建筑面积达22万平方米，定位为“三平台两中心”，即大科学装置预研平台、新型研发机构集聚平台、科技共享服务平台、公共配套服务中心和科技展示交流中心。

特别值得一提的是，我们借鉴了先进园区的经验，在园区内推行“入驻即插电”的创新服务模式。新入驻企业不再需要由园区整体办理用电报装业务，而是可以单独向供电公司申请报装，并独立核算电量电费。

未来，我们将继续以客户为中心，以高质量发展为导向，完善公共服务体系，优化企业服务流程，努力把园区建设成为高效协同、开放共享、富有活力的产业创新平台。`;
            const articleParagraphs = articleText.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
            const thoughtSteps = [
              '识别写作任务：领导致辞，场景为园区开园仪式，表达基调应庄重、热情、务实。',
              '提取参考素材：围绕园区定位、建筑规模、服务模式和产业方向抽取可引用事实。',
              '搭建正文结构：开场致意、建设背景、园区亮点、服务承诺、未来展望。',
              '统一公文语气：压缩口语化表达，保留正式场合讲话稿的节奏与感染力。',
            ];
            const citationSnippet = (source: typeof visibleSources[number], index: number) => `摘自《${source.title}》：该素材提供了园区建设背景、关键数据、政策口径与表述风格参考，已用于正文第 ${index + 1} 处事实依据校验。`;

            return (
              <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fbfaf9]">
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-6">
                  <button
                    type="button"
                    onClick={() => setWriteStep(isConclusionResult ? 'form' : needOutline ? 'full-confirm' : 'style')}
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#667085] transition hover:text-[#202124]"
                  >
                    <ArrowLeft size={16} />
                    返回上一步
                    <span className="text-[#c0c6d0]">/</span>
                  </button>
                  <div className="flex items-center gap-3">
                    {!isConclusionResult ? (
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]">
                        <input type="checkbox" checked={writeAutoFormat} onChange={(event) => setWriteAutoFormat(event.target.checked)} className="h-4 w-4 accent-[var(--gov-red)]" />
                        自动排版
                      </label>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsFullTextInserted(true)}
                      disabled={isProcessing}
                      className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--gov-red)] px-4 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(196,41,53,0.16)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      <FileText size={15} />
                      {isConclusionResult ? '编辑结语' : '编辑文稿'}
                    </button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6 transition-[width] duration-300 xl:px-8">
                  <div className="w-full">
                      <div className="space-y-3">
                        {!isConclusionResult ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowSourceTrace((value) => !value);
                              setActiveCitation(null);
                            }}
                            className="flex h-12 w-full items-center justify-between rounded-[6px] bg-[#fff3f1] px-4 text-left text-[13px] font-semibold text-[#344054] transition hover:bg-[#ffebe8]"
                          >
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle size={15} className="text-[var(--gov-red)]" />
                              已参考 <span className="text-[var(--gov-red-deep)]">{sourceCount}</span> 篇文章
                            </span>
                            <ChevronDown size={15} className={showSourceTrace ? 'rotate-180 text-[#98a2b3]' : '-rotate-90 text-[#98a2b3]'} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setShowThoughtTrace((value) => !value)}
                          className="flex h-12 w-full items-center justify-between rounded-[6px] bg-[#fff3f1] px-4 text-left text-[13px] font-semibold text-[#344054] transition hover:bg-[#ffebe8]"
                        >
                          <span className="inline-flex items-center gap-2">
                            {isProcessing ? <Loader2 size={15} className="animate-spin text-[var(--gov-red)]" /> : <CheckCircle size={15} className="text-[var(--gov-red)]" />}
                            {isProcessing ? '正在构思正文...' : '已构思（7s）'}
                          </span>
                          <ChevronDown size={15} className={showThoughtTrace ? 'rotate-180 text-[#98a2b3]' : '-rotate-90 text-[#98a2b3]'} />
                        </button>
                      </div>

                      {showThoughtTrace ? (
                        <div className="mt-3 rounded-[12px] border border-[#f2d5d1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(117,27,33,0.05)]">
                          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--gov-red-deep)]">
                            <Sparkles size={14} />
                            模型构思链
                          </div>
                          <div className="grid gap-2 md:grid-cols-4">
                            {thoughtSteps.map((step, index) => (
                              <div key={step} className="rounded-[10px] bg-[#fff8f6] p-3 text-[12px] leading-5 text-[#596170]">
                                <span className="mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[var(--gov-red)] shadow-sm">{index + 1}</span>
                                <p>{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <article className="relative mt-6 min-h-[calc(100vh-260px)] w-full rounded-[10px] bg-white px-8 py-8 text-[#111827] shadow-[0_18px_50px_rgba(15,23,42,0.04)] xl:px-12">
                        <div className="mx-auto w-full max-w-[1440px]">
                          <h1 className="mb-7 text-[30px] font-extrabold leading-[1.35] tracking-normal text-[#111827]">
                            {isConclusionResult ? '生成结语' : writeTopic || '关于北京市政府工作方案'}
                          </h1>
                          {hasFullTextHistory ? (
                            <div className="mb-6 flex justify-center">
                              <div className="inline-flex items-center rounded-[10px] border border-[#d9e0ea] bg-white px-2 py-1 text-[12px] font-semibold text-[#4b5563] shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                                <button
                                  type="button"
                                  onClick={() => setActiveFullTextVersionIndex((value) => Math.max(0, value - 1))}
                                  disabled={activeFullTextVersionIndex === 0}
                                  className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#98a2b3] transition hover:bg-[#f4f5f7] hover:text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="查看上一版全文"
                                >
                                  <ChevronDown size={13} className="rotate-90" />
                                </button>
                                <span className="min-w-[42px] px-1 text-center">{Math.min(activeFullTextVersionIndex + 1, fullTextVersions.length)}/{fullTextVersions.length}</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveFullTextVersionIndex((value) => Math.min(fullTextVersions.length - 1, value + 1))}
                                  disabled={activeFullTextVersionIndex >= fullTextVersions.length - 1}
                                  className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[#98a2b3] transition hover:bg-[#f4f5f7] hover:text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="查看下一版全文"
                                >
                                  <ChevronDown size={13} className="-rotate-90" />
                                </button>
                              </div>
                            </div>
                          ) : null}
                          <div className="space-y-4 text-[16px] font-medium leading-8 text-[#202124]">
                            {(activeFullText || articleText).split(/\n+/).map((paragraph, paragraphIndex) => {
                              const citationIndex = paragraphIndex % Math.max(sourceCount, 1);
                              const hasCitation = !isConclusionResult && paragraphIndex > 1 && visibleSources[citationIndex];
                              const source = visibleSources[citationIndex];

                              return (
                                <p key={`${paragraph.slice(0, 16)}-${paragraphIndex}`} className="relative">
                                  {paragraph}
                                  {hasCitation ? (
                                    <span className="relative ml-1 inline-flex align-baseline">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setActiveCitation(activeCitation === paragraphIndex ? null : paragraphIndex);
                                        }}
                                        className="inline-flex h-5 min-w-5 translate-y-[-1px] items-center justify-center rounded-full border border-[#b8ccff] bg-[#eef4ff] px-1.5 text-[10px] font-bold leading-none text-[#4f6fe8] transition hover:border-[var(--gov-red)] hover:bg-[#fff0ed] hover:text-[var(--gov-red)]"
                                        title="查看参考片段"
                                      >
                                        “{citationIndex + 1}”
                                      </button>
                                      {activeCitation === paragraphIndex ? (
                                        <div className="absolute left-1/2 top-7 z-30 w-[360px] -translate-x-1/2 rounded-[14px] border border-black/[0.08] bg-white p-4 text-left shadow-[0_20px_54px_rgba(15,23,42,0.16)]">
                                          <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0ed] px-2 py-1 text-[11px] font-semibold text-[var(--gov-red)]">
                                              <FileSearch size={12} />
                                              参考片段 {citationIndex + 1}
                                            </span>
                                            <button type="button" onClick={() => setActiveCitation(null)} className="rounded p-1 text-[#98a2b3] transition hover:bg-stone-100 hover:text-[#344054]">
                                              <X size={13} />
                                            </button>
                                          </div>
                                          <p className="line-clamp-2 text-[13px] font-bold leading-5 text-[#202124]">{source.title}</p>
                                          <p className="mt-2 text-[12px] font-normal leading-6 text-[#667085]">{citationSnippet(source, citationIndex)}</p>
                                          <div className="mt-3 flex items-center justify-between text-[11px] text-[#98a2b3]">
                                            <span>{source.source}</span>
                                            <span>{source.date}</span>
                                          </div>
                                        </div>
                                      ) : null}
                                    </span>
                                  ) : null}
                                </p>
                              );
                            })}
                            {isProcessing ? <span className="ml-1 inline-block h-5 w-1 animate-pulse rounded bg-[var(--gov-red)] align-middle" /> : null}
                          </div>
                        </div>
                      </article>

                      <div className="sticky bottom-6 mt-10 flex justify-center">
                        <button
                          type="button"
                          onClick={handleRegenerateCurrentFullText}
                          disabled={isProcessing}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gov-red)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_32px_rgba(196,41,53,0.22)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                          {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                          {isProcessing ? '正在生成' : isConclusionResult ? '重新生成结语' : '重新生成'}
                        </button>
                      </div>
                  </div>
                </main>

                <AnimatePresence>
                  {showSourceTrace && !isConclusionResult ? (
                    <motion.aside
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 400, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}
                      className="relative z-10 shrink-0 overflow-hidden border-l border-black/[0.06] bg-[#fff8f6] shadow-[-16px_0_40px_rgba(15,23,42,0.06)]"
                    >
                      <div className="h-full w-[400px] overflow-y-auto px-4 py-5">
                        <div className="sticky top-0 z-10 -mx-4 -mt-5 mb-4 flex items-center justify-between border-b border-black/[0.06] bg-[#fff8f6]/95 px-4 py-4 backdrop-blur">
                          <div>
                            <h3 className="text-[16px] font-bold text-[#202124]">参考来源</h3>
                            <p className="mt-1 text-[11px] text-[#98a2b3]">共 {sourceCount} 篇，点击正文引用标记查看片段</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSourceTrace(false)}
                            className="rounded-[8px] p-2 text-[#98a2b3] transition hover:bg-white hover:text-[#344054]"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {visibleSources.map((source, index) => (
                            <div key={`${source.title}-${index}`} className="rounded-[14px] border border-black/[0.08] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#4f6fe8]">{index + 1}</span>
                                <span className="text-[11px] font-semibold text-[#98a2b3]">参考自{source.source}</span>
                              </div>
                              <span className="mb-2 inline-flex h-5 items-center rounded-[5px] bg-[var(--gov-red)] px-2 text-[10px] font-semibold text-white">参考内容</span>
                              <p className="line-clamp-2 text-[13px] font-bold leading-5 text-[#202124]">{source.title}</p>
                              <p className="mt-2 line-clamp-5 text-[12px] leading-5 text-[#8a8f98]">
                                {citationSnippet(source, index)}
                              </p>
                              <div className="mt-3 flex items-center justify-between text-[11px] text-[#98a2b3]">
                                <span>{source.date}</span>
                                <span className="rounded bg-[#f4f5f7] px-1.5 py-0.5 text-[10px] font-bold text-[#667085]">{source.type}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.aside>
                  ) : null}
                </AnimatePresence>
                </div>
              </motion.div>
            );
          })()
        )}
      </div>
    );
  };

  const renderPptWorkspace = () => (
    <motion.div
      key="ppt"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex h-full flex-col overflow-hidden bg-[#f2f2f2] text-[#202124]"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-black/[0.08] bg-white px-4">
        <div className="flex items-center gap-3">
          <Home size={16} className="text-[#555]" />
          <Plus size={18} className="text-[#555]" />
          <span className="text-[15px] font-semibold">演示文稿(2)</span>
          <ChevronDown size={14} className="text-[#777]" />
        </div>
        <div className="flex items-center gap-7 text-[14px] font-semibold">
          {['开始', '插入', '审阅', '视图', '播放', '效率'].map((item, index) => (
            <span key={item} className={index === 0 ? 'text-[#ea580c]' : 'text-[#202124]'}>{item}</span>
          ))}
          <span className="text-[#1f6fff]">WPS AI</span>
        </div>
        <button type="button" className="rounded-[8px] bg-[#f97316] px-4 py-1.5 text-[13px] font-semibold text-white">分享</button>
      </div>
      <div className="flex h-12 shrink-0 items-center gap-5 border-b border-black/[0.08] bg-white/90 px-8 text-[#c3c7ce] shadow-sm">
        <span>撤销</span><span>播放</span><span>字体</span><span>字号</span><span>加粗</span><span>对齐</span><span>图片</span><span>形状</span><span>搜索</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[250px_1fr_72px]">
        <aside className="border-r border-black/[0.08] bg-[#f6f6f6] p-4">
          <div className="flex items-start gap-2">
            <span className="pt-1 text-[13px] font-semibold text-[#ea580c]">1</span>
            <div className="h-[96px] flex-1 rounded-[4px] border-2 border-[#ea580c] bg-white shadow-sm" />
          </div>
          <button type="button" className="mt-[55vh] flex w-full justify-center text-[26px] text-[#333]">+</button>
          <p className="mt-5 text-[13px] text-[#777]">幻灯片 1/1</p>
        </aside>
        <main className="relative flex items-center justify-center overflow-hidden bg-[#eeeeee] p-8">
          <div className="relative aspect-[16/9] w-[78%] bg-white shadow-[0_6px_22px_rgba(15,23,42,0.16)]">
            <div className="absolute left-[12%] right-[12%] top-[34%] border border-dashed border-[#d6d6d6] py-7 text-center text-[42px] font-bold">单击此处添加标题</div>
            <div className="absolute left-[12%] right-[12%] top-[52%] border border-dashed border-[#d6d6d6] py-5 text-center text-[24px] font-bold">单击此处添加副标题</div>
          </div>
          <div className="absolute left-1/2 top-[70px] w-[560px] -translate-x-1/2 rounded-[16px] border border-black/[0.08] bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,0.16)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[16px] font-bold">
                <Sparkles size={18} className="text-[#7c3aed]" />
                AI 生成PPT
              </div>
              <X size={18} className="text-[#777]" />
            </div>
            <div className="mt-4 grid grid-cols-3 rounded-[8px] bg-[#f1f1f1] p-1 text-center text-[13px] font-semibold">
              <span className="rounded-[7px] bg-white py-2 shadow-sm">输入内容</span>
              <span className="py-2">上传文件</span>
              <span className="py-2">粘贴大纲</span>
            </div>
            <div className="mt-4 rounded-[10px] border border-[#d9dce2] bg-white p-4">
              <textarea className="h-[112px] w-full resize-none text-[14px] outline-none placeholder:text-[#a2a8b3]" placeholder="输入幻灯片主题，智能生成大纲，例如“人工智能的发展”" />
              <div className="text-right text-[13px] text-[#777]">0/1500</div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="rounded-[8px] border border-black/[0.08] px-3 py-2 text-[13px] font-semibold">智能布局模式</button>
                <button className="rounded-[8px] border border-black/[0.08] px-3 py-2 text-[13px] font-semibold">深度思考</button>
              </div>
              <button className="rounded-[8px] bg-[#cdb4ff] px-5 py-2 text-[13px] font-semibold text-white">开始生成</button>
            </div>
          </div>
        </main>
        <aside className="border-l border-black/[0.08] bg-[#f6f6f6] p-3">
          {['格式', '动画', '评论'].map((item) => (
            <div key={item} className="mb-3 rounded-[10px] bg-white py-3 text-center text-[12px] font-semibold text-[#a0a6b1] shadow-sm">{item}</div>
          ))}
        </aside>
      </div>
    </motion.div>
  );

  const renderTableWorkspace = () => (
    <motion.div
      key="table"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mx-auto flex h-full w-full max-w-[980px] flex-col justify-center"
    >
      <div className="rounded-[22px] border border-black/[0.08] bg-white p-7 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="mb-6">
          <h3 className="text-[22px] font-semibold text-[#202124]">智能表格</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#7a808a]">上传文档后，系统会识别正文、表格和关键数据，并生成可编辑的结构化表格。</p>
        </div>
        <UploadHint title="上传文档" desc="支持 Word、PDF、Excel 等材料，先上传后提取表格数据" onClick={handleSimulateUpload} />
        {uploadedFiles.length > 0 ? (
          <div className="mt-5 space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={file.name} className="flex items-center justify-between rounded-[14px] border border-black/[0.06] bg-[#fafafa] px-4 py-3">
                <div className="flex items-center gap-3">
                  <File size={16} className="text-[var(--gov-red-deep)]" />
                  <span className="text-[13px] font-semibold text-[#202124]">{file.name}</span>
                  <span className="text-[12px] text-[#8a8f98]">{file.size}</span>
                </div>
                <button type="button" onClick={() => handleClearFile(index)} className="text-[#98a2b3] hover:text-[#d92d20]">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          disabled={uploadedFiles.length === 0}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-[12px] bg-[var(--gov-red)] px-5 text-[13px] font-semibold text-white transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-[#d1d5db]"
        >
          <Sparkles size={15} />
          生成智能表格
        </button>
      </div>
    </motion.div>
  );

  const renderWorkspaceForm = () => {
    if (currentView === 'copy') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-stone-700">仿写主题</label>
            <input
              type="text"
              value={imitateTopic}
              onChange={(event) => setImitateTopic(event.target.value)}
              placeholder="例如：关于 XXX 工作的通知 / 请示 / 纪要"
              className="gov-input w-full px-3 py-2.5 text-[12px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-stone-700">仿写要求</label>
            <textarea
              rows={4}
              value={referenceMaterial}
              onChange={(event) => setReferenceMaterial(event.target.value)}
              placeholder="例如：保持原文结构一致，语气正式统一，适配集团办公室常用发文口径。"
              className="gov-input w-full resize-none px-3 py-2.5 text-[12px] leading-relaxed"
            />
          </div>

          <div className="grid gap-3.5 xl:grid-cols-2">
            <UploadHint title="参考文档" desc="上传参考材料，辅助识别主题和背景" onClick={handleSimulateUpload} />
            <UploadHint title="仿写文档" desc="上传 1 份仿写样稿，提取结构和语气特征" onClick={handleSimulateUpload} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center py-12 text-[12px] text-stone-400">
        请从首页选择一项写作工具开始
      </div>
    );
  };

  const renderWriteWorkspace = () => {
    const isFullEditor = writeStep === 'full' && isFullTextInserted;
    const hasGeneratedFullText = Boolean(generatedFullText);
    const visibleWriteSteps = WRITE_STEP_META
      .filter((step) => {
        if (step.id === 'source') return isSourceBasedWritingMode;
        if (step.id === 'scenario') return !isSourceBasedWritingMode;
        if (step.id === 'style') return !isConclusionWritingMode;
        if (step.id === 'outline') return needOutline;
        if (step.id === 'full-confirm') return needOutline;
        return true;
      })
      .map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      }));
    const currentWriteStepId = writeStep === 'outline' && !needOutline ? 'full' : writeStep;
    const stepIndex = visibleWriteSteps.findIndex((step) => step.id === currentWriteStepId);

    if (isFullEditor) {
      return (
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex h-full flex-col"
        >
          {/* Thin web-office toolbar — Feishu/WPS style */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-neutral-50/50 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWriteStep(isConclusionWritingMode ? 'form' : needOutline ? 'full-confirm' : 'style')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-neutral-200/60 hover:text-stone-600"
                aria-label={isConclusionWritingMode ? '返回基础信息' : needOutline ? '返回生成确认' : '返回参考素材'}
              >
                <ArrowLeft size={14} />
              </button>
              <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
              <span className="text-[11px] text-[var(--gov-text-muted)]">页面格式: 信创标准A4公文</span>
              <span className="text-[10px] text-stone-300">|</span>
              <span className="text-[11px] text-[var(--gov-text-muted)]">{selectedScenario?.title ?? '公文'}</span>
              {writeAutoFormat && !isConclusionWritingMode ? (
                <>
                  <span className="text-[10px] text-stone-300">|</span>
                  <span className="inline-flex h-6 items-center rounded-full bg-[var(--gov-red-soft)] px-2 text-[11px] font-semibold text-[var(--gov-red-deep)]">
                    自动排版已启用
                  </span>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-2 text-[10px] text-stone-400">{generatedFullText.replace(/\s/g, '').length} 字</span>
              <button
                type="button"
                onClick={handleRegenerateCurrentFullText}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-[var(--gov-text-muted)] transition hover:bg-neutral-200/60 hover:text-[var(--gov-text)] disabled:cursor-not-allowed disabled:text-stone-300"
              >
                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {isProcessing ? (hasGeneratedFullText ? '正在重新生成...' : isConclusionWritingMode ? '正在生成结语...' : '正在生成全文...') : '重新生成'}
              </button>
              {onSaveToDocumentCenter && (
                <button
                  type="button"
                  onClick={() => {
                    if (savedToCenter || !hasGeneratedFullText) return;
                    onSaveToDocumentCenter({
                      id: `writing-${Date.now()}`,
                      title: `关于开展"${writeTopic}"工作的通知`,
                      lastModified: new Date().toISOString().replace('T', ' ').slice(0, 16),
                      author: '张三',
                      type: 'recent',
                      category: '公文',
                      content: generatedFullText,
                    });
                    setSavedToCenter(true);
                  }}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition ${
                    savedToCenter
                      ? 'text-emerald-600 cursor-default'
                      : !hasGeneratedFullText
                        ? 'cursor-not-allowed text-stone-300'
                      : 'text-[var(--gov-text-muted)] hover:bg-neutral-200/60 hover:text-[var(--gov-text)]'
                  }`}
                >
                  <Save size={12} />
                  {savedToCenter ? '已保存至文档中心' : '保存至文档中心'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCopy(generatedFullText)}
                disabled={!hasGeneratedFullText}
                className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-[var(--gov-text-muted)] transition hover:bg-neutral-200/60 hover:text-[var(--gov-text)] disabled:cursor-not-allowed disabled:text-stone-300"
              >
                <Copy size={12} />
                {copied ? '已复制' : '复制全文'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetWriteFlow();
                  setCurrentView('write');
                }}
                className="rounded px-2.5 py-1 text-[11px] text-[var(--gov-text-muted)] transition hover:bg-neutral-200/60 hover:text-[var(--gov-text)]"
              >
                新建文档
              </button>
            </div>
          </div>

          {hasGeneratedFullText ? (
            <WebOfficeEditor
              value={generatedFullText}
              onChange={setGeneratedFullText}
              documentTitle={isConclusionWritingMode ? '生成结语' : `关于开展”${writeTopic}”工作的通知`}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-neutral-100/50">
              <Loader2 size={28} className="animate-spin text-[var(--gov-red)]" />
              <p className="text-[13px] font-medium text-[var(--gov-text-muted)]">正在生成全文...</p>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="flex h-full flex-col"
      >
        {/* Thin top bar */}
        <div className="flex h-14 shrink-0 items-center overflow-hidden border-b border-[rgba(35,31,32,0.08)] bg-neutral-50/50 px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={handleWriteBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-neutral-200/60 hover:text-stone-600"
              aria-label={writeStep === 'mode' ? '返回首页' : '返回上一步'}
            >
              <ArrowLeft size={15} />
            </button>
            <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
            <span className="text-[15px] font-semibold text-[var(--gov-text)]">
              {currentTaskMeta?.title ?? '快速创作'}
            </span>
            <span className="text-[10px] text-stone-300">|</span>
            <div className="flex min-w-0 flex-1 items-center overflow-x-auto py-1">
              {visibleWriteSteps.map((step, index) => {
                const isCompleted = index < stepIndex;
                const isActive = index === stepIndex;
                return (
                  <div key={step.id} className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (index < stepIndex) setWriteStep(step.id);
                      }}
                      className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10.5px] font-medium transition-all ${
                        isCompleted
                          ? 'cursor-pointer bg-[var(--gov-red-soft)] text-[var(--gov-red)] hover:bg-[var(--gov-red)] hover:text-white'
                          : isActive
                            ? 'bg-[var(--gov-red)] text-white shadow-sm'
                            : 'text-stone-400'
                      }`}
                    >
                      {isCompleted ? (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span>{step.stepNumber}</span>
                      )}
                      <span>{step.label}</span>
                    </button>
                    {index < visibleWriteSteps.length - 1 ? (
                      <div className={`mx-1 h-px w-5 rounded-full xl:w-7 ${index < stepIndex ? 'bg-[var(--gov-red)]' : 'bg-stone-200'}`} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex min-h-0 flex-1 overflow-y-auto bg-neutral-100/50">
          <div className={`mx-auto flex w-full flex-col ${writeStep === 'full' ? 'max-w-none p-0' : `px-8 py-7 ${writeStep === 'style' ? 'max-w-[1680px]' : 'max-w-[1320px]'}`}`}>
            {renderWriteFlow()}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCopyWorkspace = () => {
    const stepNumber = copyStep === 'upload' ? 1 : copyStep === 'extract' ? 2 : copyStep === 'requirements' ? 3 : copyStep === 'materials' ? 4 : 5;
    const copyActiveRoot = KNOWLEDGE_LIBRARY_GROUPS.find((group) => group.id === activeKnowledgeRoot) ?? KNOWLEDGE_LIBRARY_GROUPS[0];
    const copyActiveFolder = copyActiveRoot.folders.find((folder) => folder.id === activeKnowledgeFolder) ?? copyActiveRoot.folders[0];
    const selectedCopyKnowledgeEntries = KNOWLEDGE_LIBRARY_GROUPS.flatMap((group) => group.folders.flatMap((folder) => [
      { id: folder.id, title: folder.title, meta: `${group.title} · 文件夹`, type: 'folder' },
      ...folder.files.map((file) => ({ id: file.id, title: file.title, meta: `${group.title} · ${file.size}`, type: file.type })),
    ])).filter((item) => selectedKnowledgeItems.includes(item.id));

    if (copyStep === 'result' && copyResultText) {
      const knowledgeEntries = KNOWLEDGE_LIBRARY_GROUPS.flatMap((group) => group.folders.flatMap((folder) => [
        { id: folder.id, title: folder.title, source: group.title, type: '文件夹', date: '知识库' },
        ...folder.files.map((file) => ({ id: file.id, title: file.title, source: `${group.title}/${folder.title}`, type: file.type.toUpperCase(), date: file.updated })),
      ])).filter((item) => selectedKnowledgeItems.includes(item.id));
      const visibleSources = [
        { title: copySourceFile?.name || '仿写样稿', source: '仿写样稿', type: copySourceFile?.type.toUpperCase() || 'DOC', date: copySourceFile?.size || '已解析' },
        ...uploadedFiles.map((file) => ({ title: file.name, source: '本地上传', type: file.type.toUpperCase(), date: file.size })),
        ...knowledgeEntries,
      ];
      const articleParagraphs = copyResultText.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
      const thoughtSteps = [
        '解析仿写样稿：识别标题组织、段落层次、句式节奏与正式程度。',
        `理解仿写要求：锁定写作主题、${copyWordCount.trim() || '1500'} 字左右、拟文单位与重点表达。`,
        '融合参考素材：提取政策口径、事实材料和可引用的关键依据。',
        '生成并校验：完成正文仿写、来源标注与公文规范检查。',
      ];
      const citationSnippet = (source: typeof visibleSources[number], index: number) => `摘自《${source.title}》：该材料提供了行文结构、政策口径或事实依据，已用于正文第 ${index + 1} 处内容生成与校验。`;

      return (
        <motion.div key="copy-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fbfaf9]">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-6">
            <button type="button" onClick={() => setCopyStep('materials')} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#667085] transition hover:text-[#202124]" aria-label="返回参考素材">
              <ArrowLeft size={16} />
              返回参考素材
              <span className="text-[#c0c6d0]">/</span>
              <span className="font-medium text-[#98a2b3]">AI 仿写</span>
            </button>
            <div className="flex items-center gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-3.5 text-[13px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[#f9e4e6]">
                <input
                  type="checkbox"
                  checked={copyAutoFormat}
                  onChange={(event) => setCopyAutoFormat(event.target.checked)}
                  className="h-4 w-4 accent-[var(--gov-red)]"
                />
                自动排版
              </label>
              <button
                type="button"
                onClick={() => {
                  setRecentDocumentTitle(imitateTopic || '以稿写稿文稿');
                  setRecentDocumentContent(copyResultText);
                  openView('recent-editor');
                }}
                disabled={isProcessing}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--gov-red)] px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(196,41,53,0.18)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                <FileText size={15} />
                编辑文稿
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6 transition-[width] duration-300 xl:px-8">
              <div className="w-full">
                <div className="space-y-3">
                  <button type="button" onClick={() => { setShowSourceTrace((value) => !value); setActiveCitation(null); }} className="flex h-12 w-full items-center justify-between rounded-[6px] bg-[#fff3f1] px-4 text-left text-[13px] font-semibold text-[#344054] transition hover:bg-[#ffebe8]">
                    <span className="inline-flex items-center gap-2"><CheckCircle size={15} className="text-[var(--gov-red)]" />已参考 <span className="text-[var(--gov-red-deep)]">{visibleSources.length}</span> 篇材料</span>
                    <ChevronDown size={15} className={showSourceTrace ? 'rotate-180 text-[#98a2b3]' : '-rotate-90 text-[#98a2b3]'} />
                  </button>
                  <button type="button" onClick={() => setShowThoughtTrace((value) => !value)} className="flex h-12 w-full items-center justify-between rounded-[6px] bg-[#fff3f1] px-4 text-left text-[13px] font-semibold text-[#344054] transition hover:bg-[#ffebe8]">
                    <span className="inline-flex items-center gap-2">{isProcessing ? <Loader2 size={15} className="animate-spin text-[var(--gov-red)]" /> : <CheckCircle size={15} className="text-[var(--gov-red)]" />}{isProcessing ? '正在生成仿写文档...' : '任务处理完成（7s）'}</span>
                    <ChevronDown size={15} className={showThoughtTrace ? 'rotate-180 text-[#98a2b3]' : '-rotate-90 text-[#98a2b3]'} />
                  </button>
                </div>

                {showThoughtTrace ? (
                  <div className="mt-3 rounded-[12px] border border-[#f2d5d1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(117,27,33,0.05)]">
                    <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--gov-red-deep)]"><Sparkles size={14} />任务处理摘要</div>
                    <div className="grid gap-2 md:grid-cols-4">
                      {thoughtSteps.map((step, index) => <div key={step} className="rounded-[10px] bg-[#fff8f6] p-3 text-[12px] leading-5 text-[#596170]"><span className="mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[var(--gov-red)] shadow-sm">{index + 1}</span><p>{step}</p></div>)}
                    </div>
                  </div>
                ) : null}

                <article className="relative mt-6 min-h-[calc(100vh-260px)] w-full rounded-[10px] bg-white px-8 py-8 text-[#111827] shadow-[0_18px_50px_rgba(15,23,42,0.04)] xl:px-12">
                  <div className="mx-auto w-full max-w-[1440px]">
                    <h1 className="mb-7 text-[30px] font-extrabold leading-[1.35] tracking-normal text-[#111827]">{imitateTopic || '以稿写稿文稿'}</h1>
                    <div className="space-y-4 text-[16px] font-medium leading-8 text-[#202124]">
                      {articleParagraphs.map((paragraph, paragraphIndex) => {
                        const citationIndex = paragraphIndex % visibleSources.length;
                        const hasCitation = paragraphIndex > 1 && visibleSources[citationIndex];
                        const source = visibleSources[citationIndex];
                        return (
                          <p key={`${paragraph.slice(0, 16)}-${paragraphIndex}`} className="relative">
                            {paragraph}
                            {hasCitation ? <span className="relative ml-1 inline-flex align-baseline">
                              <button type="button" onClick={(event) => { event.stopPropagation(); setActiveCitation(activeCitation === paragraphIndex ? null : paragraphIndex); }} className="inline-flex h-5 min-w-5 translate-y-[-1px] items-center justify-center rounded-full border border-[#b8ccff] bg-[#eef4ff] px-1.5 text-[10px] font-bold leading-none text-[#4f6fe8] transition hover:border-[var(--gov-red)] hover:bg-[#fff0ed] hover:text-[var(--gov-red)]" title="查看参考片段">“{citationIndex + 1}”</button>
                              {activeCitation === paragraphIndex ? <div className="absolute left-1/2 top-7 z-30 w-[360px] -translate-x-1/2 rounded-[14px] border border-black/[0.08] bg-white p-4 text-left shadow-[0_20px_54px_rgba(15,23,42,0.16)]">
                                <div className="mb-2 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0ed] px-2 py-1 text-[11px] font-semibold text-[var(--gov-red)]"><FileSearch size={12} />参考片段 {citationIndex + 1}</span><button type="button" onClick={() => setActiveCitation(null)} className="rounded p-1 text-[#98a2b3] hover:bg-stone-100 hover:text-[#344054]"><X size={13} /></button></div>
                                <p className="line-clamp-2 text-[13px] font-bold leading-5 text-[#202124]">{source.title}</p><p className="mt-2 text-[12px] font-normal leading-6 text-[#667085]">{citationSnippet(source, citationIndex)}</p><div className="mt-3 flex items-center justify-between text-[11px] text-[#98a2b3]"><span>{source.source}</span><span>{source.date}</span></div>
                              </div> : null}
                            </span> : null}
                          </p>
                        );
                      })}
                      {isProcessing ? <span className="ml-1 inline-block h-5 w-1 animate-pulse rounded bg-[var(--gov-red)] align-middle" /> : null}
                    </div>
                  </div>
                </article>

                <div className="sticky bottom-6 mt-10 flex justify-center">
                  <button type="button" onClick={handleRunImitate} disabled={isProcessing} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--gov-red)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_32px_rgba(196,41,53,0.22)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300">{isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{isProcessing ? '正在生成' : '重新生成'}</button>
                </div>
              </div>
            </main>

            <AnimatePresence>
              {showSourceTrace ? <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }} className="relative z-10 shrink-0 overflow-hidden border-l border-black/[0.06] bg-[#fff8f6] shadow-[-16px_0_40px_rgba(15,23,42,0.06)]">
                <div className="h-full w-[400px] overflow-y-auto px-4 py-5">
                  <div className="sticky top-0 z-10 -mx-4 -mt-5 mb-4 flex items-center justify-between border-b border-black/[0.06] bg-[#fff8f6]/95 px-4 py-4 backdrop-blur"><div><h3 className="text-[16px] font-bold text-[#202124]">参考来源</h3><p className="mt-1 text-[11px] text-[#98a2b3]">共 {visibleSources.length} 篇，点击正文引用标记查看片段</p></div><button type="button" onClick={() => setShowSourceTrace(false)} className="rounded-[8px] p-2 text-[#98a2b3] hover:bg-white hover:text-[#344054]"><X size={16} /></button></div>
                  <div className="space-y-4">{visibleSources.map((source, index) => <div key={`${source.title}-${index}`} className="rounded-[14px] border border-black/[0.08] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)]"><div className="mb-2 flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#4f6fe8]">{index + 1}</span><span className="text-[11px] font-semibold text-[#98a2b3]">参考自{source.source}</span></div><span className="mb-2 inline-flex h-5 items-center rounded-[5px] bg-[var(--gov-red)] px-2 text-[10px] font-semibold text-white">参考内容</span><p className="line-clamp-2 text-[13px] font-bold leading-5 text-[#202124]">{source.title}</p><p className="mt-2 line-clamp-5 text-[12px] leading-5 text-[#8a8f98]">{citationSnippet(source, index)}</p><div className="mt-3 flex items-center justify-between text-[11px] text-[#98a2b3]"><span>{source.date}</span><span className="rounded bg-[#f4f5f7] px-1.5 py-0.5 text-[10px] font-bold text-[#667085]">{source.type}</span></div></div>)}</div>
                </div>
              </motion.aside> : null}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div key={`copy-${copyStep}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => copyStep === 'upload' ? openView('home') : copyStep === 'extract' ? setCopyStep('upload') : copyStep === 'requirements' ? setCopyStep('extract') : setCopyStep('requirements')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:bg-neutral-200/60 hover:text-stone-600"
              aria-label="返回上一步"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
            <span className="text-[14px] font-bold text-[var(--gov-text)]">AI 仿写</span>
            <span className="text-[10px] text-stone-300">|</span>
            <span className="text-[13px] text-[var(--gov-text-muted)]">参考既有文稿，复用结构、语气和行文组织</span>
          </div>
          <span className="text-[12px] text-[var(--gov-text-muted)]">步骤 {stepNumber}/5</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-100/50 px-5 py-8">
          <div className={`mx-auto w-full ${copyStep === 'materials' ? 'max-w-[1540px]' : 'max-w-[1180px]'}`}>
            <div className="mb-7 flex items-center justify-center gap-2">
              {['上传仿写样稿', '文稿结构提取', '填写仿写要求', '添加参考素材', '生成仿写文档'].map((label, index) => (
                <React.Fragment key={label}>
                  {index > 0 ? <div className={`h-px w-12 ${stepNumber > index ? 'bg-[var(--gov-red)]' : 'bg-stone-200'}`} /> : null}
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${stepNumber >= index + 1 ? 'bg-[var(--gov-red)] text-white' : 'bg-stone-200 text-stone-500'}`}>{index + 1}</span>
                    <span className={`hidden text-[13px] sm:inline ${stepNumber === index + 1 ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>{label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {copyStep === 'upload' ? (
              <div className="workflow-upload-panel copy-upload-panel">
                <div className="mb-6">
                  <h2 className="text-[22px] font-bold text-stone-800">上传参考文件</h2>
                  <p className="mt-2 text-[14px] leading-6 text-stone-500">上传一份希望模仿的公文，AI 将识别其结构层次、表达方式和行文口径。</p>
                </div>
                {copySourceFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/60 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--gov-red)] shadow-sm"><FileText size={18} /></div>
                      <div className="min-w-0"><p className="truncate text-[12px] font-medium text-stone-800">{copySourceFile.name}</p><p className="mt-1 text-[10px] text-stone-400">{copySourceFile.size} · 已完成内容解析</p></div>
                    </div>
                    <button type="button" onClick={() => { setCopySourceFile(null); setCopySourceText(''); }} className="rounded p-2 text-stone-400 hover:bg-white hover:text-stone-600" aria-label="移除文件"><Trash2 size={15} /></button>
                  </div>
                ) : (
                  <div className="workflow-upload-grid copy-upload-grid">
                    <label className="workflow-upload-option workflow-upload-option-primary copy-upload-option copy-upload-option-primary cursor-pointer">
                      <span className="copy-upload-content">
                        <input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={handleCopySourceUpload} />
                        <span className="copy-upload-visual copy-upload-visual-local" aria-hidden="true">
                          <span className="copy-upload-screen">
                            <span />
                            <span />
                            <span />
                          </span>
                          <span className="copy-upload-bubble copy-upload-bubble-left" />
                          <span className="copy-upload-bubble copy-upload-bubble-right" />
                          <span className="workflow-upload-icon copy-upload-icon"><FileUp size={19} /></span>
                        </span>
                        <span className="workflow-upload-title">上传本地文件</span>
                        <span className="workflow-upload-description">适合 Word、PDF、TXT 等本地参考稿。</span>
                      </span>
                      <span className="workflow-upload-action">点击选择文件</span>
                    </label>
                    <button type="button" onClick={() => openMyCloudDocumentPicker('copy')} className="workflow-upload-option copy-upload-option">
                      <span className="copy-upload-content">
                        <span className="copy-upload-visual copy-upload-visual-library" aria-hidden="true">
                          <span className="copy-upload-folder-back" />
                          <span className="copy-upload-folder-front" />
                          <span className="copy-upload-note" />
                          <span className="workflow-upload-icon copy-upload-icon"><Folder size={19} /></span>
                        </span>
                        <span className="workflow-upload-title">从知识库选择</span>
                        <span className="workflow-upload-description">从个人或部门知识库中选择既有范文。</span>
                      </span>
                      <span className="workflow-upload-action">打开知识库</span>
                    </button>
                    <button type="button" onClick={() => openTextPasteModal('copy')} className="workflow-upload-option copy-upload-option">
                      <span className="copy-upload-content">
                        <span className="copy-upload-visual copy-upload-visual-text" aria-hidden="true">
                          <span className="copy-upload-paper">
                            <span />
                            <span />
                            <span />
                            <span />
                          </span>
                          <span className="copy-upload-mark" />
                          <span className="workflow-upload-icon copy-upload-icon"><FileText size={19} /></span>
                        </span>
                        <span className="workflow-upload-title">粘贴文本内容</span>
                        <span className="workflow-upload-description">直接粘贴参考正文，快速进入结构提取。</span>
                      </span>
                      <span className="workflow-upload-action">输入文本</span>
                    </button>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button type="button" disabled={!copySourceFile || isProcessing} onClick={handleExtractCopyDraft} className="inline-flex items-center gap-2 rounded-[9px] bg-[var(--gov-red)] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300">{isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}下一步，提取结构</button>
                </div>
              </div>
            ) : copyStep === 'extract' ? (
              <div className="rounded-[18px] border border-black/[0.08] bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] bg-[#faf7f6] px-4 py-2.5">
                  <FileSearch size={17} className="text-[#a1392e]" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#5f6368]">仿写样稿：{copySourceFile?.name}</span>
                  <button type="button" onClick={() => setCopyStep('upload')} className="text-[13px] font-semibold text-[#a1392e] hover:text-[var(--gov-red)]">更换文件</button>
                </div>

                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-[22px] font-extrabold tracking-normal text-[#202124]">AI 已提取文稿关键词及结构</h2>
                    <p className="mt-1 text-[13px] text-[#7b818a]">校验属性、关键词与结构模板后，即可继续仿写。</p>
                  </div>
                  <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-[12px] font-semibold text-[#9b3a2c]">可编辑 · 可展开解析</span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
                  <div className="space-y-4">
                    <section className="rounded-[15px] bg-[#f7f7f8] p-4">
                      <div className="mb-3">
                        <h3 className="text-[16px] font-bold text-[#202124]">文稿属性</h3>
                        <p className="mt-1 text-[12px] font-semibold text-[#8b9099]">AI 提取文体，可从常用与泛公文类型中校正</p>
                      </div>
                      <label className="space-y-2">
                        <span className="text-[13px] font-semibold text-[#6b7280]">文体类型</span>
                        <select value={copyDocumentAttributes.docType} onChange={(event) => updateCopyAttribute('docType', event.target.value)} className="gov-input h-10 w-full px-3 text-[14px] font-semibold text-[#202124]">
                          {[...new Set([copyDocumentAttributes.docType, ...COPY_DOC_TYPE_OPTIONS].filter(Boolean))].map((option) => <option key={option}>{option}</option>)}
                        </select>
                      </label>
                    </section>

                    <section>
                      <div className="mb-2">
                        <h3 className="text-[17px] font-bold text-[#202124]">关键词提取</h3>
                        <p className="mt-0.5 text-[12px] text-[#98a2b3]">主题词、行文方向和语气特征均为 AI 提取标签，可编辑、可留空。</p>
                      </div>
                      <div className="space-y-3 rounded-[14px] border border-black/[0.08] bg-white p-3">
                        <div>
                          <div className="mb-2 text-[13px] font-bold text-[#6b7280]">主题词</div>
                          <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-[12px] border border-black/[0.08] px-3 py-2">
                            {copyKeywordChips.map((chip, index) => (
                              <span key={`${chip}-${index}`} className="inline-flex h-8 items-center gap-2 rounded-[10px] bg-[#fff1ee] px-2.5 text-[14px] font-semibold text-[#983524]">
                                <input value={chip} onChange={(event) => updateCopyChip('keywords', index, event.target.value)} className="w-[5.5em] bg-transparent outline-none" aria-label={`关键词 ${index + 1}`} />
                                <button type="button" onClick={() => removeCopyChip('keywords', chip)} className="text-[#a1392e] hover:text-[var(--gov-red)]" aria-label="删除关键词">×</button>
                              </span>
                            ))}
                            <input
                              value={copyKeywordDraft}
                              onChange={(event) => setCopyKeywordDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
                                  event.preventDefault();
                                  addCopyChips(copyKeywordDraft, 'keywords');
                                }
                              }}
                              placeholder="+ 添加关键词"
                              className="h-8 min-w-[110px] flex-1 bg-transparent text-[14px] font-semibold text-[#667085] outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-[13px] font-bold text-[#6b7280]">行文方向</div>
                          <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-[12px] border border-black/[0.08] px-3 py-2">
                            {copyDirectionChips.map((chip, index) => (
                              <span key={`${chip}-${index}`} className="inline-flex h-8 items-center gap-2 rounded-[10px] bg-[#f6f7f8] px-2.5 text-[14px] font-semibold text-[#596170]">
                                <input value={chip} onChange={(event) => updateCopyChip('directions', index, event.target.value)} className="w-[5.5em] bg-transparent outline-none" aria-label={`行文方向 ${index + 1}`} />
                                <button type="button" onClick={() => removeCopyChip('directions', chip)} className="text-[#7a808a] hover:text-[var(--gov-red)]" aria-label="删除行文方向">×</button>
                              </span>
                            ))}
                            <input
                              value={copyDirectionDraft}
                              onChange={(event) => setCopyDirectionDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
                                  event.preventDefault();
                                  addCopyChips(copyDirectionDraft, 'directions');
                                }
                              }}
                              placeholder="+ 添加或留空"
                              className="h-8 min-w-[110px] flex-1 bg-transparent text-[14px] font-semibold text-[#667085] outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-[13px] font-bold text-[#6b7280]">语气特征</div>
                          <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-[12px] border border-black/[0.08] px-3 py-2">
                            {copyToneChips.map((chip, index) => (
                              <span key={`${chip}-${index}`} className="inline-flex h-8 items-center gap-2 rounded-[10px] bg-[#fff1ee] px-2.5 text-[14px] font-semibold text-[#983524]">
                                <input value={chip} onChange={(event) => updateCopyChip('tones', index, event.target.value)} className="w-[5.5em] bg-transparent outline-none" aria-label={`语气特征 ${index + 1}`} />
                                <button type="button" onClick={() => removeCopyChip('tones', chip)} className="text-[#a1392e] hover:text-[var(--gov-red)]" aria-label="删除语气特征">×</button>
                              </span>
                            ))}
                            <input
                              value={copyToneDraft}
                              onChange={(event) => setCopyToneDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
                                  event.preventDefault();
                                  addCopyChips(copyToneDraft, 'tones');
                                }
                              }}
                              placeholder="+ 添加语气特征"
                              className="h-8 min-w-[120px] flex-1 bg-transparent text-[14px] font-semibold text-[#667085] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section className="min-w-0">
                    <div className="mb-2">
                      <h3 className="text-[17px] font-bold text-[#202124]">结构提取</h3>
                      <p className="mt-0.5 text-[12px] text-[#98a2b3]">默认收起，点开单段可微调 AI 对结构的理解。</p>
                    </div>
                    <div className="rounded-[16px] border border-black/[0.08] bg-white p-3">
                      {copyStructureItems.map((item, index) => {
                        const expanded = copyExpandedStructureIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (copyDraggingStructureId) {
                                reorderCopyStructureItem(copyDraggingStructureId, item.id);
                              }
                              setCopyDraggingStructureId(null);
                            }}
                            className={`border-b border-black/[0.08] py-2.5 transition last:border-b-0 ${copyDraggingStructureId === item.id ? 'rounded-[12px] bg-[#fff7f5]' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                draggable
                                onDragStart={(event) => {
                                  setCopyDraggingStructureId(item.id);
                                  event.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => setCopyDraggingStructureId(null)}
                                title="拖拽调整顺序"
                                className="cursor-grab select-none text-[20px] leading-none text-[#a8adb7] active:cursor-grabbing"
                              >
                                ⋮⋮
                              </span>
                              <span className="w-8 shrink-0 text-[17px] font-bold text-[#6b7280]">{index + 1}、</span>
                              <input value={item.title} onChange={(event) => updateCopyStructureItem(item.id, { title: event.target.value })} className="min-w-0 flex-1 bg-transparent text-[17px] font-bold text-[#202124] outline-none" placeholder="这里填结构提纲，不是正文内容" />
                              <div className="flex shrink-0 items-center gap-2">
                                <button type="button" onClick={() => moveCopyStructureItem(item.id, -1)} disabled={index === 0} className="rounded-md px-2 py-1 text-[12px] font-semibold text-[#667085] hover:bg-stone-100 disabled:opacity-30">上移</button>
                                <button type="button" onClick={() => moveCopyStructureItem(item.id, 1)} disabled={index === copyStructureItems.length - 1} className="rounded-md px-2 py-1 text-[12px] font-semibold text-[#667085] hover:bg-stone-100 disabled:opacity-30">下移</button>
                                <button type="button" onClick={() => toggleCopyStructureExpanded(item.id)} className="rounded-[9px] bg-[#eef6ff] px-3 py-1.5 text-[13px] font-bold text-[#1769aa]">{expanded ? '收起解析⌄' : '查看解析›'}</button>
                                <button type="button" onClick={() => removeCopyStructureItem(item.id)} className="px-2 text-[13px] font-semibold text-[#666] hover:text-[var(--gov-red)]">删除</button>
                              </div>
                            </div>
                            {expanded ? (
                              <div className="ml-[62px] mt-3 rounded-[14px] bg-[#f6f6f7] p-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <label className="space-y-2">
                                    <span className="text-[13px] font-bold text-[#70757a]">写作功能</span>
                                    <input value={item.writingFunction} onChange={(event) => updateCopyStructureItem(item.id, { writingFunction: event.target.value })} className="gov-input w-full px-3 py-2.5 text-[14px] font-semibold" />
                                  </label>
                                  <label className="space-y-2">
                                    <span className="text-[13px] font-bold text-[#70757a]">行文模式</span>
                                    <input value={item.pattern} onChange={(event) => updateCopyStructureItem(item.id, { pattern: event.target.value })} className="gov-input w-full px-3 py-2.5 text-[14px] font-semibold" />
                                  </label>
                                </div>
                                <label className="mt-3 block space-y-2">
                                  <span className="text-[13px] font-bold text-[#70757a]">句式骨架（方括号为仿写填充位）</span>
                                  <textarea value={item.skeleton} onChange={(event) => updateCopyStructureItem(item.id, { skeleton: event.target.value })} rows={2} className="gov-input w-full resize-none px-3 py-2.5 text-[14px] font-semibold leading-6" />
                                </label>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                      <button type="button" onClick={addCopyStructureItem} className="mt-3 flex h-10 w-full items-center justify-center rounded-[12px] border border-dashed border-stone-300 text-[15px] font-bold text-[#666] transition hover:border-[var(--gov-red-line)] hover:bg-[var(--gov-red-soft)] hover:text-[var(--gov-red-deep)]">+ 添加条目</button>
                    </div>
                    <div className="mt-3 rounded-[12px] bg-[#f2f7ff] px-4 py-2.5 text-[13px] font-semibold text-[#25608f]">
                      点击“查看解析”可查看每段的功能定位和句式骨架；不展开也会用于后续仿写。
                    </div>
                  </section>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4">
                  <button type="button" onClick={() => setCopyStep('upload')} className="text-[14px] font-semibold text-stone-500 hover:text-stone-700">返回上传样稿</button>
                  <button type="button" disabled={!copyExtractionValid} onClick={() => setCopyStep('requirements')} className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[var(--gov-red)] px-5 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(196,41,53,0.18)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300">下一步，填写仿写要求</button>
                </div>
              </div>
            ) : copyStep === 'requirements' ? (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2.5">
                  <FileText size={15} className="text-[var(--gov-red)]" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-stone-600">参考文件：{copySourceFile?.name}</span>
                  <button type="button" onClick={() => setCopyStep('extract')} className="text-[10px] font-medium text-[var(--gov-red)]">查看结构提取</button>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-stone-700">仿写主题 <span className="text-red-500">*</span></label>
                    <input value={imitateTopic} onChange={(event) => setImitateTopic(event.target.value)} placeholder="例如：关于开展二季度安全生产检查工作的通知" className="gov-input w-full px-3 py-3 text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-stone-700">仿写要求 <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => setReferenceMaterial(`参考样稿属性：${copyAttributeSummary || '未指定'}\n主题词：${copyKeywordSummary || copyExtractedKeywords}\n参考样稿结构：\n${copyStructureSummary || copyExtractedStructure}\n\n请沿用参考稿的结构层次、句式骨架和参考语气，围绕“${imitateTopic || '当前主题'}”补充任务背景、重点安排、责任分工和完成时限，避免照搬原文表述。`)}
                      className="mb-2 inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-3 text-[11px] font-semibold text-[var(--gov-red-deep)] hover:bg-[#f9e4e6]"
                    >
                      <Sparkles size={13} />AI辅助生成
                    </button>
                    <textarea rows={7} value={referenceMaterial} onChange={(event) => setReferenceMaterial(event.target.value)} placeholder="说明需要保留的结构、语气、篇幅和重点内容。例如：沿用参考文稿的三段式结构，语气正式严谨，突出责任分工和完成时限，篇幅控制在 1200 字以内。" className="gov-input w-full resize-none px-3 py-3 text-[13px] leading-6" />
                    <p className="text-right text-[10px] text-stone-400">{referenceMaterial.length}/1000</p>
                  </div>
                  <div className="rounded-xl border border-stone-200/70 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[110px_1fr] md:items-center">
                      <label className="text-[13px] font-bold text-[var(--gov-text)]">字数</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={copyWordCount}
                        onChange={(event) => setCopyWordCount(event.target.value)}
                        placeholder="例如：1500"
                        className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                      />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-[110px_1fr] md:items-center">
                      <label className="text-[13px] font-bold text-[var(--gov-text)]">拟文单位</label>
                      <input
                        type="text"
                        value={copyDraftingUnit}
                        onChange={(event) => setCopyDraftingUnit(event.target.value)}
                        placeholder="客户机构(请修改此名称为客户机构名称)"
                        className="gov-input w-full rounded-lg px-3 py-3 text-[13px]"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-stone-200/70 bg-[#fbfbfc] p-4">
                    <div className="grid gap-3 md:grid-cols-[110px_1fr] md:items-center">
                      <div>
                        <p className="text-[13px] font-bold text-[var(--gov-text)]">生成配置</p>
                        <p className="mt-1 text-[11px] leading-4 text-[#98a2b3]">选择模型与推理模式</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <DeepThinkingToggle enabled={deepThinkingEnabled} onChange={setDeepThinkingEnabled} />
                        <ModelSelectControl selectedModel={selectedModel} onChange={setSelectedModel} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button type="button" onClick={() => setCopyStep('extract')} className="text-[11px] font-medium text-stone-500 hover:text-stone-700">返回结构提取</button>
                  <button type="button" disabled={!imitateTopic.trim() || !referenceMaterial.trim()} onClick={() => setCopyStep('materials')} className="inline-flex items-center gap-2 rounded-lg bg-[var(--gov-red)] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300">
                    下一步，添加参考素材
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                <div className="flex min-h-[620px] flex-col xl:grid xl:grid-cols-[260px_minmax(520px,1fr)_330px]">
                  <aside className="border-b border-black/[0.06] bg-[#fafafa] p-4 xl:border-b-0 xl:border-r">
                    <div className="mb-4 rounded-[12px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/50 p-3">
                      <p className="text-[10px] font-semibold text-[var(--gov-red)]">仿写样稿</p>
                      <p className="mt-1.5 truncate text-[12px] font-semibold text-[#344054]">{copySourceFile?.name}</p>
                      <p className="mt-1 text-[10px] text-[#98a2b3]">作为结构与语气基准，始终参与生成</p>
                    </div>
                    <div className="mb-3 flex items-center justify-between"><span className="text-[12px] font-bold text-[#344054]">知识库分类</span><span className="text-[10px] text-[#98a2b3]">可多选</span></div>
                    <div className="space-y-2">
                      {KNOWLEDGE_LIBRARY_GROUPS.map((group) => {
                        const isActive = group.id === copyActiveRoot.id;
                        return <div key={group.id}>
                          <button type="button" onClick={() => { setActiveKnowledgeRoot(group.id); setActiveKnowledgeFolder(group.folders[0].id); }} className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left transition ${isActive ? 'bg-white text-[var(--gov-red-deep)] shadow-sm ring-1 ring-[var(--gov-red-line)]' : 'text-[#596170] hover:bg-white'}`}><span className="inline-flex items-center gap-2 text-[12px] font-semibold"><Folder size={14} />{group.title}</span><ChevronDown size={13} className={isActive ? 'rotate-180' : '-rotate-90'} /></button>
                          {isActive ? <div className="ml-4 mt-1 space-y-1 border-l border-[#e4e7ec] pl-3">{group.folders.map((folder) => <button key={folder.id} type="button" onClick={() => setActiveKnowledgeFolder(folder.id)} className={`block w-full rounded-[8px] px-2 py-2 text-left text-[11px] transition ${folder.id === copyActiveFolder.id ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'text-[#667085] hover:bg-white'}`}>{folder.title}</button>)}</div> : null}
                        </div>;
                      })}
                    </div>
                  </aside>

                  <section className="min-w-0 border-b border-black/[0.06] p-5 xl:border-b-0 xl:border-r">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div><h2 className="text-[17px] font-bold text-[#202124]">{copyActiveFolder.title}</h2><p className="mt-1 text-[11px] text-[#98a2b3]">选择补充事实、政策口径或业务数据，不影响仿写样稿</p></div>
                      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"><FileUp size={14} />本地上传<input type="file" accept=".doc,.docx,.pdf,.txt,.xlsx" multiple className="sr-only" onChange={handleHomeSourceUpload} /></label>
                    </div>
                    <div className="relative mb-4"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" /><input type="search" placeholder="搜索当前文件夹中的文件" className="h-10 w-full rounded-[10px] border border-black/[0.08] bg-[#fafafa] pl-9 pr-3 text-[12px] outline-none transition placeholder:text-[#b2b8c2] focus:border-[var(--gov-red-line)] focus:bg-white" /></div>
                    <div className="overflow-hidden rounded-[12px] border border-black/[0.07]">
                      <div className="grid grid-cols-[minmax(0,1fr)_90px_90px] bg-[#fafafa] px-4 py-2.5 text-[10px] font-semibold text-[#98a2b3]"><span>文件名称</span><span>大小</span><span>更新时间</span></div>
                      {copyActiveFolder.files.map((file) => {
                        const selected = selectedKnowledgeItems.includes(file.id);
                        return <button key={file.id} type="button" onClick={() => setSelectedKnowledgeItems((items) => selected ? items.filter((id) => id !== file.id) : [...items, file.id])} className={`grid w-full grid-cols-[minmax(0,1fr)_90px_90px] items-center border-t border-black/[0.06] px-4 py-3 text-left transition ${selected ? 'bg-[var(--gov-red-soft)]/55' : 'bg-white hover:bg-[#fafafa]'}`}><span className="flex min-w-0 items-center gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] ${selected ? 'bg-[var(--gov-red)] text-white' : 'bg-[#f2f4f7] text-[#667085]'}`}>{selected ? <CheckCircle size={14} /> : <FileText size={14} />}</span><span className="truncate text-[12px] font-semibold text-[#344054]">{file.title}</span></span><span className="text-[11px] text-[#98a2b3]">{file.size}</span><span className="text-[11px] text-[#98a2b3]">{file.updated}</span></button>;
                      })}
                    </div>
                    {uploadedFiles.length > 0 ? <div className="mt-5"><p className="mb-2 text-[11px] font-semibold text-[#667085]">本地参考文件</p><div className="flex flex-wrap gap-2">{uploadedFiles.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex h-8 max-w-[260px] items-center gap-2 rounded-[8px] bg-[#f7f7f7] px-2.5 text-[11px] text-[#596170]"><File size={12} className="shrink-0 text-[var(--gov-red)]" /><span className="truncate">{file.name}</span><button type="button" onClick={() => handleClearFile(index)} className="shrink-0 text-[#98a2b3] hover:text-[var(--gov-red)]"><X size={12} /></button></span>)}</div></div> : null}
                  </section>

                  <aside className="flex min-h-[420px] flex-col bg-[#fffdfc] p-5">
                    <div className="flex items-start justify-between gap-3"><div><h3 className="text-[14px] font-bold text-[#202124]">已选素材</h3><p className="mt-1 text-[10px] text-[#98a2b3]">含仿写样稿、本地文件与知识库材料</p><p className="mt-1 text-[10px] leading-4 text-[#b35b62]">支持 doc、docx、pdf 文档格式，最多 6 个文档（单个 20M 以内）</p></div><span className="shrink-0 rounded-full bg-[var(--gov-red-soft)] px-2 py-1 text-[10px] font-bold text-[var(--gov-red)]">{1 + uploadedFiles.length + selectedCopyKnowledgeEntries.length} 项</span></div>
                    <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
                      <div className="flex items-start gap-2 rounded-[10px] border border-[var(--gov-red-line)] bg-white p-3"><FileCheck2 size={15} className="mt-0.5 shrink-0 text-[var(--gov-red)]" /><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#344054]">{copySourceFile?.name}</p><p className="mt-1 text-[10px] text-[#98a2b3]">仿写样稿 · 必选</p></div></div>
                      {uploadedFiles.map((file, index) => <div key={`${file.name}-selected`} className="flex items-start gap-2 rounded-[10px] border border-black/[0.07] bg-white p-3"><File size={14} className="mt-0.5 shrink-0 text-[#667085]" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#344054]">{file.name}</p><p className="mt-1 text-[10px] text-[#98a2b3]">本地上传 · {file.size}</p></div><button type="button" onClick={() => handleClearFile(index)} className="text-[#98a2b3] hover:text-[var(--gov-red)]"><X size={12} /></button></div>)}
                      {selectedCopyKnowledgeEntries.map((item) => <div key={item.id} className="flex items-start gap-2 rounded-[10px] border border-black/[0.07] bg-white p-3"><Folder size={14} className="mt-0.5 shrink-0 text-[#667085]" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#344054]">{item.title}</p><p className="mt-1 text-[10px] text-[#98a2b3]">{item.meta}</p></div><button type="button" onClick={() => setSelectedKnowledgeItems((items) => items.filter((id) => id !== item.id))} className="text-[#98a2b3] hover:text-[var(--gov-red)]"><X size={12} /></button></div>)}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4"><button type="button" onClick={() => setCopyStep('requirements')} className="text-[11px] font-semibold text-[#667085] hover:text-[#344054]">返回修改要求</button><button type="button" onClick={handleRunImitate} disabled={isProcessing} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(196,41,53,0.16)] transition hover:bg-[var(--gov-red-deep)] disabled:bg-stone-300">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}生成仿写文档</button></div>
                  </aside>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPolishWorkspace = () => {
    const stepNumber = polishStep === 'upload' ? 1 : polishStep === 'requirements' ? 2 : 3;
    const sourceName = selectedPolishDocument?.title || polishSourceFile?.name || '待润色文件';
    const toggleOption = (value: string, values: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    };

    if (polishStep === 'result') {
      return (
        <motion.div key="polish-editor" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/[0.07] bg-white px-5 md:px-7">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPolishStep('requirements')} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#667085] hover:bg-[#f5f5f5]" aria-label="返回润色要求"><ArrowLeft size={15} /></button>
              <span className="text-[13px] font-bold text-[#202124]">文风润色</span>
              <span className="text-[11px] text-[#98a2b3]">{isProcessing ? '正在润色全文' : '润色稿编辑器'}</span>
            </div>
            <span className="text-[11px] text-[#98a2b3]">{polishResultText.replace(/\s/g, '').length} 字</span>
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="relative min-w-0 flex-1 border-r border-black/[0.06] bg-[#f2f3f5]">
              <WebOfficeEditor value={polishResultText || SAMPLE_POLISH_DOCUMENT} onChange={setPolishResultText} documentTitle={`${sourceName.replace(/\.(docx?|pdf|txt)$/i, '')}（润色稿）`} variant="polished" />
              {isProcessing ? (
                <div className="absolute bottom-16 left-1/2 z-20 flex h-11 -translate-x-1/2 items-center gap-4 rounded-[10px] border border-[var(--gov-red-line)] bg-white px-5 text-[12px] font-semibold text-[#596170] shadow-[0_16px_42px_rgba(15,23,42,0.16)]">
                  <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin text-[var(--gov-red)]" />正在润色中...</span>
                  <button type="button" onClick={() => setIsProcessing(false)} className="text-[#667085] hover:text-[var(--gov-red)]">停止 Esc</button>
                </div>
              ) : null}
            </div>
            <aside className="w-[360px] shrink-0 overflow-y-auto bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#202124]">润色全文</h3>
                <button type="button" onClick={() => setPolishStep('requirements')} className="rounded p-1 text-[#98a2b3] hover:bg-[#f5f5f5]"><X size={15} /></button>
              </div>
              <div className="mb-4 grid grid-cols-2 rounded-[8px] bg-[#f0f1f3] p-1 text-[12px] font-semibold">
                <button className="h-9 rounded-[7px] bg-white text-[#202124] shadow-sm">全部润色({polishDirections.length})</button>
                <button className="h-9 rounded-[7px] text-[#667085]">修改记录(0)</button>
              </div>
              <div className="mb-4 flex gap-2">
                <select className="h-9 min-w-0 flex-1 rounded-[8px] border border-black/[0.08] bg-white px-2 text-[11px] text-[#596170]"><option>标记状态</option></select>
                <select className="h-9 w-24 rounded-[8px] border border-black/[0.08] bg-white px-2 text-[11px] text-[#596170]"><option>全部</option></select>
              </div>
              <div className="space-y-3">
                {[
                  ['通顺表达', '将口语化表述调整为正式公文语言，压缩重复句式，提升段落衔接。'],
                  ['增强感情', '保留原文事实口径，补强责任担当、协同推进等正式表达。'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-[12px] border border-black/[0.07] bg-[#fffdfc] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[#202124]"><PenTool size={14} className="text-[var(--gov-red)]" />{title}</div>
                    <p className="text-[12px] leading-6 text-[#667085]">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 mt-5 flex gap-2 bg-white pt-4">
                <button type="button" onClick={handleRunPolish} className="h-10 flex-1 rounded-[9px] border border-black/[0.08] bg-white text-[12px] font-semibold text-[#596170] hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]">重新润色</button>
                <button type="button" className="h-10 flex-1 rounded-[9px] bg-[var(--gov-red)] text-[12px] font-semibold text-white hover:bg-[var(--gov-red-deep)]">全部接受</button>
              </div>
            </aside>
          </div>
        </motion.div>
      );
    }

    if (polishStep === 'preview') {
      return (
        <motion.div key="polish-preview" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col overflow-hidden bg-[#fafafa]">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/[0.07] bg-white px-5 md:px-7">
            <div className="flex items-center gap-3"><button type="button" onClick={() => setPolishStep('requirements')} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#667085] hover:bg-[#f5f5f5]" aria-label="返回填写润色要求"><ArrowLeft size={15} /></button><span className="text-[13px] font-bold text-[#202124]">文风润色</span><span className="text-[11px] text-[#98a2b3]">结果预览</span></div>
            <div className="flex items-center gap-2">
              {polishResultText ? <button type="button" onClick={() => handleCopy(polishResultText)} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#596170] hover:text-[var(--gov-red)]"><Copy size={14} />{copied ? '已复制' : '复制'}</button> : null}
              <button type="button" disabled={!polishResultText} onClick={() => setPolishStep('result')} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(196,41,53,0.16)] hover:bg-[var(--gov-red-deep)] disabled:bg-stone-300"><PenTool size={14} />去编辑</button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8">
            <div className="mx-auto flex w-full max-w-[1420px] flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                {[['1', '文档解析完成', sourceName], ['2', '润色策略已应用', `${polishDirections.join('、')} · ${polishStyles.join('、')}`], ['3', polishResultText ? '润色稿已生成' : '正在生成润色稿', polishResultText ? `${polishResultText.replace(/\s/g, '').length} 字` : '模型正在按要求优化全文']].map(([index, title, desc]) => <div key={index} className="rounded-[10px] border border-black/[0.07] bg-white px-4 py-3"><div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[10px] font-bold text-[var(--gov-red)]">{index}</span><span className="text-[12px] font-bold text-[#344054]">{title}</span></div><p className="mt-1.5 truncate pl-7 text-[10px] text-[#98a2b3]">{desc}</p></div>)}
              </div>
              <article className="min-h-[620px] rounded-[14px] border border-black/[0.07] bg-white px-[clamp(30px,6vw,92px)] py-10 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
                {isProcessing ? <div className="flex min-h-[500px] flex-col items-center justify-center gap-4"><Loader2 size={30} className="animate-spin text-[var(--gov-red)]" /><p className="text-[13px] font-semibold text-[#596170]">正在分析原文并生成润色稿...</p><p className="text-[11px] text-[#98a2b3]">正在统一正式表述、语言风格与篇幅要求</p></div> : <div className="mx-auto max-w-[1080px]"><h1 className="mb-8 text-center text-[28px] font-bold leading-tight text-[#202124]">{sourceName.replace(/\.(docx?|pdf|txt)$/i, '')}（润色稿）</h1><div className="whitespace-pre-wrap text-[15px] leading-[2.05] text-[#30343b]">{polishResultText}</div><div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5"><span className="text-[11px] text-[#98a2b3]">已按 {polishDirections.join('、')} / {polishStyles.join('、')} / {polishLength} 完成润色</span><div className="flex items-center gap-2"><button type="button" onClick={handleRunPolish} className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-black/[0.08] px-4 text-[12px] font-semibold text-[#596170] hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"><RotateCcw size={14} />重新生成</button><button type="button" onClick={() => setPolishStep('result')} className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[var(--gov-red)] px-5 text-[12px] font-semibold text-white hover:bg-[var(--gov-red-deep)]"><PenTool size={14} />去编辑</button></div></div></div>}
              </article>
            </div>
          </div>
        </motion.div>
      );
    }

    const progressLabels = ['上传待润色文件', '填写润色要求', '预览润色结果'];
    return (
      <motion.div key={`polish-${polishStep}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col overflow-hidden bg-[#fafafa]">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/[0.07] bg-white px-5 md:px-7">
          <div className="flex items-center gap-3"><button type="button" onClick={() => polishStep === 'upload' ? openView('home') : setPolishStep('upload')} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#667085] hover:bg-[#f5f5f5]" aria-label="返回上一步"><ArrowLeft size={15} /></button><span className="text-[14px] font-bold text-[#202124]">文风润色</span><span className="text-[13px] text-[#98a2b3]">提升表达质量并保持原文事实口径</span></div>
          <span className="text-[12px] font-medium text-[#98a2b3]">步骤 {stepNumber}/3</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="mb-5 flex items-center justify-center gap-3 rounded-[10px] border border-black/[0.06] bg-white px-5 py-3">
              {progressLabels.map((label, index) => <React.Fragment key={label}>{index > 0 ? <div className={`h-px min-w-8 flex-1 max-w-28 ${stepNumber > index ? 'bg-[var(--gov-red)]' : 'bg-[#e4e7ec]'}`} /> : null}<div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${stepNumber >= index + 1 ? 'bg-[var(--gov-red)] text-white' : 'bg-[#f0f2f5] text-[#98a2b3]'}`}>{stepNumber > index + 1 ? <CheckCircle size={14} /> : index + 1}</span><span className={`text-[13px] font-semibold ${stepNumber === index + 1 ? 'text-[#344054]' : 'text-[#98a2b3]'}`}>{label}</span></div></React.Fragment>)}
            </div>

            {polishStep === 'upload' ? <div className="workflow-upload-panel copy-upload-panel">
              <div className="mb-6"><h2 className="text-[22px] font-bold text-[#202124]">上传待润色文件</h2><p className="mt-2 text-[14px] leading-6 text-[#667085]">支持本地上传、从知识库选择或直接粘贴文本，三种方式任选其一。</p></div>
              {polishSourceReady ? <div className="mb-5 flex items-center justify-between rounded-[10px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/55 px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-white text-[var(--gov-red)]"><FileCheck2 size={18} /></span><div className="min-w-0"><p className="truncate text-[13px] font-bold text-[#344054]">{sourceName}</p><p className="mt-1 text-[10px] text-[#98a2b3]">文档解析完成，可进入下一步填写润色要求</p></div></div><button type="button" onClick={() => { setPolishSourceFile(null); setPolishSourceText(''); setSelectedPolishDocumentId(null); }} className="rounded-[7px] p-2 text-[#98a2b3] hover:bg-white hover:text-[var(--gov-red)]" aria-label="移除文件"><Trash2 size={15} /></button></div> : null}
              <div className="workflow-upload-grid copy-upload-grid">
                <label className="workflow-upload-option workflow-upload-option-primary copy-upload-option copy-upload-option-primary cursor-pointer">
                  <span className="copy-upload-content">
                    <input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={handlePolishSourceUpload} />
                    <span className="copy-upload-visual copy-upload-visual-local" aria-hidden="true">
                      <span className="copy-upload-screen">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="copy-upload-bubble copy-upload-bubble-left" />
                      <span className="copy-upload-bubble copy-upload-bubble-right" />
                      <span className="workflow-upload-icon copy-upload-icon"><FileUp size={19} /></span>
                    </span>
                    <span className="workflow-upload-title">上传本地文件</span>
                    <span className="workflow-upload-description">选择电脑中的 DOCX、PDF 或 TXT 文件。</span>
                  </span>
                  <span className="workflow-upload-action">选择文件</span>
                </label>
                <button type="button" onClick={() => openMyCloudDocumentPicker('polish')} className="workflow-upload-option copy-upload-option">
                  <span className="copy-upload-content">
                    <span className="copy-upload-visual copy-upload-visual-library" aria-hidden="true">
                      <span className="copy-upload-folder-back" />
                      <span className="copy-upload-folder-front" />
                      <span className="copy-upload-note" />
                      <span className="workflow-upload-icon copy-upload-icon"><Folder size={19} /></span>
                    </span>
                    <span className="workflow-upload-title">从知识库选择</span>
                    <span className="workflow-upload-description">从个人、部门知识库中选择待润色文档。</span>
                  </span>
                  <span className="workflow-upload-action">打开知识库</span>
                </button>
                <button type="button" onClick={() => openTextPasteModal('polish')} className="workflow-upload-option copy-upload-option">
                  <span className="copy-upload-content">
                    <span className="copy-upload-visual copy-upload-visual-text" aria-hidden="true">
                      <span className="copy-upload-paper">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="copy-upload-mark" />
                      <span className="workflow-upload-icon copy-upload-icon"><FileText size={19} /></span>
                    </span>
                    <span className="workflow-upload-title">粘贴文本内容</span>
                    <span className="workflow-upload-description">直接粘贴需要润色的正文内容。</span>
                  </span>
                  <span className="workflow-upload-action">输入文本</span>
                </button>
              </div>
              <div className="mt-6 flex justify-end border-t border-black/[0.06] pt-5"><button type="button" disabled={!polishSourceReady} onClick={() => setPolishStep('requirements')} className="inline-flex h-11 items-center gap-2 rounded-[9px] bg-[var(--gov-red)] px-5 text-[14px] font-semibold text-white hover:bg-[var(--gov-red-deep)] disabled:bg-stone-300">下一步：填写润色要求<ChevronDown size={15} className="-rotate-90" /></button></div>
            </div> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              <section className="rounded-[14px] border border-black/[0.07] bg-white p-7 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] pb-5"><div><h2 className="text-[20px] font-bold text-[#202124]">填写润色要求</h2><p className="mt-2 text-[12px] text-[#667085]">按需选择优化方向、语言风格与篇幅要求。</p></div><span className="rounded-[8px] bg-[#f5f5f5] px-3 py-2 text-[11px] text-[#667085]">{sourceName}</span></div>
                <div className="mt-6 space-y-7">
                  <div><p className="mb-3 text-[13px] font-bold text-[#344054]">优化方向 <span className="font-normal text-[#98a2b3]">（多选）</span></p><div className="flex flex-wrap gap-2">{['通顺表达', '增强感情', '增强说服力', '提升文采', '增加细节'].map((item) => <button key={item} type="button" onClick={() => toggleOption(item, polishDirections, setPolishDirections)} className={`h-9 rounded-[7px] border px-4 text-[12px] font-semibold transition ${polishDirections.includes(item) ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'border-transparent bg-[#f3f4f6] text-[#596170] hover:bg-[#eceef1]'}`}>{item}</button>)}</div></div>
                  <div><p className="mb-3 text-[13px] font-bold text-[#344054]">语言风格 <span className="font-normal text-[#98a2b3]">（多选）</span></p><div className="flex flex-wrap gap-2">{['正式', '通俗', '幽默', '专业', '亲切'].map((item) => <button key={item} type="button" onClick={() => toggleOption(item, polishStyles, setPolishStyles)} className={`h-9 rounded-[7px] border px-4 text-[12px] font-semibold transition ${polishStyles.includes(item) ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'border-transparent bg-[#f3f4f6] text-[#596170] hover:bg-[#eceef1]'}`}>{item}</button>)}</div></div>
                  <div><p className="mb-3 text-[13px] font-bold text-[#344054]">长度要求 <span className="font-normal text-[#98a2b3]">（单选）</span></p><div className="flex flex-wrap gap-2">{(['尽量保持', '尽量精简', '尽量扩写'] as const).map((item) => <button key={item} type="button" onClick={() => setPolishLength(item)} className={`h-9 rounded-[7px] border px-4 text-[12px] font-semibold transition ${polishLength === item ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'border-transparent bg-[#f3f4f6] text-[#596170] hover:bg-[#eceef1]'}`}>{item}</button>)}</div></div>
                  <div><p className="mb-3 text-[13px] font-bold text-[#344054]">补充要求 <span className="font-normal text-[#98a2b3]">（选填）</span></p><textarea value={polishRequirementText} onChange={(event) => setPolishRequirementText(event.target.value)} rows={4} placeholder="例如：保留原有数据与政策表述，重点增强任务部署部分的可执行性。" className="w-full resize-none rounded-[9px] border border-black/[0.09] bg-[#fafafa] px-4 py-3 text-[12px] leading-6 text-[#344054] outline-none placeholder:text-[#b2b8c2] focus:border-[var(--gov-red-line)] focus:bg-white" /></div>
                </div>
              </section>
              <aside className="flex flex-col rounded-[14px] border border-black/[0.07] bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
                <h3 className="text-[14px] font-bold text-[#202124]">本次润色配置</h3>
                <div className="mt-5 space-y-4 text-[11px]">
                  <div className="rounded-[9px] bg-[#fafafa] p-3">
                    <p className="text-[#98a2b3]">待润色文件</p>
                    <p className="mt-1.5 truncate font-semibold text-[#344054]">{sourceName}</p>
                  </div>
                  <div>
                    <p className="text-[#98a2b3]">优化方向</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {polishDirections.map((item) => <span key={item} className="rounded-[6px] bg-[var(--gov-red-soft)] px-2 py-1 text-[var(--gov-red-deep)]">{item}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[#98a2b3]">语言风格</p>
                    <p className="mt-1.5 font-semibold text-[#344054]">{polishStyles.join('、') || '未选择'}</p>
                  </div>
                  <div>
                    <p className="text-[#98a2b3]">长度要求</p>
                    <p className="mt-1.5 font-semibold text-[#344054]">{polishLength}</p>
                  </div>
                </div>
                <div className="mt-auto space-y-3 pt-8">
                  <div className="rounded-[12px] border border-stone-200/70 bg-[#fbfbfc] p-3">
                    <p className="text-[12px] font-bold text-[var(--gov-text)]">生成配置</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#98a2b3]">选择模型与推理模式</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <DeepThinkingToggle enabled={deepThinkingEnabled} onChange={setDeepThinkingEnabled} compact />
                      <ModelSelectControl selectedModel={selectedModel} onChange={setSelectedModel} compact />
                    </div>
                  </div>
                  <button type="button" onClick={handleRunPolish} disabled={polishDirections.length === 0 || polishStyles.length === 0} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-[var(--gov-red)] text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(196,41,53,0.16)] hover:bg-[var(--gov-red-deep)] disabled:bg-stone-300"><Sparkles size={15} />开始生成</button>
                  <button type="button" onClick={() => setPolishStep('upload')} className="h-9 w-full text-[11px] font-semibold text-[#667085] hover:text-[#344054]">返回更换文件</button>
                </div>
              </aside>
            </div>}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCheckWorkspace = () => {
    const stepNumber = checkStep === 'vendor' ? 1 : checkStep === 'upload' ? 2 : 3;
    const hasResult = checkStep === 'result' && proofreadResult;

    if (hasResult) {
      return (
        <motion.div key="check-result" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-neutral-50/50 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCheckStep('upload')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:bg-neutral-200/60 hover:text-stone-600"
                aria-label="返回上一步"
              >
                <ArrowLeft size={14} />
              </button>
              <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
              <span className="text-[11px] font-medium text-[var(--gov-text)]">AI 校对</span>
              <span className="text-[10px] text-stone-300">|</span>
              <span className="text-[11px] text-[var(--gov-text-muted)]">{checkVendor} · 校对结果 · 评分 {proofreadResult.score} 分 · {proofreadResult.issues.length} 处问题</span>
            </div>
            <button type="button" onClick={() => { setCheckStep('vendor'); setCheckSourceFile(null); setProofreadResult(null); }} className="rounded px-2.5 py-1 text-[11px] text-[var(--gov-text-muted)] transition hover:bg-neutral-200/60 hover:text-[var(--gov-text)]">新建校对</button>
          </div>
          {/* Split view: WebOffice + right sidebar */}
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 border-r border-stone-200">
              <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-1.5 text-[11px] text-amber-700">
                <FileCheck2 size={13} />
                AI 全文校对完成，评分 {proofreadResult.score} 分 · {proofreadResult.issues.length} 处问题
              </div>
              <WebOfficeEditor
                value={proofreadResult.issues.length > 0 ? proofreadResult.issues.reduce((text, issue) => text.replace(issue.original, issue.suggested), SAMPLE_POLISH_DOCUMENT) : SAMPLE_POLISH_DOCUMENT}
                onChange={() => {}}
                documentTitle={checkSourceFile?.name ?? '校对结果'}
                variant="draft"
              />
            </div>
            {/* Right sidebar: issues */}
            <div className="w-[340px] shrink-0 overflow-y-auto bg-white">
              <div className="sticky top-0 z-10 border-b border-stone-100 bg-white px-4 py-3">
                <h4 className="text-[12px] font-bold text-[var(--gov-text)]">校对更改项</h4>
                <p className="mt-0.5 text-[10px] text-[var(--gov-text-muted)]">共 {proofreadResult.issues.length} 处，点击条目定位至原文</p>
              </div>
              <div className="divide-y divide-stone-50 px-3 py-2">
                {proofreadResult.issues.map((issue, index) => (
                  <div key={`${issue.type}-${index}`} className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold ${
                        issue.level === 'critical' ? 'bg-red-100 text-red-600' : issue.level === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--gov-text)]">{issue.type}</span>
                      <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        issue.level === 'critical' ? 'bg-red-100 text-red-700' : issue.level === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {issue.level === 'critical' ? '严重' : issue.level === 'warn' ? '警告' : '提示'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="rounded-md border border-stone-100 bg-stone-50/50 px-2.5 py-1.5">
                        <div className="text-[9px] text-stone-400">原文</div>
                        <div className="mt-0.5 text-[11px] leading-[17px] text-red-500 line-through">{issue.original}</div>
                      </div>
                      <div className="rounded-md border border-emerald-100 bg-emerald-50/50 px-2.5 py-1.5">
                        <div className="text-[9px] text-emerald-500">建议修改</div>
                        <div className="mt-0.5 text-[11px] leading-[17px] font-medium text-emerald-700">{issue.suggested}</div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-[16px] text-[var(--gov-text-muted)]">{issue.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (isProcessing) {
      return (
        <motion.div key="check-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-[var(--gov-red)]" />
          <p className="text-[13px] text-stone-500">正在校对文档...</p>
        </motion.div>
      );
    }

    return (
      <motion.div key="check-upload" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => checkStep === 'vendor' ? openView('home') : setCheckStep('vendor')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:bg-neutral-200/60 hover:text-stone-600"
              aria-label="返回上一步"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
            <span className="text-[14px] font-bold text-[var(--gov-text)]">AI 校对</span>
            <span className="text-[10px] text-stone-300">|</span>
            <span className="text-[13px] text-[var(--gov-text-muted)]">上传校对文档，自动检测错别字、标点、格式与敏感词</span>
          </div>
          <span className="text-[12px] text-[var(--gov-text-muted)]">步骤 {stepNumber}/3</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-100/50 px-5 py-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="mb-7 flex items-center justify-center gap-2">
              {['选择校对引擎', '上传待校对文件', '生成校对结果'].map((label, index) => (
                <React.Fragment key={label}>
                  {index > 0 ? <div className={`h-px w-12 ${stepNumber > index ? 'bg-[var(--gov-red)]' : 'bg-stone-200'}`} /> : null}
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${stepNumber >= index + 1 ? 'bg-[var(--gov-red)] text-white' : 'bg-stone-200 text-stone-500'}`}>{index + 1}</span>
                    <span className={`hidden text-[13px] sm:inline ${stepNumber === index + 1 ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>{label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {checkStep === 'vendor' ? (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <h2 className="text-[22px] font-bold text-stone-800">选择校对引擎</h2>
                  <p className="mt-2 text-[14px] leading-6 text-stone-500">先确定校对服务，再上传文档进入 WebOffice 校对结果页。</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { id: '黑马校对' as const, title: '黑马校对', desc: '适合错别字、标点、格式规范与常见敏感词快速检查。', tone: 'from-[#fff1f0] to-white' },
                    { id: '人民校对' as const, title: '人民校对', desc: '适合政策表述、政治术语、官方口径与严肃文稿校对。', tone: 'from-[#fef6e8] to-white' },
                  ].map((vendor) => {
                    const selected = checkVendor === vendor.id;
                    return (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => setCheckVendor(vendor.id)}
                        className={`relative rounded-[14px] border bg-gradient-to-br ${vendor.tone} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)] ${selected ? 'border-[var(--gov-red)] ring-2 ring-[rgba(200,16,46,0.1)]' : 'border-black/[0.08]'}`}
                      >
                        <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] ${selected ? 'bg-[var(--gov-red)] text-white' : 'bg-white text-[#667085] shadow-sm'}`}><FileCheck2 size={20} /></span>
                        <h3 className="text-[16px] font-bold text-[#202124]">{vendor.title}</h3>
                        <p className="mt-2 text-[12px] leading-6 text-[#667085]">{vendor.desc}</p>
                        {selected ? <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gov-red)] text-white"><CheckCircle size={14} /></span> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-7 flex justify-end border-t border-black/[0.06] pt-5">
                  <button type="button" onClick={() => setCheckStep('upload')} className="inline-flex h-11 items-center gap-2 rounded-[9px] bg-[var(--gov-red)] px-5 text-[14px] font-semibold text-white hover:bg-[var(--gov-red-deep)]">下一步：上传待校对文件<ChevronDown size={15} className="-rotate-90" /></button>
                </div>
              </div>
            ) : checkStep === 'upload' ? (
              <div className="workflow-upload-panel">
                <div className="mb-6">
                  <h2 className="text-[22px] font-bold text-stone-800">上传待校对文件</h2>
                  <p className="mt-2 text-[14px] leading-6 text-stone-500">当前使用 {checkVendor}。上传、从知识库选择或粘贴文本后，将直接进入 WebOffice 校对结果。</p>
                </div>
                {checkSourceFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="workflow-upload-icon h-10 w-10 shrink-0"><FileText size={18} /></div>
                      <div className="min-w-0"><p className="truncate text-[12px] font-medium text-stone-800">{checkSourceFile.name}</p><p className="mt-1 text-[10px] text-stone-400">{checkSourceFile.size} · 已完成内容解析</p></div>
                    </div>
                    <button type="button" onClick={() => { setCheckSourceFile(null); setCheckSourceText(''); }} className="rounded p-2 text-stone-400 hover:bg-white hover:text-stone-600" aria-label="移除文件"><Trash2 size={15} /></button>
                  </div>
                ) : (
                  <div className="workflow-upload-grid">
                    <label className="workflow-upload-option workflow-upload-option-primary cursor-pointer">
                      <span>
                        <input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={handleCheckSourceUpload} />
                        <span className="workflow-upload-icon"><FileUp size={21} /></span>
                        <span className="workflow-upload-title">上传本地文件</span>
                        <span className="workflow-upload-description">适合本地待校对草稿。</span>
                      </span>
                      <span className="workflow-upload-action">点击选择文件</span>
                    </label>
                    <button type="button" onClick={() => openMyCloudDocumentPicker('check')} className="workflow-upload-option">
                      <span>
                        <span className="workflow-upload-icon"><Folder size={21} /></span>
                        <span className="workflow-upload-title">从知识库选择</span>
                        <span className="workflow-upload-description">从知识库中选择待校对文档。</span>
                      </span>
                      <span className="workflow-upload-action">打开知识库</span>
                    </button>
                    <button type="button" onClick={() => openTextPasteModal('check')} className="workflow-upload-option">
                      <span>
                        <span className="workflow-upload-icon"><FileText size={21} /></span>
                        <span className="workflow-upload-title">粘贴文本内容</span>
                        <span className="workflow-upload-description">直接粘贴待校对正文。</span>
                      </span>
                      <span className="workflow-upload-action">输入文本</span>
                    </button>
                  </div>
                )}
                <div className="mt-6 flex justify-between">
                  <button type="button" onClick={() => setCheckStep('vendor')} className="text-[11px] font-medium text-stone-500 hover:text-stone-700">返回选择校对引擎</button>
                  <span className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#f5f5f5] px-3 text-[12px] font-semibold text-[#667085]">{checkSourceFile ? '已上传，正在进入校对...' : '选择文件后自动校对'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-white p-12 shadow-sm">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 size={32} className="animate-spin text-[var(--gov-red)]" />
                  <p className="text-[13px] text-stone-500">正在校对文档...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLayoutWorkspace = () => {
    const stepNumber = layoutStep === 'upload' ? 1 : layoutStep === 'requirements' ? 2 : 3;
    const hasResult = layoutStep === 'result' && resultText;
    const selectedRedTemplateStyleLabel = RED_TEMPLATE_STYLE_OPTIONS.find((style) => style.id === selectedRedTemplateStyle)?.label ?? '标准红头';
    const selectedFormatTemplateStyleLabel = FORMAT_TEMPLATE_STYLE_OPTIONS.find((style) => style.id === selectedFormatTemplateStyle)?.label ?? DOCUMENT_FORMAT_LABEL;

    if (hasResult) {
      return (
        <motion.div key="layout-result" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-neutral-50/50 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLayoutStep('requirements')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:bg-neutral-200/60 hover:text-stone-600"
                aria-label="返回上一步"
              >
                <ArrowLeft size={14} />
              </button>
              <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
              <span className="text-[11px] font-medium text-[var(--gov-text)]">智能排版</span>
              <span className="text-[10px] text-stone-300">|</span>
              <span className="text-[11px] text-[var(--gov-text-muted)]">排版结果</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCopy(resultText)}
                className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-[var(--gov-text-muted)] transition hover:bg-neutral-200/60 hover:text-[var(--gov-text)]"
              >
                <Copy size={12} />
                {copied ? '已复制' : '复制全文'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-b border-[rgba(124,58,237,0.14)] bg-[#F7F3FF] px-4 py-1.5 text-[11px] text-[#5B21B6]">
            {layoutEnableRedTemplate ? <Stamp size={13} /> : <Sparkles size={13} />}
            <span>
              {[
                layoutEnableFormat ? `已按 ${selectedFormatTemplateStyleLabel} 排版` : '',
                layoutEnableRedTemplate ? `已完成公文套红：${selectedRedTemplateStyleLabel}` : '',
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
          <WebOfficeEditor
            value={resultText}
            onChange={setResultText}
            documentTitle="智能排版结果"
            variant="draft"
          />
        </motion.div>
      );
    }

    if (layoutStep === 'result' && !resultText && isProcessing) {
      return (
        <motion.div key="layout-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-[var(--gov-red)]" />
          <p className="text-[13px] text-stone-500">正在生成排版文档...</p>
        </motion.div>
      );
    }

    return (
      <motion.div key={`layout-${layoutStep}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => layoutStep === 'upload' ? openView('home') : setLayoutStep('upload')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:bg-neutral-200/60 hover:text-stone-600"
              aria-label="返回上一步"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
            <span className="text-[14px] font-bold text-[var(--gov-text)]">智能排版</span>
            <span className="text-[10px] text-stone-300">|</span>
            <span className="text-[13px] text-[var(--gov-text-muted)]">一键排版或公文套红，完成版式整理和输出</span>
          </div>
          <span className="text-[12px] text-[var(--gov-text-muted)]">步骤 {stepNumber}/3</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-100/50 px-5 py-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="mb-7 flex items-center justify-center gap-2">
              {['上传待排版文件', '选择排版方式', '生成排版文档'].map((label, index) => (
                <React.Fragment key={label}>
                  {index > 0 ? <div className={`h-px w-12 ${stepNumber > index ? 'bg-[var(--gov-red)]' : 'bg-stone-200'}`} /> : null}
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${stepNumber >= index + 1 ? 'bg-[var(--gov-red)] text-white' : 'bg-stone-200 text-stone-500'}`}>{index + 1}</span>
                    <span className={`hidden text-[13px] sm:inline ${stepNumber === index + 1 ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>{label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {layoutStep === 'upload' ? (
              <div className="workflow-upload-panel copy-upload-panel">
                <div className="mb-6">
                  <h2 className="text-[22px] font-bold text-stone-800">上传待排版文件</h2>
                  <p className="mt-2 text-[14px] leading-6 text-stone-500">上传一份待处理公文，AI 将根据选择完成规范排版或公文套红。</p>
                </div>
                {layoutSourceFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/60 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--gov-red)] shadow-sm"><FileText size={18} /></div>
                      <div className="min-w-0"><p className="truncate text-[12px] font-medium text-stone-800">{layoutSourceFile.name}</p><p className="mt-1 text-[10px] text-stone-400">{layoutSourceFile.size} · 已完成内容解析</p></div>
                    </div>
                    <button type="button" onClick={() => { setLayoutSourceFile(null); setLayoutSourceText(''); }} className="rounded p-2 text-stone-400 hover:bg-white hover:text-stone-600" aria-label="移除文件"><Trash2 size={15} /></button>
                  </div>
                ) : (
                  <div className="workflow-upload-grid copy-upload-grid">
                    <label className="workflow-upload-option workflow-upload-option-primary copy-upload-option copy-upload-option-primary cursor-pointer">
                      <span className="copy-upload-content">
                        <input type="file" accept=".doc,.docx,.pdf,.txt" className="sr-only" onChange={handleLayoutSourceUpload} />
                        <span className="copy-upload-visual copy-upload-visual-local" aria-hidden="true">
                          <span className="copy-upload-screen">
                            <span />
                            <span />
                            <span />
                          </span>
                          <span className="copy-upload-bubble copy-upload-bubble-left" />
                          <span className="copy-upload-bubble copy-upload-bubble-right" />
                          <span className="workflow-upload-icon copy-upload-icon"><FileUp size={19} /></span>
                        </span>
                        <span className="workflow-upload-title">上传本地文件</span>
                        <span className="workflow-upload-description">适合本地待排版草稿。</span>
                      </span>
                      <span className="workflow-upload-action">点击选择文件</span>
                    </label>
                    <button type="button" onClick={() => openMyCloudDocumentPicker('layout')} className="workflow-upload-option copy-upload-option">
                      <span className="copy-upload-content">
                        <span className="copy-upload-visual copy-upload-visual-library" aria-hidden="true">
                          <span className="copy-upload-folder-back" />
                          <span className="copy-upload-folder-front" />
                          <span className="copy-upload-note" />
                          <span className="workflow-upload-icon copy-upload-icon"><Folder size={19} /></span>
                        </span>
                        <span className="workflow-upload-title">从知识库选择</span>
                        <span className="workflow-upload-description">从知识库中选择待排版文档。</span>
                      </span>
                      <span className="workflow-upload-action">打开知识库</span>
                    </button>
                    <button type="button" onClick={() => openTextPasteModal('layout')} className="workflow-upload-option copy-upload-option">
                      <span className="copy-upload-content">
                        <span className="copy-upload-visual copy-upload-visual-text" aria-hidden="true">
                          <span className="copy-upload-paper">
                            <span />
                            <span />
                            <span />
                            <span />
                          </span>
                          <span className="copy-upload-mark" />
                          <span className="workflow-upload-icon copy-upload-icon"><FileText size={19} /></span>
                        </span>
                        <span className="workflow-upload-title">粘贴文本内容</span>
                        <span className="workflow-upload-description">直接粘贴待排版正文。</span>
                      </span>
                      <span className="workflow-upload-action">输入文本</span>
                    </button>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button type="button" disabled={!layoutSourceFile} onClick={() => setLayoutStep('requirements')} className="rounded-[9px] bg-[var(--gov-red)] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300">下一步，选择排版方式</button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2.5">
                  <FileText size={15} className="text-[var(--gov-red)]" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-stone-600">待排版文件：{layoutSourceFile?.name}</span>
                  <button type="button" onClick={() => setLayoutStep('upload')} className="text-[10px] font-medium text-[var(--gov-red)]">更换文件</button>
                </div>
                <div className="space-y-5">
                  <div className="space-y-3">
                    <label className="text-[12px] font-semibold text-stone-700">选择排版方式</label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          id: 'format' as const,
                          title: '一键排版',
                          desc: selectedFormatTemplateStyleLabel,
                          icon: Sparkles,
                          enabled: layoutEnableFormat,
                        },
                        {
                          id: 'red-template' as const,
                          title: '公文套红',
                          desc: '支持多种类型公文一键套红',
                          icon: Stamp,
                          enabled: layoutEnableRedTemplate,
                        },
                      ].map((mode) => {
                        const selected = mode.enabled;
                        const Icon = mode.icon;
                        const cannotDisable = selected && ((mode.id === 'format' && !layoutEnableRedTemplate) || (mode.id === 'red-template' && !layoutEnableFormat));
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => handleToggleLayoutCapability(mode.id)}
                            className={`group relative flex min-h-[176px] items-stretch gap-4 rounded-lg border p-4 text-left transition ${
                              selected
                                ? 'border-[var(--gov-red)] bg-[var(--gov-red-soft)] ring-1 ring-[rgba(200,16,46,0.12)]'
                                : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-[var(--gov-red)] text-white' : 'bg-stone-100 text-stone-500'}`}>
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-[14px] font-semibold ${selected ? 'text-[var(--gov-red)]' : 'text-stone-800'}`}>{mode.title}</div>
                              <p className="mt-1.5 text-[11px] leading-[18px] text-stone-500">{mode.desc}</p>
                              {cannotDisable ? (
                                <p className="mt-1 text-[10px] text-stone-400">至少保留一种排版处理方式</p>
                              ) : null}
                              <div className="mt-4 flex justify-center">
                                <div className={`w-full max-w-[92px] overflow-hidden rounded border bg-white ${selected ? 'border-[rgba(200,16,46,0.24)]' : 'border-stone-200'}`} style={{ aspectRatio: '3/4' }}>
                                  <div className="flex h-full flex-col px-2 py-2.5">
                                    {mode.id === 'red-template' ? (
                                      <>
                                        <div className="text-center text-[5px] font-bold tracking-wider text-[var(--gov-red)]">中国智海建设集团文件</div>
                                        <div className="mt-1 h-0.5 w-full rounded-full bg-[var(--gov-red)]" />
                                        <div className="mt-1 text-center text-[3.5px] text-stone-300">智海办〔2026〕18号</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="mx-auto h-0.5 w-10 rounded-full bg-stone-400" />
                                        <div className="mt-1.5 text-center text-[5px] font-semibold text-stone-600">公文标题</div>
                                      </>
                                    )}
                                    <div className="mt-2 flex-1 space-y-1">
                                      <div className="h-0.5 w-4/5 rounded bg-stone-300" />
                                      <div className="h-0.5 w-full rounded bg-stone-200" />
                                      <div className="h-0.5 w-11/12 rounded bg-stone-200" />
                                      <div className="h-0.5 w-3/4 rounded bg-stone-200" />
                                      <div className="h-0.5 w-5/6 rounded bg-stone-200" />
                                    </div>
                                    <div className={mode.id === 'red-template' ? 'h-0.5 w-full rounded-full bg-[var(--gov-red)] opacity-60' : 'ml-auto h-0.5 w-8 rounded bg-stone-300'} />
                                  </div>
                                </div>
                              </div>
                            </div>
                            {selected ? (
                              <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gov-red)] text-white">
                                <CheckCircle size={13} />
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] leading-[18px] text-stone-500">可单独执行一键排版，也可同时勾选公文套红后生成套红版式文档。</p>
                  </div>

                  {layoutEnableFormat ? (
                    <div className="space-y-3 border-t border-stone-100 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[12px] font-semibold text-stone-700">选择排版模板</label>
                        <span className="text-[10px] text-stone-400">默认：{DOCUMENT_FORMAT_LABEL}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        {FORMAT_TEMPLATE_STYLE_OPTIONS.map((style) => {
                          const selected = selectedFormatTemplateStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setSelectedFormatTemplateStyle(style.id)}
                              className={`relative rounded-lg border px-3 py-3 text-left transition ${
                                selected
                                  ? 'border-[var(--gov-red)] bg-[var(--gov-red-soft)] text-[var(--gov-red)]'
                                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                              }`}
                            >
                              <span className="block text-[12px] font-semibold leading-5">{style.label}</span>
                              <span className="mt-1.5 block text-[10px] leading-4 text-stone-500">{style.desc}</span>
                              <div className={`mt-3 h-16 rounded-[7px] border bg-white px-2 py-2 ${selected ? 'border-[rgba(200,16,46,0.28)]' : 'border-stone-200'}`}>
                                <div className="mx-auto h-1 w-12 rounded-full bg-stone-300" />
                                <div className="mx-auto mt-2 h-1.5 w-20 rounded-full bg-stone-400" />
                                <div className="mt-3 space-y-1">
                                  <div className="h-1 w-full rounded bg-stone-200" />
                                  <div className="h-1 w-11/12 rounded bg-stone-200" />
                                  <div className="h-1 w-4/5 rounded bg-stone-200" />
                                </div>
                              </div>
                              {selected ? <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gov-red)] text-white"><CheckCircle size={12} /></span> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {layoutEnableRedTemplate ? (
                    <div className="space-y-3 border-t border-stone-100 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[12px] font-semibold text-stone-700">选择套红板式</label>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {RED_TEMPLATE_STYLE_OPTIONS.map((style) => {
                          const selected = selectedRedTemplateStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setSelectedRedTemplateStyle(style.id)}
                              className={`relative flex flex-col items-center rounded-lg border px-3 py-3 text-center transition ${
                                selected
                                  ? 'border-[var(--gov-red)] bg-[var(--gov-red-soft)] text-[var(--gov-red)]'
                                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                              }`}
                            >
                              <span className="text-[12px] font-semibold">{style.label}</span>
                              <div className={`mt-2 w-full max-w-[92px] overflow-hidden rounded border bg-white ${selected ? 'border-[rgba(200,16,46,0.28)]' : 'border-stone-200'}`} style={{ aspectRatio: '3/4' }}>
                                <div className="flex h-full flex-col px-1.5 py-2">
                                  <div className="text-center text-[4.5px] font-bold leading-tight tracking-wider text-[var(--gov-red)]">{style.templateTitle}</div>
                                  <div className="mt-1 h-0.5 w-full rounded-full bg-[var(--gov-red)]" />
                                  <div className="mt-1 text-center text-[3.5px] text-stone-400">{style.documentNo}</div>
                                  {style.id !== 'meeting' ? <div className="mt-0.5 text-center text-[3.5px] text-stone-400">签发人：{style.signer}</div> : null}
                                  <div className="mt-2 flex-1 space-y-1">
                                    <div className="mx-auto h-0.5 w-4/5 rounded bg-stone-300" />
                                    <div className="h-0.5 w-full rounded bg-stone-200" />
                                    <div className="h-0.5 w-10/12 rounded bg-stone-200" />
                                    <div className="h-0.5 w-11/12 rounded bg-stone-200" />
                                  </div>
                                  <div className="h-0.5 w-full rounded-full bg-[var(--gov-red)] opacity-60" />
                                </div>
                              </div>
                              {selected ? (
                                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gov-red)] text-white">
                                  <CheckCircle size={12} />
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button type="button" onClick={() => setLayoutStep('upload')} className="text-[11px] font-medium text-stone-500 hover:text-stone-700">返回上一步</button>
                  <button type="button" disabled={isProcessing} onClick={handleRunTemplate} className="inline-flex items-center gap-2 rounded-lg bg-[var(--gov-red)] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-stone-300">
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{isProcessing ? '正在排版...' : '确认，生成排版文档'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderRecentDocumentWorkspace = () => {
    const isDirectWebOffice = currentView === 'weboffice';
    return (
    <motion.div key={isDirectWebOffice ? 'weboffice' : 'recent-editor'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-neutral-50/50 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => openView('home')}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-stone-400 hover:bg-neutral-200/60 hover:text-stone-600"
            aria-label={isDirectWebOffice ? '返回工作台首页' : '返回公文写作首页'}
          >
            <ArrowLeft size={14} />
          </button>
          <div className="h-3 w-px shrink-0 bg-[rgba(35,31,32,0.1)]" />
          <span className="truncate text-[11px] font-medium text-[var(--gov-text)]">{recentDocumentTitle || '未命名文档'}</span>
          <span className="hidden text-[10px] text-stone-300 sm:inline">|</span>
          <span className="hidden text-[11px] text-[var(--gov-text-muted)] sm:inline">{isDirectWebOffice ? '打开文稿编辑器' : '最近编辑'}</span>
        </div>
        <span className="shrink-0 text-[10px] text-stone-400">{recentDocumentContent.replace(/\s/g, '').length} 字</span>
      </div>
      <WebOfficeEditor
        value={recentDocumentContent}
        onChange={setRecentDocumentContent}
        documentTitle={recentDocumentTitle || '未命名文档'}
      />
    </motion.div>
  );
  };

  const renderWorkspace = () => (
    <motion.div key={currentView} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-5 xl:flex-row">
      <div className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-[rgba(35,31,32,0.08)] bg-white p-5 shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
        <div className="flex items-start gap-3 border-b border-[rgba(35,31,32,0.06)] pb-4">
          <button
            type="button"
            onClick={() => openView('home')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-700"
            aria-label="返回首页"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            {currentTaskMeta ? <PrototypeIcon name={currentTaskMeta.iconKey} size={42} alt={`${currentTaskMeta.title}图标`} /> : <PrototypeIcon name="feature-ai-write" size={42} alt="写作工具图标" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[var(--gov-text)]">{currentTaskMeta?.title ?? '写作工具'}</h2>
            <p className="mt-1 text-[12px] leading-[20px] text-[var(--gov-text-muted)]">{currentTaskMeta?.subtitle}</p>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{renderWorkspaceForm()}</div>

        <div className="mt-4 border-t border-[rgba(35,31,32,0.06)] pt-4">
          <div className="mb-3 text-[11px] text-[var(--gov-text-muted)]">计算引擎：自研智海-国企专属公文 LLM</div>
          <button
            type="button"
            disabled={isProcessing || (currentView === 'copy' && !imitateTopic.trim())}
            onClick={() => {
              if (currentView === 'copy') handleRunImitate();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gov-red)] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isProcessing ? '正在生成结果...' : '立即运行'}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-[rgba(35,31,32,0.08)] bg-white p-5 shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
        <div className="flex items-center justify-between border-b border-[rgba(35,31,32,0.06)] pb-3">
          <div className="text-[13px] font-semibold text-[var(--gov-text)]">结果区</div>
          {resultText ? (
            <button type="button" onClick={() => handleCopy(resultText)} className="text-[11px] font-medium text-[#2563EB] transition hover:text-[#1D4ED8]">
              {copied ? '已复制' : '复制全文'}
            </button>
          ) : null}
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {isProcessing ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center space-y-3 rounded-[18px] border border-dashed border-[rgba(35,31,32,0.1)] bg-[var(--gov-panel-muted)] text-[var(--gov-text-muted)]">
              <Loader2 size={18} className="animate-spin text-[var(--gov-red)]" />
              <p className="text-[12px] font-medium">政务物理隔离安全审计通过，结果正在生成...</p>
            </div>
          ) : proofreadResult ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-amber-700 shadow-[0_6px_16px_rgba(15,15,15,0.04)]">
                  {proofreadResult.score}
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[var(--gov-text)]">公文可交付级评分：{proofreadResult.score} 分</h4>
                  <p className="mt-1 text-[11px] leading-[18px] text-[var(--gov-text-muted)]">
                    检测到 {proofreadResult.issues.length} 处排版或用语问题，建议修正后再进入正式发文流程。
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {proofreadResult.issues.map((issue, index) => (
                  <div
                    key={`${issue.type}-${index}`}
                    className={`rounded-2xl border p-4 ${
                      issue.level === 'critical'
                        ? 'border-red-100 bg-red-50/30'
                        : issue.level === 'warn'
                          ? 'border-amber-100 bg-amber-50/30'
                          : 'border-blue-100 bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold text-[var(--gov-text)]">{issue.type}</span>
                      <span className="text-[10px] text-[var(--gov-text-muted)]">问题 {index + 1}</span>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white/80 bg-white/90 p-3">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--gov-text-muted)]">草件原文</div>
                        <div className="mt-2 text-[12px] leading-[20px] text-[var(--gov-text)] line-through decoration-red-400/70">{issue.original}</div>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-700">智能建议修复</div>
                        <div className="mt-2 text-[12px] leading-[20px] text-[var(--gov-text)]">{issue.suggested}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] leading-[18px] text-[var(--gov-text-muted)]">{issue.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : resultText ? (
            <div className="rounded-[18px] border border-[rgba(35,31,32,0.06)] bg-[var(--gov-panel-muted)] p-5 text-[13px] leading-7 text-[var(--gov-text)] whitespace-pre-wrap">
              {resultText}
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center space-y-3 rounded-[18px] border border-dashed border-[rgba(35,31,32,0.1)] bg-[var(--gov-panel-muted)] text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(35,31,32,0.08)] bg-white text-[var(--gov-red)] shadow-[0_8px_20px_rgba(15,15,15,0.03)]">
                <Sparkles size={18} />
              </div>
              <p className="text-[12px] font-medium text-[var(--gov-text-muted)]">点击左侧“立即运行”，结果会在这里实时展示。</p>
              <p className="text-[10px] text-[#9AA4B2]">支持复制结果、继续修改和套入后续流程。</p>
            </div>
          )}
        </div>

        <ToolbarBlock
          uploadedFiles={uploadedFiles}
          selectedConnectors={selectedConnectors}
          selectedModel={selectedModel}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          setSelectedModel={setSelectedModel}
          handleSimulateUpload={handleSimulateUpload}
          handleClearFile={handleClearFile}
          handleToggleConnector={handleToggleConnector}
        />
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        {currentView === 'home'
          ? renderHome()
          : currentView === 'quick-create'
            ? renderHome('quick-create')
          : currentView === 'conversation-detail'
            ? renderConversationDetail()
            : currentView === 'write'
              ? renderWriteWorkspace()
              : currentView === 'copy'
                ? renderCopyWorkspace()
                : currentView === 'polish'
                  ? renderPolishWorkspace()
                  : currentView === 'check'
                  ? renderCheckWorkspace()
                  : currentView === 'template-layout'
                    ? renderLayoutWorkspace()
                    : currentView === 'ppt'
                      ? renderPptWorkspace()
                      : currentView === 'table'
                        ? renderTableWorkspace()
                        : currentView === 'recent-editor' || currentView === 'weboffice'
                          ? renderRecentDocumentWorkspace()
                          : renderWorkspace()}
      </AnimatePresence>
      {renderDocumentPickerModal()}
      {renderTextPasteModal()}
    </div>
  );
}

function UploadHint({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[16px] border border-dashed border-stone-300 bg-stone-50 px-3.5 py-4 text-left transition hover:bg-stone-100/80"
    >
      <FileUp size={16} className="text-[#2563EB]" />
      <div>
        <div className="text-[11px] font-semibold text-stone-700">{title}</div>
        <div className="mt-1 text-[11px] leading-[18px] text-stone-500">{desc}</div>
      </div>
    </button>
  );
}

function DeepThinkingToggle({
  enabled,
  onChange,
  compact = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`deep-thinking-toggle ${enabled ? 'deep-thinking-toggle-active' : ''} ${compact ? 'deep-thinking-toggle-compact' : ''}`}
    >
      <span className="deep-thinking-toggle-icon">
        {enabled ? <CheckCircle size={14} /> : <Sparkles size={14} />}
      </span>
      <span>深度思考</span>
    </button>
  );
}

function ModelSelectControl({
  selectedModel,
  onChange,
  compact = false,
}: {
  selectedModel: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label className={`model-select-control ${compact ? 'model-select-control-compact' : ''}`}>
      <Cpu size={14} className="model-select-control-icon" />
      <select value={selectedModel} onChange={(event) => onChange(event.target.value)} aria-label="选择模型">
        {MODEL_OPTIONS.map((model) => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>
      <ChevronDown size={14} className="model-select-control-arrow" />
    </label>
  );
}

function ToolbarBlock({
  uploadedFiles,
  selectedConnectors,
  selectedModel,
  activeDropdown,
  setActiveDropdown,
  setSelectedModel,
  handleSimulateUpload,
  handleClearFile,
  handleToggleConnector
}: {
  uploadedFiles: UploadedMockFile[];
  selectedConnectors: string[];
  selectedModel: string;
  activeDropdown: 'model' | 'connector' | null;
  setActiveDropdown: (value: 'model' | 'connector' | null) => void;
  setSelectedModel: (value: string) => void;
  handleSimulateUpload: () => void;
  handleClearFile: (index: number) => void;
  handleToggleConnector: (name: string) => void;
}) {
  const CONNECTOR_OPTIONS = [
    { name: '致远OA', desc: '国企收发文、签呈及审批流底盘' },
    { name: '金山文档', desc: 'WPS 云端多人协同与文件库' },
    { name: '用友ERP', desc: '核心账期与项目凭证' },
    { name: '泛微OA', desc: '流程引擎及级联事务链' },
    { name: '企业微信', desc: '企业通讯与移动办公入口' }
  ];

  return (
    <div className="mt-4 border-t border-[rgba(35,31,32,0.06)] pt-4">
      {uploadedFiles.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {uploadedFiles.map((file, index) => (
            <div key={file.name} className="inline-flex items-center gap-2 rounded-full border border-[rgba(35,31,32,0.08)] bg-[var(--gov-panel-muted)] px-3 py-1.5 text-[10px] text-[var(--gov-text)]">
              <File size={11} className="text-[#2563EB]" />
              <span>{file.name}</span>
              <span className="text-[#9AA4B2]">({file.size})</span>
              <button type="button" onClick={() => handleClearFile(index)} className="text-[#9AA4B2] transition hover:text-[#DC2626]">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSimulateUpload}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-[10.5px] font-medium text-stone-600 transition hover:bg-neutral-50"
        >
          <Paperclip size={12} className="text-stone-500" />
          上传文件
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'connector' ? null : 'connector')}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10.5px] font-medium transition ${
              selectedConnectors.length > 0
                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700'
                : 'border-neutral-200 text-stone-600 hover:bg-neutral-50'
            }`}
          >
            <Network size={12} className={selectedConnectors.length > 0 ? 'text-emerald-700' : 'text-stone-500'} />
            连接器 ({selectedConnectors.length})
            <ChevronDown size={10} className="opacity-60" />
          </button>

          <AnimatePresence>
            {activeDropdown === 'connector' ? (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-0 z-40 mb-2 w-64 rounded-lg border border-neutral-200 bg-white p-2.5 shadow-xl"
              >
                <h4 className="mb-1 border-b border-neutral-100 pb-1.5 text-[11px] font-bold text-stone-800">数据源连接器选择</h4>
                {CONNECTOR_OPTIONS.map((connector) => {
                  const isChecked = selectedConnectors.includes(connector.name);
                  return (
                    <button
                      key={connector.name}
                      type="button"
                      onClick={() => handleToggleConnector(connector.name)}
                      className={`flex w-full items-start gap-2.5 rounded px-2 py-1.5 text-left transition ${isChecked ? 'bg-emerald-50/60' : 'hover:bg-neutral-50'}`}
                    >
                      <input type="checkbox" checked={isChecked} readOnly className="mt-0.5 accent-emerald-600" />
                      <div>
                        <div className={`text-[11px] font-semibold ${isChecked ? 'text-emerald-900' : 'text-stone-700'}`}>{connector.name}</div>
                        <div className="text-[9px] text-stone-400">{connector.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'model' ? null : 'model')}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-[10.5px] font-medium text-stone-600 transition hover:bg-neutral-50"
          >
            <Cpu size={12} className="text-stone-500" />
            {selectedModel}
            <ChevronDown size={10} className="opacity-60" />
          </button>

          <AnimatePresence>
            {activeDropdown === 'model' ? (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-0 z-40 mb-2 w-56 rounded-lg border border-neutral-200 bg-white p-2.5 shadow-xl"
              >
                <h4 className="mb-1 border-b border-neutral-100 pb-1.5 text-[11px] font-bold text-stone-800">切换计算模型算力</h4>
                {MODEL_OPTIONS.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model);
                      setActiveDropdown(null);
                    }}
                    className={`w-full rounded-md px-2.5 py-2 text-left text-[11px] font-medium transition ${
                      selectedModel === model ? 'bg-blue-50/60 text-blue-900' : 'text-stone-600 hover:bg-neutral-50'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/40 px-2.5 py-1.5 text-[10.5px] font-medium text-amber-800">
          <Bot size={12} className="text-amber-700" />
          助手: 公文写作智能体
        </div>
      </div>
    </div>
  );
}
