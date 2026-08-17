/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  INITIAL_AGENTS,
  INITIAL_CONNECTORS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SKILLS
} from './data';
import {
  Agent,
  Connector,
  DocumentInfo,
  AuditLogItem,
  SkillItem,
  Role,
  ActiveSpace,
  AdminSection,
  AdminSubSection
} from './types';

import DocWritingConsoleView from './components/DocWritingConsoleView';
import DocReviewView from './components/DocReviewView';
import AgentsView from './components/AgentsView';
import SessionsView from './components/SessionsView';
import WorkConsoleView from './components/WorkConsoleView';
import DocumentsView from './components/DocumentsView';
import ConnectorsView from './components/ConnectorsView';
import WorkflowsView from './components/WorkflowsView';
import AdminView from './components/AdminView';
import PrototypeIcon from './components/PrototypeIcon';
import { DEFAULT_HOME_EXPERT_ID, HOME_EXPERTS, HomeExpertId, HomeExpertMarketCategory } from './homeExperts';
import { DEFAULT_PRODUCT_ICON_URL, resolvePublicAssetUrl } from './utils/publicAsset';

import { Bell, Bot, CheckCircle, ChevronDown, ChevronRight, ClipboardList, Clock, FileSearch, FileText, Folder, History, Home, KeyRound, Layers, Link2, LockKeyhole, LogOut, MessageCircle, MoreHorizontal, Network, PenTool, Pin, Plus, RefreshCw, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Stamp, Trash2, UserRound, Users } from 'lucide-react';

type SidebarMode = 'home' | 'ai';
type ActiveTab =
  | 'ai-console'
  | 'agents'
  | 'sessions'
  | 'documents'
  | 'history'
  | 'connectors'
  | 'automation-schedules'
  | 'console-writing'
  | 'doc-review'
  | 'expert-management';

type WritingShortcutView = 'home' | 'quick-create' | 'write' | 'copy' | 'polish' | 'template-layout' | 'check' | 'weboffice';
type BusinessNavId = WritingShortcutView | 'documents' | 'history' | 'expert-management';

type BusinessNavItem = {
  id: BusinessNavId;
  label: string;
  icon: typeof FileText;
  iconKey?: string;
  tab: 'console-writing' | 'documents' | 'history' | 'expert-management';
  writingView?: WritingShortcutView;
};

type AiFeatureNavItem = {
  id: 'agents' | 'automation-schedules' | 'connectors';
  label: string;
  icon: typeof FileText;
};

type AdminNavItem = {
  id: AdminSection;
  label: string;
  icon: typeof FileText;
  iconKey?: string;
  children?: Array<{
    id: AdminSubSection;
    label: string;
  }>;
};

type CurrentUser = {
  id: string;
  name: string;
  role: Role;
  title: string;
  org: string;
  ssoId: string;
  avatarLabel: string;
};

type DemoAccount = CurrentUser & {
  username: string;
  password: string;
};

export type HomeAppearance = {
  logoUrl: string;
  productName: string;
  productSubtitle: string;
  slogan: string;
};

export const DEFAULT_HOME_APPEARANCE: HomeAppearance = {
  logoUrl: DEFAULT_PRODUCT_ICON_URL,
  productName: '金山文澜',
  productSubtitle: '智能政务创作平台',
  slogan: '一步开启高效公文写作新体验'
};

const HOME_APPEARANCE_STORAGE_KEY = 'workagent-home-appearance';

