import React, { useEffect, useMemo, useState } from 'react';
import { DocumentInfo, Role } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, RefreshCw, Save, CheckCircle,
  Clock, Folder, Database, Info,
  ArrowLeft, ChevronDown, ChevronRight, Search, Upload, PenTool,
  MoreHorizontal, Eye, Pencil, MoveRight, Download, Trash2, Copy,
  X, Building2, Globe2, UserRound, FilePlus2, ShieldCheck
} from 'lucide-react';
import WebOfficeEditor from './WebOfficeEditor';
import PrototypeIcon from './PrototypeIcon';

interface DocumentsViewProps {
  documents: DocumentInfo[];
  role: Role;
  onUpdateDocumentContent: (id: string, content: string) => void;
}

interface VisualDoc {
  id: string;
  title: string;
  iconType: 'doc' | 'xls' | 'ppt' | 'violet-sheet' | 'green-sheet';
  collaborators: { name: string; bg: string; text: string }[];
  location: string;
  creator: string;
  lastModified: string;
  ingestStatus?: 'ingesting' | 'success' | 'failed';
  group: 'today' | 'yesterday' | 'week';
  content: string;
}

type PermissionPrincipal = {
  id: string;
  type: 'all' | 'department' | 'user';
  name: string;
  meta: string;
  children?: PermissionPrincipal[];
};

export default function DocumentsView({ documents, role: _role, onUpdateDocumentContent }: DocumentsViewProps) {
  // Navigation State inside Documents Explorer matching the screenshot left navigation
  const [activeMenuId, setActiveMenuId] = useState<string>('recent');
  
  // Search query and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'doc' | 'xls' | 'ppt'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedLibraryIds, setExpandedLibraryIds] = useState<Set<string>>(new Set(['personal']));
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [openFileMenuId, setOpenFileMenuId] = useState<string | null>(null);
  const [libraryNotice, setLibraryNotice] = useState<string | null>(null);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [pathDropdownOpenFor, setPathDropdownOpenFor] = useState<'header' | 'import' | 'new' | null>(null);
  const [actionTargetId, setActionTargetId] = useState<string>('personal');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateDeptLibraryModalOpen, setIsCreateDeptLibraryModalOpen] = useState(false);
  const [departmentLibraryName, setDepartmentLibraryName] = useState('');
  const [departmentCustomFolders, setDepartmentCustomFolders] = useState<Array<{ id: string; label: string; docIds: string[] }>>([]);
  const [customFolderEntries, setCustomFolderEntries] = useState<Array<{ id: string; parentId: string; label: string; docIds: string[] }>>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [permissionTargetDoc, setPermissionTargetDoc] = useState<VisualDoc | null>(null);
  const [permissionTargetLibraryName, setPermissionTargetLibraryName] = useState<string | null>(null);
  const [permissionTargetBatchCount, setPermissionTargetBatchCount] = useState(0);
  const [permissionSelectedIds, setPermissionSelectedIds] = useState<Set<string>>(new Set(['dept-office', 'dept-office-admin', 'user-zhang', 'user-zhao']));
  const [permissionExpandedIds, setPermissionExpandedIds] = useState<Set<string>>(new Set(['all', 'dept-office']));
  
  // Fold / Unfold Within 7 Days Group
  const [isWeekGroupExpanded, setIsWeekGroupExpanded] = useState(true);

  // Editor States (remains extremely full-featured)
  const [selectedDoc, setSelectedDoc] = useState<VisualDoc | null>(null);
  const [editorText, setEditorText] = useState('');
  const [showStatusMessage, setShowStatusMessage] = useState<string | null>(null);

  // Exact mock files from the provided layout image
  const [visualDocs, setVisualDocs] = useState<VisualDoc[]>([
    {
      id: 'vd-1',
      title: '客成双周报2026',
      iconType: 'doc',
      collaborators: [
        { name: '郑', bg: 'bg-emerald-600', text: 'text-white' },
        { name: '刘', bg: 'bg-amber-700', text: 'text-white' },
        { name: '郭', bg: 'bg-rose-700', text: 'text-white' },
        { name: '李', bg: 'bg-stone-600', text: 'text-white' }
      ],
      location: '我收到的',
      creator: '郑健',
      lastModified: '2026-06-15',
      group: 'today',
      content: `客成双周报2026

各省及直辖市客户成功中心：

一、 核心项目进度统计：
截止2026年6月中旬，全国客户成功体系支持项目安全割接，上海临港搬迁项目已进入交付第三阶段，珠海皓创项目正在进行前期排期对标。
本双周总体客户满意度达到 98.4%，整体高位维持。

二、 存在问题与合规建议：
1. 达梦数据库与致远审批会签授权未闭环，已提请法规专家协办。
2. 人员调配方面，郑健、刘娟娟、郭向忠已全额对标到位。`
    },
    {
      id: 'vd-2',
      title: '金山云项目编码规则-2026.6.15',
      iconType: 'doc',
      collaborators: [
        { name: '刘', bg: 'bg-amber-700', text: 'text-white' },
        { name: '郑', bg: 'bg-emerald-600', text: 'text-white' },
        { name: '郭', bg: 'bg-rose-700', text: 'text-white' },
        { name: '我', bg: 'bg-red-700', text: 'text-white' }
      ],
      location: '我收到的',
      creator: '刘娟娟',
      lastModified: '2026-06-15',
      group: 'yesterday',
      content: `金山云项目编码规则-2026.6.15

1. 目的：规范金山云各板块项目在信创环境下的统一代码标识符体系。
2. 编码框架：ZS-LAW-2026_HN-[四位流水序号]
3. 适用范围：所有涉及致远OA、达梦数据库（DM8）和Keycloak统一身份令牌认证的联接项目。
4. 审查：本编码一经生成，将通过SM3算法进行防篡改上链审计。`
    },
    {
      id: 'vd-3',
      title: '上海临港搬迁新疆项目-交付方案',
      iconType: 'doc',
      collaborators: [
        { name: '郭', bg: 'bg-rose-700', text: 'text-white' },
        { name: '刘', bg: 'bg-amber-700', text: 'text-white' },
        { name: '郑', bg: 'bg-emerald-600', text: 'text-white' }
      ],
      location: '我收到的',
      creator: '郭向忠',
      lastModified: '2026-06-15',
      group: 'yesterday',
      content: `上海临港搬迁新疆项目-交付方案

一、 项目概述
依托于临港智算中心，此次搬迁方案涉及206台超算主机设备，并严格对接省属致远数据流会签对标。

二、 技术加固和数据存储
1. 数据底盘：全面采用达梦关系型数据库，设立独立 LAW_SCHEMA 段隔离。
2. 数据安全：贯彻国家保密规范，采取脱敏和SM3上链摘要保护。

三、 交付时间表与节点
2026年6月中旬前：完成机架搭设旧图纸审核。
2026年6月下旬前：一键唤醒算力资源检测，进行系统并网。`
    },
    {
      id: 'vd-4',
      title: 'WorkBuddy测试',
      iconType: 'doc',
      collaborators: [],
      location: '智算项目',
      creator: '我',
      lastModified: '昨天 11:04',
      group: 'yesterday',
      content: `WorkBuddy 模块自研功能测试

当前状态：草稿
作者：我 (SSO岗位一岗双责白名单授权)

已成功测试致远办公底座API的自动唤醒和公文纠错反馈能力。整体排版完全对标 GB/T 9704-2012 政务公文标准体系。`
    },
    {
      id: 'vd-5',
      title: 'AI办公一体机集群产品特性介绍.pptx',
      iconType: 'ppt',
      collaborators: [
        { name: '郑', bg: 'bg-emerald-600', text: 'text-white' },
        { name: '李', bg: 'bg-stone-600', text: 'text-white' },
        { name: '郭', bg: 'bg-rose-700', text: 'text-white' }
      ],
      location: '我收到的',
      creator: '郑健',
      lastModified: '2026-06-09',
      group: 'week',
      content: `AI办公一体机集群产品特性介绍.pptx

Slide 1: 信创安全AI协同办公设备
- 全栈高度适配自主产权中间件
- 支持达梦(DM8)一键挂载
- 与致远OA数据流实现100%同态打通

Slide 2: 合规数字专家群
- 面向公文写作、合同审查等多场景
- AI自动排版纠错、政治术语核校
- 敏感流数据多端自动脱敏防不落盘`
    },
    {
      id: 'vd-6',
      title: '超算项目配置清单-0609-206台.xlsx',
      iconType: 'xls',
      collaborators: [
        { name: '赵', bg: 'bg-stone-700', text: 'text-white' },
        { name: '刘', bg: 'bg-amber-700', text: 'text-white' },
        { name: '郭', bg: 'bg-rose-700', text: 'text-white' }
      ],
      location: '我收到的',
      creator: '赵云镝',
      lastModified: '2026-06-09',
      group: 'week',
      content: `超算配置详情单（Excel表格摘要）：

机房机架 | 服务器数量 | 单体算力限额 | 所有权归属 | 交付备注
--------------------------------------------------------------
A区-01   | 50台       | FP32: 200T   | 智算项目   | 刘娟娟核算通过
B区-04   | 86台       | FP32: 200T   | 智算项目   | 赵云镝复算无误
C区-12   | 70台       | 高可用备份   | 我收到的   | 郑健核对`
    },
    {
      id: 'vd-7',
      title: '北京政务云-防汛重保-2026',
      iconType: 'doc',
      collaborators: [
        { name: '我', bg: 'bg-red-700', text: 'text-white' },
        { name: '刘', bg: 'bg-amber-700', text: 'text-white' },
        { name: '郑', bg: 'bg-emerald-600', text: 'text-white' }
      ],
      location: '我的云文档',
      creator: '我',
      lastModified: '2026-06-12',
      group: 'week',
      content: `北京政务云-防汛重保-2026

北京市行政系统保障处公文草案：

为切实做好2026年度汛期政务数据云底座的容灾和高可用，经研究决定，于2026年6月中旬对以下系统进行靶向治理排查：
1. 防汛调度大屏直联数据库高可用切换
2. 金山协同系统防洪防淹备用机房双因子阻断测试`
    },
    {
      id: 'vd-8',
      title: '组网设备-金山提供.xlsx',
      iconType: 'xls',
      collaborators: [
        { name: '杨', bg: 'bg-slate-600', text: 'text-white' },
        { name: '郭', bg: 'bg-rose-700', text: 'text-white' },
        { name: '我', bg: 'bg-red-700', text: 'text-white' }
      ],
      location: '我收到的',
      creator: '杨柳',
      lastModified: '昨天 16:41',
      group: 'week',
      content: `组网设备配线清单-金山提供：

设备品名 | 采购数量 | 国密支持 | 已备固件版本
-----------------------------------------------
10G主干交换机  | 14套     | 支持SM3/SM4 | Ver8.4.2
安全光纤跳线   | 200根    | 物理防护    | 物理规格
信创配线架     | 8套      | 底盘连接    | DM_2026`
    },
    {
      id: 'vd-9',
      title: '上海临港项目-排期计划',
      iconType: 'green-sheet',
      collaborators: [
        { name: '呼', bg: 'bg-stone-600', text: 'text-white' },
        { name: '刘', bg: 'bg-amber-700', text: 'text-white' }
      ],
      location: '智算项目',
      creator: '呼钰皓',
      lastModified: '2025-11-03',
      group: 'week',
      content: `【上海临港项目-排期计划】

- 项目启动及芯片物理部署 (100% 已达成)
- 达梦数据库存储底盘割接 (100% 已达成)
- 致远会签审批前置合规测试 (当前重点推进中)`
    },
    {
      id: 'vd-10',
      title: '政企-新疆哈密星云region',
      iconType: 'green-sheet',
      collaborators: [
        { name: '李', bg: 'bg-stone-700', text: 'text-white' },
        { name: '我', bg: 'bg-red-700', text: 'text-white' }
      ],
      location: '我收到的',
      creator: '李恩铮',
      lastModified: '今天 10:12',
      group: 'week',
      content: `【政企-新疆哈密星云region】

西北区域重大政务云星云Region数据底座：
已完成第二批次全自主核心服务器挂载及同态解密机制验证。所有会签节点已由李恩铮审计并归档。`
    },
    {
      id: 'vd-11',
      title: '登临-中国联通数据中心-机柜图-旧',
      iconType: 'green-sheet',
      collaborators: [
        { name: '呼', bg: 'bg-stone-600', text: 'text-white' },
        { name: '李', bg: 'bg-stone-700', text: 'text-white' }
      ],
      location: '智算项目',
      creator: '呼钰皓',
      lastModified: '2026-06-05',
      group: 'week',
      content: `【登临-中国联通数据中心-机柜图-旧】

该机柜旧图仅作为历史备份查验使用。2026年6月重构后，超算算力节点将移装至全新信创B区，相关审批已走致远OA会签流。`
    },
    {
      id: 'vd-12',
      title: '登临项目-交付材料信息汇总',
      iconType: 'violet-sheet',
      collaborators: [
        { name: '呼', bg: 'bg-stone-600', text: 'text-white' }
      ],
      location: '智算项目',
      creator: '呼钰皓',
      lastModified: '2026-06-14',
      group: 'week',
      content: `【登临项目-交付材料信息汇总】

包括：
- 金山云及本地离线数据脱敏配置规范
- 达梦 DM8 的数据库存储审计安全评测书
- 岗位一岗双责对应法律风险评定结论`
    },
    {
      id: 'vd-13',
      title: '上海临港项目-交付方案',
      iconType: 'violet-sheet',
      collaborators: [
        { name: '呼', bg: 'bg-stone-600', text: 'text-white' },
        { name: '郑', bg: 'bg-emerald-600', text: 'text-white' },
        { name: '刘', bg: 'bg-amber-700', text: 'text-white' }
      ],
      location: '智算项目',
      creator: '呼钰皓',
      lastModified: '2026-01-06',
      group: 'week',
      content: `上海临港项目-交付方案最高规范草案：

1. 交付标准：完美适配国标 GB/T 9704-2012 党政红头规范。
2. 数据保护：对机密文号、IP拓扑实施强脱敏核实，通过SM3鉴别链路保障传输物理安全。`
    }
  ]);

  const librarySections = [
    { id: 'recent', label: '最近', icon: Clock, folders: [] },
    {
      id: 'personal',
      label: '个人知识库',
      icon: UserRound,
      folders: [
        { id: 'personal-drafts', label: '我的文库', docIds: ['vd-1', 'vd-4', 'vd-7', 'vd-9'] },
        { id: 'personal-history', label: '历史写作稿件', docIds: ['vd-2', 'vd-8'] },
      ],
    },
    {
      id: 'department',
      label: '部门知识库',
      icon: Building2,
      folders: [
        { id: 'department-office', label: '办公室常用材料', docIds: ['vd-3', 'vd-5', 'vd-12'] },
        { id: 'department-policy', label: '政策制度汇编', docIds: ['vd-6', 'vd-13'] },
        ...departmentCustomFolders,
      ],
    },
    {
      id: 'public',
      label: '公共素材库',
      icon: Globe2,
      folders: [
        { id: 'public-cases', label: '优秀范文案例', docIds: ['vd-10', 'vd-11'] },
        { id: 'public-data', label: '数据与图表', docIds: ['vd-6', 'vd-8', 'vd-9'] },
      ],
    },
  ];

  const permissionPrincipals: PermissionPrincipal[] = [
    {
      id: 'all',
      type: 'all',
      name: '全部',
      meta: '全员可查看并可在写作问答中引用',
      children: [
        {
          id: 'dept-office',
          type: 'department',
          name: '办公室',
          meta: '一级部门 · 12 人',
          children: [
            {
              id: 'dept-office-admin',
              type: 'department',
              name: '综合行政科',
              meta: '二级部门 · 5 人',
              children: [
                { id: 'user-zhang', type: 'user', name: '张三', meta: '综合文秘' },
                { id: 'user-zhao', type: 'user', name: '赵蕾', meta: '材料专员' },
              ],
            },
            {
              id: 'dept-office-secretary',
              type: 'department',
              name: '秘书科',
              meta: '二级部门 · 7 人',
              children: [
                { id: 'user-chen', type: 'user', name: '陈晨', meta: '会议纪要' },
                { id: 'user-sun', type: 'user', name: '孙宁', meta: '通知起草' },
              ],
            },
          ],
        },
        {
          id: 'dept-policy',
          type: 'department',
          name: '政策研究室',
          meta: '一级部门 · 8 人',
          children: [
            { id: 'dept-policy-research', type: 'department', name: '政策研究一科', meta: '二级部门 · 4 人', children: [{ id: 'user-li', type: 'user', name: '李敏', meta: '政策专员' }] },
            { id: 'dept-policy-data', type: 'department', name: '资料法规科', meta: '二级部门 · 4 人', children: [{ id: 'user-he', type: 'user', name: '何静', meta: '法规整理' }] },
          ],
        },
        {
          id: 'dept-legal',
          type: 'department',
          name: '法律合规中心',
          meta: '一级部门 · 16 人',
          children: [
            { id: 'dept-legal-review', type: 'department', name: '合规审查科', meta: '二级部门 · 9 人', children: [{ id: 'user-wang', type: 'user', name: '王强', meta: '法务专员' }] },
          ],
        },
      ],
    },
  ];

  const renderLibrarySectionIcon = (id: string, active: boolean) => {
    const iconClassName = `knowledge-tree-icon knowledge-tree-icon-${id} ${active ? 'knowledge-tree-icon-active' : ''}`;
    const iconNameById: Record<string, string> = {
      recent: 'knowledge-recent',
      personal: 'knowledge-personal',
      department: 'knowledge-department',
      resource: 'knowledge-resource',
      public: 'knowledge-public',
    };
    return (
      <span className={iconClassName}>
        <PrototypeIcon name={iconNameById[id] ?? 'knowledge-folder'} size={34} />
      </span>
    );
  };

  const renderKnowledgeFolderIcon = (variant: 'tree' | 'row' | 'empty' = 'row') => (
    <span className={`knowledge-folder-icon knowledge-folder-icon-${variant}`}>
      <PrototypeIcon name={variant === 'empty' ? 'knowledge-folder-open' : 'knowledge-folder'} size={variant === 'empty' ? 56 : 30} />
    </span>
  );

  // Helper code to map visual icons beautifully
  const renderIcon = (type: 'doc' | 'xls' | 'ppt' | 'violet-sheet' | 'green-sheet') => {
    if (type === 'doc') {
      return (
        <div className="knowledge-file-icon knowledge-file-icon-doc">
          <svg viewBox="0 0 28 28" aria-hidden="true">
            <path className="knowledge-file-page" d="M7 3.5h9.2L22 9.3v14.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-18a2 2 0 0 1 2-2Z" />
            <path className="knowledge-file-fold" d="M16.2 3.5v5.8H22" />
            <path className="knowledge-file-mark" d="M9 13.2h10M9 17h8M9 20.8h6" />
          </svg>
          <span className="knowledge-file-type-badge">W</span>
        </div>
      );
    }
    if (type === 'xls' || type === 'green-sheet') {
      return (
        <div className="knowledge-file-icon knowledge-file-icon-xls">
          <svg viewBox="0 0 28 28" aria-hidden="true">
            <path className="knowledge-file-page" d="M7 3.5h9.2L22 9.3v14.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-18a2 2 0 0 1 2-2Z" />
            <path className="knowledge-file-fold" d="M16.2 3.5v5.8H22" />
            <path className="knowledge-file-grid" d="M9 12h10M9 16h10M9 20h10M12.4 12v8M16 12v8" />
          </svg>
          <span className="knowledge-file-type-badge">X</span>
        </div>
      );
    }
    if (type === 'ppt') {
      return (
        <div className="knowledge-file-icon knowledge-file-icon-ppt">
          <svg viewBox="0 0 28 28" aria-hidden="true">
            <path className="knowledge-file-page" d="M7 3.5h9.2L22 9.3v14.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-18a2 2 0 0 1 2-2Z" />
            <path className="knowledge-file-fold" d="M16.2 3.5v5.8H22" />
            <path className="knowledge-file-chart" d="M10 20a5 5 0 1 0 0-10v5h5" />
          </svg>
          <span className="knowledge-file-type-badge">P</span>
        </div>
      );
    }
    // violet-sheet style in the screenshot
    return (
      <div className="knowledge-file-icon knowledge-file-icon-violet">
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path className="knowledge-file-page" d="M7 3.5h9.2L22 9.3v14.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-18a2 2 0 0 1 2-2Z" />
          <path className="knowledge-file-fold" d="M16.2 3.5v5.8H22" />
          <path className="knowledge-file-mark" d="M9.5 13.5h9M9.5 17.2h7M9.5 20.8h9" />
        </svg>
        <span className="knowledge-file-type-badge">D</span>
      </div>
    );
  };

  // Documents saved from the writing console
  const documentsFromWriting = useMemo(
    () => documents.filter((d) => d.category === '公文'),
    [documents]
  );

  // Filter & Search computation
  const filteredAndGroupedDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let currentList = visualDocs;

    // Type Filter
    if (fileTypeFilter === 'doc') {
      currentList = currentList.filter(d => d.iconType === 'doc' || d.iconType === 'violet-sheet');
    } else if (fileTypeFilter === 'xls') {
      currentList = currentList.filter(d => d.iconType === 'xls' || d.iconType === 'green-sheet');
    } else if (fileTypeFilter === 'ppt') {
      currentList = currentList.filter(d => d.iconType === 'ppt');
    }

    // Search Query (Title, Location or Creator)
    if (query) {
      currentList = currentList.filter(d => d.title.toLowerCase().includes(query));
    }

    // Grouping
    return {
      today: currentList.filter(d => d.group === 'today'),
      yesterday: currentList.filter(d => d.group === 'yesterday'),
      week: currentList.filter(d => d.group === 'week')
    };
  }, [visualDocs, searchQuery, fileTypeFilter]);

  const visibleLibraryDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let currentList = [...visualDocs];
    const activeSection = librarySections.find((section) => section.id === activeMenuId);
    const allFolderEntries = [...librarySections.flatMap((section) => section.folders), ...customFolderEntries];
    const activeFolder = allFolderEntries.find((folder) => folder.id === activeMenuId);

    if (activeSection?.id === 'department') {
      currentList = [];
    } else if (activeFolder) {
      const allowedIds = new Set(activeFolder.docIds);
      currentList = currentList.filter((doc) => allowedIds.has(doc.id) || doc.location === activeFolder.label);
    } else if (activeSection && activeSection.id !== 'recent') {
      const allowedIds = new Set(activeSection.folders.flatMap((folder) => folder.docIds));
      currentList = currentList.filter((doc) => allowedIds.has(doc.id) || doc.location === activeSection.label);
    }

    if (fileTypeFilter === 'doc') currentList = currentList.filter((doc) => doc.iconType === 'doc' || doc.iconType === 'violet-sheet');
    if (fileTypeFilter === 'xls') currentList = currentList.filter((doc) => doc.iconType === 'xls' || doc.iconType === 'green-sheet');
    if (fileTypeFilter === 'ppt') currentList = currentList.filter((doc) => doc.iconType === 'ppt');
    if (query) currentList = currentList.filter((doc) => doc.title.toLowerCase().includes(query));
    return currentList;
  }, [activeMenuId, customFolderEntries, fileTypeFilter, searchQuery, visualDocs]);

  const baseDirectoryMeta = librarySections.flatMap((section) => [
    { id: section.id, label: section.label, path: section.label },
    ...section.folders.map((folder) => ({ id: folder.id, label: folder.label, path: `${section.label} / ${folder.label}` })),
  ]);
  const directoryMeta = [
    ...baseDirectoryMeta,
    ...customFolderEntries.map((folder) => {
      const parent = baseDirectoryMeta.find((item) => item.id === folder.parentId);
      return {
        id: folder.id,
        label: folder.label,
        path: `${parent?.path ?? '部门知识库'} / ${folder.label}`,
      };
    }),
  ];
  const activeDirectoryLabel = directoryMeta.find((item) => item.id === activeMenuId)?.label ?? '最近';

  const isWritableDirectoryId = (id: string) => id === 'personal' || id === 'personal-drafts' || id.startsWith('department-');
  const actionDirectoryTree = librarySections
    .filter((section) => section.id === 'personal' || section.id === 'department')
    .map((section) => ({
      ...section,
      selectable: section.id === 'personal',
      folders: section.folders.filter((folder) => folder.id !== 'personal-history'),
    }));
  const actionTargetMeta = directoryMeta.find((item) => item.id === actionTargetId) ?? { id: 'personal', label: '个人知识库', path: '个人知识库' };
  const actionTargetLabel = actionTargetMeta.label;
  const actionTargetPath = actionTargetMeta.path;

  useEffect(() => {
    if (isWritableDirectoryId(activeMenuId)) {
      setActionTargetId(activeMenuId);
    }
  }, [activeMenuId]);

  const handleSelectActionTarget = (targetId: string) => {
    setActionTargetId(targetId);
    setPathDropdownOpenFor(null);
  };

  const renderActionTargetPicker = (align: 'left' | 'right' = 'right', context: 'header' | 'import' | 'new' = 'header') => {
    const open = pathDropdownOpenFor === context;
    return <div className="relative">
      <button
        type="button"
        onClick={() => { setPathDropdownOpenFor(open ? null : context); if (context !== 'new') setIsNewMenuOpen(false); setOpenFileMenuId(null); setIsFilterDropdownOpen(false); }}
        className={`knowledge-action-button inline-flex h-9 items-center gap-2 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#344054] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)] ${context === 'new' ? 'w-full max-w-full' : 'max-w-[300px]'}`}
      >
        <Folder size={14} className="shrink-0 text-[#5aa9ee]" />
        <span className="shrink-0 text-[#98a2b3]">文件路径</span>
        <span className="min-w-0 truncate">{actionTargetPath}</span>
        <ChevronDown size={13} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-11 z-[360] ${context === 'new' ? 'w-[268px]' : 'w-[300px]'} rounded-[12px] border border-black/[0.08] bg-white p-2.5 shadow-[0_22px_58px_rgba(15,23,42,0.18)]`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[12px] font-bold text-[#344054]">选择文件路径</span>
              <span className="text-[10px] text-[#98a2b3]">可写目录</span>
            </div>
            <div className="max-h-[300px] overflow-auto pr-1">
              {actionDirectoryTree.map((section) => {
                const sectionSelected = actionTargetId === section.id;
                return (
                  <div key={section.id} className="mb-1.5">
                    <button
                      type="button"
                      disabled={!section.selectable}
                      onClick={() => section.selectable ? handleSelectActionTarget(section.id) : undefined}
                      className={`flex h-9 w-full items-center gap-2 rounded-[9px] px-2.5 text-left transition ${sectionSelected ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : section.selectable ? 'text-[#344054] hover:bg-[#f7f8fa]' : 'cursor-default text-[#667085]'}`}
                    >
                      {renderLibrarySectionIcon(section.id, sectionSelected)}
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{section.label}</span>
                      {section.selectable ? null : <span className="text-[10px] text-[#b2b8c2]">选择子目录</span>}
                    </button>
                    {section.folders.length > 0 ? (
                      <div className="ml-4 mt-1 border-l border-black/[0.07] pl-2">
                        {section.folders.map((folder) => {
                          const selected = actionTargetId === folder.id;
                          return (
                            <div key={folder.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectActionTarget(folder.id)}
                                className={`mt-1 flex h-9 w-full items-center gap-2 rounded-[8px] px-2.5 text-left transition ${selected ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)] shadow-sm' : 'text-[#667085] hover:bg-[#f7f8fa]'}`}
                              >
                                {renderKnowledgeFolderIcon('tree')}
                                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{folder.label}</span>
                                {selected ? <CheckCircle size={13} className="shrink-0 text-[var(--gov-red)]" /> : null}
                              </button>
                              {customFolderEntries.filter((child) => child.parentId === folder.id).map((child) => {
                                const childSelected = actionTargetId === child.id;
                                return (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => handleSelectActionTarget(child.id)}
                                    className={`ml-5 mt-1 flex h-8 w-[calc(100%-20px)] items-center gap-2 rounded-[8px] px-2 text-left transition ${childSelected ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)] shadow-sm' : 'text-[#667085] hover:bg-[#f7f8fa]'}`}
                                  >
                                    {renderKnowledgeFolderIcon('tree')}
                                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{child.label}</span>
                                    {childSelected ? <CheckCircle size={12} className="shrink-0 text-[var(--gov-red)]" /> : null}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>;
  };

  const fileSize = (doc: VisualDoc) => {
    const sizes = ['578.8KB', '5.1MB', '70.1KB', '2.8MB', '333.9KB', '3.6MB', '21.8KB', '14.4MB'];
    const number = Number(doc.id.replace(/\D/g, '')) || 1;
    return sizes[(number - 1) % sizes.length];
  };

  const getDocSource = (doc: VisualDoc): '个人知识库' | '部门知识库' | '素材库' => {
    const personalIds = new Set(librarySections.find((section) => section.id === 'personal')?.folders.flatMap((folder) => folder.docIds) ?? []);
    const departmentIds = new Set(librarySections.find((section) => section.id === 'department')?.folders.flatMap((folder) => folder.docIds) ?? []);
    const publicIds = new Set(librarySections.find((section) => section.id === 'public')?.folders.flatMap((folder) => folder.docIds) ?? []);
    const personalLabels = new Set(['个人知识库', '我的云文档', ...(librarySections.find((section) => section.id === 'personal')?.folders.map((folder) => folder.label) ?? [])]);
    const departmentLabels = new Set(['部门知识库', ...(librarySections.find((section) => section.id === 'department')?.folders.map((folder) => folder.label) ?? [])]);
    const publicLabels = new Set(['公共素材库', '智算项目', '我收到的', ...(librarySections.find((section) => section.id === 'public')?.folders.map((folder) => folder.label) ?? [])]);
    if (departmentIds.has(doc.id) || departmentLabels.has(doc.location)) return '部门知识库';
    if (personalIds.has(doc.id) || personalLabels.has(doc.location) || doc.creator === '我') return '个人知识库';
    if (publicIds.has(doc.id) || publicLabels.has(doc.location)) return '素材库';
    return '个人知识库';
  };

  const canDeleteDoc = (doc: VisualDoc) => activeMenuId.startsWith('department-') || (!isDepartmentLibrary && getDocSource(doc) === '个人知识库');
  const canManageDoc = (doc: VisualDoc) => activeMenuId.startsWith('department-') || (!isDepartmentLibrary && getDocSource(doc) === '个人知识库');
  const isRecentLibrary = activeMenuId === 'recent';
  const showIngestStatus = activeMenuId !== 'personal-history' && (activeMenuId === 'personal' || activeMenuId.startsWith('personal-') || activeMenuId === 'department' || activeMenuId.startsWith('department-'));
  const showSourceColumn = isRecentLibrary;
  const libraryGridClass = showSourceColumn
    ? 'grid-cols-[42px_minmax(320px,1fr)_120px_120px_110px_100px_48px]'
    : showIngestStatus
    ? 'grid-cols-[42px_minmax(360px,1fr)_130px_130px_110px_120px_48px]'
    : 'grid-cols-[42px_minmax(360px,1fr)_140px_140px_100px_48px]';
  const getIngestStatus = (doc: VisualDoc) => {
    if (doc.ingestStatus) return doc.ingestStatus;
    if (doc.id === 'vd-3') return 'failed';
    if (doc.id === 'vd-5') return 'ingesting';
    return 'success';
  };
  const renderIngestStatus = (doc: VisualDoc) => {
    const status = getIngestStatus(doc);
    if (status === 'ingesting') return <span className="inline-flex h-7 items-center rounded-[7px] bg-[#fff7e6] px-2.5 text-[11px] font-semibold text-[#b76e00]">入库中</span>;
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 items-center rounded-[7px] bg-[#fff1f0] px-2.5 text-[11px] font-semibold text-[#d92d20]">解析失败</span>
          <button type="button" onClick={() => showLibraryNotice(`${doc.title} 已重新提交解析`)} className="text-[11px] font-semibold text-[var(--gov-red)] hover:underline">重试</button>
        </span>
      );
    }
    return <span className="inline-flex h-7 items-center rounded-[7px] bg-[#edf8ee] px-2.5 text-[11px] font-semibold text-[#2f7a3d]">入库成功</span>;
  };

  const renderSourceBadge = (doc: VisualDoc) => {
    const source = getDocSource(doc);
    const className = source === '个人知识库'
      ? 'border-[#ffd4dc] bg-[#fff1f4] text-[var(--gov-red-deep)]'
      : source === '部门知识库'
        ? 'border-[#c9defd] bg-[#eef6ff] text-[#2464b4]'
        : 'border-[#cfeedd] bg-[#effaf3] text-[#278051]';
    return <span className={`inline-flex h-7 w-fit items-center rounded-full border px-3 text-[11px] font-bold shadow-[0_5px_14px_rgba(15,23,42,0.04)] ${className}`}>{source}</span>;
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFileIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setOpenFileMenuId(null);
  };

  const showLibraryNotice = (message: string) => {
    setLibraryNotice(message);
    window.setTimeout(() => setLibraryNotice(null), 1800);
  };

  const handleRenameDoc = (doc: VisualDoc) => {
    const nextTitle = window.prompt('请输入新的文件名称', doc.title)?.trim();
    if (!nextTitle || nextTitle === doc.title) return;
    setVisualDocs((items) => items.map((item) => item.id === doc.id ? { ...item, title: nextTitle, lastModified: '刚刚' } : item));
    setOpenFileMenuId(null);
    showLibraryNotice('文件已重命名');
  };

  const handleDownloadDoc = (doc: VisualDoc, quiet = false) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `${doc.title.replace(/\.(docx?|xlsx?|pptx?|txt|pdf)$/i, '')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setOpenFileMenuId(null);
    if (!quiet) showLibraryNotice('文件已开始下载');
  };

  const handleBatchDownloadDocs = () => {
    const docsToDownload = visibleLibraryDocs.filter((doc) => selectedFileIds.has(doc.id));
    if (docsToDownload.length === 0) return;
    if (docsToDownload.length > 20) {
      showLibraryNotice('批量下载最多支持 20 个文件，请减少选择后重试');
      return;
    }
    docsToDownload.forEach((doc) => handleDownloadDoc(doc, true));
  };

  const handleCreateDepartmentLibrary = () => {
    const name = departmentLibraryName.trim();
    if (!name) return;
    const id = `department-custom-${Date.now()}`;
    setDepartmentCustomFolders((items) => [{ id, label: name, docIds: [] }, ...items]);
    setExpandedLibraryIds((current) => new Set([...Array.from(current), 'department']));
    setActiveMenuId(id);
    setIsCreateDeptLibraryModalOpen(false);
    setDepartmentLibraryName('');
    showLibraryNotice('部门知识库已创建');
  };

  const handleDeleteDocs = (ids: Set<string>) => {
    if (ids.size === 0) return;
    const docsToDelete = visualDocs.filter((doc) => ids.has(doc.id));
    if (docsToDelete.some((doc) => !canDeleteDoc(doc))) {
      showLibraryNotice('仅支持删除个人知识库或部门文件夹中的文件');
      setOpenFileMenuId(null);
      return;
    }
    setVisualDocs((items) => items.filter((item) => !ids.has(item.id)));
    setSelectedFileIds(new Set());
    setOpenFileMenuId(null);
    showLibraryNotice(`已删除 ${ids.size} 项`);
  };

  const handleImportFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    if (files.length > 20) {
      showLibraryNotice('单次上传文件数量限制 20 个');
      event.target.value = '';
      return;
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 100 * 1024 * 1024) {
      showLibraryNotice('上传文件总大小不能超过 100M');
      event.target.value = '';
      return;
    }
    const importedDocs = files.map((file, index): VisualDoc => ({
      id: `vd-import-${Date.now()}-${index}`,
      title: file.name,
      iconType: /\.xlsx?$/i.test(file.name) ? 'xls' : /\.pptx?$/i.test(file.name) ? 'ppt' : 'doc',
      collaborators: [],
      location: actionTargetLabel,
      creator: '我',
      lastModified: '刚刚',
      ingestStatus: 'ingesting',
      group: 'today',
      content: `${file.name}\n\n已从本地导入知识库，等待内容解析。`,
    }));
    setVisualDocs((items) => [...importedDocs, ...items]);
    showLibraryNotice(`已导入 ${files.length} 个文件到 ${actionTargetPath}`);
    setIsImportModalOpen(false);
    event.target.value = '';
  };

  const handleCreateLibraryItem = (kind: 'doc' | 'ppt' | 'xls' | 'smart-doc' | 'smart-sheet' | 'multi-sheet' | 'form' | 'folder') => {
    setIsNewMenuOpen(false);
    if (kind === 'folder') {
      if (!isDepartmentLibrary) {
        showLibraryNotice(`已在 ${actionTargetPath} 新建文件夹`);
        return;
      }
      const name = newFolderName.trim();
      if (!name) {
        showLibraryNotice('请先填写文件夹名称');
        setIsNewMenuOpen(true);
        return;
      }
      setCustomFolderEntries((items) => [{ id: `department-folder-${Date.now()}`, parentId: actionTargetId, label: name, docIds: [] }, ...items]);
      setNewFolderName('');
      showLibraryNotice(`已在 ${actionTargetPath} 新建文件夹`);
      return;
    }
    const config = {
      doc: { title: '未命名文字.docx', iconType: 'doc' as const },
      ppt: { title: '未命名演示.pptx', iconType: 'ppt' as const },
      xls: { title: '未命名表格.xlsx', iconType: 'xls' as const },
      'smart-doc': { title: '未命名智能文档', iconType: 'violet-sheet' as const },
      'smart-sheet': { title: '未命名智能表格', iconType: 'green-sheet' as const },
      'multi-sheet': { title: '未命名多维表格', iconType: 'green-sheet' as const },
      form: { title: '未命名表单', iconType: 'violet-sheet' as const },
    }[kind];
    const newDoc: VisualDoc = {
      id: `vd-${Date.now()}`,
      title: config.title,
      iconType: config.iconType,
      collaborators: [],
      location: actionTargetLabel,
      creator: '我',
      lastModified: '刚刚',
      ingestStatus: 'success',
      group: 'today',
      content: '请在此开始编辑知识库内容。',
    };
    setVisualDocs((items) => [newDoc, ...items]);
    handleOpenDoc(newDoc);
    showLibraryNotice(`已在 ${actionTargetPath} 新建文件`);
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    if (!canRenameFolder(folderId)) {
      showLibraryNotice('系统初始化文库不可重命名');
      setOpenFileMenuId(null);
      return;
    }
    const nextName = window.prompt('请输入新的文库名称', currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    if (isDepartmentAdminLibrary(folderId)) {
      setDepartmentCustomFolders((items) => items.map((folder) => folder.id === folderId ? { ...folder, label: nextName } : folder));
      setCustomFolderEntries((items) => items.map((folder) => folder.id === folderId ? { ...folder, label: nextName } : folder));
    }
    setOpenFileMenuId(null);
    showLibraryNotice('文库已重命名');
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!canDeleteFolder(folderId)) {
      showLibraryNotice('系统初始化文库不可删除');
      setOpenFileMenuId(null);
      return;
    }
    if (isDepartmentAdminLibrary(folderId)) {
      setDepartmentCustomFolders((items) => items.filter((folder) => folder.id !== folderId));
      setCustomFolderEntries((items) => items.filter((folder) => folder.id !== folderId && folder.parentId !== folderId));
      if (activeMenuId === folderId) setActiveMenuId('department');
    }
    setOpenFileMenuId(null);
    showLibraryNotice('文库已删除');
  };

  // Handle open document in editor
  const handleOpenDoc = (doc: VisualDoc) => {
    setSelectedDoc(doc);
    setEditorText(doc.content);
  };

  const handleCloseEditor = () => {
    setSelectedDoc(null);
    setShowStatusMessage(null);
  };

  // Simulating refresh action on documents library
  const handleTriggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Handle saving back
  const handleSaveDocToDB = () => {
    if (selectedDoc) {
      setVisualDocs(prev => prev.map(d => {
        if (d.id === selectedDoc.id) {
          return { ...d, content: editorText, lastModified: '刚才' };
        }
        return d;
      }));
      onUpdateDocumentContent(selectedDoc.id, editorText);
      setShowStatusMessage('💾 金钥存盘成功：最新修订版本已高速归档入「达梦信创数据库」LAW_SCHEMA_2026 实例中，SM3 防篡改数字时间戳签名已更新。');
    }
  };

  const selectedCount = selectedFileIds.size;
  const allVisibleSelected = visibleLibraryDocs.length > 0 && visibleLibraryDocs.every((doc) => selectedFileIds.has(doc.id));
  const visibleFolderEntries = [
    ...(librarySections.find((section) => section.id === activeMenuId)?.folders ?? []),
    ...customFolderEntries.filter((folder) => folder.parentId === activeMenuId),
  ];
  const isPublicLibrary = activeMenuId === 'public' || activeMenuId.startsWith('public-');
  const isDepartmentLibrary = activeMenuId === 'department' || activeMenuId.startsWith('department-');
  const isPersonalLibrary = activeMenuId === 'personal' || activeMenuId.startsWith('personal-');
  const canCreateOrImport = !isRecentLibrary && !isPublicLibrary && activeMenuId !== 'personal-history' && activeMenuId !== 'department';
  const selectedDocs = visibleLibraryDocs.filter((doc) => selectedFileIds.has(doc.id));
  const selectedAllDeletable = selectedDocs.length > 0 && selectedDocs.every(canDeleteDoc);
  const showPermissionAction = isDepartmentLibrary;
  const showMoveAction = !isRecentLibrary && !isPublicLibrary;
  const protectedPersonalFolderIds = new Set(['personal-drafts', 'personal-history']);
  const systemDepartmentLibraryIds = new Set(['department-office', 'department-policy']);
  const isDepartmentAdminLibrary = (folderId: string) => folderId.startsWith('department-custom-') || folderId.startsWith('department-folder-');
  const canRenameFolder = (folderId: string) => {
    if (isPublicLibrary) return false;
    if (systemDepartmentLibraryIds.has(folderId)) return false;
    if (isDepartmentAdminLibrary(folderId)) return true;
    return isPersonalLibrary && !protectedPersonalFolderIds.has(folderId);
  };
  const canMoveFolder = (folderId: string) => !isPublicLibrary && !folderId.startsWith('department-') && !protectedPersonalFolderIds.has(folderId);
  const canDeleteFolder = (folderId: string) => {
    if (isPublicLibrary) return false;
    if (isDepartmentAdminLibrary(folderId)) return true;
    return isPersonalLibrary && !protectedPersonalFolderIds.has(folderId);
  };
  const getFolderCreator = (folderId: string) => isDepartmentAdminLibrary(folderId) ? '部门管理员' : '系统';
  const newItemOptions = [
    { id: 'doc', label: '新建文件', className: 'bg-[#2878f0] text-white' },
    { id: 'folder', label: '新建文件夹', className: 'bg-[#2f7cf4] text-white' },
  ] as const;

  const renderNewMenuContent = () => {
    if (isDepartmentLibrary) {
      return (
        <div className="space-y-3">
          <div className="rounded-[10px] border border-black/[0.06] bg-[#fafbfc] px-3 py-2.5">
            <div className="mb-1.5 text-[11px] font-semibold text-[#98a2b3]">文件路径</div>
            {renderActionTargetPicker('left', 'new')}
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold text-[#667085]">文件夹名称</span>
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="请输入文件夹名称"
              className="mt-1 h-9 w-full rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] text-[#344054] outline-none transition placeholder:text-[#b2b8c2] focus:border-[var(--gov-red-line)] focus:ring-2 focus:ring-[var(--gov-red-soft)]"
            />
          </label>
          <button
            type="button"
            onClick={() => handleCreateLibraryItem('folder')}
            disabled={!newFolderName.trim()}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--gov-red)] px-3 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(225,61,78,0.2)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-[#d0d5dd] disabled:shadow-none"
          >
            <Folder size={14} />
            新建文件夹
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {newItemOptions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleCreateLibraryItem(item.id)}
            className="flex min-h-[84px] flex-col items-center justify-center rounded-[9px] border border-transparent px-2 text-center transition hover:border-[var(--gov-red-line)] hover:bg-[var(--gov-red-soft)]/35"
          >
            <span className="knowledge-create-icon">{item.id === 'folder' ? renderKnowledgeFolderIcon('tree') : renderIcon('doc')}</span>
            <span className="mt-2 text-[11px] font-semibold text-[#596170]">{item.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const collectPermissionIds = (node: PermissionPrincipal): string[] => [
    node.id,
    ...(node.children?.flatMap(collectPermissionIds) ?? []),
  ];

  const findPermissionPrincipal = (nodes: PermissionPrincipal[], id: string): PermissionPrincipal | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = node.children ? findPermissionPrincipal(node.children, id) : null;
      if (found) return found;
    }
    return null;
  };

  const selectedPermissionPrincipals = (nodes: PermissionPrincipal[], ancestorSelected = false): PermissionPrincipal[] => nodes.flatMap((node) => {
    const selected = permissionSelectedIds.has(node.id);
    if (selected && !ancestorSelected) return [node];
    return node.children ? selectedPermissionPrincipals(node.children, ancestorSelected || selected) : [];
  });

  const togglePermissionPrincipal = (id: string) => {
    const target = findPermissionPrincipal(permissionPrincipals, id);
    if (!target) return;
    const affectedIds = collectPermissionIds(target);
    setPermissionSelectedIds((current) => {
      const next = new Set(current);
      const allAffectedSelected = affectedIds.every((itemId) => next.has(itemId));
      affectedIds.forEach((itemId) => {
        allAffectedSelected ? next.delete(itemId) : next.add(itemId);
      });
      return next;
    });
  };

  const renderPermissionNode = (node: PermissionPrincipal, depth = 0): React.ReactNode => {
    const childIds = collectPermissionIds(node);
    const selected = permissionSelectedIds.has(node.id);
    const partiallySelected = !selected && childIds.some((itemId) => permissionSelectedIds.has(itemId));
    const hasChildren = Boolean(node.children?.length);
    const expanded = permissionExpandedIds.has(node.id);
    return (
      <div key={node.id} className="space-y-1">
        <button
          type="button"
          onClick={() => togglePermissionPrincipal(node.id)}
          className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition ${selected ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/60' : partiallySelected ? 'border-[#f2c3c9] bg-[#fff8f8]' : 'border-black/[0.06] bg-white hover:border-black/[0.12] hover:bg-[#fafafa]'}`}
          style={{ paddingLeft: 12 + depth * 18 }}
        >
          {hasChildren ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                setPermissionExpandedIds((current) => {
                  const next = new Set(current);
                  next.has(node.id) ? next.delete(node.id) : next.add(node.id);
                  return next;
                });
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                setPermissionExpandedIds((current) => {
                  const next = new Set(current);
                  next.has(node.id) ? next.delete(node.id) : next.add(node.id);
                  return next;
                });
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[#98a2b3] hover:bg-white hover:text-[#344054]"
            >
              <ChevronRight size={14} className={`transition ${expanded ? 'rotate-90' : ''}`} />
            </span>
          ) : <span className="h-6 w-6 shrink-0" />}
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${node.type === 'user' ? 'bg-[#fff1f0] text-[var(--gov-red)]' : node.type === 'all' ? 'bg-[#202124] text-white' : 'bg-[#eef4ff] text-[#3b63d9]'}`}>
            {node.type === 'user' ? <UserRound size={15} /> : node.type === 'all' ? <Globe2 size={15} /> : <Building2 size={15} />}
          </span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#202124]">{node.name}</span><span className="mt-0.5 block truncate text-[11px] text-[#98a2b3]">{node.meta}</span></span>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${selected ? 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white' : partiallySelected ? 'border-[var(--gov-red-line)] bg-white text-[var(--gov-red)]' : 'border-[#d0d5dd] text-transparent'}`}>{selected ? '✓' : '•'}</span>
        </button>
        {hasChildren && expanded ? <div className="space-y-1">{node.children!.map((child) => renderPermissionNode(child, depth + 1))}</div> : null}
      </div>
    );
  };

  return (
    <div className="knowledge-shell flex h-full w-full flex-col overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        {!selectedDoc ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="knowledge-layout grid h-full min-h-0 grid-cols-[250px_minmax(0,1fr)] overflow-hidden"
          >
            <aside className="knowledge-sidebar flex min-h-0 flex-col border-r border-black/[0.06] bg-[#fafafa] px-3 py-4">
              <div className="knowledge-sidebar-title mb-4 px-2">
                <p className="text-[13px] font-bold text-[#202124]">知识库目录</p>
                <p className="mt-1 text-[10px] text-[#98a2b3]">按归属与用途管理政务素材</p>
              </div>
              <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="知识库目录">
                {librarySections.map((section) => {
                  const expanded = expandedLibraryIds.has(section.id);
                  const active = activeMenuId === section.id;
                  return (
                    <div key={section.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(section.id);
                          setSelectedFileIds(new Set());
                          setOpenFileMenuId(null);
                          if (section.folders.length > 0) {
                            setExpandedLibraryIds((current) => {
                              const next = new Set(current);
                              expanded ? next.delete(section.id) : next.add(section.id);
                              return next;
                            });
                          }
                        }}
                        className={`knowledge-nav-item flex h-11 w-full items-center gap-2.5 rounded-[10px] px-3 text-left transition ${active ? 'knowledge-nav-item-active bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'text-[#475467] hover:bg-white'}`}
                      >
                        {renderLibrarySectionIcon(section.id, active)}
                        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{section.label}</span>
                        {section.folders.length > 0 ? <ChevronRight size={14} className={`shrink-0 text-[#98a2b3] transition ${expanded ? 'rotate-90' : ''}`} /> : null}
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && section.folders.length > 0 ? (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-5 overflow-hidden border-l border-black/[0.07] pl-2">
                            {section.folders.map((folder) => (
                              <button key={folder.id} type="button" onClick={() => { setActiveMenuId(folder.id); setSelectedFileIds(new Set()); setOpenFileMenuId(null); }} className={`knowledge-subnav-item mt-1.5 flex h-10 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left transition ${activeMenuId === folder.id ? 'knowledge-subnav-item-active bg-white text-[var(--gov-red-deep)] shadow-sm' : 'text-[#667085] hover:bg-white'}`}>
                                {renderKnowledgeFolderIcon('tree')}
                                <span className="truncate text-[13px] font-semibold">{folder.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
              <div className="knowledge-space-card mt-4 border-t border-black/[0.06] px-2 pt-4">
                <div className="flex items-center justify-between text-[10px] text-[#98a2b3]"><span className="inline-flex items-center gap-1"><Database size={11} className="knowledge-storage-icon" />知识库空间</span><span>48.34 GB / 1 TB</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full w-[18%] rounded-full bg-[var(--gov-red)]" /></div>
              </div>
            </aside>

            <section className="knowledge-main relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-white">
              <div className="knowledge-header shrink-0 border-b border-black/[0.06] px-6 py-4">
                <div className="flex min-h-10 items-center justify-between gap-5">
                  <div className="flex min-w-0 items-center gap-2 text-[13px] text-[#667085]"><span className="font-semibold text-[#202124]">知识库</span><ChevronRight size={14} className="text-[#c0c6d0]" /><span className="truncate">{activeDirectoryLabel}</span></div>
                  {selectedCount === 0 ? (
                    isPublicLibrary ? <span className="knowledge-readonly-badge inline-flex h-9 items-center rounded-[8px] bg-[#f5f5f5] px-3 text-[11px] font-semibold text-[#667085]"><Globe2 size={13} className="mr-1.5" />公共素材库为只读内容</span> : activeMenuId === 'department' ? (
                      <button type="button" onClick={() => setIsCreateDeptLibraryModalOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#e74d5e] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(225,61,78,0.18)] transition hover:-translate-y-0.5 hover:bg-[#d9364b] hover:shadow-[0_12px_26px_rgba(225,61,78,0.24)]"><FilePlus2 size={14} className="shrink-0 text-white" /><span className="text-white">新建知识库</span></button>
                    ) : canCreateOrImport ? <div className="relative z-[260] flex items-center gap-2">
                      {renderActionTargetPicker('right', 'header')}
                      <button type="button" onClick={() => { setIsNewMenuOpen((value) => !value); setPathDropdownOpenFor(null); setOpenFileMenuId(null); setIsFilterDropdownOpen(false); }} className="knowledge-action-button inline-flex h-9 items-center gap-2 rounded-[8px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#344054] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"><FilePlus2 size={14} />新建<ChevronDown size={13} /></button>
                      <button type="button" onClick={() => { setIsImportModalOpen(true); setIsNewMenuOpen(false); setPathDropdownOpenFor(null); }} className="knowledge-action-button inline-flex h-9 items-center gap-2 rounded-[8px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#344054] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red)]"><Upload size={14} />导入</button>
                      <AnimatePresence>{isNewMenuOpen ? <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} className={`absolute right-0 top-11 z-[320] ${isDepartmentLibrary ? 'w-[300px]' : 'w-[240px]'} rounded-[12px] border border-black/[0.08] bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.16)]`}><div className="mb-3 flex items-center justify-between"><span className="text-[12px] font-bold text-[#344054]">{isDepartmentLibrary ? '新建文件夹' : '新建'}</span><button type="button" onClick={() => setIsNewMenuOpen(false)} className="rounded-[6px] p-1 text-[#98a2b3] hover:bg-[#f5f5f5]"><X size={14} /></button></div>{renderNewMenuContent()}</motion.div> : null}</AnimatePresence>
                    </div> : <span className="h-9" aria-hidden="true" />
                  ) : (
                    <div className="flex items-center gap-1.5 text-[12px]">
                      <span className="mr-1 font-semibold text-[#344054]">已选中 {selectedCount} 项</span>
                      <button type="button" onClick={() => setSelectedFileIds(new Set())} className="px-2 py-1.5 font-medium text-[var(--gov-red)] hover:underline">取消选择</button>
                      {showPermissionAction ? <button type="button" onClick={() => { const firstSelectedDoc = visibleLibraryDocs.find((doc) => selectedFileIds.has(doc.id)); if (firstSelectedDoc) { setPermissionTargetBatchCount(selectedCount); setPermissionTargetDoc(firstSelectedDoc); } }} className="rounded-[7px] px-2.5 py-1.5 font-medium text-[#596170] hover:bg-[#f5f5f5]">设置权限</button> : null}
                      {showMoveAction ? <button type="button" onClick={() => showLibraryNotice(`已移动 ${selectedCount} 项`)} className="rounded-[7px] px-2.5 py-1.5 font-medium text-[#596170] hover:bg-[#f5f5f5]">移动到</button> : null}
                      <button type="button" onClick={handleBatchDownloadDocs} className="rounded-[7px] px-2.5 py-1.5 font-medium text-[#596170] hover:bg-[#f5f5f5]">下载</button>
                      {selectedDocs.some(canDeleteDoc) ? <button type="button" onClick={() => handleDeleteDocs(selectedFileIds)} className={`rounded-[7px] px-2.5 py-1.5 font-medium hover:bg-[#fff1f0] ${selectedAllDeletable ? 'text-[#d92d20]' : 'text-[#b42318]'}`}>删除</button> : null}
                    </div>
                  )}
                </div>
                <div className="knowledge-toolbar mt-4 flex items-center gap-3">
                  <div className="knowledge-search-field relative min-w-0 flex-1">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="按文档标题检索当前目录"
                      className="h-10 w-full rounded-[9px] border border-black/[0.08] bg-[#fafafa] pl-9 pr-3 text-[12px] text-[#344054] outline-none transition placeholder:text-[#b2b8c2] focus:border-[var(--gov-red-line)] focus:bg-white"
                    />
                  </div>
                  <div className="relative">
                    <button type="button" onClick={() => setIsFilterDropdownOpen((value) => !value)} className="knowledge-filter-button inline-flex h-10 items-center gap-2 rounded-[9px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#596170]"><span>{fileTypeFilter === 'all' ? '全部类型' : fileTypeFilter === 'doc' ? '文字' : fileTypeFilter === 'xls' ? '表格' : '演示'}</span><ChevronDown size={13} /></button>
                    {isFilterDropdownOpen ? <div className="knowledge-filter-menu absolute right-0 top-11 z-[220] w-32 rounded-[9px] border border-black/[0.08] bg-white p-1.5 shadow-[0_16px_38px_rgba(15,23,42,0.12)]">{[['all','全部类型'],['doc','文字'],['xls','表格'],['ppt','演示']].map(([id,label]) => <button key={id} type="button" onClick={() => { setFileTypeFilter(id as typeof fileTypeFilter); setIsFilterDropdownOpen(false); }} className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[11px] text-[#596170] hover:bg-[#f5f5f5]">{label}</button>)}</div> : null}
                  </div>
                  <button type="button" onClick={handleTriggerRefresh} className="knowledge-icon-button inline-flex h-10 w-10 items-center justify-center rounded-[9px] border border-black/[0.08] bg-white text-[#667085] hover:text-[var(--gov-red)]" title="刷新"><RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /></button>
                </div>
              </div>

              <div className="knowledge-table-scroll min-h-0 flex-1 scroll-pb-32 overflow-auto px-6 pb-32">
                <div className={`knowledge-table-head sticky top-0 z-10 grid min-w-[820px] ${libraryGridClass} items-center border-b border-black/[0.07] bg-white py-3 text-[11px] font-semibold text-[#98a2b3]`}>
                  <label className="flex items-center justify-center"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedFileIds(allVisibleSelected ? new Set() : new Set(visibleLibraryDocs.map((doc) => doc.id)))} className="h-4 w-4 accent-[var(--gov-red)]" aria-label="选择当前列表全部文件" /></label>
                  <span>文件名称</span><span>创建者</span><span>最后修改</span><span>大小</span>{showSourceColumn ? <span>来源</span> : null}{showIngestStatus ? <span>入库状态</span> : null}<span />
                </div>
                {isRefreshing ? <div className="knowledge-empty-state flex h-64 items-center justify-center gap-2 text-[12px] text-[#98a2b3]"><RefreshCw size={18} className="animate-spin text-[var(--gov-red)]" />正在刷新文件列表</div> : visibleLibraryDocs.length === 0 && visibleFolderEntries.length === 0 ? <div className="knowledge-empty-state flex h-64 flex-col items-center justify-center text-[#98a2b3]">{renderKnowledgeFolderIcon('empty')}<p className="mt-3 text-[13px] font-semibold text-[#667085]">当前目录暂无文件</p>{canCreateOrImport ? <p className="mt-1 text-[11px]">可通过右上角新建或导入文件</p> : null}</div> : <div className="knowledge-table-body min-w-[820px] divide-y divide-black/[0.05]">
                  {visibleFolderEntries.map((folder) => {
                    const folderMenuOpen = openFileMenuId === folder.id;
                    const folderRenameable = canRenameFolder(folder.id);
                    const folderMovable = canMoveFolder(folder.id);
                    const folderDeletable = canDeleteFolder(folder.id);
                    const folderOperable = folderRenameable || folderMovable || folderDeletable;
                    return <div key={folder.id} className={`knowledge-table-row group relative grid min-h-[64px] ${libraryGridClass} items-center rounded-[6px] transition hover:bg-[#fafafa] ${folderMenuOpen ? 'z-[70]' : 'z-0'}`}>
                      <span />
                      <button type="button" onClick={() => { setActiveMenuId(folder.id); setOpenFileMenuId(null); }} className="flex min-w-0 items-center gap-3 text-left">{renderKnowledgeFolderIcon('row')}<span className="truncate text-[13px] font-semibold text-[#344054] transition group-hover:text-[var(--gov-red-deep)]">{folder.label}</span></button>
                      <span className="text-[12px] text-[#667085]">{getFolderCreator(folder.id)}</span><span className="text-[12px] text-[#667085]">刚刚</span><span className="text-[12px] text-[#98a2b3]">--</span>
                      {showSourceColumn ? <span className="text-[12px] text-[#98a2b3]">--</span> : null}
                      {showIngestStatus ? <span className="text-[12px] text-[#98a2b3]">--</span> : null}
                      <div className="relative flex justify-center">{folderOperable ? <button type="button" onClick={() => setOpenFileMenuId(folderMenuOpen ? null : folder.id)} className={`knowledge-row-more inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-[#98a2b3] transition hover:bg-white hover:text-[#344054] ${folderMenuOpen ? 'bg-white text-[#344054] shadow-sm' : ''}`} aria-label={`${folder.label}更多操作`}><MoreHorizontal size={17} /></button> : null}
                        {folderOperable && folderMenuOpen ? <div className="absolute right-2 top-9 z-[90] w-36 rounded-[10px] border border-black/[0.08] bg-white p-1.5 shadow-[0_18px_46px_rgba(15,23,42,0.16)]">
                          <button type="button" onClick={() => { setActiveMenuId(folder.id); setOpenFileMenuId(null); }} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><Eye size={14} />查看</button>
                          {folderRenameable ? <button type="button" onClick={() => handleRenameFolder(folder.id, folder.label)} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><Pencil size={14} />重命名</button> : null}
                          {folderMovable && showMoveAction ? <button type="button" onClick={() => { setOpenFileMenuId(null); showLibraryNotice('文件夹已移动'); }} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><MoveRight size={14} />移动到</button> : null}
                          {folderMovable ? <button type="button" onClick={() => { setOpenFileMenuId(null); showLibraryNotice('文件夹正在打包下载'); }} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><Download size={14} />下载</button> : null}
                          {folderDeletable ? <><div className="my-1 h-px bg-black/[0.06]" /><button type="button" onClick={() => handleDeleteFolder(folder.id)} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#d92d20] hover:bg-[#fff1f0]"><Trash2 size={14} />删除</button></> : null}
                        </div> : null}
                      </div>
                    </div>;
                  })}
                  {visibleLibraryDocs.map((doc) => {
                    const selected = selectedFileIds.has(doc.id);
                    const menuOpen = openFileMenuId === doc.id;
                    return <div key={doc.id} className={`knowledge-table-row group relative grid min-h-[64px] ${libraryGridClass} items-center rounded-[6px] transition ${selected ? 'knowledge-table-row-selected bg-[var(--gov-red-soft)]/60' : 'hover:bg-[#fafafa]'} ${menuOpen ? 'z-[70]' : 'z-0'}`}>
                      <label className="flex h-full items-center justify-center"><input type="checkbox" checked={selected} onChange={() => toggleFileSelection(doc.id)} className="h-4 w-4 accent-[var(--gov-red)]" aria-label={`选择${doc.title}`} /></label>
                      <button type="button" onClick={() => handleOpenDoc(doc)} className="flex min-w-0 items-center gap-3 text-left"><span className="knowledge-row-file-icon">{renderIcon(doc.iconType)}</span><span className="truncate text-[13px] font-semibold text-[#344054] transition group-hover:text-[var(--gov-red-deep)]">{doc.title}</span></button>
                      <span className="text-[12px] text-[#667085]">{doc.creator}</span><span className="text-[12px] text-[#667085]">{doc.lastModified}</span><span className="text-[12px] text-[#667085]">{fileSize(doc)}</span>
                      {showSourceColumn ? renderSourceBadge(doc) : null}
                      {showIngestStatus ? <span>{renderIngestStatus(doc)}</span> : null}
                      <div className="relative flex justify-center"><button type="button" onClick={() => setOpenFileMenuId(menuOpen ? null : doc.id)} className={`knowledge-row-more inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-[#98a2b3] transition hover:bg-white hover:text-[#344054] ${menuOpen ? 'bg-white text-[#344054] shadow-sm' : ''}`} aria-label={`${doc.title}更多操作`}><MoreHorizontal size={17} /></button>
                        {menuOpen ? <div className="absolute right-2 top-9 z-[90] w-36 rounded-[10px] border border-black/[0.08] bg-white p-1.5 shadow-[0_18px_46px_rgba(15,23,42,0.16)]">
                          <button type="button" onClick={() => { setOpenFileMenuId(null); handleOpenDoc(doc); }} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><Eye size={14} />查看</button>
                          {canManageDoc(doc) ? <button type="button" onClick={() => handleRenameDoc(doc)} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><Pencil size={14} />重命名</button> : null}
                          {showMoveAction ? <button type="button" onClick={() => { setVisualDocs((items) => items.map((item) => item.id === doc.id ? { ...item, location: '我的文库', lastModified: '刚刚' } : item)); setOpenFileMenuId(null); showLibraryNotice('已移动到“我的文库”'); }} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><MoveRight size={14} />移动到</button> : null}
                          {showPermissionAction ? <button type="button" onClick={() => { setOpenFileMenuId(null); setPermissionTargetBatchCount(0); setPermissionTargetDoc(doc); }} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><ShieldCheck size={14} />设置权限</button> : null}
                          <button type="button" onClick={() => handleDownloadDoc(doc)} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#475467] hover:bg-[#f5f5f5]"><Download size={14} />下载</button>
                          {canDeleteDoc(doc) ? <><div className="my-1 h-px bg-black/[0.06]" /><button type="button" onClick={() => handleDeleteDocs(new Set([doc.id]))} className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] text-[#d92d20] hover:bg-[#fff1f0]"><Trash2 size={14} />删除</button></> : null}
                        </div> : null}
                      </div>
                    </div>;
                  })}
                </div>}
              </div>

              <div className="knowledge-footer flex h-10 shrink-0 items-center justify-between border-t border-black/[0.05] px-6 text-[10px] text-[#98a2b3]"><span className="inline-flex items-center gap-1.5"><Info size={11} />当前目录共 {visibleLibraryDocs.length + visibleFolderEntries.length} 项</span><span>内容存储于政务内网知识库</span></div>
              <AnimatePresence>{libraryNotice ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[9px] bg-[#202124] px-4 py-2 text-[12px] font-medium text-white shadow-xl">{libraryNotice}</motion.div> : null}</AnimatePresence>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex h-full flex-col"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(35,31,32,0.08)] bg-white px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-neutral-200/60 hover:text-stone-600"
                  aria-label="返回文档库"
                >
                  <ArrowLeft size={14} />
                </button>
                <div className="h-3 w-px bg-[rgba(35,31,32,0.1)]" />
                  <span className="text-[11px] text-[var(--gov-text-muted)]">知识库文档</span>
                <span className="text-[10px] text-stone-300">|</span>
                <span className="min-w-0 truncate text-[11px] text-[var(--gov-text-muted)]">{selectedDoc.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 hidden text-[10px] text-stone-400 sm:inline">{editorText.replace(/\s/g, '').length} 字</span>
                <button
                  type="button"
                  onClick={handleSaveDocToDB}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-[var(--gov-text-muted)] transition hover:bg-neutral-200/60 hover:text-[var(--gov-text)]"
                >
                  <Save size={12} />
                  保存文档
                </button>
              </div>
            </div>

            <WebOfficeEditor
              value={editorText}
              onChange={setEditorText}
              documentTitle={selectedDoc.title}
            />

            {showStatusMessage && (
              <div className="flex h-8 shrink-0 items-center gap-2 border-t border-[rgba(35,31,32,0.08)] bg-[#FAF9F6] px-4 text-[10.5px] font-medium text-gray-600">
                <CheckCircle size={12} className="text-[#137A4C]" />
                <span className="truncate">{showStatusMessage}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCreateDeptLibraryModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4"
            onClick={() => setIsCreateDeptLibraryModalOpen(false)}
          >
            <motion.div
              initial={{ y: 16, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              className="w-full max-w-[520px] overflow-visible rounded-[8px] bg-white shadow-[0_24px_72px_rgba(15,23,42,0.24)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-14 items-center justify-between border-b border-black/[0.08] px-6">
                <h3 className="text-[18px] font-bold text-[#202124]">新建文库</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateDeptLibraryModalOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-[#596170] transition hover:bg-[#f5f5f5] hover:text-[#202124]"
                  aria-label="关闭新建文库"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-5 px-6 py-6">
                <label className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3">
                  <span className="text-[13px] font-semibold text-[#344054]"><span className="mr-1 text-[var(--gov-red)]">*</span>文库名称</span>
                  <input
                    value={departmentLibraryName}
                    onChange={(event) => setDepartmentLibraryName(event.target.value)}
                    placeholder="请输入文库名称"
                    className="h-10 rounded-[6px] border border-[#d7dde6] px-3 text-[13px] text-[#202124] outline-none transition placeholder:text-[#b2b8c2] focus:border-[var(--gov-red-line)] focus:ring-2 focus:ring-[var(--gov-red-soft)]"
                  />
                </label>
                <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3">
                  <span className="text-[13px] font-semibold text-[#344054]">权限范围</span>
                  <button
                    type="button"
                    onClick={() => setPermissionTargetLibraryName(departmentLibraryName.trim() || '新建文库')}
                    className="inline-flex w-fit items-center gap-2 rounded-[7px] px-2 py-1 text-[13px] font-semibold text-[#344054] transition hover:bg-[#f5f5f5] hover:text-[var(--gov-red-deep)]"
                  >
                    <ShieldCheck size={14} />
                    设置库权限
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button type="button" onClick={() => setIsCreateDeptLibraryModalOpen(false)} className="h-9 rounded-[7px] border border-black/[0.1] px-5 text-[13px] font-semibold text-[#344054] hover:bg-[#f5f5f5]">取消</button>
                <button type="button" onClick={handleCreateDepartmentLibrary} disabled={!departmentLibraryName.trim()} className="h-9 rounded-[7px] bg-[var(--gov-red)] px-5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(225,61,78,0.2)] transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-[#d0d5dd] disabled:shadow-none">保存</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {isImportModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
            onClick={() => { setIsImportModalOpen(false); setPathDropdownOpenFor(null); }}
          >
            <motion.div
              initial={{ y: 16, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              className="w-full max-w-[520px] overflow-hidden rounded-[8px] bg-white shadow-[0_24px_72px_rgba(15,23,42,0.24)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-14 items-center justify-between border-b border-black/[0.08] px-6">
                <h3 className="text-[18px] font-bold text-[#202124]">上传提示</h3>
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); setPathDropdownOpenFor(null); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-[#596170] transition hover:bg-[#f5f5f5] hover:text-[#202124]"
                  aria-label="关闭上传提示"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5">
                <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-black/[0.06] bg-[#fafbfc] px-3 py-3">
                  <div>
                    <div className="text-[12px] font-bold text-[#344054]">导入到</div>
                    <div className="mt-0.5 text-[11px] text-[#98a2b3]">文件将保存到选中的知识库路径</div>
                  </div>
                  {renderActionTargetPicker('right', 'import')}
                </div>
                <p className="mb-2 text-[13px] font-medium text-[#344054]">提示： 总大小不超过100M，单次上传文件数量限制20个</p>
                <label className="flex h-[156px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#cfd6df] bg-white text-center transition hover:border-[var(--gov-red-line)] hover:bg-[var(--gov-red-soft)]/20">
                  <span className="mb-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--gov-red)] text-[var(--gov-red)]">
                    <Plus size={15} />
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--gov-red)]">选择上传</span>
                  <input type="file" multiple accept=".doc,.docx,.pdf,.txt,.xls,.xlsx,.ppt,.pptx" className="sr-only" onChange={handleImportFiles} />
                </label>
                <p className="mt-4 text-[13px] font-medium text-[#667085]">提示： 总大小不超过100M，单次上传文件数量限制20个</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {permissionTargetDoc || permissionTargetLibraryName ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4"
          >
            <motion.div
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.98 }}
              className="w-full max-w-3xl overflow-hidden rounded-[14px] border border-black/[0.08] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.2)]"
            >
              <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-[15px] font-bold text-[#202124]"><ShieldCheck size={17} className="text-[var(--gov-red)]" />{permissionTargetLibraryName ? '设置库权限' : '设置文件权限'}</div>
                  <p className="mt-1 max-w-xl truncate text-[12px] text-[#667085]">{permissionTargetLibraryName ? `文库：${permissionTargetLibraryName}` : permissionTargetBatchCount > 0 ? `批量设置：已选中 ${permissionTargetBatchCount} 个文件` : `文件：${permissionTargetDoc?.title}`}</p>
                </div>
                <button type="button" onClick={() => { setPermissionTargetDoc(null); setPermissionTargetLibraryName(null); setPermissionTargetBatchCount(0); }} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f5f5f5]"><X size={17} /></button>
              </div>
              <div className="grid min-h-[430px] grid-cols-[1.15fr_0.85fr]">
                <div className="border-r border-black/[0.06] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#344054]">部门用户列表</p>
                    <span className="rounded-full bg-[var(--gov-red-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--gov-red-deep)]">勾选后可见</span>
                  </div>
                  <div className="max-h-[355px] space-y-1 overflow-auto pr-1">
                    {permissionPrincipals.map((principal) => renderPermissionNode(principal))}
                  </div>
                </div>
                <div className="bg-[#fbfbfc] p-5">
                  <p className="text-[13px] font-bold text-[#344054]">已选用户 / 部门</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#98a2b3]">只有右侧对象具备查看权限，并可在写作问答中引用该{permissionTargetLibraryName ? '文库内容' : '文件'}。</p>
                  <div className="mt-4 space-y-2">
                    {selectedPermissionPrincipals(permissionPrincipals).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-[9px] border border-black/[0.06] bg-white px-3 py-2.5">
                        <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#344054]">{item.name}</p><p className="mt-0.5 truncate text-[10px] text-[#98a2b3]">{item.type === 'all' ? '全员权限' : item.type === 'department' ? '部门权限（含下级）' : '用户权限'}</p></div>
                        <button type="button" onClick={() => togglePermissionPrincipal(item.id)} className="rounded-[6px] p-1 text-[#98a2b3] hover:bg-[#fff1f0] hover:text-[#d92d20]"><X size={13} /></button>
                      </div>
                    ))}
                    {permissionSelectedIds.size === 0 ? <div className="rounded-[10px] border border-dashed border-black/[0.12] bg-white p-6 text-center text-[12px] text-[#98a2b3]">尚未选择授权对象</div> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] bg-white px-5 py-4">
                <button type="button" onClick={() => { setPermissionTargetDoc(null); setPermissionTargetLibraryName(null); setPermissionTargetBatchCount(0); }} className="h-9 rounded-[8px] border border-black/[0.08] px-4 text-[12px] font-semibold text-[#596170] hover:bg-[#f5f5f5]">取消</button>
                <button type="button" onClick={() => { showLibraryNotice(permissionTargetLibraryName ? '文库权限已保存' : permissionTargetBatchCount > 0 ? `已批量保存 ${permissionTargetBatchCount} 个文件权限` : '权限已保存，未授权对象将不可见且不可在问答中引用'); setPermissionTargetDoc(null); setPermissionTargetLibraryName(null); setPermissionTargetBatchCount(0); }} className="h-9 rounded-[8px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(225,61,78,0.22)]">保存权限</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