const loadHomeAppearance = (): HomeAppearance => {
  if (typeof window === 'undefined') return DEFAULT_HOME_APPEARANCE;
  try {
    const saved = window.localStorage.getItem(HOME_APPEARANCE_STORAGE_KEY);
    if (!saved) return DEFAULT_HOME_APPEARANCE;
    const parsed = { ...DEFAULT_HOME_APPEARANCE, ...JSON.parse(saved) };
    if (parsed.productName === '金山政务一体机' || parsed.productName === '金山文澜智能创作平台') {
      return { ...parsed, productName: DEFAULT_HOME_APPEARANCE.productName, productSubtitle: DEFAULT_HOME_APPEARANCE.productSubtitle };
    }
    return parsed;
  } catch {
    return DEFAULT_HOME_APPEARANCE;
  }
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'u-admin',
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: 'admin',
    title: 'FDE',
    org: '信创平台运维中心',
    ssoId: '20000000_OK',
    avatarLabel: '管'
  },
  {
    id: 'u-zhangsan',
    username: 'zhangsan',
    password: 'user123',
    name: '张三',
    role: 'user',
    title: '法务专员',
    org: '法律事务中心一科',
    ssoId: '20040182_OK',
    avatarLabel: '张'
  }
];

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const createCaptcha = () =>
  Array.from({ length: 4 }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');

const DEFAULT_ADMIN_SUBSECTIONS: Partial<Record<AdminSection, AdminSubSection>> = {
  'users-orgs': 'users',
  'material-library': 'material-documents',
  'model-management': 'llm-models',
  'agent-management': 'agent-directory',
  'writing-admin': 'style-library',
  'system-settings': 'role-management'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [captcha, setCaptcha] = useState(() => createCaptcha());
  const [activeSpace, setActiveSpace] = useState<ActiveSpace>('workbench');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('home');
  const [activeTab, setActiveTab] = useState<ActiveTab>('console-writing');
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>('users-orgs');
  const [activeAdminSubSection, setActiveAdminSubSection] = useState<AdminSubSection>('users');
  const [focusedBusinessNav, setFocusedBusinessNav] = useState<BusinessNavId | null>('home');
  const [isDocumentNavExpanded, setIsDocumentNavExpanded] = useState(false);
  const [writingNavigation, setWritingNavigation] = useState<{ view: WritingShortcutView; key: number }>({ view: 'home', key: 0 });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openHistoryMenu, setOpenHistoryMenu] = useState<string | null>(null);
  const [isHistorySearchOpen, setIsHistorySearchOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState('history-quarter-report');
  const [selectedHomeExpertId, setSelectedHomeExpertId] = useState<HomeExpertId>(DEFAULT_HOME_EXPERT_ID);
  const [homeAppearance, setHomeAppearance] = useState<HomeAppearance>(() => loadHomeAppearance());

  useEffect(() => {
    const syncAppearance = () => setHomeAppearance(loadHomeAppearance());
    window.addEventListener('workagent-appearance-updated', syncAppearance);
    window.addEventListener('storage', syncAppearance);
    return () => {
      window.removeEventListener('workagent-appearance-updated', syncAppearance);
      window.removeEventListener('storage', syncAppearance);
    };
  }, []);

  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [connectors, setConnectors] = useState<Connector[]>(INITIAL_CONNECTORS);
  const [documents, setDocuments] = useState<DocumentInfo[]>(INITIAL_DOCUMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [usedAgentIds, setUsedAgentIds] = useState<Set<string>>(new Set(['agent-gongwen', 'agent-proofread', 'agent-contract', 'agent-meeting', 'agent-report']));

  const myExpertIds = useMemo(
    () => new Set([...agents.filter(a => a.type === 'my').map(a => a.id), ...usedAgentIds]),
    [agents, usedAgentIds]
  );

  const [activeSessions, setActiveSessions] = useState([
    { id: 'session-jinshan', title: '整理金山文档内容', time: '5小时前' },
    { id: 'session-analysis', title: '文档内容分析', time: '5小时前' },
    { id: 'session-contract', title: '郑州总部合同审查', time: '10分钟前' },
    { id: 'session-safety', title: '安全生产自查自评估', time: '1小时前' }
  ]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('session-contract');

  const [redirectAgentId, setRedirectAgentId] = useState<string | null>(null);
  const [redirectPrompt, setRedirectPrompt] = useState<string | null>(null);
  const role = currentUser?.role ?? 'user';

  const businessNavItems: BusinessNavItem[] = [
    {
      id: 'home',
      label: '首页',
      icon: Home,
      iconKey: 'nav-home',
      tab: 'console-writing',
      writingView: 'home'
    },
    {
      id: 'write',
      label: '场景创作',
      icon: PenTool,
      iconKey: 'nav-ai-write',
      tab: 'console-writing',
      writingView: 'write'
    },
    {
      id: 'copy',
      label: '以稿写稿',
      icon: Layers,
      iconKey: 'nav-ai-copy',
      tab: 'console-writing',
      writingView: 'copy'
    },
    {
      id: 'polish',
      label: '文风润色',
      icon: Sparkles,
      iconKey: 'nav-ai-polish',
      tab: 'console-writing',
      writingView: 'polish'
    },
    {
      id: 'template-layout',
      label: '智能排版',
      icon: Stamp,
      iconKey: 'nav-layout',
      tab: 'console-writing',
      writingView: 'template-layout'
    },
    {
      id: 'check',
      label: '智能校对',
      icon: CheckCircle,
      iconKey: 'nav-proofread',
      tab: 'console-writing',
      writingView: 'check'
    },
    {
      id: 'weboffice',
      label: '公文写作',
      icon: FileText,
      iconKey: 'feature-web-office',
      tab: 'console-writing',
      writingView: 'weboffice'
    },
    {
      id: 'documents',
      label: '知识库',
      icon: Folder,
      iconKey: 'nav-knowledge',
      tab: 'documents'
    },
    {
      id: 'expert-management',
      label: '专家市场',
      icon: Bot,
      iconKey: 'nav-expert',
      tab: 'expert-management'
    },
    {
      id: 'history',
      label: '历史记录',
      icon: History,
      iconKey: 'nav-history',
      tab: 'history'
    }
  ];

  const aiFeatureNavItems: AiFeatureNavItem[] = [
    { id: 'agents', label: '数字专家', icon: Bot },
    { id: 'automation-schedules', label: '自动化', icon: Clock },
    { id: 'connectors', label: '系统集成', icon: Network }
  ];

  const adminNavItems: AdminNavItem[] = [
    {
      id: 'users-orgs',
      label: '用户与组织',
      icon: Users,
      iconKey: 'admin-users'
    },
    {
      id: 'material-library',
      label: '文库管理',
      icon: Folder,
      iconKey: 'admin-material',
      children: [
        { id: 'material-documents', label: '文库管理' },
        { id: 'document-type-management', label: '文档类型管理' },
        { id: 'metadata-management', label: '元数据管理' },
        { id: 'tag-management', label: '分类标签管理' }
      ]
    },
    {
      id: 'model-management',
      label: '模型管理',
      icon: Bot,
      iconKey: 'admin-model'
    },
    {
      id: 'agent-management',
      label: '智能体管理',
      icon: Sparkles,
      iconKey: 'admin-agent'
    },
    {
      id: 'writing-admin',
      label: '公文写作后台',
      icon: FileText,
      iconKey: 'admin-prompt',
      children: [
        { id: 'style-library', label: '写作场景管理' },
        { id: 'business-management', label: '提示词管理' },
        { id: 'red-templates', label: '套红模板管理' }
      ]
    },
    {
      id: 'system-settings',
      label: '系统管理',
      icon: Settings,
      iconKey: 'admin-system',
      children: [
        { id: 'role-management', label: '角色管理' },
        { id: 'menu-management', label: '菜单管理' },
        { id: 'appearance-management', label: '外观管理' }
      ]
    }
  ];

  const viewTitles: Record<ActiveTab, string> = {
    'console-writing': '公文写作',
    'ai-console': 'AI中台',
    agents: '数字专家',
    sessions: 'AI会话',
    documents: '知识库',
    history: '历史记录',
    connectors: '系统集成',
    'automation-schedules': '定时任务',
    'doc-review': 'AI审校',
    'expert-management': '专家市场'
  };

  const adminViewTitles: Partial<Record<AdminSection, string>> = {
    'users-orgs': '用户与组织',
    'material-library': '文库管理',
    'model-management': '模型管理',
    'agent-management': '智能体管理',
    'ai-resources': '资源管理',
    'writing-admin': '公文写作后台',
    'system-settings': '系统设置'
  };

  const refreshCaptcha = () => {
    setCaptcha(createCaptcha());
  };

  const handleLogin = (username: string, password: string, captchaInput: string): string | null => {
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password || !captchaInput.trim()) {
      return '请完整输入账号、密码和验证码。';
    }
    if (captchaInput.trim().toUpperCase() !== captcha.toUpperCase()) {
      refreshCaptcha();
      return '验证码不正确，请重新输入。';
    }
    const account = DEMO_ACCOUNTS.find((item) => item.username === normalizedUsername);
    if (!account) {
      refreshCaptcha();
      return '账号不存在，请使用演示账号登录。';
    }
    if (account.password !== password) {
      refreshCaptcha();
      return '密码不正确，请核对后重试。';
    }

    const { password: _password, username: _username, ...user } = account;
    setCurrentUser(user);
    refreshCaptcha();
    setRedirectAgentId(null);
    setRedirectPrompt(null);

    if (user.role === 'admin') {
      setActiveSpace('workbench');
      setSidebarMode('home');
      setActiveTab('console-writing');
      setFocusedBusinessNav('home');
      setWritingNavigation({ view: 'home', key: Date.now() });
      return null;
    }

    setActiveSpace('workbench');
    setSidebarMode('home');
    setActiveTab('console-writing');
    setFocusedBusinessNav('home');
    setWritingNavigation({ view: 'home', key: Date.now() });
    return null;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    refreshCaptcha();
    setActiveSpace('workbench');
    setSidebarMode('home');
    setActiveTab('console-writing');
    setActiveAdminSection('users-orgs');
    setActiveAdminSubSection('users');
    setFocusedBusinessNav('home');
    setWritingNavigation({ view: 'home', key: Date.now() });
    setIsUserMenuOpen(false);
    setRedirectAgentId(null);
    setRedirectPrompt(null);
  };

  const openBusinessTab = (id: BusinessNavItem['id']) => {
    const item = businessNavItems.find((navItem) => navItem.id === id);
    if (!item) return;
    setActiveSpace('workbench');
    setSidebarMode('home');
    setFocusedBusinessNav(item.id);
    setActiveTab(item.tab);
    setIsDocumentNavExpanded(['write', 'copy', 'polish', 'template-layout', 'check'].includes(item.id));
    if (item.writingView) {
      setWritingNavigation({ view: item.writingView, key: Date.now() });
    }
  };

  const openDocumentNavGroup = () => {
    setActiveSpace('workbench');
    setSidebarMode('home');
    setActiveTab('console-writing');
    setFocusedBusinessNav('write');
    setIsDocumentNavExpanded(true);
    setWritingNavigation({ view: 'home', key: Date.now() });
  };

  const syncWritingNavigation = (id: WritingShortcutView) => {
    setActiveSpace('workbench');
    setSidebarMode('home');
    setActiveTab('console-writing');
    setFocusedBusinessNav(id);
    setIsDocumentNavExpanded(['write', 'copy', 'polish', 'template-layout', 'check'].includes(id));
  };

  const openAiFeatureTab = (tab: AiFeatureNavItem['id']) => {
    setActiveSpace('workbench');
    setSidebarMode('ai');
    setActiveTab(tab);
  };

  const openAiConsole = () => {
    setActiveSpace('workbench');
    setSidebarMode('ai');
    setActiveTab('ai-console');
  };

  const openAiSessions = (sessionId?: string) => {
    setActiveSpace('workbench');
    setSidebarMode('ai');
    setActiveTab('sessions');
    if (sessionId) {
      setSelectedSessionId(sessionId);
    }
  };

  const handleTopModeChange = (mode: SidebarMode) => {
    setActiveSpace('workbench');
    setSidebarMode(mode);
    if (mode === 'home') {
      if (!['console-writing', 'documents', 'history', 'expert-management'].includes(activeTab)) {
        setActiveTab('console-writing');
        setFocusedBusinessNav('home');
        setWritingNavigation({ view: 'home', key: Date.now() });
      }
      return;
    }
    if (mode === 'ai') {
      setActiveTab('ai-console');
    }
  };

  const openAdminSpace = () => {
    if (role !== 'admin') return;
    setActiveSpace('admin');
    openAdminSection('users-orgs', 'users');
  };

  const openAdminSection = (section: AdminSection, subSection?: AdminSubSection) => {
    setActiveAdminSection(section);
    const defaultSubSection = DEFAULT_ADMIN_SUBSECTIONS[section];
    if (subSection || defaultSubSection) {
      setActiveAdminSubSection(subSection ?? defaultSubSection ?? 'users');
    }
  };

  const returnToWorkbench = () => {
    setActiveSpace('workbench');
    setSidebarMode('home');
    setActiveTab('console-writing');
    setFocusedBusinessNav('home');
    setWritingNavigation({ view: 'home', key: Date.now() });
  };

  const handleToggleAgentEnable = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          const isNowEnabled = !agent.isEnabled;
          const newLog: AuditLogItem = {
            id: `log-user-${Date.now()}`,
            operator: currentUser ? `${currentUser.name} · ${currentUser.title} (SSO: ${currentUser.ssoId})` : '未授权用户',
            agentName: agent.name,
            permissionUsed: role === 'admin' ? '管理员·核心资源调配权' : '法务专员·岗位一岗双责白名单开启',
            node: '我的工作台 -> 代理市场一键启用',
            dataAccessed: `智能体配置: ${agent.name} 状态变更为 ${isNowEnabled ? '已就绪' : '未部署'}`,
            nationalCryptHash: `SM3: ${Math.random().toString(16).substring(2, 34).toUpperCase()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
          };
          setAuditLogs((logs) => [newLog, ...logs]);
          return { ...agent, isEnabled: isNowEnabled };
        }
        return agent;
      })
    );
  };

  const handleAddToMyExperts = (agentId: string) => {
    setUsedAgentIds((prev) => new Set([...prev, agentId]));
  };

  const handleStartChatFromAgent = (agentId: string) => {
    setRedirectAgentId(agentId);
    setRedirectPrompt(null);
    setUsedAgentIds((prev) => new Set([...prev, agentId]));
    setSelectedSessionId(`session-new-${Date.now()}`);
    openAiSessions();
  };

  const handleStartChatWithPrompt = (agentId: string, prompt: string) => {
    setRedirectAgentId(agentId);
    setRedirectPrompt(prompt);
    setUsedAgentIds((prev) => new Set([...prev, agentId]));
    setSelectedSessionId(`session-new-${Date.now()}`);
    openAiSessions();
  };

  const handleAutomationRun = (taskName: string, prompt: string): string => {
    const sessionId = `auto-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const sessionTitle = `自动化任务-${today}-${taskName}`;
    setActiveSessions((prev) => [{ id: sessionId, title: sessionTitle, time: '刚刚' }, ...prev]);
    const firstAgent = agents.find(a => myExpertIds.has(a.id));
    if (firstAgent) {
      setRedirectAgentId(firstAgent.id);
      setUsedAgentIds((prev) => new Set([...prev, firstAgent.id]));
    }
    setRedirectPrompt(prompt);
    setSelectedSessionId(sessionId);
    openAiSessions();
    return sessionId;
  };

  const handleSummonHomeExpert = (expertId: HomeExpertId) => {
    setSelectedHomeExpertId(expertId);
    setActiveSpace('workbench');
    setSidebarMode('home');
    setActiveTab('console-writing');
    setFocusedBusinessNav('home');
    setWritingNavigation({ view: 'home', key: Date.now() });
  };

  const handleUpdateDocumentContent = (id: string, newContent: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          return { ...doc, content: newContent, lastModified: new Date().toISOString().replace('T', ' ').slice(0, 16) };
        }
        return doc;
      })
    );
  };

  const handleAddDocument = (doc: DocumentInfo) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleAddConnector = (newConnector: Connector) => {
    setConnectors((prev) => [newConnector, ...prev]);
  };

  const handleAddSkill = (newSkill: SkillItem) => {
    setSkills((prev) => [newSkill, ...prev]);
  };

  if (!currentUser) {
    return <LoginView captcha={captcha} appearance={homeAppearance} onRefreshCaptcha={refreshCaptcha} onLogin={handleLogin} />;
  }

  const renderSidebarContent = () => {
    if (activeSpace === 'admin') {
      return (
        <div className="space-y-4">
          <div className="px-1">
            <p className="text-[13px] font-semibold text-[#596170]">管理后台</p>
          </div>

          <nav className="space-y-1" aria-label="管理后台菜单">
            {adminNavItems.map((item) => {
              const isSelected = activeAdminSection === item.id;
              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => openAdminSection(item.id)}
                    className={`gov-home-row w-full text-left ${isSelected ? 'gov-home-row-active' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className={`ai-nav-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${isSelected ? 'ai-nav-icon-active' : ''}`}>
                        <PrototypeIcon name={item.iconKey ?? 'admin-system'} size={30} alt={`${item.label}图标`} />
                      </div>
                      <span className="truncate text-[13px] font-semibold text-[#30343b]">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={isSelected ? 'text-[var(--gov-red-deep)]' : 'text-[#a3a8b2]'} />
                  </button>
                  {isSelected && item.children && (
                    <div className="ml-7 space-y-0.5 border-l border-black/[0.06] pl-2">
                      {item.children.map((child) => {
                        const isChildSelected = activeAdminSubSection === child.id;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => openAdminSection(item.id, child.id)}
                            className={`w-full rounded-[8px] px-2.5 py-2 text-left text-[12px] transition-colors ${isChildSelected ? 'bg-[var(--gov-red-soft)] font-semibold text-[var(--gov-red-deep)]' : 'text-[#7a808a] hover:bg-black/[0.03] hover:text-[#30343b]'}`}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      );
    }

    if (sidebarMode === 'home') {
      const primaryItems = [
        { id: 'home' as const, label: '新建任务', icon: PenTool, iconKey: 'nav-new-task' },
        { id: 'write' as const, label: '智能公文', icon: FileText, iconKey: 'nav-smart-doc' },
        { id: 'weboffice' as const, label: '公文写作', icon: FileText, iconKey: 'feature-web-office' },
        { id: 'documents' as const, label: '知识库', icon: Folder, iconKey: 'nav-knowledge' },
        { id: 'expert-management' as const, label: '专家市场', icon: Bot, iconKey: 'nav-expert' }
      ];
      const documentFeatureIds: BusinessNavId[] = ['write', 'copy', 'polish', 'template-layout', 'check'];
      const documentFeatureItems = [
        { id: 'write' as const, label: '场景创作', icon: PenTool, iconKey: 'write-mode-outline' },
        { id: 'copy' as const, label: '以稿写稿', icon: Layers, iconKey: 'nav-ai-copy' },
        { id: 'polish' as const, label: '文风润色', icon: Sparkles, iconKey: 'nav-ai-polish' },
        { id: 'template-layout' as const, label: '智能排版', icon: Stamp, iconKey: 'nav-layout' },
        { id: 'check' as const, label: '智能校对', icon: CheckCircle, iconKey: 'nav-proofread' }
      ];
      const historyItems = HISTORY_RECORDS.filter((item) => item.title.includes(historySearchQuery.trim()));

      return (
        <div className="flex min-h-full flex-col">
          <div className="mb-4 flex items-center gap-3 px-2">
            <img src={resolvePublicAssetUrl(homeAppearance.logoUrl)} alt="产品 logo" className="h-11 w-11 rounded-[14px] object-cover shadow-[0_8px_20px_rgba(176,64,70,0.10)]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-[20px] text-[#1f2329]">{homeAppearance.productName}</p>
              <p className="mt-0.5 truncate text-[11px] font-medium leading-[16px] text-[#98a2b3]">{homeAppearance.productSubtitle}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {primaryItems.map((item) => {
              const isSelected =
                focusedBusinessNav === item.id ||
                (item.id === 'write' && (isDocumentNavExpanded || (focusedBusinessNav !== null && documentFeatureIds.includes(focusedBusinessNav)))) ||
                (item.id === 'documents' && activeTab === 'documents') ||
                (item.id === 'expert-management' && activeTab === 'expert-management') ||
                (item.id === 'home' && activeTab === 'console-writing' && focusedBusinessNav === 'home');

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.id === 'write') {
                        openDocumentNavGroup();
                      } else {
                        openBusinessTab(item.id);
                      }
                    }}
                    className={`flex h-12 w-full items-center justify-between rounded-[13px] px-3 text-left transition ${
                      isSelected
                        ? 'bg-white text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.08)]'
                        : 'text-[#24272f] hover:bg-white/70'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <PrototypeIcon name={item.iconKey} size={30} alt={`${item.label}图标`} />
                      <span className="truncate text-[15px] font-semibold">{item.label}</span>
                    </span>
                    {item.id === 'write' ? (
                      <ChevronDown size={14} className={`text-[#a6abb4] transition ${isSelected ? 'rotate-180' : ''}`} />
                    ) : item.shortcut ? (
                      <span className="text-[12px] font-medium text-[#a6abb4]">{item.shortcut}</span>
                    ) : null}
                  </button>

                  {item.id === 'write' && isSelected ? (
                    <div className="ml-8 mt-1 space-y-1 border-l border-black/[0.06] pl-2">
                      {documentFeatureItems.map((feature) => {
                        const isFeatureSelected = focusedBusinessNav === feature.id && writingNavigation.view === feature.id;
                        return (
                          <button
                            key={feature.id}
                            type="button"
                            onClick={() => openBusinessTab(feature.id)}
                            className={`flex h-9 w-full items-center gap-2 rounded-[10px] px-2.5 text-left transition ${
                              isFeatureSelected
                                ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]'
                                : 'text-[#5f6670] hover:bg-white/80 hover:text-[#111827]'
                            }`}
                          >
                            <PrototypeIcon name={feature.iconKey} size={24} alt={`${feature.label}图标`} />
                            <span className="text-[13px] font-semibold">{feature.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="mt-8 flex-1">
            <div className="flex items-center justify-between px-3">
              <p className="text-[13px] font-semibold text-[#a6abb4]">历史对话</p>
              {isHistorySearchOpen ? (
                <div className="flex h-7 w-[142px] items-center gap-1.5 rounded-[8px] border border-black/[0.06] bg-white px-2 text-[#9aa0a6] shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
                  <Search size={13} />
                  <input
                    value={historySearchQuery}
                    onChange={(event) => setHistorySearchQuery(event.target.value)}
                    autoFocus
                    placeholder="搜索..."
                    className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#4b5563] outline-none placeholder:text-[#b0b5bd]"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsHistorySearchOpen(true)}
                  className="inline-flex h-7 items-center gap-1.5 rounded-[8px] px-2 text-[12px] font-medium text-[#9aa0a6] transition hover:bg-white hover:text-[#4b5563]"
                >
                  <Search size={13} />
                  <span>搜索</span>
                </button>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {historyItems.map((item) => (
                <div key={`${item.id}-${item.title}`} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHistoryMenu(null);
                      setSelectedHistoryId(item.id);
                      openBusinessTab('history');
                    }}
                    className="flex h-9 w-full items-center gap-2 rounded-[10px] px-3 pr-10 text-left text-[14px] font-medium text-[#4b5563] transition hover:bg-white/80 hover:text-[#111827]"
                  >
                    <MessageCircle size={15} className="shrink-0 text-[#b0b5bd]" />
                    <span className="truncate">{item.title}</span>
                  </button>
                  <button
                    type="button"
                    aria-label="历史对话操作"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenHistoryMenu((value) => (value === item.title ? null : item.title));
                    }}
                    className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-[8px] text-[#9aa0a6] transition hover:bg-[#f2f3f5] hover:text-[#30343b] ${openHistoryMenu === item.title ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {openHistoryMenu === item.title ? (
                    <div className="absolute right-1 top-8 z-30 w-[116px] rounded-[12px] border border-black/[0.08] bg-white p-1.5 shadow-[0_16px_38px_rgba(15,23,42,0.14)]">
                      {[
                        { label: '置顶', icon: Pin, tone: 'text-[#4b5563]' },
                        { label: '重命名', icon: PenTool, tone: 'text-[#4b5563]' },
                        { label: '删除', icon: Trash2, tone: 'text-[var(--gov-red-deep)]' }
                      ].map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenHistoryMenu(null);
                            }}
                            className={`flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[12px] font-semibold transition hover:bg-[#f6f6f7] ${action.tone}`}
                          >
                            <ActionIcon size={13} />
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
              {historyItems.length === 0 ? (
                <div className="rounded-[10px] px-3 py-3 text-[12px] text-[#9aa0a6]">没有匹配的历史对话</div>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    if (sidebarMode === 'ai') {
      return (
        <div className="space-y-4">
          <div className="px-1">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-[#8a8f98] uppercase">AI中台</p>
            <p className="mt-1 text-[12px] leading-5 text-[#7b8088]">统一承接AI对话、数字专家和自动化能力。</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setRedirectAgentId(null);
              setRedirectPrompt(null);
              openAiConsole();
            }}
            className="gov-button-secondary flex w-full items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold"
          >
            <Plus size={13} />
            <span>新建会话</span>
          </button>

          <nav className="space-y-1 border-b border-black/[0.05] pb-3" aria-label="AI 会话能力">
            {aiFeatureNavItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openAiFeatureTab(item.id)}
                  className={`gov-home-row w-full text-left ${isSelected ? 'gov-home-row-active' : ''}`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={`ai-nav-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${isSelected ? 'ai-nav-icon-active' : ''}`}>
                      <IconComponent size={16} />
                    </div>
                    <span className="truncate text-[14px] font-semibold text-[#30343b]">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className={isSelected ? 'text-[var(--gov-red-deep)]' : 'text-[#a3a8b2]'} />
                </button>
              );
            })}
          </nav>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold text-[#30343b]">会话</span>
              <span className="text-[12px] text-[#7b8088]">{activeSessions.length} 条</span>
            </div>

            <div className="space-y-1.5">
              {activeSessions.map((session) => {
                const isSelected = activeTab === 'sessions' && selectedSessionId === session.id;

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => openAiSessions(session.id)}
                    className={`gov-session-item w-full text-left ${isSelected ? 'gov-session-item-active' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-[13px] font-medium leading-5">{session.title}</span>
                      <span className="shrink-0 text-[11px] text-[#7b8088]">{session.time}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

  };

  const businessHeaderTitles: Partial<Record<BusinessNavId, string>> = {
    home: '新建任务',
    write: '场景创作',
    copy: '以稿写稿',
    polish: '文风润色',
    'template-layout': '智能排版',
    check: '智能校对',
    weboffice: '公文写作',
    documents: '知识库',
    history: '历史记录',
    'expert-management': '专家市场'
  };
  const headerTitle =
    activeSpace === 'admin'
      ? adminViewTitles[activeAdminSection]
      : activeTab === 'console-writing'
        ? businessHeaderTitles[focusedBusinessNav ?? 'home'] ?? '首页'
          : activeTab === 'documents'
            ? '知识库'
            : viewTitles[activeTab];
  return (
    <div className="gov-shell flex h-screen w-screen select-none flex-col overflow-hidden antialiased">
      <div className="flex flex-1 overflow-hidden">
        <aside className="gov-sidebar relative z-20 flex w-[280px] shrink-0 flex-col justify-between border-r select-none">
          <div className="min-h-0">
            <div className="h-[calc(100vh-70px)] overflow-y-auto px-3 py-5">{renderSidebarContent()}</div>
          </div>

          <div className="relative border-t border-black/[0.05] bg-transparent px-3 py-3">
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="absolute bottom-[72px] left-3 right-3 z-30 rounded-[18px] border border-black/[0.07] bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
                >
                  <div className="flex items-center gap-3 border-b border-black/[0.06] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gov-red)] text-sm font-semibold text-white">
                      {currentUser.avatarLabel}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#202124]">{currentUser.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#7a7d85]">{currentUser.title} · {currentUser.org}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="flex h-9 w-full items-center gap-2 rounded-[10px] px-2 text-left text-[13px] font-medium text-[#30343b] transition hover:bg-[var(--gov-red-soft)] hover:text-[var(--gov-red-deep)]"
                    >
                      <UserRound size={14} className="text-[#7a808a]" />
                      <span>个人中心</span>
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          activeSpace === 'admin' ? returnToWorkbench() : openAdminSpace();
                        }}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[rgba(231,77,94,0.14)] bg-[var(--gov-red-soft)] text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-white"
                      >
                        <SlidersHorizontal size={14} />
                        <span>{activeSpace === 'admin' ? '返回工作台' : '进入管理后台'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border border-black/[0.06] bg-white text-[12px] font-semibold text-[#7a808a] transition hover:border-[rgba(231,77,94,0.14)] hover:bg-[var(--gov-red-soft)] hover:text-[var(--gov-red-deep)]"
                    >
                      <LogOut size={14} />
                      <span>退出登录</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((value) => !value)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] px-1.5 py-1.5 text-left transition hover:bg-white/80"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[13px] font-semibold text-[#4263eb]">
                  {currentUser.avatarLabel}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#202124]">用户{currentUser.ssoId.slice(-7)}</p>
                </div>
                <ChevronDown size={14} className={`shrink-0 text-[#9aa1ad] transition ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </aside>

        <main className="ai-shell-main relative flex flex-1 flex-col overflow-hidden">
          <header className="ai-topbar z-10 flex h-[64px] items-center justify-between px-7 select-none">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--gov-red-soft)] text-[var(--gov-red)]"><Sparkles size={16} /></span>
              <div className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-[#202124]">{headerTitle}</span>
                {activeSpace === 'admin' && <span className="mt-0.5 hidden text-[10px] font-medium text-[#98a2b3] sm:block">智能办公平台管理中心</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-[rgba(231,77,94,0.12)] bg-[var(--gov-red-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--gov-red-deep)] lg:inline-flex">
                安全办公 · 内网可信
              </span>
            </div>
          </header>

          {activeSpace === 'admin' ? (
            <div className="ai-workspace-bg flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-[1560px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeAdminSection}-${activeAdminSubSection}-${role}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.12 }}
                  >
                    <AdminView
                      section={activeAdminSection}
                      subSection={activeAdminSubSection}
                      skills={skills}
                      agents={agents}
                      connectors={connectors}
                      auditLogs={auditLogs}
                      role={role}
                      onAddSkill={handleAddSkill}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          ) : activeTab === 'sessions' || activeTab === 'documents' || activeTab === 'history' || activeTab === 'expert-management' || activeTab === 'console-writing' || activeTab === 'doc-review' ? (
            <div className="ai-workspace-bg relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${role}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="h-full w-full"
                >
                  {activeTab === 'sessions' && (
                    <SessionsView
                      agents={agents.filter(a => myExpertIds.has(a.id))}
                      role={role}
                      activeSessionId={selectedSessionId}
                      onSelectSession={(sessId) => setSelectedSessionId(sessId)}
                      initialSelectedAgentId={redirectAgentId}
                      initialPrompt={redirectPrompt}
                      onClearRedirect={() => {
                        setRedirectAgentId(null);
                        setRedirectPrompt(null);
                      }}
                    />
                  )}

                  {activeTab === 'documents' && (
                    <DocumentsView documents={documents} role={role} onUpdateDocumentContent={handleUpdateDocumentContent} />
                  )}

                  {activeTab === 'history' && <HistoryView key={selectedHistoryId} initialSelectedId={selectedHistoryId} />}

                  {activeTab === 'expert-management' && (
                    <ExpertManagementView
                      selectedExpertId={selectedHomeExpertId}
                      onSummon={handleSummonHomeExpert}
                    />
                  )}

                  {activeTab === 'console-writing' && (
                    <DocWritingConsoleView
                      role={role}
                      documents={documents}
                      navigationView={writingNavigation.view}
                      navigationKey={writingNavigation.key}
                      selectedExpertId={selectedHomeExpertId}
                      appearance={homeAppearance}
                      onSelectedExpertChange={setSelectedHomeExpertId}
                      onNavigationSync={syncWritingNavigation}
                      onOpenDocReview={() => {
                        setSidebarMode('home');
                        setFocusedBusinessNav(null);
                        setActiveTab('doc-review');
                      }}
                      onSaveToDocumentCenter={handleAddDocument}
                    />
                  )}

                  {activeTab === 'doc-review' && <DocReviewView role={role} />}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="ai-workspace-bg flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-[1480px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeTab}-${role}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.12 }}
                  >
                    {activeTab === 'ai-console' && (
                      <WorkConsoleView
                        agents={agents.filter(a => myExpertIds.has(a.id))}
                        role={role}
                        onStartChat={handleStartChatFromAgent}
                        onStartChatWithPrompt={handleStartChatWithPrompt}
                        onOpenSession={(sessionId) => openAiSessions(sessionId)}
                      />
                    )}

                    {activeTab === 'agents' && (
                      <AgentsView
                        agents={agents}
                        role={role}
                        usedAgentIds={usedAgentIds}
                        onToggleEnable={handleToggleAgentEnable}
                        onStartChat={handleStartChatFromAgent}
                        onAddToMyExperts={handleAddToMyExperts}
                      />
                    )}

                    {activeTab === 'connectors' && (
                      <ConnectorsView
                        connectors={connectors}
                        role={role}
                        onAddConnector={handleAddConnector}
                      />
                    )}


                    {activeTab === 'automation-schedules' && (
                      <WorkflowsView
                        onRunTask={handleAutomationRun}
                        onOpenSession={(sessionId) => openAiSessions(sessionId)}
                      />
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>
      </div>
      <AnimatePresence>
        {isProfileOpen ? (
          <ProfileCenterModal user={currentUser} onClose={() => setIsProfileOpen(false)} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type LoginViewProps = {
  captcha: string;
  appearance: HomeAppearance;
  onRefreshCaptcha: () => void;
  onLogin: (username: string, password: string, captchaInput: string) => string | null;
};

function ProfileCenterModal({ user, onClose }: { user: CurrentUser; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="w-full max-w-[620px] overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.20)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-black/[0.06] bg-[linear-gradient(135deg,#fff,#fff7f8)] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[15px] font-bold text-[var(--gov-red-deep)]">
              {user.avatarLabel}
            </span>
            <div>
              <h3 className="text-[18px] font-bold text-[#202124]">个人中心</h3>
              <p className="mt-1 text-[12px] text-[#8a93a3]">基本信息与密码修改</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-[10px] p-2 text-[#98a2b3] transition hover:bg-white hover:text-[#344054]">
            <ChevronDown size={16} className="rotate-90" />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <section className="rounded-[14px] border border-black/[0.06] bg-[#fbfbfc] p-4">
            <h4 className="text-[13px] font-bold text-[#202124]">基本信息</h4>
            <div className="mt-4 space-y-3 text-[13px]">
              {[
                ['姓名', user.name],
                ['岗位', user.title],
                ['组织', user.org],
                ['角色', user.role === 'admin' ? '系统管理员' : '普通用户'],
                ['账号', user.ssoId]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-[#8a93a3]">{label}</span>
                  <span className="truncate font-semibold text-[#30343b]">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[14px] border border-black/[0.06] bg-white p-4">
            <h4 className="text-[13px] font-bold text-[#202124]">修改密码</h4>
            <div className="mt-4 space-y-3">
              {['当前密码', '新密码', '确认新密码'].map((label) => (
                <label key={label} className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-[#667085]">{label}</span>
                  <input type="password" className="gov-input h-10 w-full px-3 text-[13px]" placeholder={`请输入${label}`} />
                </label>
              ))}
            </div>
            <button type="button" className="gov-button-primary mt-4 h-10 w-full text-[13px] font-semibold">
              保存修改
            </button>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

const HISTORY_RECORDS = [
  {
    id: 'history-quarter-report',
    title: '季度汇报材料起草',
    type: '快速创作',
    time: '今天 14:26',
    status: '已生成',
    prompt: '结合三个月月报，生成二季度重点工作汇报。',
    detail: '已完成任务拆解、材料归并、结构生成与政务表达润色，形成一版可进入编辑器继续修改的汇报稿。'
  },
  {
    id: 'history-style-copy',
    title: '参照去年讲话稿仿写',
    type: '以稿写稿',
    time: '昨天 18:40',
    status: '已编辑',
    prompt: '参考去年领导讲话风格，改写今年安全生产会议讲话。',
    detail: '保留原稿结构与语气节奏，替换年度任务、组织口径与重点项目表述。'
  },
  {
    id: 'history-polish-notice',
    title: '端午值班通知润色',
    type: '文风润色',
    time: '06/16 18:12',
    status: '已下载',
    prompt: '把端午值班通知改得更正式、简洁，并检查敏感表述。',
    detail: '完成正式表达替换、重复句压缩、格式规范检查，并输出下载版本。'
  },
  {
    id: 'history-prompt-optimize',
    title: '优化公文写作提示词',
    type: '智能问答',
    time: '06/15 16:05',
    status: '已归档',
    prompt: '帮我优化一套适用于通知、请示、报告的公文写作提示词。',
    detail: '已按文种拆分提示词结构，补充写作目标、受众、约束条件和输出格式要求。'
  },
  {
    id: 'history-speech-polish',
    title: '领导讲话稿润色',
    type: '文风润色',
    time: '06/14 11:20',
    status: '已编辑',
    prompt: '把领导讲话稿改得更有层次，语言更稳重，适合会议发言。',
    detail: '已优化段落层级、过渡句和政务表达，保留原稿核心观点并压缩重复内容。'
  },
  {
    id: 'history-ppt-outline',
    title: 'PPT汇报大纲',
    type: 'PPT创作',
    time: '06/13 17:42',
    status: '已生成',
    prompt: '根据年度重点工作材料生成一份汇报 PPT 大纲。',
    detail: '已拆解汇报逻辑，形成背景、进展、问题、计划四部分演示结构。'
  },
  {
    id: 'history-table-extract',
    title: '表格数据提取',
    type: '智能表格',
    time: '06/12 09:36',
    status: '已下载',
    prompt: '从上传材料中提取项目名称、责任部门、完成时限和进度状态。',
    detail: '已识别表格字段并生成结构化结果，支持继续导出 Excel。'
  },
  {
    id: 'history-contract-review',
    title: '合同审查意见',
    type: '智能校对',
    time: '06/11 20:18',
    status: '已审查',
    prompt: '帮我检查合同条款里的风险点，并输出审查意见。',
    detail: '已识别付款、违约、验收和保密条款风险，生成可提交的审查意见摘要。'
  },
  {
    id: 'history-daily-summary',
    title: '昨日工作汇报整理',
    type: '快速创作',
    time: '06/10 18:55',
    status: '已生成',
    prompt: '把昨天的零散工作记录整理成一份简洁的工作汇报。',
    detail: '已按工作进展、存在问题、下一步计划整理为汇报稿。'
  }
];

function ExpertManagementView({
  selectedExpertId,
  onSummon
}: {
  selectedExpertId: HomeExpertId;
  onSummon: (expertId: HomeExpertId) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<'全部' | HomeExpertMarketCategory>('全部');
  const categories: Array<'全部' | HomeExpertMarketCategory> = ['全部', '政务', '办公', '写作', '数据', '法律', '金融'];
  const visibleExperts = HOME_EXPERTS.filter((expert) => activeCategory === '全部' || expert.marketCategories.includes(activeCategory));
  const iconPalette = [
    { icon: FileText, bg: 'linear-gradient(145deg,#fff1f2,#ffffff)', color: '#d9364b', glow: 'rgba(217,54,75,0.14)' },
    { icon: ClipboardList, bg: 'linear-gradient(145deg,#eef4ff,#ffffff)', color: '#3b63d9', glow: 'rgba(59,99,217,0.13)' },
    { icon: MessageCircle, bg: 'linear-gradient(145deg,#ecfdf7,#ffffff)', color: '#0f8f7b', glow: 'rgba(15,143,123,0.13)' },
    { icon: PenTool, bg: 'linear-gradient(145deg,#fff7ed,#ffffff)', color: '#c56a17', glow: 'rgba(197,106,23,0.13)' },
    { icon: FileSearch, bg: 'linear-gradient(145deg,#f5f0ff,#ffffff)', color: '#7c3aed', glow: 'rgba(124,58,237,0.13)' },
    { icon: Layers, bg: 'linear-gradient(145deg,#eefdfd,#ffffff)', color: '#0891b2', glow: 'rgba(8,145,178,0.13)' }
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#fbfbfc] px-7 py-6 text-[var(--gov-text)]">
      <div className="mx-auto w-full max-w-[1560px] space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[24px] font-bold tracking-normal text-[#151922]">专家市场</p>
            <p className="mt-2 text-[13px] leading-6 text-[#7a808a]">选择专家后回到首页，以对应专家身份发起问答和任务处理。</p>
          </div>
          <div className="flex h-11 min-w-[320px] items-center gap-2 rounded-[13px] border border-black/[0.06] bg-white px-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
            <Search size={16} className="text-[#98a2b3]" />
            <span className="text-[13px] text-[#98a2b3]">搜索专家、场景或能力</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`h-9 rounded-full px-4 text-[13px] font-semibold transition ${
                activeCategory === category
                  ? 'bg-[#151922] text-white shadow-[0_8px_22px_rgba(15,23,42,0.12)]'
                  : 'border border-black/[0.06] bg-white text-[#667085] hover:bg-[#f7f8fa] hover:text-[#202124]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleExperts.map((expert, index) => {
            const isSelected = selectedExpertId === expert.id;
            const accent = iconPalette[index % iconPalette.length];
            const ExpertIcon = accent.icon;
            return (
              <button
                key={expert.id}
                type="button"
                onClick={() => onSummon(expert.id)}
                className={`group relative min-h-[210px] overflow-hidden rounded-[18px] border bg-white p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(15,23,42,0.10)] ${
                  isSelected ? 'border-[var(--gov-red-line)] shadow-[0_18px_42px_rgba(190,51,62,0.12)]' : 'border-black/[0.06] shadow-[0_8px_26px_rgba(15,23,42,0.04)]'
                }`}
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-2xl transition group-hover:scale-110" style={{ background: accent.glow }} />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border border-white shadow-[0_14px_28px_rgba(15,23,42,0.10),inset_0_-8px_16px_rgba(15,23,42,0.04)]"
                      style={{ background: accent.bg, color: accent.color }}
                    >
                      <ExpertIcon size={24} strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-bold text-[#151922]">{expert.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-[12px] font-medium text-[#8a93a3]">{expert.id === DEFAULT_HOME_EXPERT_ID ? '默认专家' : '可召唤专家'}</p>
                        <span className="rounded-full bg-[#fff1f0] px-2 py-0.5 text-[10px] font-bold text-[var(--gov-red-deep)]">{expert.category}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[var(--gov-red-deep)] shadow-[0_8px_18px_rgba(190,51,62,0.10)]">已选中</span>
                  ) : null}
                </div>

                <p className="relative mt-5 min-h-[52px] text-[13px] leading-6 text-[#5f6875]">{expert.description}</p>

                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {expert.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#667085] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#98a2b3]">
                    <Sparkles size={13} />
                    {expert.processFocus.length} 项核心能力
                  </span>
                  <span className="translate-y-1 rounded-[11px] bg-[#151922] px-3.5 py-2 text-[12px] font-semibold text-white opacity-0 shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    召唤专家
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HistoryView({ initialSelectedId }: { initialSelectedId?: string }) {
  const selectedRecord = HISTORY_RECORDS.find((record) => record.id === initialSelectedId) ?? HISTORY_RECORDS[0];

  return (
    <div className="h-full overflow-y-auto bg-white px-8 py-7 text-[var(--gov-text)]">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-7 border-b border-black/[0.06] pb-5">
          <p className="text-[20px] font-semibold leading-tight tracking-normal">{selectedRecord.title}</p>
          <p className="mt-2 text-[13px] text-[var(--gov-text-muted)]">{selectedRecord.time} · {selectedRecord.type} · {selectedRecord.status}</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-end">
            <div className="max-w-[76%] rounded-[18px] bg-[#f6f6f6] px-5 py-4">
              <p className="text-[12px] font-semibold text-[#8a8f98]">我的需求</p>
              <p className="mt-2 text-[15px] leading-7 text-[#202124]">{selectedRecord.prompt}</p>
            </div>
          </div>

          <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]">
                <Sparkles size={17} />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-[#202124]">Agent 处理过程</p>
                <p className="mt-0.5 text-[12px] text-[#8a8f98]">已完成任务理解、材料处理和结果汇总</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                '识别任务类型、目标文种和输出要求',
                '检索历史材料与知识库素材，提取可复用结构',
                '调用公文写作、政务表达润色和格式校验工具',
                selectedRecord.detail
              ].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[11px] font-semibold text-[var(--gov-red-deep)]">{index + 1}</span>
                  <p className="text-[14px] leading-6 text-[#202124]">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] p-5">
            <p className="text-[15px] font-semibold text-[#202124]">生成结果</p>
            <p className="mt-2 text-[14px] leading-7 text-[#4b5563]">
              系统已保留本次任务的输入、拆解步骤、工具调用记录和最终文本结果。后续可从编辑器继续处理，也可作为同类公文任务的参考样例。
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3 text-[13px] font-semibold text-[#202124] ring-1 ring-black/[0.06] transition hover:bg-[#fafafa]">
                <FileText size={15} />
                去编辑
              </button>
              <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[var(--gov-red)] px-3 text-[13px] font-semibold text-white transition hover:bg-[var(--gov-red-deep)]">
                <FileSearch size={15} />
                下载
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginView({ captcha, appearance, onRefreshCaptcha, onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const shouldUseDemoLogin = !username.trim() && !password && !captchaInput.trim();
    const loginError = shouldUseDemoLogin
      ? onLogin('admin', 'admin123', captcha)
      : onLogin(username, password, captchaInput);
    setError(loginError);
    if (loginError) {
      setCaptchaInput('');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.99)_0,rgba(255,255,255,0.92)_30%,transparent_58%),radial-gradient(circle_at_84%_16%,rgba(255,250,248,0.72)_0,transparent_38%),linear-gradient(135deg,#ffffff_0%,#fffdfb_52%,#f8f4f2_100%)] px-6 py-6 text-[#22252c]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(214,54,75,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(214,54,75,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-12%] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(231,77,94,0.08)_0,rgba(231,77,94,0.01)_64%,transparent_74%)] blur-2xl" />
      <img
        src={DEFAULT_PRODUCT_ICON_URL}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-150px] right-[-128px] h-[640px] w-[640px] select-none rounded-[150px] object-cover opacity-[0.12] saturate-[0.95] blur-[0.15px] md:h-[760px] md:w-[760px]"
      />

      <header className="relative z-10 mt-4 flex w-full items-center justify-end">
        <div className="hidden items-center text-[13px] font-medium text-[#7d6f70] md:flex">
          <span>智能问答</span>
          <span className="mx-3 text-[#c9b5b1]">|</span>
          <span>智能写作</span>
          <span className="mx-3 text-[#c9b5b1]">|</span>
          <span>智能审校</span>
          <span className="mx-3 text-[#c9b5b1]">|</span>
          <span>Agent协同</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-[1220px] grid-cols-1 items-center gap-5 py-10 lg:grid-cols-[620px_540px]">
        <section className="max-w-[620px]">
          <h1 className="text-[42px] font-semibold leading-[1.08] tracking-normal text-[#db4053] sm:text-[54px]">
            {appearance.productName}
          </h1>
          <p className="mt-3 text-[18px] font-semibold tracking-normal text-[#8b94a3] sm:text-[22px]">
            {appearance.productSubtitle}
          </p>
          <p className="mt-5 text-[23px] font-semibold tracking-normal text-[#39404c] sm:text-[28px]">
            让公文流转更轻，让智能办公更近
          </p>
          <p className="mt-8 max-w-[540px] text-[15px] font-medium leading-7 text-[#6f7886]">
            金山文澜已接入公文写作、智能校对、排版审查与智能体协同能力，面向政务办公全流程提效。
          </p>
        </section>

        <section className="relative rounded-[28px] border border-white/70 bg-white/76 p-10 shadow-[0_34px_96px_rgba(117,65,61,0.17)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-[linear-gradient(145deg,rgba(255,255,255,0.68),rgba(255,245,242,0.18))]" />
          <div className="relative">
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-[13px] font-semibold text-[#596170]">账号</span>
                <div className="flex h-14 items-center gap-3 rounded-[16px] border border-black/[0.07] bg-white/84 px-4 transition focus-within:border-[#e74d5e]/45 focus-within:ring-4 focus-within:ring-[#e74d5e]/10">
                  <UserRound size={17} className="text-[#9aa0a6]" />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#b0a8a6]"
                    placeholder="admin 或 zhangsan"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-[13px] font-semibold text-[#596170]">密码</span>
                <div className="flex h-14 items-center gap-3 rounded-[16px] border border-black/[0.07] bg-white/84 px-4 transition focus-within:border-[#e74d5e]/45 focus-within:ring-4 focus-within:ring-[#e74d5e]/10">
                  <LockKeyhole size={17} className="text-[#9aa0a6]" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#b0a8a6]"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-[13px] font-semibold text-[#596170]">验证码</span>
                <div className="grid grid-cols-[1fr_132px] gap-3">
                  <div className="flex h-14 items-center gap-3 rounded-[16px] border border-black/[0.07] bg-white/84 px-4 transition focus-within:border-[#e74d5e]/45 focus-within:ring-4 focus-within:ring-[#e74d5e]/10">
                    <KeyRound size={17} className="text-[#9aa0a6]" />
                    <input
                      value={captchaInput}
                      onChange={(event) => setCaptchaInput(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-[15px] font-medium uppercase outline-none placeholder:text-[#b0a8a6]"
                      placeholder="4位字符"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onRefreshCaptcha}
                    className="flex h-14 items-center justify-center gap-2 rounded-[16px] border border-[#e74d5e]/18 bg-[#fff6f4] px-3 text-[15px] font-semibold tracking-[0.12em] text-[#d9364b] transition hover:bg-[#ffecea]"
                    title="刷新验证码"
                  >
                    <span>{captcha}</span>
                    <RefreshCw size={14} className="text-[#d9364b]/70" />
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-[12px] border border-[rgba(217,54,75,0.18)] bg-[#fff0ed] px-3 py-2 text-xs font-medium text-[#d9364b]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-[#e74d5e] px-4 text-[15px] font-semibold text-white shadow-[0_16px_32px_rgba(217,54,75,0.22)] transition hover:-translate-y-0.5 hover:bg-[#d9364b]"
              >
                <ShieldCheck size={16} />
                <span>登录平台</span>
              </button>
            </form>

          </div>
        </section>
      </main>
    </div>
  );
}
