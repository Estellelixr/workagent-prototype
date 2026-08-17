import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Agent, AdminSection, AdminSubSection, AuditLogItem, Connector, Role, SkillItem, AGENT_CATEGORY_OPTIONS, AgentCategory } from '../types';
import { RED_TEMPLATE_STYLE_OPTIONS, WRITING_CATEGORIES } from './DocWritingConsoleView';
import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  Edit3,
  Eye,
  FileKey,
  FileText,
  FileUp,
  FolderTree,
  HardDrive,
  KeyRound,
  MoreHorizontal,
  Lock,
  MessageSquareText,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
  Globe2,
  UserRound,
  Users
} from 'lucide-react';
import PrototypeIcon from './PrototypeIcon';
import { DEFAULT_PRODUCT_ICON_URL, resolvePublicAssetUrl } from '../utils/publicAsset';

interface AdminViewProps {
  section: AdminSection;
  subSection: AdminSubSection;
  skills: SkillItem[];
  agents: Agent[];
  connectors: Connector[];
  auditLogs: AuditLogItem[];
  role: Role;
  onAddSkill: (newSkill: SkillItem) => void;
}

type AdminUser = {
  name: string;
  org: string;
  post: string;
  status: '启用' | '停用';
  level: string;
  builtInRole: string;
};

const users: AdminUser[] = [
  { name: '系统管理员', org: '信创平台运维中心', post: 'FDE', status: '启用', level: '平台运维', builtInRole: '系统管理员' },
  { name: '张三', org: '法律事务中心一科', post: '法务专员', status: '启用', level: 'A级核心', builtInRole: '普通用户' },
  { name: '李敏', org: '财务资金管理中心', post: '预算主管', status: '启用', level: 'B级重要', builtInRole: '普通用户' },
  { name: '王强', org: '办公室', post: '综合文秘', status: '停用', level: '内部', builtInRole: '普通用户' }
];

const userRoleOptions = ['普通用户', '部门管理员', '公文管理员', '系统管理员', '安全管理员', '安全审计员'];

const departments = [
  { name: '中国国资建工集团总部', code: 'CN_GG_GROUP', children: 18, level: '集团根组织' },
  { name: '法律合规管理事务中心', code: 'HN_LAW', children: 5, level: 'A级核心' },
  { name: '财务资金管理事务中心', code: 'HN_FIN', children: 7, level: 'B级重要' },
  { name: '党群工作部 / 办公室', code: 'HN_OFFICE', children: 6, level: '内部' }
];

type AdminOrgUnit = {
  id: string;
  parentId?: string;
  name: string;
  code: string;
  leader: string;
  memberCount: number;
  status: '已启用' | '已停用';
  sortOrder?: number;
};

const initialOrgUnits: AdminOrgUnit[] = [
  { id: 'org-root', name: '金山文澜智能创作平台', code: 'KS_GOV_ROOT', leader: '系统管理员', memberCount: 5410, status: '已启用' },
  { id: 'org-office', parentId: 'org-root', name: '办公室', code: 'KS_OFFICE', leader: '赵主任', memberCount: 86, status: '已启用' },
  { id: 'org-secretary', parentId: 'org-office', name: '综合文秘科', code: 'KS_OFFICE_SECRETARY', leader: '张三', memberCount: 18, status: '已启用' },
  { id: 'org-policy', parentId: 'org-root', name: '政策研究室', code: 'KS_POLICY', leader: '李敏', memberCount: 32, status: '已启用' },
  { id: 'org-legal', parentId: 'org-root', name: '法律合规中心', code: 'KS_LEGAL', leader: '王强', memberCount: 46, status: '已启用' },
  { id: 'org-finance', parentId: 'org-root', name: '财务资金中心', code: 'KS_FINANCE', leader: '陈会计', memberCount: 41, status: '已停用' }
];

type AdminRoleRecord = {
  id: string;
  name: string;
  code: string;
  scope: string;
  members: number;
  status: '已启用' | '已停用';
  builtin?: boolean;
  permissions: string[];
};

const initialRoleRecords: AdminRoleRecord[] = [
  { id: 'role-admin', name: '系统管理员', code: 'system_admin', scope: '全部后台与前台能力', members: 2, status: '已启用', builtin: true, permissions: ['用户管理', '组织管理', '角色管理', '菜单管理', '模型管理', '提示词管理'] },
  { id: 'role-doc', name: '公文管理员', code: 'doc_admin', scope: '公文写作后台、文库管理', members: 6, status: '已启用', permissions: ['写作场景管理', '提示词管理', '文库管理'] },
  { id: 'role-user', name: '普通用户', code: 'normal_user', scope: '工作台基础能力', members: 5400, status: '已启用', builtin: true, permissions: ['首页', '智能公文', '知识库'] },
  { id: 'role-model', name: '模型运维员', code: 'model_operator', scope: '模型接入与连通性测试', members: 3, status: '已停用', permissions: ['模型管理'] }
];

type RoleBoundUser = {
  id: string;
  roleId: string;
  name: string;
  account: string;
  org: string;
  permissionScope: string;
  status: '启用' | '停用';
};

const initialRoleBoundUsers: RoleBoundUser[] = [
  { id: 'ru-001', roleId: 'role-admin', name: '系统管理员', account: 'sysadmin', org: '信创平台运维中心', permissionScope: '全部后台与前台能力', status: '启用' },
  { id: 'ru-002', roleId: 'role-admin', name: '平台管理员', account: 'platform_admin', org: '信创平台运维中心', permissionScope: '全部后台与前台能力', status: '启用' },
  { id: 'ru-003', roleId: 'role-doc', name: '张三', account: 'zhangsan', org: '办公室', permissionScope: '公文写作后台、文库管理', status: '启用' },
  { id: 'ru-004', roleId: 'role-doc', name: '李敏', account: 'limin', org: '政策研究室', permissionScope: '公文写作后台、文库管理', status: '启用' },
  { id: 'ru-005', roleId: 'role-doc', name: '周晓兰', account: 'zhouxl', org: '综合文秘科', permissionScope: '公文写作后台、文库管理', status: '启用' },
  { id: 'ru-006', roleId: 'role-user', name: '王强', account: 'wangqiang', org: '法律合规中心', permissionScope: '工作台基础能力', status: '停用' },
  { id: 'ru-007', roleId: 'role-user', name: '陈会计', account: 'chenkj', org: '财务资金中心', permissionScope: '工作台基础能力', status: '启用' },
  { id: 'ru-008', roleId: 'role-model', name: '模型运维员', account: 'model_ops', org: '信创平台运维中心', permissionScope: '模型接入与连通性测试', status: '启用' }
];

type AdminMenuRecord = {
  id: string;
  parentId?: string;
  name: string;
  code: string;
  path: string;
  visibleRange: string;
  status: '已启用' | '已停用';
  resourceType?: '菜单' | '按钮';
  sortOrder?: number;
  iconUrl?: string;
  componentName?: string;
  createdAt?: string;
};

const initialMenuRecords: AdminMenuRecord[] = ([
  { id: 'menu-home', name: '首页', code: 'workbench.home', path: '/home', visibleRange: '全员可见', status: '已启用', resourceType: '菜单', componentName: 'HomeWorkbench' },
  { id: 'btn-home-new-task', parentId: 'menu-home', name: '新建任务', code: 'workbench.home.create_task', path: 'action:create-task', visibleRange: '全员可见', status: '已启用', resourceType: '按钮' },
  { id: 'btn-home-add-reference', parentId: 'menu-home', name: '添加参考文档', code: 'workbench.home.add_reference', path: 'action:add-reference', visibleRange: '全员可见', status: '已启用', resourceType: '按钮' },
  { id: 'menu-doc', name: '智能公文', code: 'workbench.doc', path: '/doc-writing', visibleRange: '全员可见', status: '已启用', resourceType: '菜单', componentName: 'DocWritingConsole' },
  { id: 'menu-write', parentId: 'menu-doc', name: 'AI写作', code: 'workbench.doc.write', path: '/doc-writing/write', visibleRange: '全员可见', status: '已启用', resourceType: '菜单', componentName: 'AiWritingWizard' },
  { id: 'btn-write-generate', parentId: 'menu-write', name: '开始生成', code: 'workbench.doc.write.generate', path: 'action:generate', visibleRange: '全员可见', status: '已启用', resourceType: '按钮' },
  { id: 'btn-write-edit', parentId: 'menu-write', name: '编辑文稿', code: 'workbench.doc.write.edit', path: 'action:edit-document', visibleRange: '全员可见', status: '已启用', resourceType: '按钮' },
  { id: 'menu-polish', parentId: 'menu-doc', name: 'AI润色', code: 'workbench.doc.polish', path: '/doc-writing/polish', visibleRange: '全员可见', status: '已启用', resourceType: '菜单', componentName: 'PolishWizard' },
  { id: 'btn-polish-start', parentId: 'menu-polish', name: '开始润色', code: 'workbench.doc.polish.start', path: 'action:polish-start', visibleRange: '全员可见', status: '已启用', resourceType: '按钮' },
  { id: 'menu-knowledge', name: '知识库', code: 'workbench.knowledge', path: '/knowledge', visibleRange: '授权用户可见', status: '已启用', resourceType: '菜单', componentName: 'KnowledgeLibrary' },
  { id: 'btn-knowledge-create', parentId: 'menu-knowledge', name: '新建文件/文件夹', code: 'workbench.knowledge.create', path: 'action:create-file-or-folder', visibleRange: '授权用户可见', status: '已启用', resourceType: '按钮' },
  { id: 'btn-knowledge-permission', parentId: 'menu-knowledge', name: '设置权限', code: 'workbench.knowledge.permission', path: 'action:set-permission', visibleRange: '授权用户可见', status: '已启用', resourceType: '按钮' },
  { id: 'menu-admin', name: '后台管理', code: 'admin.root', path: '/admin', visibleRange: '管理员可见', status: '已启用', resourceType: '菜单', componentName: 'AdminShell' },
  { id: 'menu-admin-user', parentId: 'menu-admin', name: '用户与组织', code: 'admin.users', path: '/admin/users', visibleRange: '系统管理员', status: '已启用', resourceType: '菜单', componentName: 'UsersOrgAdmin' },
  { id: 'btn-user-reset-password', parentId: 'menu-admin-user', name: '重置密码', code: 'admin.users.reset_password', path: 'action:reset-password', visibleRange: '系统管理员', status: '已启用', resourceType: '按钮' },
  { id: 'menu-admin-role', parentId: 'menu-admin', name: '角色管理', code: 'admin.roles', path: '/admin/roles', visibleRange: '系统管理员', status: '已启用', resourceType: '菜单', componentName: 'RoleManagement' },
  { id: 'btn-role-add-user', parentId: 'menu-admin-role', name: '添加用户', code: 'admin.roles.add_user', path: 'action:add-role-user', visibleRange: '系统管理员', status: '已启用', resourceType: '按钮' }
] as AdminMenuRecord[]).map((item, index) => ({ ...item, sortOrder: (index + 1) * 10, createdAt: '2026-07-28 14:30' }));

const policies = [
  { name: '合同采购总报价脱敏', scope: '法务普通专员', strategy: 'SM4同态不落盘校验，不包含商户底册明细', owner: '安全管理员' },
  { name: '三重一大项目名保护', scope: '行政办起草人', strategy: '以流程ID掩码替代关键字', owner: '安全管理员' },
  { name: '离线供应商访问限制', scope: '外部供应商', strategy: '降级不可读，导出时强制遮挡水印', owner: '安全管理员' }
];

const systemSettings = [
  { name: '空间配额', value: '500 GB / 租户', desc: '本地信创集群存储上限' },
  { name: '模型/算力配置', value: '政务大模型专属池', desc: '按部门任务队列限流' },
  { name: '基础参数', value: 'SSO + Keycloak', desc: '统一身份与岗位同步源' },
  { name: '平台公告', value: '已启用', desc: '首页与登录页公告同步' }
];

export default function AdminView({ section, subSection, skills, agents, connectors, auditLogs, role, onAddSkill }: AdminViewProps) {
  const [skillSearch, setSkillSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillCat, setNewSkillCat] = useState('通用分类');
  const [isSyncingKeycloak, setIsSyncingKeycloak] = useState(false);

  const filteredSkills = useMemo(
    () => skills.filter((skill) => `${skill.name} ${skill.description}`.toLowerCase().includes(skillSearch.toLowerCase())),
    [skills, skillSearch]
  );

  const filteredLogs = useMemo(
    () => auditLogs.filter((log) => `${log.operator} ${log.agentName} ${log.node}`.toLowerCase().includes(auditSearch.toLowerCase())),
    [auditLogs, auditSearch]
  );

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    onAddSkill({
      id: `skill-${Date.now()}`,
      name: newSkillName,
      description: newSkillDesc || '提供针对央企复杂特定指标的多叉分析校验微服务能力。',
      category: newSkillCat,
      mountedAgentsCount: 0
    });
    setShowAddSkillForm(false);
    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillCat('通用分类');
  };

  const handleSyncKeycloak = () => {
    setIsSyncingKeycloak(true);
    setTimeout(() => setIsSyncingKeycloak(false), 900);
  };

  if (role !== 'admin') {
    return (
      <div className="mx-auto max-w-md rounded-[6px] border border-black/[0.06] bg-[#FAF9F6] p-8 text-center text-gray-800">
        <Lock className="mx-auto text-gray-400" size={32} />
        <h3 className="mt-4 text-sm font-bold text-gray-950">无权限访问管理后台</h3>
        <p className="mt-2 text-xs leading-6 text-gray-500">当前账号没有后台管理授权，请使用管理员演示账号登录。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {section === 'users-orgs' && <UsersAndOrgs subSection={subSection} isSyncing={isSyncingKeycloak} onSync={handleSyncKeycloak} />}
      {section === 'material-library' && <MaterialLibraryAdmin subSection={subSection} />}
      {section === 'model-management' && <ModelManagementAdmin subSection={subSection} />}
      {section === 'agent-management' && <AgentManagementAdmin />}
      {section === 'ai-resources' && (
        <AiResources
          subSection={subSection}
          agents={agents}
          connectors={connectors}
          filteredSkills={filteredSkills}
          skillSearch={skillSearch}
          onSkillSearch={setSkillSearch}
          onShowAddSkill={() => setShowAddSkillForm(true)}
        />
      )}
      {section === 'writing-admin' && <WritingAdmin subSection={subSection} />}
      {section === 'system-settings' && <SystemManagementAdmin subSection={subSection} />}

      <AnimatePresence>
        {showAddSkillForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <form onSubmit={handleCreateSkill} className="w-full max-w-sm rounded-[6px] border border-black/[0.08] bg-white">
              <div className="border-b border-black/[0.06] bg-[#FAF9F6] p-4">
                <h4 className="text-sm font-bold text-gray-900">注册技能服务</h4>
                <p className="mt-1 text-xs leading-5 text-gray-500">技能库用于后台统一归属、挂载和配置。</p>
              </div>
              <div className="space-y-4 p-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-gray-700">技能类别</span>
                  <select className="w-full rounded-[4px] border border-black/[0.08] bg-white p-2 text-xs" value={newSkillCat} onChange={(e) => setNewSkillCat(e.target.value)}>
                    <option value="合同解析类">合同解析类</option>
                    <option value="国家标准类">国家标准类</option>
                    <option value="组织权限类">组织权限类</option>
                    <option value="财务审计类">财务审计类</option>
                    <option value="通用分类">通用分类</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-gray-700">技能名称</span>
                  <input className="w-full rounded-[4px] border border-black/[0.08] px-3 py-2 text-xs" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} required />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-gray-700">说明</span>
                  <textarea className="h-20 w-full resize-none rounded-[4px] border border-black/[0.08] px-3 py-2 text-xs" value={newSkillDesc} onChange={(e) => setNewSkillDesc(e.target.value)} required />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] p-4">
                <button type="button" onClick={() => setShowAddSkillForm(false)} className="rounded-[4px] border border-black/[0.08] bg-white px-3 py-1.5 text-xs text-gray-700">取消</button>
                <button type="submit" className="rounded-[4px] bg-[#23221F] px-4 py-1.5 text-xs font-semibold text-white">确认录入</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Overview({ skills, agents, connectors, auditLogs }: Pick<AdminViewProps, 'skills' | 'agents' | 'connectors' | 'auditLogs'>) {
  const metrics = [
    { label: '用户与组织同步状态', value: '5,410 / 36', desc: 'Keycloak 职工与部门已同步', icon: Users, iconKey: 'admin-users' },
    { label: 'AI资源运行状态', value: `${agents.filter((item) => item.isEnabled).length}/${agents.length}`, desc: `数字专家启用，技能 ${skills.length} 项`, icon: Bot, iconKey: 'admin-agent' },
    { label: '公文写作资源状态', value: `${WRITING_CATEGORIES.reduce((total, item) => total + (item.children?.length || 0), 0) + RED_TEMPLATE_STYLE_OPTIONS.length}`, desc: '写作场景与套红模板可用', icon: FileText, iconKey: 'admin-prompt' },
    { label: '审计告警', value: `${auditLogs.length}`, desc: '近7日留痕记录', icon: AlertTriangle, iconKey: 'admin-audit' },
    { label: '系统健康', value: `${connectors.filter((item) => item.status === 'connected').length}/${connectors.length}`, desc: '连接器在线情况', icon: Activity, iconKey: 'model-test' }
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {metrics.map((item) => {
          return (
            <div key={item.label} className="ai-admin-card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--gov-text-muted)]">{item.label}</span>
                <PrototypeIcon name={item.iconKey} size={32} alt={`${item.label}图标`} />
              </div>
              <p className="mt-3 text-2xl font-semibold text-[var(--gov-text)]">{item.value}</p>
              <p className="mt-1 text-[11px] text-[var(--gov-text-muted)]">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsersAndOrgs({ subSection, isSyncing, onSync }: { subSection: AdminSubSection; isSyncing: boolean; onSync: () => void }) {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(users);
  const [orgUnits, setOrgUnits] = useState<AdminOrgUnit[]>(initialOrgUnits);
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部状态');
  const [selectedUserKeys, setSelectedUserKeys] = useState<Set<string>>(() => new Set());
  const [isUserImportOpen, setIsUserImportOpen] = useState(false);
  const [userImportFile, setUserImportFile] = useState<File | null>(null);
  const [userImportNotice, setUserImportNotice] = useState('');
  const [editingUserKey, setEditingUserKey] = useState<string | null>(null);
  const [userDraft, setUserDraft] = useState<AdminUser | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [departmentAdjustTarget, setDepartmentAdjustTarget] = useState<AdminUser[] | null>(null);
  const [departmentAdjustValue, setDepartmentAdjustValue] = useState(departments[0]?.name ?? '');
  const [passwordResetTarget, setPasswordResetTarget] = useState<AdminUser[] | null>(null);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [passwordConfirmDraft, setPasswordConfirmDraft] = useState('');
  const [isUserOrgPickerOpen, setIsUserOrgPickerOpen] = useState(false);
  const [expandedOrgIds, setExpandedOrgIds] = useState<Set<string>>(() => new Set(['org-root', 'org-office']));
  const [selectedOrgId, setSelectedOrgId] = useState('org-root');
  const [orgMenuId, setOrgMenuId] = useState<string | null>(null);
  const [orgEditor, setOrgEditor] = useState<{ mode: 'create' | 'edit'; parentId?: string; orgId?: string } | null>(null);
  const [orgDraft, setOrgDraft] = useState<AdminOrgUnit | null>(null);

  useEffect(() => {
    if (!userImportNotice) return undefined;
    const timer = window.setTimeout(() => setUserImportNotice(''), 4200);
    return () => window.clearTimeout(timer);
  }, [userImportNotice]);

  const userKey = (item: AdminUser) => `${item.name}-${item.org}-${item.post}`;
  const filteredUsers = adminUsers.filter((item) => {
    const matchedKeyword = `${item.name} ${item.org} ${item.post} ${item.builtInRole}`.toLowerCase().includes(userSearch.trim().toLowerCase());
    const matchedStatus = statusFilter === '全部状态' || item.status === statusFilter;
    return matchedKeyword && matchedStatus;
  });
  const selectedOrg = orgUnits.find((item) => item.id === selectedOrgId) ?? orgUnits[0];
  const selectedOrgChildren = orgUnits.filter((item) => item.parentId === selectedOrg?.id);
  const splitOrgNames = (orgText: string) => orgText.split(/[、,，/]/).map((item) => item.trim()).filter(Boolean);
  const collectOrgIds = (id: string): string[] => {
    const childIds = orgUnits.filter((item) => item.parentId === id).flatMap((item) => collectOrgIds(item.id));
    return [id, ...childIds];
  };
  const collectOrgNames = (org?: AdminOrgUnit) => {
    if (!org) return new Set<string>();
    const ids = new Set(collectOrgIds(org.id));
    return new Set(orgUnits.filter((item) => ids.has(item.id)).map((item) => item.name));
  };
  const selectedOrgNameSet = collectOrgNames(selectedOrg);
  const selectedOrgUsers = adminUsers.filter((item) => splitOrgNames(item.org).some((name) => selectedOrgNameSet.has(name)));

  const openUserEditor = (item?: AdminUser) => {
    setEditingUserKey(item ? userKey(item) : null);
    setUserDraft(item ? { ...item } : { name: '', org: departments[0]?.name ?? '', post: '', status: '启用', level: '内部', builtInRole: userRoleOptions[0] });
    setNewUserPassword('');
  };

  const saveUserDraft = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userDraft?.name.trim() || !userDraft.post.trim()) return;
    if (!editingUserKey && !newUserPassword.trim()) {
      setUserImportNotice('请输入初始密码');
      return;
    }
    if (editingUserKey) {
      setAdminUsers((items) => items.map((item) => userKey(item) === editingUserKey ? userDraft : item));
    } else {
      setAdminUsers((items) => [{ ...userDraft, status: '启用' }, ...items]);
    }
    setUserDraft(null);
    setEditingUserKey(null);
    setNewUserPassword('');
  };

  const toggleUserStatus = (target: AdminUser) => {
    setAdminUsers((items) => items.map((item) => userKey(item) === userKey(target) ? { ...item, status: item.status === '停用' ? '启用' : '停用' } : item));
  };

  const openOrgEditor = (mode: 'create' | 'edit', org?: AdminOrgUnit, parentId?: string) => {
    setOrgEditor({ mode, orgId: org?.id, parentId });
    setOrgDraft(org ? { ...org } : { id: `org-${Date.now()}`, parentId, name: '', code: '', leader: '', memberCount: 0, status: '已启用', sortOrder: orgUnits.filter((item) => item.parentId === parentId).length + 1 });
  };

  const saveOrgDraft = (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgDraft?.name.trim()) return;
    const normalizedDraft = {
      ...orgDraft,
      code: orgDraft.code.trim() || `ORG_${orgDraft.id.replace(/\D/g, '').slice(-6) || Date.now()}`
    };
    if (orgEditor?.mode === 'edit') {
      setOrgUnits((items) => items.map((item) => item.id === orgEditor.orgId ? normalizedDraft : item));
    } else {
      setOrgUnits((items) => [...items, normalizedDraft]);
      if (normalizedDraft.parentId) setExpandedOrgIds((current) => new Set(current).add(normalizedDraft.parentId!));
    }
    setSelectedOrgId(normalizedDraft.id);
    setOrgEditor(null);
    setOrgDraft(null);
    setOrgMenuId(null);
  };

  const deleteOrgUnit = (org: AdminOrgUnit) => {
    if (org.id === 'org-root') return;
    const ids = new Set(collectOrgIds(org.id));
    setOrgUnits((items) => items.filter((item) => !ids.has(item.id)));
    if (ids.has(selectedOrgId)) setSelectedOrgId(org.parentId ?? 'org-root');
    setOrgMenuId(null);
  };

  const deleteOrgWithCheck = (org?: AdminOrgUnit) => {
    if (!org) return;
    if (org.id === 'org-root') {
      setUserImportNotice('根部门不能删除');
      return;
    }
    const scopedOrgNames = collectOrgNames(org);
    const usersInOrg = adminUsers.filter((item) => splitOrgNames(item.org).some((name) => scopedOrgNames.has(name)));
    if (usersInOrg.length > 0) {
      setUserImportNotice(`“${org.name}”下仍有 ${usersInOrg.length} 名用户，不能删除部门`);
      return;
    }
    const deletedName = org.name;
    deleteOrgUnit(org);
    setUserImportNotice(`已删除部门“${deletedName}”`);
  };

  const deleteSelectedOrg = () => {
    deleteOrgWithCheck(selectedOrg);
  };

  const renderOrgNode = (org: AdminOrgUnit, depth = 0): React.ReactNode => {
    const children = orgUnits.filter((item) => item.parentId === org.id);
    const expanded = expandedOrgIds.has(org.id);
    const selected = selectedOrgId === org.id;
    return (
      <div key={org.id} className="relative">
        <div
          className={`group flex h-11 w-full items-center gap-2 rounded-[9px] px-2.5 text-left transition ${selected ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)] shadow-sm' : 'text-[#475467] hover:bg-white'}`}
          style={{ paddingLeft: 10 + depth * 18 }}
        >
          {children.length > 0 ? (
            <button type="button" onClick={(event) => { event.stopPropagation(); setExpandedOrgIds((current) => { const next = new Set(current); next.has(org.id) ? next.delete(org.id) : next.add(org.id); return next; }); }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-[#98a2b3] hover:bg-[#f5f5f5]" aria-label={expanded ? '收起部门' : '展开部门'}>
              <ChevronRight size={14} className={`transition ${expanded ? 'rotate-90' : ''}`} />
            </button>
          ) : <span className="h-6 w-6 shrink-0" />}
          <button type="button" onClick={() => { setSelectedOrgId(org.id); setSelectedUserKeys(new Set()); }} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <Building2 size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{org.name}</span>
            <span className="text-[10px] text-[#98a2b3]">{org.memberCount}</span>
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); setOrgMenuId((current) => current === org.id ? null : org.id); }} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[#98a2b3] transition hover:bg-white hover:text-[#344054] ${orgMenuId === org.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} aria-label="部门操作">
            <MoreHorizontal size={15} />
          </button>
          {orgMenuId === org.id ? (
            <div className="absolute right-2 top-10 z-30 w-32 overflow-hidden rounded-[10px] border border-black/[0.08] bg-white py-1 text-[12px] shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
              <button type="button" onClick={(event) => { event.stopPropagation(); openOrgEditor('create', undefined, org.id); }} className="block w-full px-3 py-2 text-left font-medium text-[#344054] hover:bg-[#f7f8fa]">新增子部门</button>
              <button type="button" onClick={(event) => { event.stopPropagation(); openOrgEditor('edit', org); }} className="block w-full px-3 py-2 text-left font-medium text-[#344054] hover:bg-[#f7f8fa]">编辑</button>
              <button type="button" onClick={(event) => { event.stopPropagation(); deleteOrgWithCheck(org); }} className="block w-full px-3 py-2 text-left font-medium text-[var(--gov-red-deep)] hover:bg-[#fff1f0]">删除</button>
            </div>
          ) : null}
        </div>
        {expanded ? <div className="mt-1 space-y-1">{children.map((child) => renderOrgNode(child, depth + 1))}</div> : null}
      </div>
    );
  };

  const openMemberEditor = (item?: AdminUser) => {
    setEditingUserKey(item ? userKey(item) : null);
    setUserDraft(item ? { ...item } : { name: '', org: selectedOrg?.name ?? orgUnits[0]?.name ?? '', post: '成员', status: '启用', level: '内部', builtInRole: userRoleOptions[0] });
  };
  const memberRowsBase = selectedOrg?.id === 'org-root'
    ? adminUsers
    : selectedOrgUsers;
  const memberRows = memberRowsBase.filter((item) => {
    const matchedKeyword = `${item.name} ${item.org} ${item.builtInRole}`.toLowerCase().includes(userSearch.trim().toLowerCase());
    const matchedStatus = statusFilter === '全部状态' || item.status === statusFilter;
    return matchedKeyword && matchedStatus;
  });
  const displayOrgName = (item: AdminUser) => item.org;

  const toggleUserSelection = (item: AdminUser) => {
    const key = userKey(item);
    setSelectedUserKeys((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleAllFilteredUsers = () => {
    const visibleKeys = filteredUsers.map(userKey);
    const allSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedUserKeys.has(key));
    setSelectedUserKeys((current) => {
      const next = new Set(current);
      visibleKeys.forEach((key) => allSelected ? next.delete(key) : next.add(key));
      return next;
    });
  };

  const toggleAllMemberRows = () => {
    const visibleKeys = memberRows.map(userKey);
    const allSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedUserKeys.has(key));
    setSelectedUserKeys((current) => {
      const next = new Set(current);
      visibleKeys.forEach((key) => allSelected ? next.delete(key) : next.add(key));
      return next;
    });
  };

  const disableSelectedUsers = () => {
    if (!selectedUsers.length) return;
    const targetKeys = new Set(selectedUsers.map(userKey));
    setAdminUsers((items) => items.map((item) => targetKeys.has(userKey(item)) ? { ...item, status: '停用' } : item));
    setUserImportNotice(`已停用 ${selectedUsers.length} 名用户`);
  };

  const deleteSelectedUsers = () => {
    if (!selectedUsers.length) return;
    const activeUsers = selectedUsers.filter((item) => item.status !== '停用');
    if (activeUsers.length > 0) {
      setUserImportNotice(`选中用户中有 ${activeUsers.length} 名仍为启用状态，不能删除，请先停用后再删除`);
      return;
    }
    const targetKeys = new Set(selectedUsers.map(userKey));
    setAdminUsers((items) => items.filter((item) => !targetKeys.has(userKey(item))));
    setSelectedUserKeys(new Set());
    setUserImportNotice(`已删除 ${selectedUsers.length} 名停用用户`);
  };

  const deleteUserWithCheck = (target: AdminUser) => {
    if (target.status !== '停用') {
      setUserImportNotice(`用户“${target.name}”仍为启用状态，不能删除，请先停用后再删除`);
      return;
    }
    const targetKey = userKey(target);
    setAdminUsers((items) => items.filter((item) => userKey(item) !== targetKey));
    setSelectedUserKeys((keys) => {
      const next = new Set(keys);
      next.delete(targetKey);
      return next;
    });
    setUserImportNotice(`已删除停用用户“${target.name}”`);
  };

  const downloadTextFile = (filename: string, text: string, type: string) => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadUserImportTemplate = () => {
    const spreadsheetXml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="用户导入模板"><Table><Row><Cell><Data ss:Type="String">姓名</Data></Cell><Cell><Data ss:Type="String">岗位</Data></Cell><Cell><Data ss:Type="String">组织</Data></Cell><Cell><Data ss:Type="String">角色</Data></Cell><Cell><Data ss:Type="String">密级</Data></Cell><Cell><Data ss:Type="String">状态</Data></Cell></Row><Row><Cell><Data ss:Type="String">示例用户</Data></Cell><Cell><Data ss:Type="String">综合文秘</Data></Cell><Cell><Data ss:Type="String">办公室</Data></Cell><Cell><Data ss:Type="String">普通用户</Data></Cell><Cell><Data ss:Type="String">内部</Data></Cell><Cell><Data ss:Type="String">启用</Data></Cell></Row></Table></Worksheet></Workbook>`;
    downloadTextFile('用户批量导入模板.xls', spreadsheetXml, 'application/vnd.ms-excel;charset=utf-8');
  };

  const exportCurrentUserList = () => {
    const currentRows = memberRows;
    if (!currentRows.length) {
      setUserImportNotice('当前筛选条件下没有可导出的用户');
      return;
    }
    const rows = [
      ['姓名', '账号', '组织', '岗位', '角色', '密级', '状态'],
      ...currentRows.map((item) => [item.name, `${item.name.toLowerCase().replace(/\s+/g, '_')}_gov`, item.org, item.post, item.builtInRole, item.level, item.status]),
    ];
    const escapeXml = (value: string) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const spreadsheetXml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="用户列表"><Table>${rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
    const scopeName = selectedOrg?.id === 'org-root' ? '全部部门' : selectedOrg?.name ?? '当前部门';
    downloadTextFile(`用户列表_${scopeName}_${currentRows.length}人.xls`, spreadsheetXml, 'application/vnd.ms-excel;charset=utf-8');
    setUserImportNotice(`已导出当前筛选条件下 ${currentRows.length} 名用户`);
  };

  const selectedUsers = adminUsers.filter((item) => selectedUserKeys.has(userKey(item)));
  const departmentAdjustSelectedNames = splitOrgNames(departmentAdjustValue);

  const openDepartmentAdjust = (items: AdminUser[]) => {
    if (!items.length) return;
    const currentOrgNames = Array.from(new Set(items.flatMap((item) => splitOrgNames(item.org))));
    setDepartmentAdjustTarget(items);
    setDepartmentAdjustValue(currentOrgNames.join('、'));
  };

  const confirmDepartmentAdjust = () => {
    if (!departmentAdjustTarget?.length) return;
    const nextOrgNames = splitOrgNames(departmentAdjustValue);
    if (!nextOrgNames.length) {
      setUserImportNotice('请选择至少一个目标部门');
      return;
    }
    const nextOrgText = nextOrgNames.join('、');
    const targetKeys = new Set(departmentAdjustTarget.map(userKey));
    setAdminUsers((items) => items.map((item) => targetKeys.has(userKey(item)) ? { ...item, org: nextOrgText } : item));
    setUserImportNotice(`已将 ${departmentAdjustTarget.length} 名用户调整至“${nextOrgText}”`);
    setDepartmentAdjustTarget(null);
  };

  const openPasswordReset = (items: AdminUser[]) => {
    if (!items.length) return;
    setPasswordResetTarget(items);
    setPasswordDraft('');
    setPasswordConfirmDraft('');
  };

  const confirmPasswordReset = () => {
    if (!passwordResetTarget?.length) return;
    if (!passwordDraft || passwordDraft !== passwordConfirmDraft) return;
    setUserImportNotice(`已为 ${passwordResetTarget.length} 名用户重置密码`);
    setPasswordResetTarget(null);
    setPasswordDraft('');
    setPasswordConfirmDraft('');
  };

  const renderDepartmentAdjustNode = (org: AdminOrgUnit, depth = 0): React.ReactNode => {
    const children = orgUnits.filter((item) => item.parentId === org.id);
    const selectedNames = splitOrgNames(departmentAdjustValue);
    const selected = selectedNames.includes(org.name);
    const toggleDepartment = () => {
      const next = selected ? selectedNames.filter((item) => item !== org.name) : [...selectedNames, org.name];
      setDepartmentAdjustValue(next.join('、'));
    };
    return (
      <div key={org.id} className="space-y-1">
        <button
          type="button"
          onClick={toggleDepartment}
          className={`flex min-h-11 w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left transition ${selected ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)] shadow-sm ring-1 ring-[var(--gov-red-line)]' : 'text-[#475467] hover:bg-white hover:text-[#202124]'}`}
          style={{ paddingLeft: 12 + depth * 18 }}
        >
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white' : 'border-black/[0.18] bg-white'}`}>
            {selected ? <Check size={11} /> : null}
          </span>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${depth === 0 ? 'bg-[#eef4ff] text-[#3b63d9]' : 'bg-[#f2f4f7] text-[#667085]'}`}>
            <Building2 size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold">{org.name}</span>
            <span className="mt-0.5 block text-[10px] text-[#98a2b3]">{depth === 0 ? '一级部门' : `${depth + 1}级部门`} · {org.memberCount} 人</span>
          </span>
          {selected ? <CheckCircle size={15} className="shrink-0 text-[var(--gov-red)]" /> : null}
        </button>
        {children.length > 0 ? <div className="space-y-1">{children.map((child) => renderDepartmentAdjustNode(child, depth + 1))}</div> : null}
      </div>
    );
  };

  const toggleUserDraftOrg = (orgName: string) => {
    if (!userDraft) return;
    const current = splitOrgNames(userDraft.org);
    const next = current.includes(orgName) ? current.filter((item) => item !== orgName) : [...current, orgName];
    setUserDraft({ ...userDraft, org: next.join('、') });
  };

  const renderUserOrgPickerNode = (org: AdminOrgUnit, depth = 0): React.ReactNode => {
    const children = orgUnits.filter((item) => item.parentId === org.id);
    const checked = userDraft ? splitOrgNames(userDraft.org).includes(org.name) : false;
    const expanded = expandedOrgIds.has(org.id);
    return (
      <div key={org.id} className="space-y-1">
        <div className="flex min-h-10 items-center gap-2 rounded-[9px] px-2 text-left transition hover:bg-[#fbfbfc]" style={{ paddingLeft: 8 + depth * 22 }}>
          {children.length > 0 ? (
            <button type="button" onClick={() => setExpandedOrgIds((current) => { const next = new Set(current); next.has(org.id) ? next.delete(org.id) : next.add(org.id); return next; })} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-[#98a2b3] hover:bg-[#f2f4f7]">
              <ChevronRight size={14} className={`transition ${expanded ? 'rotate-90' : ''}`} />
            </button>
          ) : <span className="h-6 w-6 shrink-0" />}
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
            <input type="checkbox" checked={checked} onChange={() => toggleUserDraftOrg(org.name)} className="h-4 w-4 rounded border-black/[0.16] accent-[var(--gov-red)]" />
            <span className="truncate text-[13px] font-semibold text-[#344054]">{org.name}</span>
          </label>
        </div>
        {children.length > 0 && expanded ? <div className="space-y-1">{children.map((child) => renderUserOrgPickerNode(child, depth + 1))}</div> : null}
      </div>
    );
  };

  const handleUserImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setUserImportNotice('请选择 Excel 格式的 .xlsx 或 .xls 文件');
      event.target.value = '';
      return;
    }
    setUserImportNotice('');
    setUserImportFile(file);
    event.target.value = '';
  };

  const confirmUserImport = () => {
    if (!userImportFile) return;
    setUserImportNotice(`已提交“${userImportFile.name}”导入任务`);
    setUserImportFile(null);
    setIsUserImportOpen(false);
  };

  const userNoticeIsWarning = /不能|请选择|请输入|根部门|失败|不一致/.test(userImportNotice);

  return (
    <div className="grid min-h-[calc(100vh-172px)] gap-0 overflow-hidden rounded-[16px] border border-black/[0.06] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)] lg:grid-cols-[360px_minmax(0,1fr)]">
      <AnimatePresence>
        {userImportNotice ? (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%', scale: 0.98 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -12, x: '-50%', scale: 0.98 }}
            className={`fixed left-1/2 top-[88px] z-[9999] flex min-h-14 w-[min(560px,calc(100vw-40px))] items-start gap-3 rounded-[14px] border bg-white px-4 py-3 shadow-[0_22px_70px_rgba(15,23,42,0.22)] ${
              userNoticeIsWarning ? 'border-[#f2b84b]' : 'border-[#6bd192]'
            }`}
          >
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
              userNoticeIsWarning ? 'bg-[#fff4d6] text-[#b86a00]' : 'bg-[#e9f9ef] text-[#12824c]'
            }`}>
              {userNoticeIsWarning ? <AlertTriangle size={17} /> : <CheckCircle size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-bold ${userNoticeIsWarning ? 'text-[#7a3d00]' : 'text-[#14643c]'}`}>
                {userNoticeIsWarning ? '操作受限' : '操作成功'}
              </p>
              <p className="mt-0.5 text-[12px] leading-5 text-[#344054]">{userImportNotice}</p>
            </div>
            <button type="button" onClick={() => setUserImportNotice('')} className="rounded-[8px] p-1.5 text-[#98a2b3] transition hover:bg-[#f2f4f7] hover:text-[#344054]" aria-label="关闭提示">
              <X size={16} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <aside className="flex min-h-0 flex-col border-r border-black/[0.06] bg-[#fbfbfc]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div>
            <h3 className="text-[18px] font-bold text-[#202124]">组织架构</h3>
            <p className="mt-1 text-[12px] text-[#667085]">用户与组织统一维护</p>
          </div>
          <button type="button" onClick={() => { setUserImportNotice(''); setUserImportFile(null); setIsUserImportOpen(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[var(--gov-red)] px-3 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(230,76,88,0.18)]">
            <FileUp size={13} />
            批量导入
          </button>
        </div>
        <div className="border-b border-black/[0.06] p-4">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
            <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} className="gov-input h-10 w-full pl-10 pr-3 text-[13px]" placeholder="搜索组织或成员" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {orgUnits.filter((item) => !item.parentId).map((org) => renderOrgNode(org))}
        </div>
        <div className="border-t border-black/[0.06] p-3">
          <button type="button" onClick={() => openOrgEditor('create')} className="h-10 w-full rounded-[9px] border border-black/[0.08] bg-white text-[12px] font-semibold text-[#344054] hover:border-[var(--gov-red)] hover:text-[var(--gov-red-deep)]">
            新增一级部门
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[20px] font-bold text-[#202124]">{selectedOrg?.name}</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f4f7] px-3 py-1 text-[12px] font-semibold text-[#667085]">
                <Users size={14} />
                {selectedOrg?.id === 'org-root' ? adminUsers.length : selectedOrg?.memberCount} 人
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[12px] text-[#98a2b3]">{selectedOrg?.code}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportCurrentUserList} disabled={memberRows.length === 0} className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#344054] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:opacity-45">
              <Download size={14} />
              导出用户列表{memberRows.length ? `（${memberRows.length}）` : ''}
            </button>
            <button type="button" onClick={() => openMemberEditor()} className="gov-button-primary inline-flex h-10 items-center gap-2 px-4 text-[13px] font-semibold">
              <PlusCircle size={15} />
              添加成员
            </button>
            <button type="button" onClick={deleteSelectedOrg} className="h-10 rounded-[8px] border border-[#f4c7cc] bg-white px-3 text-[12px] font-semibold text-[#d92d20] transition hover:bg-[#fff1f0]">
              删除部门
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
          <Field label="成员范围">
            <select className="gov-input h-10 w-[190px] px-3 text-[13px]">
              <option>当前部门成员</option>
              <option>包含下级部门成员</option>
              <option>全部成员</option>
            </select>
          </Field>
          <Field label="成员状态">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="gov-input h-10 w-[150px] px-3 text-[13px]">
              <option>全部状态</option>
              <option>启用</option>
              <option>停用</option>
            </select>
          </Field>
          <div className="ml-auto flex flex-wrap items-center gap-2 self-end">
            <span className="text-[12px] font-medium text-[#98a2b3]">已选 {selectedUserKeys.size} 人</span>
            <button type="button" disabled={selectedUserKeys.size === 0} onClick={() => openDepartmentAdjust(selectedUsers)} className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#596170] transition hover:border-[var(--gov-red-line)] hover:bg-[#fff8f8] hover:text-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:opacity-45">
              <Building2 size={14} />
              调整部门
            </button>
            <button type="button" disabled={selectedUserKeys.size === 0} onClick={() => openPasswordReset(selectedUsers)} className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-[#d7e2ff] bg-[#f7faff] px-3 text-[12px] font-semibold text-[#3b63d9] transition hover:border-[#9db8ff] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45">
              <KeyRound size={14} />
              重置密码
            </button>
            <button type="button" disabled={selectedUserKeys.size === 0} onClick={disableSelectedUsers} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#667085] hover:border-[var(--gov-red)] hover:text-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:opacity-45">
              停用
            </button>
            <button type="button" disabled={selectedUserKeys.size === 0} onClick={deleteSelectedUsers} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#667085] hover:border-[var(--gov-red)] hover:text-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:opacity-45">
              删除
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-[#f7f8fa] text-[12px] text-[#667085] shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
              <tr>
                <th className="w-12 p-4"><input type="checkbox" checked={memberRows.length > 0 && memberRows.every((item) => selectedUserKeys.has(userKey(item)))} onChange={toggleAllMemberRows} className="h-4 w-4 rounded border-black/[0.16] accent-[var(--gov-red)]" aria-label="全选当前成员列表" /></th>
                <th className="p-4">姓名</th>
                <th className="p-4">账号</th>
                <th className="p-4">部门</th>
                <th className="p-4">角色</th>
                <th className="p-4">状态</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {memberRows.map((item) => (
                <tr key={userKey(item)} className={selectedUserKeys.has(userKey(item)) ? 'group bg-[#fff8f8] hover:bg-[#fff4f4]' : 'group hover:bg-[#fbfbfc]'}>
                  <td className="p-4"><input type="checkbox" checked={selectedUserKeys.has(userKey(item))} onChange={() => toggleUserSelection(item)} className="h-4 w-4 rounded border-black/[0.16] accent-[var(--gov-red)]" aria-label={`选择${item.name}`} /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[12px] font-bold text-[var(--gov-red-deep)]">{item.name.slice(0, 1)}</span>
                      <span className="font-semibold text-[#202124]">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-[12px] text-[#667085]">{item.name.toLowerCase().replace(/\s+/g, '_')}_gov</td>
                  <td className="p-4 text-[#667085]">{displayOrgName(item)}</td>
                  <td className="p-4 text-[#667085]">{item.builtInRole}</td>
                  <td className="p-4"><Status tone={item.status === '启用' ? 'success' : 'warning'}>{item.status}</Status></td>
                  <td className="p-4 text-right">
                    <button type="button" onClick={() => openMemberEditor(item)} className="mr-2 rounded-[7px] px-2 py-1.5 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[var(--gov-red-soft)]">编辑</button>
                    <button type="button" onClick={() => openDepartmentAdjust([item])} className="mr-2 rounded-[7px] px-2 py-1.5 text-[12px] font-semibold text-[#596170] transition hover:bg-[#f2f4f7]">调整部门</button>
                    <button type="button" onClick={() => openPasswordReset([item])} className="mr-2 rounded-[7px] px-2 py-1.5 text-[12px] font-semibold text-[#3b63d9] transition hover:bg-[#eef4ff]">重置密码</button>
                    <button type="button" onClick={() => toggleUserStatus(item)} className="mr-3 text-[12px] font-semibold text-amber-700">{item.status === '停用' ? '启用' : '停用'}</button>
                    <button type="button" onClick={() => deleteUserWithCheck(item)} className="text-[12px] font-semibold text-[#98a2b3]">删除</button>
                  </td>
                </tr>
              ))}
              {memberRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <div className="mx-auto flex max-w-[280px] flex-col items-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f2f4f7] text-[#98a2b3]">
                        <Users size={22} />
                      </span>
                      <p className="mt-3 text-[13px] font-semibold text-[#667085]">当前部门暂无匹配用户</p>
                      <p className="mt-1 text-[11px] text-[#98a2b3]">可切换部门、调整成员范围或新增成员。</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {isUserImportOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5"
            onClick={() => setIsUserImportOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              className="w-full max-w-[640px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
                <div>
                  <h3 className="text-[18px] font-bold text-[#202124]">批量导入用户</h3>
                  <p className="mt-1 text-[12px] text-[#667085]">仅支持一次导入一个 Excel 文件，不执行更新覆盖。</p>
                </div>
                <button type="button" onClick={() => setIsUserImportOpen(false)} className="rounded-[8px] p-2 text-[#98a2b3] hover:bg-[#f7f8fa] hover:text-[#344054]" aria-label="关闭导入弹窗">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between rounded-[10px] border border-[#f3d4d7] bg-[#fff8f8] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#9f2d3a]">导入模板</p>
                    <p className="mt-1 text-[11px] text-[#9b6a70]">请按模板填写姓名、岗位、组织、角色、密级和状态。</p>
                  </div>
                  <button type="button" onClick={downloadUserImportTemplate} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-white px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[#efc4c9] transition hover:bg-[#fff0f1]">
                    <Download size={14} />
                    下载模板
                  </button>
                </div>
                <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-[#ef737a] bg-[#fffafa] px-5 text-center transition hover:bg-[#fff5f6]">
                  <FileUp size={36} className="text-[var(--gov-red)]" />
                  <p className="mt-4 text-[14px] font-bold text-[#344054]">{userImportFile ? userImportFile.name : '选择本地 Excel 表格'}</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#8a8f98]">支持 .xlsx、.xls，仅可选择 1 个文件</p>
                  <span className="mt-4 inline-flex h-9 items-center rounded-[8px] bg-white px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[#efc4c9]">点击选择文件</span>
                  <input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="sr-only" onChange={handleUserImportFile} />
                </label>
                {userImportNotice && !userImportFile ? <p className="mt-3 text-[12px] font-medium text-[#c53d35]">{userImportNotice}</p> : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
                <button type="button" onClick={() => setIsUserImportOpen(false)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#596170]">取消</button>
                <button type="button" disabled={!userImportFile} onClick={confirmUserImport} className="gov-button-primary inline-flex h-10 items-center gap-2 px-5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45">
                  <FileUp size={14} />
                  开始导入
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        {userDraft ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-[#111827]/35" onClick={() => setUserDraft(null)}>
            <motion.form initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} onSubmit={saveUserDraft} className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
                <h3 className="text-[17px] font-bold text-[#202124]">{editingUserKey ? '编辑成员' : '新增成员'}</h3>
                <button type="button" onClick={() => setUserDraft(null)}><X size={18} /></button>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-auto px-6 py-6">
                <Field label="账号" required><input className="gov-input h-11 w-full px-3 text-[13px]" placeholder="填写账号用于登录" defaultValue={editingUserKey ? `${userDraft.name.toLowerCase()}_gov` : ''} /></Field>
                {!editingUserKey ? (
                  <Field label="初始密码" required>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(event) => setNewUserPassword(event.target.value)}
                      className="gov-input h-11 w-full px-3 text-[13px]"
                      placeholder="请输入初始登录密码"
                    />
                  </Field>
                ) : null}
                <Field label="姓名" required><input value={userDraft.name} onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="请输入成员姓名" /></Field>
                <Field label="部门" required>
                  <button type="button" onClick={() => setIsUserOrgPickerOpen(true)} className="flex min-h-11 w-full items-center justify-between rounded-[8px] border border-black/[0.08] bg-white px-3 py-2 text-left text-[13px] text-[#344054] transition hover:border-[var(--gov-red-line)] hover:bg-[#fffafa]">
                    <span className="line-clamp-2">{userDraft.org || '请选择部门，可多选'}</span>
                    <span className="ml-3 shrink-0 text-[12px] font-semibold text-[var(--gov-red-deep)]">修改</span>
                  </button>
                </Field>
                <Field label="角色"><select value={userDraft.builtInRole} onChange={(event) => setUserDraft({ ...userDraft, builtInRole: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]">{userRoleOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4">
                <button type="button" onClick={() => setUserDraft(null)} className="h-10 rounded-[8px] border border-black/[0.08] px-5 text-[12px] font-semibold">取消</button>
                <button className="gov-button-primary h-10 px-5 text-[12px] font-semibold">保存</button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
        {userDraft && isUserOrgPickerOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/45 p-5" onClick={() => setIsUserOrgPickerOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} className="w-full max-w-[760px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
                <div>
                  <h3 className="text-[17px] font-bold text-[#202124]">选择部门</h3>
                  <p className="mt-1 text-[12px] text-[#667085]">支持选择多个一级或二级部门。</p>
                </div>
                <button type="button" onClick={() => setIsUserOrgPickerOpen(false)} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f7f8fa] hover:text-[#344054]"><X size={18} /></button>
              </div>
              <div className="grid min-h-[430px] grid-cols-[1.05fr_0.95fr]">
                <div className="border-r border-black/[0.06] p-5">
                  <div className="relative mb-3">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
                    <input className="gov-input h-10 w-full pl-10 pr-3 text-[13px]" placeholder="搜索部门" />
                  </div>
                  <div className="max-h-[330px] overflow-auto rounded-[12px] border border-black/[0.06] bg-white p-2">
                    {orgUnits.filter((item) => !item.parentId).map((org) => renderUserOrgPickerNode(org))}
                  </div>
                </div>
                <div className="bg-[#fbfbfc] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#344054]">已选择（{splitOrgNames(userDraft.org).length}）</p>
                    <button type="button" onClick={() => setUserDraft({ ...userDraft, org: '' })} className="text-[12px] font-semibold text-[var(--gov-red-deep)]">清空</button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {splitOrgNames(userDraft.org).map((orgName) => (
                      <div key={orgName} className="flex items-center justify-between rounded-[10px] border border-black/[0.06] bg-white px-3 py-3 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f4ecff] text-[#8b5cf6]"><Building2 size={15} /></span>
                          <span className="truncate text-[13px] font-semibold text-[#344054]">{orgName}</span>
                        </div>
                        <button type="button" onClick={() => toggleUserDraftOrg(orgName)} className="rounded-[7px] p-1 text-[#98a2b3] hover:bg-[#fff1f0] hover:text-[#d92d20]"><X size={14} /></button>
                      </div>
                    ))}
                    {!splitOrgNames(userDraft.org).length ? <div className="rounded-[12px] border border-dashed border-black/[0.12] bg-white py-12 text-center text-[12px] text-[#98a2b3]">尚未选择部门</div> : null}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
                <button type="button" onClick={() => setIsUserOrgPickerOpen(false)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#596170] hover:bg-[#f7f8fa]">取消</button>
                <button type="button" onClick={() => setIsUserOrgPickerOpen(false)} className="gov-button-primary h-10 px-5 text-[12px] font-semibold">确定</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        {departmentAdjustTarget ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-[#111827]/35" onClick={() => setDepartmentAdjustTarget(null)}>
            <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-black/[0.06] px-6 py-5">
                <div>
                  <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#fff1f0] px-3 text-[12px] font-bold text-[var(--gov-red-deep)]"><Building2 size={14} />组织归属</div>
                  <h3 className="mt-3 text-[17px] font-bold text-[#202124]">调整部门</h3>
                  <p className="mt-1 text-[12px] leading-5 text-[#667085]">先核对用户当前所在部门，再选择一个或多个目标部门。</p>
                </div>
                <button type="button" onClick={() => setDepartmentAdjustTarget(null)} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f7f8fa] hover:text-[#344054]"><X size={18} /></button>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-auto px-6 py-6">
                <div className="rounded-[12px] border border-black/[0.06] bg-[#fbfbfc] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#344054]">已选用户</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[var(--gov-red-deep)] shadow-sm">{departmentAdjustTarget.length} 人</span>
                  </div>
                  <div className="mt-3 max-h-40 space-y-2 overflow-auto pr-1">
                    {departmentAdjustTarget.map((item) => (
                      <div key={userKey(item)} className="flex items-center justify-between rounded-[9px] bg-white px-3 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-[#344054]">{item.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {splitOrgNames(item.org).map((orgName) => (
                              <span key={orgName} className="inline-flex max-w-full items-center rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-semibold text-[#3b63d9]">
                                <span className="truncate">{orgName}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="ml-3 shrink-0 text-[11px] font-semibold text-[#667085]">{item.post}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[12px] border border-[#e7ecf4] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-bold text-[#344054]">调整后部门</p>
                    <button type="button" onClick={() => setDepartmentAdjustValue('')} className="text-[11px] font-semibold text-[#98a2b3] hover:text-[var(--gov-red-deep)]">清空</button>
                  </div>
                  <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                    {departmentAdjustSelectedNames.length ? departmentAdjustSelectedNames.map((orgName) => (
                      <span key={orgName} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gov-red-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--gov-red-deep)] ring-1 ring-[var(--gov-red-line)]">
                        {orgName}
                        <button type="button" onClick={() => setDepartmentAdjustValue(departmentAdjustSelectedNames.filter((item) => item !== orgName).join('、'))} className="rounded-full text-[var(--gov-red)] hover:bg-white" aria-label={`移除${orgName}`}>
                          <X size={12} />
                        </button>
                      </span>
                    )) : (
                      <span className="text-[12px] text-[#98a2b3]">请选择至少一个目标部门</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[12px] font-bold text-[#344054]">调整至部门</p>
                    <span className="text-[11px] font-medium text-[#98a2b3]">支持多选</span>
                  </div>
                  <div className="max-h-[360px] overflow-auto rounded-[12px] border border-black/[0.06] bg-[#fbfbfc] p-2">
                    {orgUnits.filter((item) => !item.parentId).map((org) => renderDepartmentAdjustNode(org))}
                  </div>
                </div>
                <div className="rounded-[12px] border border-[#f3d4d7] bg-[#fff8f8] px-4 py-3 text-[12px] leading-6 text-[#8a4b53]">
                  调整后会同步更新用户列表中的组织归属，角色和账号状态保持不变。
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
                <button type="button" onClick={() => setDepartmentAdjustTarget(null)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#596170] hover:bg-[#f7f8fa]">取消</button>
                <button type="button" onClick={confirmDepartmentAdjust} disabled={departmentAdjustSelectedNames.length === 0} className="gov-button-primary h-10 px-5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45">确认调整</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        {passwordResetTarget ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setPasswordResetTarget(null)}>
            <motion.form initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} onSubmit={(event) => { event.preventDefault(); confirmPasswordReset(); }} className="w-full max-w-[520px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-black/[0.06] px-6 py-5">
                <div>
                  <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 text-[12px] font-bold text-[#3b63d9]"><KeyRound size={14} />账号安全</div>
                  <h3 className="mt-3 text-[18px] font-bold text-[#202124]">重置密码</h3>
                  <p className="mt-1 text-[12px] leading-5 text-[#667085]">为 {passwordResetTarget.length} 名用户设置新密码。</p>
                </div>
                <button type="button" onClick={() => setPasswordResetTarget(null)} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f7f8fa] hover:text-[#344054]"><X size={18} /></button>
              </div>
              <div className="space-y-4 px-6 py-6">
                <Field label="新密码" required>
                  <input type="password" value={passwordDraft} onChange={(event) => setPasswordDraft(event.target.value)} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="请输入新密码" />
                </Field>
                <Field label="确认新密码" required>
                  <input type="password" value={passwordConfirmDraft} onChange={(event) => setPasswordConfirmDraft(event.target.value)} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="请再次输入新密码" />
                </Field>
                {passwordConfirmDraft && passwordDraft !== passwordConfirmDraft ? <p className="text-[12px] font-semibold text-[#d92d20]">两次输入的密码不一致</p> : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
                <button type="button" onClick={() => setPasswordResetTarget(null)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#596170] hover:bg-[#f7f8fa]">取消</button>
                <button type="submit" disabled={!passwordDraft || passwordDraft !== passwordConfirmDraft} className="gov-button-primary h-10 px-5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45">确认重置</button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
        {orgDraft && orgEditor ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-[#111827]/35" onClick={() => setOrgDraft(null)}>
            <motion.form initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} onSubmit={saveOrgDraft} className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
                <h3 className="text-[17px] font-bold text-[#202124]">{orgEditor.mode === 'edit' ? '编辑部门' : '新建部门'}</h3>
                <button type="button" onClick={() => setOrgDraft(null)}><X size={18} /></button>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-auto px-6 py-6">
                <Field label="部门名称" required><input value={orgDraft.name} onChange={(event) => setOrgDraft({ ...orgDraft, name: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="请输入部门名称" /></Field>
                <Field label="部门负责人"><input value={orgDraft.leader} onChange={(event) => setOrgDraft({ ...orgDraft, leader: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="可添加多名负责人" /></Field>
                <Field label="部门类型"><select className="gov-input h-11 w-full px-3 text-[13px]"><option>普通部门</option><option>业务部门</option><option>项目组</option></select></Field>
                <Field label="排序"><input type="number" value={orgDraft.sortOrder ?? 1} onChange={(event) => setOrgDraft({ ...orgDraft, sortOrder: Number(event.target.value) })} className="gov-input h-11 w-full px-3 text-[13px]" /></Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4">
                <button type="button" onClick={() => setOrgDraft(null)} className="h-10 rounded-[8px] border border-black/[0.08] px-5 text-[12px] font-semibold">取消</button>
                <button className="gov-button-primary h-10 px-5 text-[12px] font-semibold">保存</button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  if (subSection === 'org-tree') {
    return (
      <div className="grid min-h-[calc(100vh-190px)] gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        <section className="ai-admin-card flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-5">
            <div>
              <h3 className="text-[18px] font-bold text-[#202124]">组织架构</h3>
              <p className="mt-1.5 text-[12px] text-[#667085]">树形维护部门和人员归属。</p>
            </div>
            <button onClick={onSync} disabled={isSyncing} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#344054] disabled:opacity-60"><RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />{isSyncing ? '同步中' : 'SSO同步'}</button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">{orgUnits.filter((item) => !item.parentId).map((org) => renderOrgNode(org))}</div>
          <div className="border-t border-black/[0.06] p-3"><button type="button" onClick={() => openOrgEditor('create')} className="gov-button-primary flex h-10 w-full items-center justify-center gap-2 text-[13px] font-semibold"><PlusCircle size={15} />新增一级组织</button></div>
        </section>
        <section className="ai-admin-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] px-6 py-5">
            <div>
              <div className="flex items-center gap-2"><h3 className="text-[20px] font-bold text-[#202124]">{selectedOrg?.name}</h3></div>
              <p className="mt-1.5 font-mono text-[12px] text-[#98a2b3]">{selectedOrg?.code}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => selectedOrg && openOrgEditor('create', undefined, selectedOrg.id)} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#344054] hover:text-[var(--gov-red-deep)]"><PlusCircle size={14} />新增下级</button>
              <button type="button" onClick={() => selectedOrg && openOrgEditor('edit', selectedOrg)} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#344054]"><Edit3 size={14} />编辑</button>
              <button type="button" onClick={deleteSelectedOrg} className="inline-flex h-9 items-center rounded-[8px] border border-[#f4c7cc] bg-white px-3 text-[12px] font-semibold text-[#d92d20] transition hover:bg-[#fff1f0]">删除</button>
            </div>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-4">
            {[['负责人', selectedOrg?.leader ?? '-'], ['组织人数', `${selectedOrg?.memberCount ?? 0} 人`], ['下级组织', `${selectedOrgChildren.length} 个`], ['直属用户', `${selectedOrgUsers.length} 人`]].map(([label, value]) => <InfoPill key={label} label={label} value={value} />)}
          </div>
          <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
            <div className="rounded-[14px] border border-black/[0.06] bg-white p-4">
              <h4 className="text-[13px] font-bold text-[#344054]">下级组织</h4>
              <div className="mt-3 divide-y divide-black/[0.05]">{selectedOrgChildren.length ? selectedOrgChildren.map((item) => <button key={item.id} type="button" onClick={() => setSelectedOrgId(item.id)} className="flex w-full items-center justify-between py-3 text-left"><span className="text-[13px] font-semibold text-[#344054]">{item.name}</span><ChevronRight size={14} className="text-[#98a2b3]" /></button>) : <p className="py-8 text-center text-[12px] text-[#98a2b3]">暂无下级组织</p>}</div>
            </div>
            <div className="rounded-[14px] border border-black/[0.06] bg-white p-4">
              <h4 className="text-[13px] font-bold text-[#344054]">直属用户</h4>
              <div className="mt-3 divide-y divide-black/[0.05]">{selectedOrgUsers.length ? selectedOrgUsers.map((item) => <div key={userKey(item)} className="flex items-center justify-between py-3"><div><p className="text-[13px] font-semibold text-[#344054]">{item.name}</p><p className="mt-0.5 text-[11px] text-[#98a2b3]">{item.post}</p></div><Status tone={item.status === '启用' ? 'success' : 'warning'}>{item.status}</Status></div>) : <p className="py-8 text-center text-[12px] text-[#98a2b3]">暂无直属用户</p>}</div>
            </div>
          </div>
        </section>
        <AnimatePresence>{orgDraft && orgEditor ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setOrgDraft(null)}><motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} onSubmit={saveOrgDraft} className="w-full max-w-[560px] rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5"><h3 className="text-[17px] font-bold text-[#202124]">{orgEditor.mode === 'edit' ? '编辑组织' : '新增组织'}</h3><button type="button" onClick={() => setOrgDraft(null)}><X size={18} /></button></div><div className="grid gap-4 px-6 py-6 md:grid-cols-2"><Field label="组织名称" required><input value={orgDraft.name} onChange={(event) => setOrgDraft({ ...orgDraft, name: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" /></Field><Field label="组织编码" required><input value={orgDraft.code} onChange={(event) => setOrgDraft({ ...orgDraft, code: event.target.value })} className="gov-input h-11 w-full px-3 font-mono text-[13px]" /></Field><Field label="负责人"><input value={orgDraft.leader} onChange={(event) => setOrgDraft({ ...orgDraft, leader: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" /></Field><Field label="组织人数"><input type="number" value={orgDraft.memberCount} onChange={(event) => setOrgDraft({ ...orgDraft, memberCount: Number(event.target.value) })} className="gov-input h-11 w-full px-3 text-[13px]" /></Field></div><div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4"><button type="button" onClick={() => setOrgDraft(null)} className="h-10 rounded-[8px] border border-black/[0.08] px-5 text-[12px] font-semibold">取消</button><button className="gov-button-primary h-10 px-5 text-[12px] font-semibold">保存</button></div></motion.form></motion.div> : null}</AnimatePresence>
      </div>
    );
  }

  return (
    <div className="ai-admin-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-black/[0.06] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-[#202124]">用户管理</h3>
          <p className="mt-1.5 text-[13px] text-[#667085]">维护用户账号、组织归属、角色授权与账号状态。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCurrentUserList} disabled={memberRows.length === 0} className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#344054] transition hover:border-[var(--gov-red-line)] hover:text-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:opacity-45"><Download size={14} />导出用户列表{memberRows.length ? `（${memberRows.length}）` : ''}</button>
          <button type="button" onClick={() => { setUserImportNotice(''); setUserImportFile(null); setIsUserImportOpen(true); }} className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[#f9e4e6]"><FileUp size={14} />批量导入</button>
          <button type="button" onClick={() => openUserEditor()} className="gov-button-primary inline-flex h-10 items-center gap-2 px-4 text-[13px] font-semibold"><PlusCircle size={15} />新增用户</button>
        </div>
      </div>
      {userImportNotice ? <div className="flex items-center gap-2 border-b border-[#d9efe0] bg-[#f0faf3] px-5 py-2.5 text-[12px] font-semibold text-[#24734a]"><CheckCircle size={14} />{userImportNotice}</div> : null}
      <div className="flex flex-col gap-3 border-b border-black/[0.06] bg-[#fbfbfc] px-5 py-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} className="gov-input h-11 w-full pl-10 pr-3 text-[13px]" placeholder="搜索姓名、部门、岗位或角色" /></div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="gov-input h-11 w-full px-3 text-[13px] sm:w-36"><option>全部状态</option><option>启用</option><option>停用</option></select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead className="bg-[#f7f8fa] text-[12px] text-[#667085]"><tr><th className="w-12 p-4"><input type="checkbox" checked={filteredUsers.length > 0 && filteredUsers.every((item) => selectedUserKeys.has(userKey(item)))} onChange={toggleAllFilteredUsers} className="h-4 w-4 rounded border-black/[0.16] accent-[var(--gov-red)]" aria-label="全选当前用户列表" /></th><th className="p-4">用户</th><th className="p-4">组织</th><th className="p-4">岗位</th><th className="p-4">角色</th><th className="p-4">密级</th><th className="p-4">状态</th><th className="p-4 text-right">操作</th></tr></thead>
          <tbody className="divide-y divide-black/[0.05]">{filteredUsers.map((item) => <tr key={userKey(item)} className={selectedUserKeys.has(userKey(item)) ? 'bg-[#fff8f8] hover:bg-[#fff4f4]' : 'hover:bg-[#fbfbfc]'}><td className="p-4"><input type="checkbox" checked={selectedUserKeys.has(userKey(item))} onChange={() => toggleUserSelection(item)} className="h-4 w-4 rounded border-black/[0.16] accent-[var(--gov-red)]" aria-label={`选择${item.name}`} /></td><td className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gov-red-soft)] text-[12px] font-bold text-[var(--gov-red-deep)]">{item.name.slice(0, 1)}</span><div><p className="font-semibold text-[#202124]">{item.name}</p><p className="mt-0.5 text-[11px] text-[#98a2b3]">SSO_{item.name}</p></div></div></td><td className="p-4 text-[#667085]">{item.org}</td><td className="p-4 text-[#667085]">{item.post}</td><td className="p-4 text-[#667085]">{item.builtInRole}</td><td className="p-4 text-[#667085]">{item.level}</td><td className="p-4"><Status tone={item.status === '启用' ? 'success' : 'warning'}>{item.status}</Status></td><td className="p-4 text-right"><button type="button" onClick={() => openUserEditor(item)} className="mr-3 text-[12px] font-semibold text-[var(--gov-red-deep)]">编辑</button><button type="button" onClick={() => toggleUserStatus(item)} className="mr-3 text-[12px] font-semibold text-amber-700">{item.status === '停用' ? '启用' : '停用'}</button><button type="button" onClick={() => deleteUserWithCheck(item)} className="text-[12px] font-semibold text-[#98a2b3]">删除</button></td></tr>)}</tbody>
        </table>
      </div>
      <AnimatePresence>
        {isUserImportOpen ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setIsUserImportOpen(false)}><motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} className="w-full max-w-[640px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5"><div><h3 className="text-[18px] font-bold text-[#202124]">批量导入用户</h3><p className="mt-1 text-[12px] text-[#667085]">仅支持一次导入一个 Excel 文件，不执行更新覆盖。</p></div><button type="button" onClick={() => setIsUserImportOpen(false)} className="rounded-[8px] p-2 text-[#98a2b3] hover:bg-[#f7f8fa] hover:text-[#344054]" aria-label="关闭导入弹窗"><X size={18} /></button></div><div className="p-6"><div className="mb-4 flex items-center justify-between rounded-[10px] border border-[#f3d4d7] bg-[#fff8f8] px-4 py-3"><div><p className="text-[13px] font-bold text-[#9f2d3a]">导入模板</p><p className="mt-1 text-[11px] text-[#9b6a70]">请按模板填写姓名、岗位、组织、角色、密级和状态。</p></div><button type="button" onClick={downloadUserImportTemplate} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-white px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[#efc4c9] transition hover:bg-[#fff0f1]"><Download size={14} />下载模板</button></div><label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-[#ef737a] bg-[#fffafa] px-5 text-center transition hover:bg-[#fff5f6]"><FileUp size={36} className="text-[var(--gov-red)]" /><p className="mt-4 text-[14px] font-bold text-[#344054]">{userImportFile ? userImportFile.name : '选择本地 Excel 表格'}</p><p className="mt-2 text-[12px] leading-5 text-[#8a8f98]">支持 .xlsx、.xls，仅可选择 1 个文件</p><span className="mt-4 inline-flex h-9 items-center rounded-[8px] bg-white px-3 text-[12px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[#efc4c9]">点击选择文件</span><input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="sr-only" onChange={handleUserImportFile} /></label>{userImportNotice && !userImportFile ? <p className="mt-3 text-[12px] font-medium text-[#c53d35]">{userImportNotice}</p> : null}</div><div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4"><button type="button" onClick={() => setIsUserImportOpen(false)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#596170]">取消</button><button type="button" disabled={!userImportFile} onClick={confirmUserImport} className="gov-button-primary inline-flex h-10 items-center gap-2 px-5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"><FileUp size={14} />开始导入</button></div></motion.div></motion.div> : null}
        {userDraft ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setUserDraft(null)}><motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} onSubmit={saveUserDraft} className="w-full max-w-[640px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5"><div><h3 className="text-[17px] font-bold text-[#202124]">{editingUserKey ? '编辑用户' : '新增用户'}</h3><p className="mt-1 text-[12px] text-[#667085]">配置账号基础信息、组织归属与系统角色。</p></div><button type="button" onClick={() => setUserDraft(null)}><X size={18} /></button></div><div className="grid gap-4 px-6 py-6 md:grid-cols-2">{!editingUserKey ? <Field label="初始密码" required><input type="password" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="请输入初始登录密码" /></Field> : null}<Field label="姓名" required><input value={userDraft.name} onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" /></Field><Field label="岗位" required><input value={userDraft.post} onChange={(event) => setUserDraft({ ...userDraft, post: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" /></Field><Field label="组织"><select value={userDraft.org} onChange={(event) => setUserDraft({ ...userDraft, org: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]">{departments.map((item) => <option key={item.code}>{item.name}</option>)}</select></Field><Field label="角色"><select value={userDraft.builtInRole} onChange={(event) => setUserDraft({ ...userDraft, builtInRole: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]">{userRoleOptions.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="密级"><select value={userDraft.level} onChange={(event) => setUserDraft({ ...userDraft, level: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]">{['内部', 'B级重要', 'A级核心', '平台运维'].map((item) => <option key={item}>{item}</option>)}</select></Field></div><div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4"><button type="button" onClick={() => setUserDraft(null)} className="h-10 rounded-[8px] border border-black/[0.08] px-5 text-[12px] font-semibold">取消</button><button className="gov-button-primary h-10 px-5 text-[12px] font-semibold">保存</button></div></motion.form></motion.div> : null}
      </AnimatePresence>
    </div>
  );
}

function LegacyReferencePage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center rounded-[14px] border border-black/[0.06] bg-white text-[18px] font-semibold text-[#344054]">
      {title}：参考老版
    </div>
  );
}

function AiResources({ subSection, agents, connectors, filteredSkills, skillSearch, onSkillSearch, onShowAddSkill }: {
  subSection: AdminSubSection;
  agents: Agent[];
  connectors: Connector[];
  filteredSkills: SkillItem[];
  skillSearch: string;
  onSkillSearch: (value: string) => void;
  onShowAddSkill: () => void;
}) {
  if (subSection === 'connectors') {
    return (
      <div className="space-y-5">
        <ResourcePanel title="连接器总览" value={`${connectors.length} 个`} items={connectors.slice(0, 5).map((item) => `${item.name} · ${item.status}`)} />
        <div className="overflow-hidden rounded-[6px] border border-black/[0.06] bg-white">
          <div className="border-b border-black/[0.05] p-4">
            <h3 className="text-sm font-semibold text-gray-900">连接器</h3>
            <p className="mt-1 text-xs text-gray-500">展示连接状态、同步时间、授权范围、数据读取权限与安全配置状态。</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[11px] text-gray-500">
                <tr>
                  <th className="p-3">连接器</th>
                  <th className="p-3">连接状态</th>
                  <th className="p-3">同步时间</th>
                  <th className="p-3">授权范围</th>
                  <th className="p-3">数据读取权限</th>
                  <th className="p-3 text-right">安全配置状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {connectors.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-semibold text-gray-900">{item.name}</td>
                    <td className="p-3"><Status tone={item.status === 'connected' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}>{item.status}</Status></td>
                    <td className="p-3 font-mono text-[10px] text-gray-500">{item.syncTime}</td>
                    <td className="p-3 text-gray-600">{item.purpose}</td>
                    <td className="p-3 text-gray-500">{item.dataReadPermission}</td>
                    <td className="p-3 text-right text-gray-600">{item.status === 'connected' ? '国密链路已校验' : '待安全复核'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-[6px] border border-black/[0.06] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{agent.name}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">{agent.description}</p>
              </div>
              <Status tone={agent.isEnabled ? 'success' : 'warning'}>{agent.isEnabled ? '已启用' : '待启用'}</Status>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
              <InfoPill label="归属部门" value={agent.domain === 'doc' ? '办公室公文枢纽科' : agent.domain === 'legal' ? '法律合规中心' : agent.domain === 'finance' ? '财务资金中心' : '平台运营中心'} />
              <InfoPill label="挂载技能" value={agent.connectedSystem.slice(0, 2).join('、') || '基础问答'} />
              <InfoPill label="使用范围" value={agent.type === 'my' ? '个人与部门' : '集团共享'} />
              <InfoPill label="最近调用" value={agent.isEnabled ? '今日 09:42' : '暂无调用'} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-between gap-3 rounded-[6px] border border-black/[0.06] bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">技能库辅助区</h3>
          <p className="mt-1 text-xs text-gray-500">技能库用于查看挂载关系与后续扩展。</p>
        </div>
        <div className="relative max-w-sm flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={skillSearch} onChange={(e) => onSkillSearch(e.target.value)} placeholder="搜索技能库、挂载说明..." className="w-full rounded-[4px] border border-black/[0.08] bg-[#FAF9F6] py-2 pl-8 pr-3 text-xs outline-none" />
        </div>
        <button onClick={onShowAddSkill} className="flex items-center justify-center gap-1.5 rounded-[4px] bg-[#23221F] px-3 py-2 text-xs font-semibold text-white">
          <PlusCircle size={13} />
          新增技能
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredSkills.map((skill) => (
          <div key={skill.id} className="rounded-[6px] border border-black/[0.06] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-[4px] bg-[#FAF9F6] px-2 py-0.5 text-[10px] text-gray-600">{skill.category}</span>
              <span className="text-[10px] text-gray-500">挂载 {skill.mountedAgentsCount} 个专家</span>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-gray-900">{skill.name}</h4>
            <p className="mt-2 text-xs leading-6 text-gray-500">{skill.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type AdminWritingScene = {
  id: string;
  title: string;
  suggestedTitle?: string;
  enabled?: boolean;
  hasChildren?: boolean;
  children?: AdminWritingScene[];
};

function WritingAdmin({ subSection }: { subSection: AdminSubSection }) {
  const [sceneTree, setSceneTree] = useState<AdminWritingScene[]>(() => WRITING_CATEGORIES.map((category) => ({
    id: category.id,
    title: category.title,
    suggestedTitle: category.suggestedTitle,
    enabled: true,
    hasChildren: Boolean(category.children?.length),
    children: category.children?.map((child) => ({ ...child, enabled: true })),
  })));
  const [expandedSceneIds, setExpandedSceneIds] = useState<Set<string>>(() => new Set(WRITING_CATEGORIES.slice(0, 4).map((item) => item.id)));
  const [sceneSearch, setSceneSearch] = useState('');
  const [sceneEditor, setSceneEditor] = useState<{ parentId: string; sceneId?: string } | null>(null);
  const [sceneName, setSceneName] = useState('');
  const [scenePrompt, setScenePrompt] = useState('');
  const [sceneHasChildren, setSceneHasChildren] = useState(true);

  if (subSection === 'business-management') {
    return <BusinessNodeAdmin />;
  }

  if (subSection === 'red-templates') {
    return <LegacyReferencePage title="套红模板管理" />;
  }

  const openCreateScene = (parentId?: string) => {
    const targetId = parentId ?? '__root__';
    setSceneEditor({ parentId: targetId });
    setSceneName('');
    setScenePrompt('');
    setSceneHasChildren(!parentId);
    if (parentId) setExpandedSceneIds((current) => new Set(current).add(parentId));
  };

  const openEditScene = (parentId: string, scene: AdminWritingScene) => {
    setSceneEditor({ parentId, sceneId: scene.id });
    setSceneName(scene.title);
    setScenePrompt(scene.suggestedTitle ?? '');
    setSceneHasChildren(Boolean(scene.hasChildren || (scene.children?.length ?? 0) > 0));
  };

  const saveScene = () => {
    if (!sceneEditor || !sceneName.trim()) return;
    const isRootCreate = sceneEditor.parentId === '__root__';
    if (!sceneHasChildren && !scenePrompt.trim()) return;
    if (!isRootCreate && !scenePrompt.trim()) return;
    if (isRootCreate) {
      setSceneTree((categories) => [
        {
          id: `category-${Date.now()}`,
          title: sceneName.trim(),
          suggestedTitle: sceneHasChildren ? '' : scenePrompt.trim(),
          enabled: false,
          hasChildren: sceneHasChildren,
          children: []
        },
        ...categories
      ]);
      setSceneEditor(null);
      return;
    }
    setSceneTree((categories) => categories.map((category) => {
      if (category.id !== sceneEditor.parentId) return category;
      if (sceneEditor.sceneId) {
        if (category.id === sceneEditor.sceneId) return { ...category, title: sceneName.trim(), suggestedTitle: sceneHasChildren ? '' : scenePrompt.trim(), hasChildren: sceneHasChildren };
        return { ...category, children: category.children?.map((scene) => scene.id === sceneEditor.sceneId ? { ...scene, title: sceneName.trim(), suggestedTitle: scenePrompt.trim() } : scene) };
      }
      return { ...category, hasChildren: true, children: [...(category.children ?? []), { id: `scene-${Date.now()}`, title: sceneName.trim(), suggestedTitle: scenePrompt.trim(), enabled: false }] };
    }));
    setSceneEditor(null);
  };

  const removeScene = (parentId: string, sceneId: string) => {
    if (parentId === '__root__') {
      setSceneTree((categories) => categories.filter((category) => category.id !== sceneId));
      return;
    }
    setSceneTree((categories) => categories.map((category) => category.id === parentId ? { ...category, children: category.children?.filter((scene) => scene.id !== sceneId) } : category));
  };

  const toggleSceneStatus = (parentId: string, sceneId?: string) => {
    setSceneTree((categories) => categories.map((category) => {
      if (sceneId) {
        if (category.id !== parentId) return category;
        return { ...category, children: category.children?.map((scene) => scene.id === sceneId ? { ...scene, enabled: !scene.enabled } : scene) };
      }
      if (category.id !== parentId) return category;
      const nextEnabled = !category.enabled;
      return { ...category, enabled: nextEnabled, children: category.children?.map((scene) => ({ ...scene, enabled: nextEnabled })) };
    }));
  };

  const normalizedQuery = sceneSearch.trim().toLowerCase();
  const visibleCategories = sceneTree.map((category) => ({ ...category, children: category.children?.filter((scene) => `${category.title} ${scene.title} ${scene.suggestedTitle ?? ''}`.toLowerCase().includes(normalizedQuery)) })).filter((category) => !normalizedQuery || category.title.toLowerCase().includes(normalizedQuery) || (category.children?.length ?? 0) > 0);
  const editingCategory = sceneTree.find((category) => category.id === sceneEditor?.parentId);
  const isRootSceneCreate = sceneEditor?.parentId === '__root__' && !sceneEditor?.sceneId;
  const isRootSceneEdit = Boolean(sceneEditor?.sceneId && sceneEditor.parentId === sceneEditor.sceneId);
  const rootSceneHasExistingChildren = Boolean(isRootSceneEdit && editingCategory && (editingCategory.children?.length ?? 0) > 0);
  const isChildSceneCreate = Boolean(sceneEditor && !sceneEditor.sceneId && sceneEditor.parentId !== '__root__');
  const showSceneSplitOption = isRootSceneCreate || isRootSceneEdit;
  const requireScenePrompt = !showSceneSplitOption || !sceneHasChildren;

  return (
    <div className="space-y-4">
      <section className="ai-admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-black/[0.06] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><span className="ai-dimensional-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gov-red-soft)] text-[var(--gov-red)]"><FolderTree size={20} /></span><div><h3 className="text-[18px] font-bold text-[#202124]">写作场景管理</h3><p className="mt-1.5 text-[13px] leading-6 text-[#667085]">维护前台“生成全文”选择的一级文种和细分写作场景，场景提示词将作为生成任务的默认指令。</p></div></div>
          <button type="button" onClick={() => openCreateScene()} className="gov-button-primary inline-flex h-11 shrink-0 items-center justify-center gap-2 px-5 text-[14px] font-semibold"><PlusCircle size={16} />新增一级场景</button>
        </div>
        <div className="flex flex-col gap-3 border-b border-black/[0.06] bg-[#fbfbfc] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-[460px]"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" /><input value={sceneSearch} onChange={(event) => setSceneSearch(event.target.value)} placeholder="搜索文种、场景名称或提示词" className="gov-input h-11 w-full pl-10 pr-3 text-[13px]" /></div>
          <div className="flex items-center gap-4 text-[12px] text-[#7a808a]"><span>一级文种 {sceneTree.length}</span><span>细分场景 {sceneTree.reduce((count, category) => count + (category.children?.length ?? 0), 0)}</span></div>
        </div>
        <div className="grid min-w-[1040px] grid-cols-[minmax(260px,0.9fr)_minmax(420px,1.6fr)_120px_240px] border-b border-black/[0.06] bg-[#f7f8fa] px-5 py-3.5 text-[12px] font-semibold text-[#667085]"><span>场景名称</span><span>场景提示词</span><span>状态</span><span className="text-right">操作</span></div>
        <div className="min-w-[920px] divide-y divide-black/[0.05]">
          {visibleCategories.map((category) => {
            const expanded = expandedSceneIds.has(category.id) || Boolean(normalizedQuery);
            return <div key={category.id}>
              <div className="grid min-h-[62px] grid-cols-[minmax(260px,0.9fr)_minmax(420px,1.6fr)_120px_240px] items-center bg-white px-5 transition hover:bg-[#fffafa]"><button type="button" onClick={() => setExpandedSceneIds((current) => { const next = new Set(current); next.has(category.id) ? next.delete(category.id) : next.add(category.id); return next; })} className="flex min-w-0 items-center gap-2 text-left"><span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--gov-red-soft)] text-[var(--gov-red)]">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span><span className="truncate text-[13px] font-bold text-[#344054]">{category.title}</span><span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-semibold text-[#667085]">{category.children?.length ?? 0}</span></button><span className="text-[11px] text-[#98a2b3]">{category.hasChildren ? '一级文种 · 点击展开细分场景' : (category.suggestedTitle || '一级场景提示词未配置')}</span><Status tone={category.enabled ? 'success' : 'warning'}>{category.enabled ? '启用' : '未启用'}</Status><div className="flex justify-end gap-1">{category.hasChildren ? <button type="button" onClick={() => openCreateScene(category.id)} className="inline-flex h-8 items-center gap-1 rounded-[7px] px-2 text-[11px] font-semibold text-[#3b63d9] transition hover:bg-[#eef4ff] hover:text-[#2548b8]"><PlusCircle size={13} />新增子场景</button> : null}<button type="button" onClick={() => toggleSceneStatus(category.id)} className={`inline-flex h-8 items-center rounded-[7px] px-2 text-[11px] font-semibold ${category.enabled ? 'text-amber-700' : 'text-emerald-700'}`}>{category.enabled ? '停用' : '启用'}</button><button type="button" disabled={category.enabled} onClick={() => openEditScene(category.id, category)} className="inline-flex h-8 items-center rounded-[7px] px-2 text-[11px] font-semibold text-[var(--gov-red-deep)] disabled:text-[#c5cad3]">编辑</button><button type="button" disabled={category.enabled} onClick={() => removeScene('__root__', category.id)} className="inline-flex h-8 items-center rounded-[7px] px-2 text-[11px] font-semibold text-[#98a2b3] disabled:text-[#c5cad3]">删除</button></div></div>
              <AnimatePresence initial={false}>{expanded ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[#fbfbfc]">{category.children?.map((scene) => <div key={scene.id} className="group grid min-h-[64px] grid-cols-[minmax(260px,0.9fr)_minmax(420px,1.6fr)_120px_240px] items-center border-t border-black/[0.04] px-5 transition hover:bg-white"><div className="flex min-w-0 items-center gap-3 pl-9"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white text-[#596170] shadow-[0_2px_8px_rgba(15,23,42,0.06)]"><MessageSquareText size={15} /></span><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#344054]">{scene.title}</p><p className="mt-0.5 text-[10px] text-[#98a2b3]">{category.title}</p></div></div><p className="line-clamp-2 pr-6 text-[11px] leading-5 text-[#667085]">{scene.suggestedTitle || '暂未配置场景提示词'}</p><Status tone={scene.enabled ? 'success' : 'warning'}>{scene.enabled ? '启用' : '未启用'}</Status><div className="flex justify-end gap-1"><button type="button" onClick={() => toggleSceneStatus(category.id, scene.id)} className={`inline-flex h-8 items-center rounded-[7px] px-2 text-[11px] font-semibold ${scene.enabled ? 'text-amber-700' : 'text-emerald-700'}`}>{scene.enabled ? '停用' : '启用'}</button><button type="button" disabled={scene.enabled} onClick={() => openEditScene(category.id, scene)} className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-semibold text-[#596170] hover:bg-[var(--gov-red-soft)] hover:text-[var(--gov-red-deep)] disabled:text-[#c5cad3]"><Edit3 size={13} />编辑</button><button type="button" disabled={scene.enabled} onClick={() => removeScene(category.id, scene.id)} className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-semibold text-[#98a2b3] hover:bg-[#fff1f0] hover:text-[#d92d20] disabled:text-[#c5cad3]"><Trash2 size={13} />删除</button></div></div>)}</motion.div> : null}</AnimatePresence>
            </div>;
          })}
        </div>
      </section>

      <AnimatePresence>
        {sceneEditor ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2329]/35 p-5" onClick={() => setSceneEditor(null)}>
            <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} className="w-full max-w-[760px] overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-black/[0.06] px-6 py-5">
                <div>
                  <h3 className="text-[17px] font-bold text-[#202124]">{isRootSceneCreate ? '新增一级场景' : isChildSceneCreate ? '新增子场景' : '编辑写作场景'}</h3>
                  <p className="mt-1.5 text-[12px] text-[#667085]">所属文种：{isRootSceneCreate ? '一级场景' : editingCategory?.title ?? '通用写作'}</p>
                </div>
                <button type="button" onClick={() => setSceneEditor(null)} className="rounded-[8px] p-2 text-[#98a2b3] hover:bg-[#f5f5f5] hover:text-[#344054]" aria-label="关闭"><X size={16} /></button>
              </div>
              <div className="space-y-5 px-6 py-6">
                <label className="block"><span className="mb-2 block text-[12px] font-bold text-[#344054]"><span className="mr-1 text-[var(--gov-red)]">*</span>场景名称</span><input value={sceneName} onChange={(event) => setSceneName(event.target.value)} placeholder="例如：工作部署讲话" className="gov-input h-11 w-full px-3.5 text-[13px]" autoFocus /></label>
                {showSceneSplitOption ? (
                  <div className="rounded-[12px] border border-black/[0.08] bg-[#fbfbfc] p-4">
                    <p className="text-[12px] font-bold text-[#344054]">是否细分场景</p>
                    <div className="mt-3 flex gap-6 text-[13px] text-[#344054]">
                      <label className="flex items-center gap-2"><input type="radio" checked={sceneHasChildren} onChange={() => setSceneHasChildren(true)} />是，后续新增子场景</label>
                      <label className={`flex items-center gap-2 ${rootSceneHasExistingChildren ? 'cursor-not-allowed text-[#98a2b3]' : ''}`}>
                        <input type="radio" checked={!sceneHasChildren} disabled={rootSceneHasExistingChildren} onChange={() => setSceneHasChildren(false)} />
                        否，直接配置提示词
                      </label>
                    </div>
                    {rootSceneHasExistingChildren ? (
                      <p className="mt-2 text-[11px] text-[#98a2b3]">该一级场景已有下级场景，默认按“细分场景”维护，不配置一级场景提示词。</p>
                    ) : null}
                  </div>
                ) : null}
                {requireScenePrompt ? (
                  <label className="block"><span className="mb-2 block text-[12px] font-bold text-[#344054]"><span className="mr-1 text-[var(--gov-red)]">*</span>场景提示词</span><textarea value={scenePrompt} onChange={(event) => setScenePrompt(event.target.value)} rows={12} placeholder="请填写该场景的系统提示词，包括角色、写作目标、结构要求、语言风格和输出规则。" className="gov-input w-full resize-none px-4 py-3 text-[12px] leading-6" /></label>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
                <button type="button" onClick={() => setSceneEditor(null)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#596170] hover:bg-[#f5f5f5]">取消</button>
                <button type="button" disabled={!sceneName.trim() || (requireScenePrompt && !scenePrompt.trim())} onClick={saveScene} className="gov-button-primary h-10 px-6 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45">保存</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const materialFolders = [
  { id: 'recent', name: '最近', children: [] },
  { id: 'personal', name: '个人知识库', children: ['我的文库', '历史写作稿件'] },
  { id: 'department', name: '部门知识库', children: ['办公室资料', '法务合规资料', '财务报表资料'] },
  { id: 'public', name: '公共素材库', children: ['政策法规', '领导讲话', '专业文献'] }
];

const materialFiles = [
  { name: '季度汇报材料整理.docx', type: 'word', size: '128KB', creator: '张三', updated: '2026/07/20', status: '可用' },
  { name: '领导讲话语料库.txt', type: 'text', size: '36KB', creator: '张三', updated: '2026/07/18', status: '可用' },
  { name: '近期政策摘编.pdf', type: 'pdf', size: '2.1MB', creator: '李敏', updated: '2026/07/12', status: '可用' },
  { name: '企业组织架构图.xlsx', type: 'excel', size: '44KB', creator: '王强', updated: '2026/07/09', status: '待审核' },
  { name: '端午值班通知初稿.docx', type: 'word', size: '92KB', creator: '张三', updated: '2026/06/16', status: '可用' }
];

function MaterialLibraryAdmin({ subSection }: { subSection: AdminSubSection }) {
  const titleMap: Partial<Record<AdminSubSection, string>> = {
    'material-documents': '文库管理',
    'document-type-management': '文档类型管理',
    'metadata-management': '元数据管理',
    'tag-management': '分类标签管理'
  };
  return <LegacyReferencePage title={titleMap[subSection] ?? '文库管理'} />;

  const [activeFolder, setActiveFolder] = useState('personal');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const isPublic = activeFolder === 'public';
  return (
    <div className="grid min-h-[calc(100vh-132px)] grid-cols-[280px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
      <aside className="border-r border-black/[0.06] bg-[#f6f7fb] p-4">
        <div className="flex gap-2">
          <button disabled={isPublic} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-[var(--gov-red)] text-[12px] font-semibold text-white disabled:bg-[#d1d5db]">
            <PlusCircle size={14} />新建
          </button>
          <button disabled={isPublic} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[9px] border border-black/[0.08] bg-white text-[12px] font-semibold text-[#596170] disabled:opacity-45">
            <FileUp size={14} />导入
          </button>
        </div>
        <div className="relative mt-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
          <input className="gov-input h-10 w-full pl-9 pr-3 text-[12px]" placeholder="搜索素材库" />
        </div>
        <div className="mt-4 space-y-2">
          {materialFolders.map((folder) => (
            <div key={folder.id}>
              <button
                onClick={() => setActiveFolder(folder.id)}
                className={`flex h-10 w-full items-center justify-between rounded-[10px] px-3 text-left text-[13px] font-semibold transition ${activeFolder === folder.id ? 'bg-white text-[var(--gov-red-deep)] shadow-[0_8px_20px_rgba(15,23,42,0.06)]' : 'text-[#4b5563] hover:bg-white/70'}`}
              >
                <span className="flex items-center gap-2"><FolderTree size={15} />{folder.name}</span>
                {folder.children.length > 0 ? <ChevronDown size={13} /> : null}
              </button>
              {folder.children.length > 0 && activeFolder === folder.id ? (
                <div className="ml-5 mt-1 space-y-1 border-l border-black/[0.06] pl-2">
                  {folder.children.map((child) => (
                    <button key={child} className="h-8 w-full rounded-[8px] px-2 text-left text-[12px] font-medium text-[#667085] hover:bg-white">{child}</button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </aside>
      <section className="min-w-0">
        <div className="flex h-16 items-center justify-between border-b border-black/[0.06] px-6">
          <div>
            <h3 className="text-[16px] font-bold text-[#202124]">{materialFolders.find((item) => item.id === activeFolder)?.name}</h3>
            <p className="mt-1 text-[11px] text-[#98a2b3]">统一维护可被写作、问答、审校调用的素材文件。</p>
          </div>
          {selectedFile ? (
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[#667085]">已选中 1 项</span>
              <button onClick={() => setSelectedFile(null)} className="font-semibold text-[var(--gov-red-deep)]">取消选择</button>
              <button className="h-8 rounded-[8px] border border-black/[0.06] bg-white px-3">复制到</button>
              <button className="h-8 rounded-[8px] border border-black/[0.06] bg-white px-3">移动到</button>
              <button className="h-8 rounded-[8px] border border-[#ffd6d8] bg-[#fff7f7] px-3 text-[var(--gov-red-deep)]">删除</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button disabled={isPublic} className="h-9 rounded-[9px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#596170] disabled:opacity-45">新建</button>
              <button disabled={isPublic} className="h-9 rounded-[9px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white disabled:bg-[#d1d5db]">导入</button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-[13px]">
            <thead className="border-b border-black/[0.06] bg-[#fbfbfc] text-[12px] text-[#667085]">
              <tr>
                <th className="w-12 p-4"></th>
                <th className="p-4">文件/文件夹目录</th>
                <th className="p-4">大小</th>
                <th className="p-4">上传者</th>
                <th className="p-4">更新时间</th>
                <th className="p-4">状态</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {materialFiles.map((file) => {
                const isSelected = selectedFile === file.name;
                return (
                  <tr key={file.name} className={isSelected ? 'bg-[#eef3ff]' : 'hover:bg-[#f7f8fa]'}>
                    <td className="p-4"><input type="checkbox" checked={isSelected} onChange={() => setSelectedFile(isSelected ? null : file.name)} /></td>
                    <td className="p-4 font-semibold text-[#202124]"><span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f0f4ff] text-[#3b63d9]"><FileText size={16} /></span>{file.name}</td>
                    <td className="p-4 text-[#667085]">{file.size}</td>
                    <td className="p-4 text-[#667085]">{file.creator}</td>
                    <td className="p-4 text-[#667085]">{file.updated}</td>
                    <td className="p-4"><Status tone={file.status === '可用' ? 'success' : 'warning'}>{file.status}</Status></td>
                    <td className="relative p-4 text-right">
                      <button onClick={() => setOpenMenu(openMenu === file.name ? null : file.name)} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-white"><MoreHorizontal size={16} /></button>
                      {openMenu === file.name ? (
                        <div className="absolute right-4 top-12 z-20 w-[120px] rounded-[10px] border border-black/[0.08] bg-white p-1.5 text-left shadow-[0_16px_36px_rgba(15,23,42,0.14)]">
                          {['查看', '重命名', '移动到', '下载', '删除'].map((action) => (
                            <button key={action} className={`flex h-8 w-full items-center rounded-[7px] px-2 text-[12px] font-semibold hover:bg-[#f7f8fa] ${action === '删除' ? 'text-[var(--gov-red-deep)]' : 'text-[#344054]'}`}>{action}</button>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type ModelRuntimeStatus = '启用' | '停用' | '待启用' | '连接异常';
type ConnectionTestStatus = 'untested' | 'success' | 'failed';

type LlmModelItem = {
  name: string;
  vendor: 'OpenAI' | '金山政务大模型';
  modelId: string;
  status: ModelRuntimeStatus;
  reasoning: '支持' | '不支持';
  tokens: string;
};

const initialLlmModels: LlmModelItem[] = [
  { name: '金山政务大模型-Pro', vendor: '金山政务大模型', modelId: 'ks-gov-pro-0724', status: '启用', reasoning: '支持', tokens: '128K / 8K' },
  { name: '通用 OpenAI 兼容模型', vendor: 'OpenAI', modelId: 'openai-compatible', status: '待启用', reasoning: '支持', tokens: '32K / 4K' },
  { name: '专项审校模型', vendor: '金山政务大模型', modelId: 'gov-proofread-v2', status: '连接异常', reasoning: '不支持', tokens: '16K / 2K' }
];

type ManagedAgentRecord = {
  id: string;
  name: string;
  category: AgentCategory;
  mode: 'Agent' | 'Multi-Agent';
  icon: string;
  description: string;
  keywords: string[];
  identifier: string;
};

const agentCategoryBadgeStyles: Record<AgentCategory, string> = {
  法律: 'bg-[#f5f0ff] text-[#7c3aed]',
  金融: 'bg-[#fff7ed] text-[#c56a17]',
  办公: 'bg-[#fff1f0] text-[var(--gov-red-deep)]',
  电商: 'bg-[#eef4ff] text-[#3b63d9]',
  医疗: 'bg-[#ecfdf7] text-[#0f8f7b]',
  编程: 'bg-[#eefdfd] text-[#0891b2]',
  数据: 'bg-[#f0fdf4] text-[#15803d]',
};

type AgentPermissionPrincipal = {
  id: string;
  type: 'all' | 'department' | 'user';
  name: string;
  meta: string;
  children?: AgentPermissionPrincipal[];
};

function AgentManagementAdmin() {
  const [showCreate, setShowCreate] = useState(false);
  const [permissionTargetAgent, setPermissionTargetAgent] = useState<ManagedAgentRecord | null>(null);
  const [agentPermissionSelectedIds, setAgentPermissionSelectedIds] = useState<Set<string>>(new Set(['dept-office', 'dept-office-admin', 'user-zhang', 'user-zhao']));
  const [agentPermissionExpandedIds, setAgentPermissionExpandedIds] = useState<Set<string>>(new Set(['all', 'dept-office']));
  const [agentMode, setAgentMode] = useState<'Agent' | 'Multi-Agent'>('Agent');
  const [agentCategory, setAgentCategory] = useState<AgentCategory>('办公');
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentKeywords, setAgentKeywords] = useState('');
  const [agentIdentifier, setAgentIdentifier] = useState('');
  const [iconFileName, setIconFileName] = useState('');
  const [records, setRecords] = useState<ManagedAgentRecord[]>([
    { id: 'ma-1', name: '智能公文专家', category: '办公', mode: 'Agent', icon: '公', description: '面向公文起草、问答、参考素材调用的一站式政务办公专家。', keywords: ['公文写作', '问答', '素材引用'], identifier: 'agent_doc_office' },
    { id: 'ma-2', name: '工作总结专家', category: '办公', mode: 'Agent', icon: '总', description: '支持阶段总结、年度总结、汇报材料提炼与结构优化。', keywords: ['工作总结', '汇报', '提炼'], identifier: 'agent_work_summary' },
    { id: 'ma-3', name: '会议纪要专家', category: '办公', mode: 'Agent', icon: '会', description: '将会议记录整理为规范纪要，提取议定事项、责任分工和完成时限。', keywords: ['会议纪要', '议定事项', '待办追踪'], identifier: 'agent_meeting_minutes' },
    { id: 'ma-4', name: '讲话稿专家', category: '办公', mode: 'Agent', icon: '讲', description: '面向领导讲话、会议发言和活动致辞，组织表达层次与正式语气。', keywords: ['讲话稿', '发言材料', '表达润色'], identifier: 'agent_speech_writer' },
    { id: 'ma-5', name: '政策解读专家', category: '办公', mode: 'Multi-Agent', icon: '策', description: '多角色协同完成政策检索、要点解析、影响分析与答疑。', keywords: ['政策解读', '法规', '协同分析'], identifier: 'team_policy_analysis' },
    { id: 'ma-6', name: '数据分析专家', category: '数据', mode: 'Agent', icon: '数', description: '支持材料数据提取、指标解释、趋势分析和汇报口径组织。', keywords: ['数据分析', '指标解读', '汇报图表'], identifier: 'agent_data_analysis' },
  ]);

  const permissionTree: AgentPermissionPrincipal[] = [
    {
      id: 'all',
      type: 'all',
      name: '全部',
      meta: '全员可查看并召唤该智能体',
      children: [
        {
          id: 'dept-office',
          type: 'department',
          name: '办公室',
          meta: '一级部门 · 12 人',
          children: [
            { id: 'dept-office-admin', type: 'department', name: '综合行政科', meta: '二级部门 · 5 人', children: [{ id: 'user-zhang', type: 'user', name: '张三', meta: '综合文秘' }, { id: 'user-zhao', type: 'user', name: '赵蕾', meta: '材料专员' }] },
            { id: 'dept-office-secretary', type: 'department', name: '秘书科', meta: '二级部门 · 7 人', children: [{ id: 'user-chen', type: 'user', name: '陈晨', meta: '会议纪要' }] },
          ],
        },
        { id: 'dept-policy', type: 'department', name: '政策研究室', meta: '一级部门 · 8 人', children: [{ id: 'user-li', type: 'user', name: '李敏', meta: '政策专员' }] },
        { id: 'dept-legal', type: 'department', name: '法律合规中心', meta: '一级部门 · 16 人', children: [{ id: 'user-wang', type: 'user', name: '王强', meta: '法务专员' }] },
      ],
    },
  ];

  const resetForm = () => {
    setAgentMode('Agent');
    setAgentCategory('办公');
    setAgentName('');
    setAgentDescription('');
    setAgentKeywords('');
    setAgentIdentifier('');
    setIconFileName('');
  };

  const handleCreateAgent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!agentName.trim() || !agentIdentifier.trim()) return;
    setRecords((items) => [{
      id: `ma-${Date.now()}`,
      name: agentName.trim(),
      category: agentCategory,
      mode: agentMode,
      icon: agentName.trim().slice(0, 1),
      description: agentDescription.trim() || '用于政务办公场景的智能体能力配置。',
      keywords: agentKeywords.split(/[，,\s]+/).map((item) => item.trim()).filter(Boolean).slice(0, 5),
      identifier: agentIdentifier.trim(),
    }, ...items]);
    resetForm();
    setShowCreate(false);
  };

  const collectPermissionIds = (node: AgentPermissionPrincipal): string[] => [
    node.id,
    ...(node.children?.flatMap(collectPermissionIds) ?? []),
  ];

  const findPermissionNode = (nodes: AgentPermissionPrincipal[], id: string): AgentPermissionPrincipal | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = node.children ? findPermissionNode(node.children, id) : null;
      if (found) return found;
    }
    return null;
  };

  const selectedPermissionNodes = (nodes: AgentPermissionPrincipal[], ancestorSelected = false): AgentPermissionPrincipal[] => nodes.flatMap((node) => {
    const selected = agentPermissionSelectedIds.has(node.id);
    if (selected && !ancestorSelected) return [node];
    return node.children ? selectedPermissionNodes(node.children, ancestorSelected || selected) : [];
  });

  const toggleAgentPermission = (id: string) => {
    const target = findPermissionNode(permissionTree, id);
    if (!target) return;
    const ids = collectPermissionIds(target);
    setAgentPermissionSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = ids.every((itemId) => next.has(itemId));
      ids.forEach((itemId) => {
        allSelected ? next.delete(itemId) : next.add(itemId);
      });
      return next;
    });
  };

  const renderAgentPermissionNode = (node: AgentPermissionPrincipal, depth = 0): React.ReactNode => {
    const childIds = collectPermissionIds(node);
    const selected = agentPermissionSelectedIds.has(node.id);
    const partiallySelected = !selected && childIds.some((itemId) => agentPermissionSelectedIds.has(itemId));
    const hasChildren = Boolean(node.children?.length);
    const expanded = agentPermissionExpandedIds.has(node.id);
    return (
      <div key={node.id} className="space-y-1">
        <button type="button" onClick={() => toggleAgentPermission(node.id)} className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition ${selected ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/60' : partiallySelected ? 'border-[#f2c3c9] bg-[#fff8f8]' : 'border-black/[0.06] bg-white hover:border-black/[0.12] hover:bg-[#fafafa]'}`} style={{ paddingLeft: 12 + depth * 18 }}>
          {hasChildren ? <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setAgentPermissionExpandedIds((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }); }} onKeyDown={(event) => { if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault(); event.stopPropagation(); setAgentPermissionExpandedIds((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }); }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[#98a2b3] hover:bg-white hover:text-[#344054]"><ChevronRight size={14} className={`transition ${expanded ? 'rotate-90' : ''}`} /></span> : <span className="h-6 w-6 shrink-0" />}
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${node.type === 'user' ? 'bg-[#fff1f0] text-[var(--gov-red)]' : node.type === 'all' ? 'bg-[#202124] text-white' : 'bg-[#eef4ff] text-[#3b63d9]'}`}>{node.type === 'user' ? <UserRound size={15} /> : node.type === 'all' ? <Globe2 size={15} /> : <Building2 size={15} />}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#202124]">{node.name}</span><span className="mt-0.5 block truncate text-[11px] text-[#98a2b3]">{node.meta}</span></span>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${selected ? 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white' : partiallySelected ? 'border-[var(--gov-red-line)] bg-white text-[var(--gov-red)]' : 'border-[#d0d5dd] text-transparent'}`}>{selected ? '✓' : '•'}</span>
        </button>
        {hasChildren && expanded ? <div className="space-y-1">{node.children!.map((child) => renderAgentPermissionNode(child, depth + 1))}</div> : null}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-[14px] border border-black/[0.06] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--gov-red-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--gov-red-deep)]"><Bot size={13} />智能体配置中心</div>
          <h3 className="mt-2 text-[18px] font-bold text-[#202124]">智能体管理</h3>
          <p className="mt-1 text-[13px] text-[#667085]">维护前台专家入口、Agent 与 Multi-Agent 的 id 标识和可见范围。</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[var(--gov-red)] px-4 text-[13px] font-semibold text-white shadow-[0_8px_22px_rgba(225,61,78,0.22)] transition hover:brightness-105"><PlusCircle size={15} />新建智能体</button>
      </div>
      <div className="border-b border-black/[0.05] bg-[#fbfbfc] px-5 py-3">
        <div className="relative max-w-md"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" /><input className="h-10 w-full rounded-[9px] border border-black/[0.08] bg-white pl-9 pr-3 text-[12px] outline-none focus:border-[var(--gov-red-line)]" placeholder="搜索智能体名称、关键字或标识" /></div>
      </div>
      <table className="w-full text-left text-[13px]">
        <thead className="bg-white text-[12px] text-[#667085]"><tr><th className="p-4">名称</th><th className="p-4">类型</th><th className="p-4">模式</th><th className="p-4">关键字</th><th className="p-4">id标识</th><th className="p-4 text-right">操作</th></tr></thead>
        <tbody className="divide-y divide-black/[0.05]">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-[#fbfbfc]">
              <td className="p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#fff1f0] to-[#ffe5e8] text-[15px] font-bold text-[var(--gov-red-deep)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_rgba(225,61,78,0.12)]">{record.icon}</span><div><p className="font-bold text-[#202124]">{record.name}</p><p className="mt-0.5 max-w-md truncate text-[11px] text-[#98a2b3]">{record.description}</p></div></div></td>
              <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${agentCategoryBadgeStyles[record.category]}`}>{record.category}</span></td>
              <td className="p-4"><Status tone={record.mode === 'Agent' ? 'success' : 'warning'}>{record.mode}</Status></td>
              <td className="p-4"><div className="flex flex-wrap gap-1.5">{record.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[#f2f4f7] px-2 py-1 text-[10px] font-semibold text-[#596170]">{keyword}</span>)}</div></td>
              <td className="p-4 font-mono text-[12px] text-[#596170]">{record.identifier}</td>
              <td className="p-4 text-right"><button type="button" onClick={() => setPermissionTargetAgent(record)} className="mr-3 text-[12px] font-semibold text-[#3b63d9]">设置权限</button><button type="button" className="mr-3 text-[12px] font-semibold text-[var(--gov-red-deep)]">编辑</button><button type="button" className="text-[12px] font-semibold text-[#98a2b3]">删除</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <AnimatePresence>
        {showCreate ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleCreateAgent} className="w-full max-w-2xl overflow-hidden rounded-[14px] border border-black/[0.08] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.2)]">
              <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-4"><div><h4 className="text-[16px] font-bold text-[#202124]">新建智能体</h4><p className="mt-1 text-[12px] text-[#667085]">填写智能体展示信息及平台 id 标识。</p></div><button type="button" onClick={() => { resetForm(); setShowCreate(false); }} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f5f5f5]"><X size={17} /></button></div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <Field label="智能体名称" required><input value={agentName} onChange={(event) => setAgentName(event.target.value)} className="gov-input h-10 w-full px-3 text-[12px]" placeholder="例如：智能公文专家" /></Field>
                <Field label="上传图标"><label className="flex h-10 cursor-pointer items-center gap-2 rounded-[8px] border border-black/[0.08] bg-[#fafafa] px-3 text-[12px] font-semibold text-[#596170] hover:bg-white"><FileUp size={14} />{iconFileName || '选择图标图片'}<input type="file" accept="image/*" className="sr-only" onChange={(event) => setIconFileName(event.target.files?.[0]?.name ?? '')} /></label></Field>
                <Field label="描述" required><textarea value={agentDescription} onChange={(event) => setAgentDescription(event.target.value)} className="gov-input min-h-24 w-full px-3 py-2 text-[12px]" placeholder="说明该智能体适用场景和能力边界" /></Field>
                <Field label="关键字"><textarea value={agentKeywords} onChange={(event) => setAgentKeywords(event.target.value)} className="gov-input min-h-24 w-full px-3 py-2 text-[12px]" placeholder="用逗号分隔，例如：公文写作，政策解读" /></Field>
                <Field label="类型" required><select value={agentCategory} onChange={(event) => setAgentCategory(event.target.value as AgentCategory)} className="gov-input h-10 w-full px-3 text-[12px]">{AGENT_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
                <Field label="运行模式" required><div className="grid grid-cols-2 gap-2">{(['Agent', 'Multi-Agent'] as const).map((mode) => <button key={mode} type="button" onClick={() => { setAgentMode(mode); setAgentIdentifier(''); }} className={`h-10 rounded-[8px] border text-[12px] font-semibold transition ${agentMode === mode ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)]' : 'border-black/[0.08] bg-white text-[#596170] hover:bg-[#fafafa]'}`}>{mode}</button>)}</div></Field>
                <Field label={agentMode === 'Agent' ? 'agent_id' : 'team_id'} required><input value={agentIdentifier} onChange={(event) => setAgentIdentifier(event.target.value)} className="gov-input h-10 w-full px-3 font-mono text-[12px]" placeholder={agentMode === 'Agent' ? 'agent_doc_office' : 'team_policy_analysis'} /></Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-5 py-4"><button type="button" onClick={() => { resetForm(); setShowCreate(false); }} className="h-9 rounded-[8px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#596170] hover:bg-[#f5f5f5]">取消</button><button type="submit" className="h-9 rounded-[8px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(225,61,78,0.22)]">保存</button></div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {permissionTargetAgent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <motion.div initial={{ y: 18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.98 }} className="w-full max-w-3xl overflow-hidden rounded-[14px] border border-black/[0.08] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.2)]">
              <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-4">
                <div><div className="flex items-center gap-2 text-[15px] font-bold text-[#202124]"><ShieldCheck size={17} className="text-[var(--gov-red)]" />设置智能体权限</div><p className="mt-1 text-[12px] text-[#667085]">智能体：{permissionTargetAgent.name}</p></div>
                <button type="button" onClick={() => setPermissionTargetAgent(null)} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f5f5f5]"><X size={17} /></button>
              </div>
              <div className="grid min-h-[430px] grid-cols-[1.15fr_0.85fr]">
                <div className="border-r border-black/[0.06] p-5">
                  <div className="mb-3 flex items-center justify-between"><p className="text-[13px] font-bold text-[#344054]">部门用户列表</p><span className="rounded-full bg-[var(--gov-red-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--gov-red-deep)]">勾选后可见</span></div>
                  <div className="max-h-[355px] space-y-1 overflow-auto pr-1">{permissionTree.map((node) => renderAgentPermissionNode(node))}</div>
                </div>
                <div className="bg-[#fbfbfc] p-5">
                  <p className="text-[13px] font-bold text-[#344054]">已选用户 / 部门</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#98a2b3]">只有右侧对象可在首页和专家管理中看到并召唤该智能体。</p>
                  <div className="mt-4 space-y-2">
                    {selectedPermissionNodes(permissionTree).map((item) => <div key={item.id} className="flex items-center justify-between rounded-[9px] border border-black/[0.06] bg-white px-3 py-2.5"><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#344054]">{item.name}</p><p className="mt-0.5 truncate text-[10px] text-[#98a2b3]">{item.type === 'all' ? '全员权限' : item.type === 'department' ? '部门权限（含下级）' : '用户权限'}</p></div><button type="button" onClick={() => toggleAgentPermission(item.id)} className="rounded-[6px] p-1 text-[#98a2b3] hover:bg-[#fff1f0] hover:text-[#d92d20]"><X size={13} /></button></div>)}
                    {agentPermissionSelectedIds.size === 0 ? <div className="rounded-[10px] border border-dashed border-black/[0.12] bg-white p-6 text-center text-[12px] text-[#98a2b3]">尚未选择授权对象</div> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] bg-white px-5 py-4"><button type="button" onClick={() => setPermissionTargetAgent(null)} className="h-9 rounded-[8px] border border-black/[0.08] px-4 text-[12px] font-semibold text-[#596170] hover:bg-[#f5f5f5]">取消</button><button type="button" onClick={() => setPermissionTargetAgent(null)} className="h-9 rounded-[8px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(225,61,78,0.22)]">保存权限</button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ModelManagementAdmin({ subSection: _subSection }: { subSection: AdminSubSection }) {
  const [models, setModels] = useState<LlmModelItem[]>(initialLlmModels);
  const [showModelModal, setShowModelModal] = useState(false);
  const [activeModelDetail, setActiveModelDetail] = useState<LlmModelItem | null>(null);
  const [activeModelOriginalId, setActiveModelOriginalId] = useState('');
  const [modelStep, setModelStep] = useState(0);
  const [detailModelStep, setDetailModelStep] = useState(0);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestStatus>('untested');
  const steps = [
    { title: '基础信息', desc: '必填' },
    { title: '调用地址', desc: '必填并测试' },
    { title: '默认参数', desc: '可选调整' }
  ];
  const modelStatusTone = (status: ModelRuntimeStatus) => {
    if (status === '启用') return 'success';
    if (status === '连接异常') return 'danger';
    return 'warning';
  };
  const openModelModal = () => {
    setModelStep(0);
    setConnectionTest('untested');
    setShowModelModal(true);
  };
  const saveModel = () => {
    if (connectionTest === 'untested') return;
    setModels((items) => [
      {
        name: '省厅 DeepSeek-R1 32B',
        vendor: 'OpenAI',
        modelId: 'deepseek-r1-distill-qwen-32b',
        status: connectionTest === 'success' ? '待启用' : '连接异常',
        reasoning: '支持',
        tokens: '64K / 8K'
      },
      ...items
    ]);
    setShowModelModal(false);
  };
  const toggleModelStatus = (modelId: string) => {
    setModels((items) => items.map((item) => {
      if (item.modelId !== modelId || item.status === '连接异常') return item;
      return { ...item, status: item.status === '启用' ? '停用' : '启用' };
    }));
  };
  const retestModel = (modelId: string) => {
    setModels((items) => items.map((item) => (
      item.modelId === modelId ? { ...item, status: '待启用' } : item
    )));
  };
  const openModelDetail = (model: LlmModelItem) => {
    setActiveModelDetail(model);
    setActiveModelOriginalId(model.modelId);
    setDetailModelStep(0);
  };
  const readonlyModelDetail = activeModelDetail?.status === '启用';
  const saveModelDetail = () => {
    if (!activeModelDetail || readonlyModelDetail) return;
    setModels((items) => items.map((item) => (
      item.modelId === activeModelOriginalId ? activeModelDetail : item
    )));
    setActiveModelDetail(null);
  };

  return (
    <div className="space-y-4">
      <section className="ai-admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-5">
          <div>
            <h3 className="text-[18px] font-bold text-[#202124]">模型管理</h3>
            <p className="mt-1.5 text-[13px] text-[#667085]">管理模型资产、连通性、启停状态和绑定前可用性。</p>
          </div>
          <button
            onClick={openModelModal}
            className="gov-button-primary inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-[13px] font-semibold shadow-[0_10px_24px_rgba(230,76,88,0.20)]"
          >
            <PlusCircle size={16} />
            接入模型
          </button>
        </div>
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-[#fbfbfc] px-5 py-3">
          <div className="relative w-full max-w-[420px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" /><input className="gov-input h-10 w-full pl-9 text-[12px]" placeholder="搜索模型显示名称、厂商、模型上游名称" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-[13px]">
            <thead className="bg-[#f7f8fa] text-[12px] text-[#667085]"><tr><th className="p-4">模型显示名称</th><th className="p-4">厂商类型</th><th className="p-4">模型上游名称</th><th className="p-4">状态</th><th className="p-4">思维链</th><th className="p-4">上下文/输出</th><th className="p-4 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-black/[0.05]">
              {models.map((model) => (
                <tr key={model.modelId} className="hover:bg-[#fbfbfc]">
                  <td className="p-4 font-semibold text-[#202124]">{model.name}</td>
                  <td className="p-4 text-[#667085]">{model.vendor}</td>
                  <td className="p-4 font-mono text-[12px] text-[#667085]">{model.modelId}</td>
                  <td className="p-4"><Status tone={modelStatusTone(model.status)}>{model.status}</Status></td>
                  <td className="p-4 text-[#667085]">{model.reasoning}</td>
                  <td className="p-4 text-[#667085]">{model.tokens}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openModelDetail(model)} className="mr-3 text-[12px] font-semibold text-[#3b63d9]">
                      {model.status === '启用' ? '详情' : '编辑'}
                    </button>
                    {model.status === '启用' ? (
                      <>
                        <button onClick={() => toggleModelStatus(model.modelId)} className="mr-3 text-[12px] font-semibold text-amber-700">停用</button>
                        <button
                          type="button"
                          disabled
                          title="启用中的模型不能删除，请先停用"
                          className="cursor-not-allowed text-[12px] font-semibold text-[#c5cad3]"
                        >
                          删除
                        </button>
                      </>
                    ) : (
                      <>
                        {model.status === '连接异常' ? (
                          <button onClick={() => retestModel(model.modelId)} className="mr-3 text-[12px] font-semibold text-[var(--gov-red-deep)]">重新测试</button>
                        ) : (
                          <button onClick={() => toggleModelStatus(model.modelId)} className="mr-3 text-[12px] font-semibold text-emerald-700">启用</button>
                        )}
                        <button
                          onClick={() => setModels((items) => items.filter((item) => item.modelId !== model.modelId))}
                          className="text-[12px] font-semibold text-[#667085]"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AnimatePresence>
        {showModelModal ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setShowModelModal(false)}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="w-full max-w-[900px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between px-6 py-5">
                <div>
                  <h3 className="text-[18px] font-bold text-[#202124]">接入 LLM 模型</h3>
                  <p className="mt-1.5 text-[13px] text-[#667085]">按步骤完成模型接入。基础信息和调用地址为必填；默认参数可直接保存，也可后续调整。</p>
                </div>
                <button onClick={() => setShowModelModal(false)} className="rounded-[8px] border border-black/[0.08] p-2 text-[#344054] hover:bg-[#f7f8fa]" aria-label="关闭"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 px-6 pb-4">
                {steps.map((step, index) => (
                  <button key={step.title} onClick={() => setModelStep(index)} className={`rounded-[8px] border px-4 py-3 text-left transition ${modelStep === index ? 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white shadow-[0_10px_24px_rgba(230,76,88,0.16)]' : 'border-black/[0.08] bg-[#fbfbfc] text-[#344054] hover:bg-white'}`}>
                    <p className="text-[13px] font-bold">{step.title}</p>
                    <p className={`mt-1 text-[11px] ${modelStep === index ? 'text-white/80' : 'text-[#667085]'}`}>{step.desc}</p>
                  </button>
                ))}
              </div>
              <div className="mx-6 rounded-[12px] border border-black/[0.08] px-5 py-5">
                {modelStep === 0 ? (
                  <div>
                    <h4 className="text-[15px] font-bold text-[#202124]">基础信息</h4>
                    <p className="mt-1 text-[12px] text-[#667085]">用于后台展示、模型网关识别和列表检索。</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field label="模型显示名称" required><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue="省厅 DeepSeek-R1 32B" /></Field>
                      <Field label="厂商类型" required><select className="gov-input h-10 w-full px-3 text-[13px]"><option>OpenAI</option><option>金山政务大模型</option></select></Field>
                      <Field label="模型上游名称" required><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue="deepseek-r1-distill-qwen-32b" /></Field>
                    </div>
                  </div>
                ) : modelStep === 1 ? (
                  <div>
                    <h4 className="text-[15px] font-bold text-[#202124]">调用地址与鉴权</h4>
                    <p className="mt-1 text-[12px] text-[#667085]">填写完成后可直接测试连通性；敏感信息保存后脱敏展示。</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field label="调用地址（Base URL，LLM 带 /v1）" required><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue="https://model-gateway.local/v1" /></Field>
                      <Field label="API Key"><input type="password" className="gov-input h-10 w-full px-3 text-[13px]" defaultValue="sk-local-000000" /></Field>
                      <Field label="上下文窗口" required><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue="65536" /></Field>
                      <Field label="最大输出 Token 上限" required><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue="8192" /></Field>
                    </div>
                    <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border p-4 ${
                      connectionTest === 'success'
                        ? 'border-emerald-200 bg-emerald-50'
                        : connectionTest === 'failed'
                          ? 'border-red-200 bg-red-50'
                          : 'border-black/[0.06] bg-[#fbfbfc]'
                    }`}>
                      <div>
                        <p className="text-[13px] font-bold text-[#344054]">连通性测试</p>
                        <p className="mt-1 text-[12px] text-[#667085]">
                          {connectionTest === 'success'
                            ? '测试成功。可直接保存到模型列表，状态为“待启用”；默认参数可跳过，后续在详情中调整。'
                            : connectionTest === 'failed'
                              ? '测试失败。可保存为“连接异常”记录，列表仅支持重新测试或删除，不能启用。'
                              : '未测试。建议完成连通性测试后再保存，避免业务节点绑定不可用模型。'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setConnectionTest('failed')} className="h-9 rounded-[8px] border border-red-100 bg-white px-3 text-[12px] font-semibold text-[var(--gov-red-deep)]">模拟失败</button>
                        <button onClick={() => setConnectionTest('success')} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#344054] transition hover:border-emerald-200 hover:text-emerald-700">
                          <RefreshCw size={13} />
                          测试连通性
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-[15px] font-bold text-[#202124]">默认参数</h4>
                    <p className="mt-1 text-[12px] text-[#667085]">均有默认值；不修改也可以直接保存，后续可在模型详情中调整。</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field label="是否支持流式输出"><select className="gov-input h-10 w-full px-3 text-[13px]"><option>是</option><option>否</option></select></Field>
                      <Field label="是否支持思维链 / Reasoning"><select className="gov-input h-10 w-full px-3 text-[13px]"><option>是</option><option>否</option></select></Field>
                      {[
                        ['QPS 上限', '20'],
                        ['每分钟 Token 上限', '800000'],
                        ['最大并发数', '12'],
                        ['超时时间限制（秒）', '180'],
                        ['连接超时（秒）', '10'],
                        ['temperature', '0.3'],
                        ['top_p', '0.8'],
                        ['frequency_penalty', '0'],
                        ['presence_penalty', '0']
                      ].map(([label, value]) => <Field key={label} label={label}><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue={value} /></Field>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
                <button onClick={() => setShowModelModal(false)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#344054]">取消</button>
                <button disabled={modelStep === 0} onClick={() => setModelStep((step) => Math.max(0, step - 1))} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#344054] disabled:opacity-40">上一步</button>
                <button disabled={modelStep === 2} onClick={() => setModelStep((step) => Math.min(2, step + 1))} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#344054] disabled:opacity-40">下一步</button>
                <button
                  disabled={connectionTest === 'untested'}
                  onClick={saveModel}
                  className="gov-button-primary h-10 px-5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                  title={connectionTest === 'untested' ? '请先完成连通性测试' : '保存模型配置'}
                >
                  <Save size={14} />
                  {connectionTest === 'failed' ? '保存异常记录' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {activeModelDetail ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setActiveModelDetail(null)}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="w-full max-w-[860px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-black/[0.06] px-6 py-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[18px] font-bold text-[#202124]">{readonlyModelDetail ? '模型详情' : '编辑模型'}</h3>
                    <Status tone={modelStatusTone(activeModelDetail.status)}>{activeModelDetail.status}</Status>
                  </div>
                  <p className="mt-1.5 text-[13px] text-[#667085]">
                    {readonlyModelDetail ? '当前模型处于启用状态，只能查看参数详情，不能编辑或执行操作。' : '当前模型未启用，可编辑基础信息和默认参数，保存后再启用。'}
                  </p>
                </div>
                <button onClick={() => setActiveModelDetail(null)} className="rounded-[8px] border border-black/[0.08] p-2 text-[#344054] hover:bg-[#f7f8fa]" aria-label="关闭"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 px-6 pb-4">
                {steps.map((step, index) => (
                  <button
                    key={step.title}
                    onClick={() => setDetailModelStep(index)}
                    className={`rounded-[8px] border px-4 py-3 text-left transition ${
                      detailModelStep === index
                        ? readonlyModelDetail
                          ? 'border-[#d7dde8] bg-[#f1f4f8] text-[#344054]'
                          : 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white shadow-[0_10px_24px_rgba(230,76,88,0.16)]'
                        : 'border-black/[0.08] bg-[#fbfbfc] text-[#344054] hover:bg-white'
                    }`}
                  >
                    <p className="text-[13px] font-bold">{step.title}</p>
                    <p className={`mt-1 text-[11px] ${detailModelStep === index && !readonlyModelDetail ? 'text-white/80' : 'text-[#667085]'}`}>{step.desc}</p>
                  </button>
                ))}
              </div>
              <div className="px-6 pb-5">
                {readonlyModelDetail ? (
                  <div className="mb-5 rounded-[12px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-medium text-emerald-700">
                    启用中的模型正在被业务节点使用。需要调整参数时，请先在运维流程中停用后再编辑。
                  </div>
                ) : null}
                <div className="rounded-[12px] border border-black/[0.08] px-5 py-5">
                  {detailModelStep === 0 ? (
                    <div>
                      <h4 className="text-[15px] font-bold text-[#202124]">基础信息</h4>
                      <p className="mt-1 text-[12px] text-[#667085]">用于后台展示、模型网关识别和列表检索。</p>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <Field label="模型显示名称" required>
                          <input
                            disabled={readonlyModelDetail}
                            className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]"
                            value={activeModelDetail.name}
                            onChange={(event) => setActiveModelDetail((model) => (model ? { ...model, name: event.target.value } : model))}
                          />
                        </Field>
                        <Field label="厂商类型" required>
                          <select
                            disabled={readonlyModelDetail}
                            className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]"
                            value={activeModelDetail.vendor}
                            onChange={(event) => setActiveModelDetail((model) => (model ? { ...model, vendor: event.target.value as LlmModelItem['vendor'] } : model))}
                          >
                            <option>OpenAI</option>
                            <option>金山政务大模型</option>
                          </select>
                        </Field>
                        <Field label="模型上游名称" required>
                          <input
                            disabled={readonlyModelDetail}
                            className="gov-input h-10 w-full px-3 font-mono text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]"
                            value={activeModelDetail.modelId}
                            onChange={(event) => setActiveModelDetail((model) => (model ? { ...model, modelId: event.target.value } : model))}
                          />
                        </Field>
                        <Field label="模型状态">
                          <div className="flex h-10 items-center rounded-[8px] border border-black/[0.08] bg-[#fbfbfc] px-3">
                            <Status tone={modelStatusTone(activeModelDetail.status)}>{activeModelDetail.status}</Status>
                          </div>
                        </Field>
                      </div>
                    </div>
                  ) : detailModelStep === 1 ? (
                    <div>
                      <h4 className="text-[15px] font-bold text-[#202124]">调用地址与鉴权</h4>
                      <p className="mt-1 text-[12px] text-[#667085]">与新增模型保持一致，支持查看或维护调用地址、鉴权和上下文配置。</p>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <Field label="调用地址（Base URL，LLM 带 /v1）" required>
                          <input disabled={readonlyModelDetail} className="gov-input h-10 w-full px-3 font-mono text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]" defaultValue="https://model-gateway.local/v1" />
                        </Field>
                        <Field label="API Key">
                          <input disabled={readonlyModelDetail} type="password" className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]" defaultValue="sk-local-************" />
                        </Field>
                        <Field label="上下文窗口" required>
                          <input disabled={readonlyModelDetail} className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]" defaultValue={activeModelDetail.tokens.split('/')[0]?.trim().replace('K', '000') || '65536'} />
                        </Field>
                        <Field label="最大输出 Token 上限" required>
                          <input disabled={readonlyModelDetail} className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]" defaultValue={activeModelDetail.tokens.split('/')[1]?.trim().replace('K', '000') || '8192'} />
                        </Field>
                      </div>
                      <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border p-4 ${activeModelDetail.status === '连接异常' ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
                        <div>
                          <p className="text-[13px] font-bold text-[#344054]">连通性测试</p>
                          <p className="mt-1 text-[12px] text-[#667085]">
                            {readonlyModelDetail ? '启用中模型已通过连通性校验，此处仅展示，不允许重新测试。' : activeModelDetail.status === '连接异常' ? '当前连通性异常，可重新测试后再启用。' : '当前模型可重新测试连通性，测试通过后可继续启用。'}
                          </p>
                        </div>
                        <button disabled={readonlyModelDetail} onClick={() => setActiveModelDetail((model) => (model ? { ...model, status: '待启用' } : model))} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#344054] transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45">
                          <RefreshCw size={13} />
                          测试连通性
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-[15px] font-bold text-[#202124]">默认参数</h4>
                      <p className="mt-1 text-[12px] text-[#667085]">与新增接入保持一致，集中展示模型运行默认值、限流和生成参数。</p>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <Field label="是否支持流式输出"><select disabled={readonlyModelDetail} className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]"><option>是</option><option>否</option></select></Field>
                        <Field label="是否支持思维链 / Reasoning">
                          <select
                            disabled={readonlyModelDetail}
                            className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]"
                            value={activeModelDetail.reasoning === '支持' ? '是' : '否'}
                            onChange={(event) => setActiveModelDetail((model) => (model ? { ...model, reasoning: event.target.value === '是' ? '支持' : '不支持' } : model))}
                          >
                            <option>是</option>
                            <option>否</option>
                          </select>
                        </Field>
                        {[
                          ['QPS 上限', '20'],
                          ['每分钟 Token 上限', '800000'],
                          ['最大并发数', '12'],
                          ['超时时间限制（秒）', '180'],
                          ['连接超时（秒）', '10'],
                          ['temperature', '0.3'],
                          ['top_p', '0.8'],
                          ['frequency_penalty', '0'],
                          ['presence_penalty', '0']
                        ].map(([label, value]) => (
                          <Field key={label} label={label}>
                            <input disabled={readonlyModelDetail} className="gov-input h-10 w-full px-3 text-[13px] disabled:bg-[#f7f8fa] disabled:text-[#667085]" defaultValue={value} />
                          </Field>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
                <button onClick={() => setActiveModelDetail(null)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#344054]">{readonlyModelDetail ? '关闭' : '取消'}</button>
                <button disabled={detailModelStep === 0} onClick={() => setDetailModelStep((step) => Math.max(0, step - 1))} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#344054] disabled:opacity-40">上一步</button>
                <button disabled={detailModelStep === 2} onClick={() => setDetailModelStep((step) => Math.min(2, step + 1))} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#344054] disabled:opacity-40">下一步</button>
                {!readonlyModelDetail ? (
                  <button onClick={saveModelDetail} className="gov-button-primary h-10 px-5 text-[12px] font-semibold">
                    <Save size={14} />
                    保存修改
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const businessNodes = [
  { level: 0, name: '智能公文', type: '一级功能', systemPrompt: '组织智能公文能力入口。', userPrompt: '识别用户任务目标并路由到具体功能节点。', variables: [], model: '', params: '', status: '', root: true },
  { level: 1, name: '智能问答', type: '单模型节点', systemPrompt: '限定为政务办公问答助手，回答需依据问题和可用素材。', userPrompt: '请基于 {{question}}、{{reference_materials}} 输出结构化答复。', variables: ['{{question}}', '{{reference_materials}}'], model: '金山政务大模型-Pro', params: 'Temp 0.3 / Max 2048 / 深度思考 开', status: '已启用' },
  { level: 1, name: 'AI写作', type: '二级功能', systemPrompt: '识别写作模式、场景、参数与素材流程。', userPrompt: '根据 {{writing_mode}}、{{title}}、{{requirements}} 进入对应写作链路。', variables: ['{{writing_mode}}', '{{title}}', '{{requirements}}'], model: '金山政务大模型-Pro', params: 'Temp 0.4 / Max 4096 / 深度思考 开', status: '已启用' },
  { level: 2, name: '写作模式识别', type: '单模型节点', systemPrompt: '只判断用户意图，不生成正文。', userPrompt: '从 {{user_input}} 中识别生成全文、生成大纲、大纲成文、继续写或生成结语。', variables: ['{{user_input}}'], model: '通用兼容模型', params: 'Temp 0.1 / Max 1024', status: '待启用' },
  { level: 2, name: '场景选择', type: '单模型节点', systemPrompt: '根据文种与场景选择适配写作模板。', userPrompt: '结合 {{doc_type}}、{{scene}}、{{business_context}} 返回推荐场景。', variables: ['{{doc_type}}', '{{scene}}', '{{business_context}}'], model: '金山政务大模型-Pro', params: 'Temp 0.2 / Max 1024', status: '已启用' },
  { level: 2, name: '生成全文', type: '多模型节点', systemPrompt: '生成正式、规范、可编辑的公文正文。', userPrompt: '根据 {{title}}、{{scene}}、{{word_count}}、{{draft_unit}}、{{reference_materials}} 生成全文。', variables: ['{{title}}', '{{scene}}', '{{word_count}}', '{{draft_unit}}', '{{reference_materials}}'], model: '金山政务大模型-Pro', params: 'Temp 0.5 / Max 8192 / 深度思考 开', status: '已启用' },
  { level: 1, name: 'AI仿写', type: '多模型节点', systemPrompt: '提取参考文本结构、语气和行文特征，不直接照搬原文。', userPrompt: '基于 {{sample_text}}、{{structure_keywords}}、{{rewrite_requirements}} 生成仿写稿。', variables: ['{{sample_text}}', '{{structure_keywords}}', '{{rewrite_requirements}}'], model: '金山政务大模型-Pro', params: 'Temp 0.45 / Max 8192 / 深度思考 开', status: '已启用' },
  { level: 1, name: 'AI润色', type: '单模型节点', systemPrompt: '优化表达层次、文字质感和正式语气。', userPrompt: '按 {{polish_goal}} 润色 {{draft_text}}，保留原意和事实。', variables: ['{{polish_goal}}', '{{draft_text}}'], model: '专项审校模型', params: 'Temp 0.3 / Max 4096', status: '待启用' },
  { level: 1, name: '智能排版', type: '单模型节点', systemPrompt: '识别正文层级并给出规范排版建议。', userPrompt: '对 {{draft_text}} 输出标题层级、段落和格式调整建议。', variables: ['{{draft_text}}'], model: '专项审校模型', params: 'Temp 0.2 / Max 4096', status: '已启用' },
  { level: 1, name: '智能校对', type: '单模型节点', systemPrompt: '检查错别字、敏感表述和公文格式问题。', userPrompt: '校对 {{draft_text}}，输出问题位置、问题类型和修改建议。', variables: ['{{draft_text}}'], model: '专项审校模型', params: 'Temp 0.2 / Max 4096', status: '已启用' }
];

function BusinessNodeAdmin() {
  const editableNodes = businessNodes.filter((node) => !node.root);
  const [selectedNodeName, setSelectedNodeName] = useState(editableNodes[0]?.name ?? '智能问答');
  const [promptEditor, setPromptEditor] = useState<{ title: string; mode: 'create' | 'edit' } | null>(null);
  const [enabledVersions, setEnabledVersions] = useState<Record<string, boolean>>({});
  const selectedNode = businessNodes.find((node) => node.name === selectedNodeName) ?? editableNodes[0];
  const supportsMultiModel = selectedNode?.type.includes('多模型') ?? false;
  const promptVersions = selectedNode ? [
    {
      id: `${selectedNode.name}-v1`,
      version: 'V1.0',
      supportsMultiModel,
      model: selectedNode.model || '金山政务大模型-Pro',
      deepThinking: selectedNode.params.includes('深度思考'),
      defaultEnabled: selectedNode.status === '已启用',
    },
    {
      id: `${selectedNode.name}-v09`,
      version: 'V0.9',
      supportsMultiModel,
      model: selectedNode.name.includes('校对') || selectedNode.name.includes('排版') || selectedNode.name.includes('润色') ? '专项审校模型' : '通用兼容模型',
      deepThinking: supportsMultiModel,
      defaultEnabled: supportsMultiModel,
    },
  ] : [];

  const toggleVersion = (versionId: string) => {
    setEnabledVersions((current) => {
      const version = promptVersions.find((item) => item.id === versionId);
      if (!version) return current;
      const enabled = current[version.id] ?? version.defaultEnabled;
      if (enabled) return { ...current, [version.id]: false };
      if (version.supportsMultiModel) return { ...current, [version.id]: true };
      const next = { ...current, [version.id]: true };
      promptVersions.forEach((item) => {
        if (item.id !== version.id) next[item.id] = false;
      });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="ai-admin-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-5">
          <div><h3 className="text-[18px] font-bold text-[#202124]">提示词管理</h3><p className="mt-1.5 text-[13px] leading-6 text-[#667085]">按业务节点维护提示词版本、入参变量、绑定模型和模型参数。</p></div>
        </div>
        <div className="grid min-h-[620px] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-r border-black/[0.06] bg-[#fbfbfc] p-4">
            <div className="mb-3 flex h-10 items-center gap-2 rounded-[10px] border border-black/[0.06] bg-white px-3">
              <Search size={15} className="text-[#98a2b3]" />
              <input className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#b0b5bd]" placeholder="搜索业务节点" />
            </div>
            <div className="space-y-1">
              {businessNodes.map((node) => {
                const root = Boolean(node.root);
                const selected = selectedNodeName === node.name;
                return (
                  <button
                    key={node.name}
                    type="button"
                    disabled={root}
                    onClick={() => setSelectedNodeName(node.name)}
                    className={`flex min-h-[44px] w-full items-center gap-2 rounded-[10px] px-3 text-left transition ${
                      root
                        ? 'cursor-default bg-white text-[var(--gov-red-deep)] shadow-[0_6px_18px_rgba(15,23,42,0.04)]'
                        : selected
                          ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)] ring-1 ring-[var(--gov-red-line)]'
                          : 'text-[#596170] hover:bg-white hover:text-[#202124]'
                    }`}
                    style={{ paddingLeft: `${12 + node.level * 18}px` }}
                  >
                    {root ? <FolderTree size={15} /> : node.level > 1 ? <MessageSquareText size={14} /> : <FileText size={14} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold">{node.name}</span>
                      <span className={`mt-0.5 block text-[10px] ${selected ? 'text-[var(--gov-red-deep)]/70' : 'text-[#98a2b3]'}`}>{node.type}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 bg-white">
            {selectedNode ? (
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] pb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[var(--gov-red-soft)] text-[var(--gov-red)]"><MessageSquareText size={15} /></span>
                      <h4 className="text-[17px] font-bold text-[#202124]">{selectedNode.name}</h4>
                      <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-semibold text-[#667085]">{selectedNode.type}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedNode.variables.length > 0 ? selectedNode.variables.map((item) => (
                        <span key={item} className="rounded-[7px] bg-[var(--gov-red-soft)] px-2 py-1 font-mono text-[11px] font-semibold text-[var(--gov-red-deep)] ring-1 ring-[var(--gov-red-line)]">{item}</span>
                      )) : <span className="text-[12px] text-[#c5cad3]">该节点暂无入参变量</span>}
                    </div>
                  </div>
                  <button onClick={() => setPromptEditor({ title: selectedNode.name, mode: 'create' })} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[var(--gov-red)] px-3 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(190,51,62,0.16)]">
                    <PlusCircle size={14} />
                    新增版本
                  </button>
                </div>

                <div className="overflow-x-auto rounded-[12px] border border-black/[0.06]">
                  <table className="w-full min-w-[860px] text-left text-[13px]">
                    <thead className="bg-[#f7f8fa] text-[12px] font-semibold text-[#667085]">
                      <tr>
                        <th className="px-4 py-3">版本号</th>
                        <th className="px-4 py-3">是否支持多模型</th>
                        <th className="px-4 py-3">绑定模型名称</th>
                        <th className="px-4 py-3">是否支持深度思考</th>
                        <th className="px-4 py-3">状态</th>
                        <th className="px-4 py-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05] bg-white">
                      {promptVersions.map((version) => {
                        const active = enabledVersions[version.id] ?? version.defaultEnabled;
                        return (
                          <tr key={version.id} className="hover:bg-[#fffafa]">
                            <td className="px-4 py-3 font-semibold text-[#202124]">{version.version}</td>
                            <td className="px-4 py-3 text-[#667085]">{version.supportsMultiModel ? '是' : '否'}</td>
                            <td className="px-4 py-3 text-[#344054]">{version.model}</td>
                            <td className="px-4 py-3 text-[#667085]">{version.deepThinking ? '是' : '否'}</td>
                            <td className="px-4 py-3"><Status tone={active ? 'success' : 'warning'}>{active ? '启用' : '停用'}</Status></td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-3">
                                <button onClick={() => setPromptEditor({ title: selectedNode.name, mode: 'edit' })} className="text-[12px] font-semibold text-[var(--gov-red-deep)]">编辑</button>
                                <button onClick={() => toggleVersion(version.id)} className={`text-[12px] font-semibold ${active ? 'text-amber-700' : 'text-emerald-700'}`}>{active ? '停用' : '启用'}</button>
                                <button disabled={active} className="text-[12px] font-semibold text-[#98a2b3] disabled:text-[#c5cad3]">删除</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        </div>
        <div className="border-t border-black/[0.06] bg-[#fbfbfc] px-5 py-3 text-[11px] leading-5 text-[#667085]">
          前台调用规则：每个业务节点同一时间只允许一条启用的提示词版本；若没有启用版本，前台返回“当前功能暂未完成后台配置，请联系管理员”。
        </div>
        <AnimatePresence>{promptEditor ? <BusinessPromptModal title={promptEditor.title} mode={promptEditor.mode} onClose={() => setPromptEditor(null)} /> : null}</AnimatePresence>
      </div>
    </div>
  );
}

function BusinessPromptModal({ title, mode, onClose }: { title: string; mode: 'create' | 'edit'; onClose: () => void }) {
  const node = businessNodes.find((item) => item.name === title);
  const variables = node?.variables.length ? node.variables : ['{{user_input}}', '{{reference_materials}}', '{{output_format}}'];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="w-full max-w-[1040px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
          <div><h3 className="text-[17px] font-bold text-[#202124]">{mode === 'create' ? '新增' : '编辑'}提示词版本：{title}</h3><p className="mt-1 text-[12px] text-[#667085]">入参统一使用双大括号，例如 <code>{'{{title}}'}</code>、<code>{'{{requirements}}'}</code>。</p></div>
          <button onClick={onClose} className="rounded-[8px] border border-black/[0.08] p-2"><X size={18} /></button>
        </div>
        <div className="grid max-h-[72vh] gap-5 overflow-auto px-6 py-6 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[14px] border border-black/[0.06] bg-[#fbfbfc] p-4">
              <h4 className="text-[13px] font-bold text-[#202124]">所属业务节点</h4>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-[8px] bg-[var(--gov-red-soft)] px-3 py-1.5 text-[12px] font-bold text-[var(--gov-red-deep)]">{title}</span>
                <span className="text-[12px] text-[#98a2b3]">版本号由系统保存时自动生成，编辑时不需要手动维护。</span>
              </div>
            </div>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-[13px] font-bold text-[#344054]">System Prompt <span className="text-[11px] font-medium text-[#98a2b3]">角色 / 边界 / 格式约束</span></span>
              <textarea rows={9} className="gov-input w-full resize-none px-4 py-3 text-[13px] leading-6" defaultValue={`你是${title}处理专家，服务于政务公文写作场景。\n你必须遵循正式、准确、稳健、可追溯的表达原则。\n不得编造政策、数据、单位名称；缺少关键信息时输出待补充项。\n输出需符合公文表达习惯，避免口语化和营销化措辞。`} />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-[13px] font-bold text-[#344054]">User Prompt <span className="text-[11px] font-medium text-[#98a2b3]">业务输入 / 任务变量</span></span>
              <textarea rows={9} className="gov-input w-full resize-none px-4 py-3 font-mono text-[12px] leading-6" defaultValue={node?.userPrompt || `请根据 {{user_input}}、{{reference_materials}} 和 {{output_format}} 完成当前节点任务。`} />
            </label>
          </div>
          <div className="space-y-4">
            <div className="rounded-[14px] border border-black/[0.06] bg-[#fbfbfc] p-4">
              <h4 className="text-[13px] font-bold text-[#202124]">绑定模型</h4>
              <div className="mt-3 space-y-3">
                <Field label="模型列表" required>
                  <select className="gov-input h-10 w-full px-3 text-[13px]" defaultValue={node?.model || '金山政务大模型-Pro'}>
                    {(initialLlmModels.length > 0 ? initialLlmModels : [{ name: '金山政务大模型-Pro', vendor: '金山政务大模型', modelId: 'ks-gov-pro-0724', status: '启用', reasoning: '支持', tokens: '128K / 8K' } satisfies LlmModelItem]).map((model) => <option key={model.modelId} value={model.name}>{model.name}</option>)}
                  </select>
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Temperature"><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue={title.includes('全文') || title.includes('仿写') ? '0.5' : '0.3'} /></Field>
                  <Field label="Max Tokens"><input className="gov-input h-10 w-full px-3 text-[13px]" defaultValue={title.includes('全文') || title.includes('仿写') ? '8192' : '4096'} /></Field>
                </div>
                <label className="flex items-center gap-2 rounded-[10px] border border-black/[0.06] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054]"><input type="checkbox" defaultChecked={node?.params?.includes('深度思考')} className="accent-[var(--gov-red)]" />启用深度思考</label>
              </div>
            </div>
            <div className="rounded-[14px] border border-black/[0.06] bg-[#fbfbfc] p-4">
              <h4 className="text-[13px] font-bold text-[#202124]">入参变量</h4>
              <p className="mt-1 text-[11px] leading-5 text-[#98a2b3]">保存时校验 user prompt 中的变量必须出现在入参清单内。</p>
              <div className="mt-3 flex flex-wrap gap-2">{variables.map((item) => <span key={item} className="rounded-[7px] bg-white px-2 py-1 font-mono text-[11px] text-[var(--gov-red-deep)] ring-1 ring-black/[0.06]">{item}</span>)}</div>
            </div>
            <div className="rounded-[14px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/35 p-4">
              <h4 className="text-[13px] font-bold text-[#202124]">启用规则</h4>
              <div className="mt-3 space-y-2 text-[12px] leading-5 text-[#596170]">
                <p>1. 当前业务节点同一时间只允许启用一条提示词版本。</p>
                <p>2. 启用新版本后，系统自动停用该节点下其他版本。</p>
                <p>3. 没有启用版本时，前台生成前进行明确报错。</p>
              </div>
              <label className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[var(--gov-red-deep)]"><input type="checkbox" defaultChecked={node?.status === '已启用'} className="accent-[var(--gov-red)]" />保存后启用该版本</label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4"><button onClick={onClose} className="h-10 rounded-[8px] border border-black/[0.08] px-5 text-[12px] font-semibold">取消</button><button className="gov-button-primary h-10 px-5 text-[12px] font-semibold">保存版本</button></div>
      </motion.div>
    </motion.div>
  );
}

function SystemManagementAdmin({ subSection }: { subSection: AdminSubSection }) {
  if (subSection === 'appearance-management') return <AppearanceManagementPanel />;
  if (subSection === 'menu-management') return <MenuManagementPanel />;
  return <RoleManagementPanel />;
}

const HOME_APPEARANCE_STORAGE_KEY = 'workagent-home-appearance';
const DEFAULT_HOME_APPEARANCE = {
  logoUrl: DEFAULT_PRODUCT_ICON_URL,
  productName: '金山文澜智能创作平台',
  slogan: '一步开启高效公文写作新体验',
};

function loadAppearanceDraft() {
  if (typeof window === 'undefined') return DEFAULT_HOME_APPEARANCE;
  try {
    const saved = window.localStorage.getItem(HOME_APPEARANCE_STORAGE_KEY);
    if (!saved) return DEFAULT_HOME_APPEARANCE;
    const parsed = { ...DEFAULT_HOME_APPEARANCE, ...JSON.parse(saved) };
    if (parsed.productName === '金山政务一体机') {
      return { ...parsed, productName: DEFAULT_HOME_APPEARANCE.productName };
    }
    return parsed;
  } catch {
    return DEFAULT_HOME_APPEARANCE;
  }
}

function AppearanceManagementPanel() {
  const [appearanceDraft, setAppearanceDraft] = useState(loadAppearanceDraft);
  const [saveStatus, setSaveStatus] = useState('');

  const saveAppearance = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = {
      logoUrl: appearanceDraft.logoUrl || DEFAULT_HOME_APPEARANCE.logoUrl,
      productName: appearanceDraft.productName.trim() || DEFAULT_HOME_APPEARANCE.productName,
      slogan: appearanceDraft.slogan.trim() || DEFAULT_HOME_APPEARANCE.slogan,
    };
    window.localStorage.setItem(HOME_APPEARANCE_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event('workagent-appearance-updated'));
    setAppearanceDraft(normalized);
    setSaveStatus('已保存，首页外观已同步更新');
    window.setTimeout(() => setSaveStatus(''), 2200);
  };

  const resetAppearance = () => {
    window.localStorage.setItem(HOME_APPEARANCE_STORAGE_KEY, JSON.stringify(DEFAULT_HOME_APPEARANCE));
    window.dispatchEvent(new Event('workagent-appearance-updated'));
    setAppearanceDraft(DEFAULT_HOME_APPEARANCE);
    setSaveStatus('已恢复默认外观');
    window.setTimeout(() => setSaveStatus(''), 2200);
  };

  const handleLogoUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAppearanceDraft((current) => ({ ...current, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="ai-admin-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-black/[0.06] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-[#202124]">外观管理</h3>
          <p className="mt-1.5 text-[13px] text-[#667085]">配置产品首页 Logo、产品名称和首页标语，用于原型展示与品牌信息维护。</p>
        </div>
        {saveStatus ? <span className="rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[12px] font-semibold text-[#027a48]">{saveStatus}</span> : null}
      </div>
      <form onSubmit={saveAppearance} className="grid gap-0 lg:grid-cols-[minmax(420px,0.78fr)_minmax(0,1.22fr)]">
        <div className="space-y-5 border-b border-black/[0.06] p-6 lg:border-b-0 lg:border-r">
          <div className="rounded-[14px] border border-black/[0.06] bg-[#fbfbfc] p-5">
            <p className="text-[13px] font-bold text-[#202124]">首页 Logo</p>
            <div className="mt-4 flex items-center gap-4">
              <img src={resolvePublicAssetUrl(appearanceDraft.logoUrl)} alt="首页 Logo 预览" className="h-20 w-20 rounded-[22px] border border-white object-cover shadow-[0_16px_38px_rgba(176,64,70,0.16)]" />
              <div className="min-w-0 flex-1">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[9px] border border-[var(--gov-red-line)] bg-white px-4 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:bg-[var(--gov-red-soft)]">
                  <FileUp size={14} />
                  上传 Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => handleLogoUpload(event.target.files?.[0])} />
                </label>
                <p className="mt-2 text-[11px] leading-5 text-[#98a2b3]">建议上传正方形 PNG/JPG，原型会保存到浏览器本地。</p>
              </div>
            </div>
          </div>
          <Field label="产品名称" required>
            <input value={appearanceDraft.productName} onChange={(event) => setAppearanceDraft({ ...appearanceDraft, productName: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="例如：金山文澜智能创作平台" />
          </Field>
          <Field label="首页标语" required>
            <textarea value={appearanceDraft.slogan} onChange={(event) => setAppearanceDraft({ ...appearanceDraft, slogan: event.target.value })} className="gov-input min-h-[108px] w-full resize-none px-3 py-3 text-[13px] leading-6" placeholder="例如：一步开启高效公文写作新体验" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetAppearance} className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#596170] transition hover:bg-[#f7f8fa]">
              <RefreshCw size={14} />
              恢复默认
            </button>
            <button className="gov-button-primary inline-flex h-10 items-center gap-2 px-5 text-[12px] font-semibold">
              <Save size={14} />
              保存外观
            </button>
          </div>
        </div>
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#fff,#fff7f6_44%,#f7f8ff)] p-6">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[rgba(225,61,78,0.08)] blur-3xl" />
          <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full border border-[rgba(225,61,78,0.14)]" />
          <div className="relative flex min-h-[420px] items-center justify-center">
            <div className="w-full max-w-[760px] rounded-[22px] border border-white/80 bg-white/82 p-8 shadow-[0_26px_80px_rgba(15,23,42,0.10)] backdrop-blur">
              <div className="flex items-center gap-3">
                <img src={resolvePublicAssetUrl(appearanceDraft.logoUrl)} alt="首页 Logo" className="h-14 w-14 rounded-[17px] object-cover shadow-[0_12px_30px_rgba(176,64,70,0.14)]" />
                <div>
                  <p className="text-[16px] font-bold text-[#202124]">{appearanceDraft.productName || DEFAULT_HOME_APPEARANCE.productName}</p>
                  <p className="mt-1 text-[12px] text-[#98a2b3]">首页品牌预览</p>
                </div>
              </div>
              <div className="mt-10 text-center">
                <img src={resolvePublicAssetUrl(appearanceDraft.logoUrl)} alt="首页主 Logo" className="mx-auto h-20 w-20 rounded-[22px] border border-white object-cover shadow-[0_18px_38px_rgba(176,64,70,0.18)]" />
                <h2 className="mt-6 text-[30px] font-semibold leading-tight tracking-normal text-[#202124]">
                  全能助手，<span className="text-[var(--gov-red-deep)]">{appearanceDraft.slogan || DEFAULT_HOME_APPEARANCE.slogan}</span>
                </h2>
                <div className="mx-auto mt-8 h-28 max-w-[620px] rounded-[18px] border border-black/[0.06] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

type RolePermissionNode = {
  id: string;
  label: string;
  description?: string;
  children?: RolePermissionNode[];
};

type RoleUserPrincipal = {
  id: string;
  type: 'all' | 'department' | 'user';
  name: string;
  meta: string;
  account?: string;
  org?: string;
  children?: RoleUserPrincipal[];
};

const rolePermissionTree: RolePermissionNode[] = [
  {
    id: '工作台',
    label: '工作台',
    description: '前台办公入口',
    children: [
      { id: '首页', label: '首页', children: [{ id: '首页-新建任务', label: '新建任务按钮' }, { id: '首页-添加参考文档', label: '添加参考文档按钮' }] },
      { id: '智能公文', label: '智能公文', children: [{ id: 'AI写作', label: 'AI写作菜单' }, { id: 'AI仿写', label: 'AI仿写菜单' }, { id: 'AI润色', label: 'AI润色菜单' }, { id: '智能排版', label: '智能排版菜单' }, { id: '智能校对', label: '智能校对菜单' }] },
      { id: '知识库', label: '知识库', children: [{ id: '知识库-新建', label: '新建文件/文件夹' }, { id: '知识库-导入', label: '导入文件' }, { id: '知识库-设置权限', label: '设置权限' }, { id: '知识库-下载', label: '下载' }] },
      { id: '专家管理', label: '专家管理', children: [{ id: '专家管理-召唤专家', label: '召唤专家' }] },
    ],
  },
  {
    id: '后台管理',
    label: '后台管理',
    description: '后台配置入口',
    children: [
      { id: '用户管理', label: '用户与组织', children: [{ id: '用户管理-新增用户', label: '新增用户' }, { id: '用户管理-重置密码', label: '重置密码' }, { id: '用户管理-启停用', label: '启用/停用用户' }, { id: '组织管理-新增部门', label: '新增部门' }] },
      { id: '角色管理', label: '角色管理', children: [{ id: '角色管理-新增角色', label: '新增角色' }, { id: '角色管理-添加用户', label: '添加用户' }, { id: '角色管理-启停用', label: '启用/停用角色' }] },
      { id: '菜单管理', label: '菜单管理', children: [{ id: '菜单管理-新增菜单', label: '新增菜单' }, { id: '菜单管理-编辑菜单', label: '编辑菜单' }, { id: '菜单管理-排序', label: '调整排序' }] },
      { id: '外观管理', label: '外观管理', children: [{ id: '外观管理-保存', label: '保存首页外观' }, { id: '外观管理-上传logo', label: '上传首页Logo' }] },
      { id: '模型管理', label: '模型管理', children: [{ id: '模型管理-接入模型', label: '接入模型' }, { id: '模型管理-连通性测试', label: '连通性测试' }, { id: '模型管理-启停用', label: '启用/停用模型' }] },
      { id: '智能体管理', label: '智能体管理', children: [{ id: '智能体管理-新建智能体', label: '新建智能体' }, { id: '智能体管理-设置权限', label: '设置权限' }] },
      { id: '文库管理', label: '文库管理' },
      { id: '写作场景管理', label: '写作场景管理', children: [{ id: '写作场景管理-新增一级场景', label: '新增一级场景' }, { id: '写作场景管理-新增子场景', label: '新增子场景' }] },
      { id: '提示词管理', label: '提示词管理', children: [{ id: '提示词管理-新增版本', label: '新增提示词版本' }, { id: '提示词管理-编辑版本', label: '编辑提示词版本' }] },
      { id: '套红管理', label: '套红管理' },
    ],
  },
];

const roleUserPermissionTree: RoleUserPrincipal[] = [
  {
    id: 'all',
    type: 'all',
    name: '全部',
    meta: '全部部门与用户',
    children: [
      {
        id: 'dept-office',
        type: 'department',
        name: '办公室',
        meta: '一级部门 · 12 人',
        children: [
          { id: 'dept-secretary', type: 'department', name: '综合文秘科', meta: '二级部门 · 5 人', children: [{ id: 'user-zhangsan', type: 'user', name: '张三', meta: '综合文秘', account: 'zhangsan', org: '综合文秘科' }, { id: 'user-zhouxiaolan', type: 'user', name: '周晓兰', meta: '材料专员', account: 'zhouxl', org: '综合文秘科' }] },
          { id: 'dept-meeting', type: 'department', name: '会议服务科', meta: '二级部门 · 7 人', children: [{ id: 'user-chenchen', type: 'user', name: '陈晨', meta: '会议纪要', account: 'chenchen', org: '会议服务科' }] },
        ],
      },
      { id: 'dept-policy', type: 'department', name: '政策研究室', meta: '一级部门 · 8 人', children: [{ id: 'user-limin', type: 'user', name: '李敏', meta: '政策专员', account: 'limin', org: '政策研究室' }] },
      { id: 'dept-legal', type: 'department', name: '法律合规中心', meta: '一级部门 · 16 人', children: [{ id: 'user-wangqiang', type: 'user', name: '王强', meta: '法务专员', account: 'wangqiang', org: '法律合规中心' }] },
      { id: 'dept-ops', type: 'department', name: '信创平台运维中心', meta: '一级部门 · 9 人', children: [{ id: 'user-sysadmin', type: 'user', name: '系统管理员', meta: '平台运维', account: 'sysadmin', org: '信创平台运维中心' }, { id: 'user-platformadmin', type: 'user', name: '平台管理员', meta: '平台运维', account: 'platform_admin', org: '信创平台运维中心' }] },
    ],
  },
];

function RoleManagementPanel() {
  const [roles, setRoles] = useState<AdminRoleRecord[]>(initialRoleRecords);
  const [roleUsers, setRoleUsers] = useState<RoleBoundUser[]>(initialRoleBoundUsers);
  const [roleSearch, setRoleSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberOrgFilter, setMemberOrgFilter] = useState('全部部门');
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleRecords[0]?.id ?? '');
  const [roleDraft, setRoleDraft] = useState<AdminRoleRecord | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [rolePendingDelete, setRolePendingDelete] = useState<AdminRoleRecord | null>(null);
  const [expandedPermissionIds, setExpandedPermissionIds] = useState<Set<string>>(() => new Set(['工作台', '后台管理', '智能公文', '用户管理', '角色管理']));
  const [showRoleUserPicker, setShowRoleUserPicker] = useState(false);
  const [roleUserSelectedIds, setRoleUserSelectedIds] = useState<Set<string>>(new Set(['dept-secretary', 'user-zhangsan', 'user-zhouxiaolan']));
  const [roleUserExpandedIds, setRoleUserExpandedIds] = useState<Set<string>>(new Set(['all', 'dept-office', 'dept-secretary']));

  const filteredRoles = roles.filter((role) => `${role.name} ${role.scope}`.toLowerCase().includes(roleSearch.trim().toLowerCase()));
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? filteredRoles[0] ?? roles[0];
  const orgOptions = ['全部部门', ...Array.from(new Set(roleUsers.map((item) => item.org)))];
  const selectedRoleUsers = roleUsers.filter((item) => {
    const matchRole = item.roleId === selectedRole?.id;
    const matchKeyword = `${item.name} ${item.account}`.toLowerCase().includes(memberSearch.trim().toLowerCase());
    const matchOrg = memberOrgFilter === '全部部门' || item.org === memberOrgFilter;
    return matchRole && matchKeyword && matchOrg;
  });
  const openRoleEditor = (role?: AdminRoleRecord) => {
    setEditingRoleId(role?.id ?? null);
    setRoleDraft(role ? { ...role, permissions: [...role.permissions] } : { id: `role-${Date.now()}`, name: '', code: `role_${Date.now()}`, scope: '', members: 0, status: '已启用', permissions: [] });
  };
  const saveRoleDraft = (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleDraft?.name.trim()) return;
    const normalizedDraft = { ...roleDraft, code: roleDraft.code || `role_${Date.now()}` };
    setRoles((items) => editingRoleId ? items.map((item) => item.id === editingRoleId ? normalizedDraft : item) : [normalizedDraft, ...items]);
    if (!editingRoleId) setSelectedRoleId(roleDraft.id);
    setRoleDraft(null);
    setEditingRoleId(null);
  };
  const deleteRole = (role: AdminRoleRecord) => {
    if (role.builtin || role.status !== '已停用') return;
    const nextRoles = roles.filter((item) => item.id !== role.id);
    setRoles(nextRoles);
    setRoleUsers((items) => items.filter((item) => item.roleId !== role.id));
    if (selectedRoleId === role.id) setSelectedRoleId(nextRoles[0]?.id ?? '');
    setRolePendingDelete(null);
  };
  const collectRolePermissionIds = (node: RolePermissionNode): string[] => [
    node.id,
    ...(node.children?.flatMap(collectRolePermissionIds) ?? []),
  ];
  const togglePermission = (node: RolePermissionNode) => {
    if (!roleDraft) return;
    const ids = collectRolePermissionIds(node);
    const allSelected = ids.every((id) => roleDraft.permissions.includes(id));
    setRoleDraft({
      ...roleDraft,
      permissions: allSelected
        ? roleDraft.permissions.filter((item) => !ids.includes(item))
        : Array.from(new Set([...roleDraft.permissions, ...ids]))
    });
  };
  const collectRoleUserIds = (node: RoleUserPrincipal): string[] => [
    node.id,
    ...(node.children?.flatMap(collectRoleUserIds) ?? []),
  ];
  const findRoleUserNode = (nodes: RoleUserPrincipal[], id: string): RoleUserPrincipal | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = node.children ? findRoleUserNode(node.children, id) : null;
      if (found) return found;
    }
    return null;
  };
  const selectedRoleUserNodes = (nodes: RoleUserPrincipal[], ancestorSelected = false): RoleUserPrincipal[] => nodes.flatMap((node) => {
    const selected = roleUserSelectedIds.has(node.id);
    if (selected && !ancestorSelected) return [node];
    return node.children ? selectedRoleUserNodes(node.children, ancestorSelected || selected) : [];
  });
  const flattenRoleUserLeaves = (nodes: RoleUserPrincipal[]): RoleUserPrincipal[] => nodes.flatMap((node) => node.type === 'user' ? [node] : flattenRoleUserLeaves(node.children ?? []));
  const toggleRoleUserPrincipal = (id: string) => {
    const target = findRoleUserNode(roleUserPermissionTree, id);
    if (!target) return;
    const ids = collectRoleUserIds(target);
    setRoleUserSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = ids.every((itemId) => next.has(itemId));
      ids.forEach((itemId) => {
        allSelected ? next.delete(itemId) : next.add(itemId);
      });
      return next;
    });
  };
  const saveRoleUsers = () => {
    if (!selectedRole) return;
    const selectedLeaves = flattenRoleUserLeaves(roleUserPermissionTree).filter((node) => roleUserSelectedIds.has(node.id));
    setRoleUsers((items) => [
      ...items.filter((item) => item.roleId !== selectedRole.id),
      ...selectedLeaves.map((node) => ({
        id: `${selectedRole.id}-${node.id}`,
        roleId: selectedRole.id,
        name: node.name,
        account: node.account ?? node.id,
        org: node.org ?? '未分配部门',
        permissionScope: selectedRole.scope || selectedRole.name,
        status: '启用' as const,
      })),
    ]);
    setRoles((items) => items.map((item) => item.id === selectedRole.id ? { ...item, members: selectedLeaves.length } : item));
    setShowRoleUserPicker(false);
  };
  const renderRolePermissionNode = (node: RolePermissionNode, depth = 0): React.ReactNode => {
    if (!roleDraft) return null;
    const childIds = collectRolePermissionIds(node);
    const selected = roleDraft.permissions.includes(node.id);
    const partiallySelected = !selected && childIds.some((id) => roleDraft.permissions.includes(id));
    const hasChildren = Boolean(node.children?.length);
    const expanded = expandedPermissionIds.has(node.id);
    return (
      <div key={node.id} className="space-y-1">
        <button type="button" onClick={() => togglePermission(node)} className={`flex w-full items-center gap-3 rounded-[9px] border px-3 py-2.5 text-left transition ${selected ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/65' : partiallySelected ? 'border-[#f2c3c9] bg-[#fff8f8]' : 'border-black/[0.06] bg-white hover:border-black/[0.12] hover:bg-[#fafafa]'}`} style={{ paddingLeft: 12 + depth * 18 }}>
          {hasChildren ? <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setExpandedPermissionIds((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }); }} onKeyDown={(event) => { if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault(); event.stopPropagation(); setExpandedPermissionIds((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }); }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[#98a2b3] hover:bg-white hover:text-[#344054]"><ChevronRight size={14} className={`transition ${expanded ? 'rotate-90' : ''}`} /></span> : <span className="h-6 w-6 shrink-0" />}
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border text-[11px] ${selected ? 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white' : partiallySelected ? 'border-[var(--gov-red-line)] bg-white text-[var(--gov-red)]' : 'border-[#d0d5dd] bg-white text-transparent'}`}>{selected ? '✓' : '•'}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#202124]">{node.label}</span>{node.description ? <span className="mt-0.5 block truncate text-[11px] text-[#98a2b3]">{node.description}</span> : null}</span>
        </button>
        {hasChildren && expanded ? <div className="space-y-1">{node.children!.map((child) => renderRolePermissionNode(child, depth + 1))}</div> : null}
      </div>
    );
  };
  const renderRoleUserNode = (node: RoleUserPrincipal, depth = 0): React.ReactNode => {
    const childIds = collectRoleUserIds(node);
    const selected = roleUserSelectedIds.has(node.id);
    const partiallySelected = !selected && childIds.some((itemId) => roleUserSelectedIds.has(itemId));
    const hasChildren = Boolean(node.children?.length);
    const expanded = roleUserExpandedIds.has(node.id);
    return (
      <div key={node.id} className="space-y-1">
        <button type="button" onClick={() => toggleRoleUserPrincipal(node.id)} className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition ${selected ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)]/60' : partiallySelected ? 'border-[#f2c3c9] bg-[#fff8f8]' : 'border-black/[0.06] bg-white hover:border-black/[0.12] hover:bg-[#fafafa]'}`} style={{ paddingLeft: 12 + depth * 18 }}>
          {hasChildren ? <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setRoleUserExpandedIds((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }); }} onKeyDown={(event) => { if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault(); event.stopPropagation(); setRoleUserExpandedIds((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }); }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[#98a2b3] hover:bg-white hover:text-[#344054]"><ChevronRight size={14} className={`transition ${expanded ? 'rotate-90' : ''}`} /></span> : <span className="h-6 w-6 shrink-0" />}
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${node.type === 'user' ? 'bg-[#fff1f0] text-[var(--gov-red)]' : node.type === 'all' ? 'bg-[#202124] text-white' : 'bg-[#eef4ff] text-[#3b63d9]'}`}>{node.type === 'user' ? <UserRound size={15} /> : node.type === 'all' ? <Globe2 size={15} /> : <Building2 size={15} />}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#202124]">{node.name}</span><span className="mt-0.5 block truncate text-[11px] text-[#98a2b3]">{node.meta}</span></span>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${selected ? 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white' : partiallySelected ? 'border-[var(--gov-red-line)] bg-white text-[var(--gov-red)]' : 'border-[#d0d5dd] text-transparent'}`}>{selected ? '✓' : '•'}</span>
        </button>
        {hasChildren && expanded ? <div className="space-y-1">{node.children!.map((child) => renderRoleUserNode(child, depth + 1))}</div> : null}
      </div>
    );
  };

  return (
    <div className="ai-admin-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-black/[0.06] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-[#202124]">角色管理</h3>
          <p className="mt-1.5 text-[13px] text-[#667085]">维护后台与工作台的角色、权限项，并查看角色已绑定用户。</p>
        </div>
        <button type="button" onClick={() => openRoleEditor()} className="gov-button-primary inline-flex h-10 items-center gap-2 px-4 text-[13px] font-semibold">
          <PlusCircle size={15} />
          新增角色
        </button>
      </div>
      <div className="grid min-h-[620px] grid-cols-[280px_minmax(0,1fr)] bg-white">
        <aside className="border-r border-black/[0.06] bg-[#fbfbfc] p-4">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
            <input value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} className="gov-input h-11 w-full pl-10 pr-3 text-[13px]" placeholder="搜索角色" />
          </div>
          <div className="mt-4 space-y-1.5">
            {filteredRoles.map((role) => {
              const active = role.id === selectedRole?.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`group flex w-full items-center justify-between rounded-[10px] px-3 py-3 text-left transition ${active ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red-deep)] shadow-[0_10px_24px_rgba(210,47,63,0.08)]' : 'text-[#344054] hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,0.05)]'}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold">{role.name}</span>
                    <span className={`mt-1 block truncate text-[11px] ${active ? 'text-[var(--gov-red)]' : 'text-[#98a2b3]'}`}>{role.members} 人 · {role.status}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
        <section className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-black/[0.06] px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="text-[17px] font-bold text-[#202124]">{selectedRole?.name ?? '角色详情'}</h4>
                {selectedRole ? <Status tone={selectedRole.status === '已启用' ? 'success' : 'warning'}>{selectedRole.status}</Status> : null}
                {selectedRole?.builtin ? <span className="rounded-full bg-[#f0f2f5] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">系统内置</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => selectedRole && openRoleEditor(selectedRole)} className="inline-flex h-9 items-center rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[var(--gov-red-deep)]">编辑角色</button>
              <button type="button" disabled={!selectedRole} onClick={() => selectedRole && setRoles((items) => items.map((item) => item.id === selectedRole.id ? { ...item, status: item.status === '已启用' ? '已停用' : '已启用' } : item))} className="inline-flex h-9 items-center rounded-[8px] border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50">{selectedRole?.status === '已启用' ? '停用角色' : '启用角色'}</button>
              <button
                type="button"
                disabled={!selectedRole || selectedRole.builtin || selectedRole.status !== '已停用'}
                onClick={() => selectedRole && setRolePendingDelete(selectedRole)}
                title={selectedRole?.builtin ? '系统内置角色不能删除' : selectedRole?.status === '已启用' ? '启用中的角色请先停用后删除' : '删除角色'}
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#f4c7cc] bg-white px-3 text-[12px] font-semibold text-[#d92d20] transition hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:border-black/[0.08] disabled:text-[#c5cad3] disabled:hover:bg-white"
              >
                <Trash2 size={14} />
                删除角色
              </button>
              <button type="button" onClick={() => setShowRoleUserPicker(true)} className="gov-button-primary inline-flex h-9 items-center gap-1.5 px-3 text-[12px] font-semibold"><PlusCircle size={14} />添加用户</button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] bg-[#fbfbfc] px-6 py-4">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#667085]">
              姓名/账号
              <input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} className="gov-input h-10 w-[220px] px-3 text-[13px]" placeholder="请输入姓名/账号" />
            </label>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#667085]">
              所属部门
              <select value={memberOrgFilter} onChange={(event) => setMemberOrgFilter(event.target.value)} className="gov-input h-10 w-[190px] px-3 text-[13px]">
                {orgOptions.map((org) => <option key={org}>{org}</option>)}
              </select>
            </label>
            <button type="button" className="gov-button-primary h-10 px-4 text-[12px] font-semibold">搜索</button>
            <button type="button" onClick={() => { setMemberSearch(''); setMemberOrgFilter('全部部门'); }} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#344054]">重置</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[13px]">
              <thead className="bg-[#f7f8fa] text-[12px] text-[#667085]">
                <tr><th className="p-4">姓名</th><th className="p-4">账号</th><th className="p-4">部门</th><th className="p-4 text-right">操作</th></tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {selectedRoleUsers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#fbfbfc]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#fff1f0] to-[#ffe4e7] text-[12px] font-bold text-[var(--gov-red-deep)] shadow-[0_6px_16px_rgba(210,47,63,0.12)]">{member.name.slice(-2)}</span>
                        <span className="font-semibold text-[#202124]">{member.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[12px] text-[#667085]">{member.account}</td>
                    <td className="p-4 text-[#667085]">{member.org}</td>
                    <td className="p-4 text-right">
                      <button type="button" onClick={() => setRoleUsers((items) => items.filter((item) => item.id !== member.id))} className="text-[12px] font-semibold text-[#d92d20]">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!selectedRoleUsers.length ? <div className="py-16 text-center text-[13px] text-[#98a2b3]">当前角色暂无绑定用户</div> : null}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-black/[0.06] px-6 py-4 text-[12px] text-[#667085]">
            共 {selectedRoleUsers.length} 条
            <button className="h-8 w-8 rounded-[7px] border border-black/[0.08] text-[#98a2b3]">‹</button>
            <button className="h-8 w-8 rounded-[7px] bg-[var(--gov-red)] text-white">1</button>
            <button className="h-8 w-8 rounded-[7px] border border-black/[0.08] text-[#98a2b3]">›</button>
          </div>
        </section>
      </div>
      <AnimatePresence>
        {roleDraft ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setRoleDraft(null)}>
            <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} onSubmit={saveRoleDraft} className="w-full max-w-[760px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
                <div><h3 className="text-[17px] font-bold text-[#202124]">{editingRoleId ? '编辑角色' : '新增角色'}</h3><p className="mt-1 text-[12px] text-[#667085]">配置角色基础信息、菜单权限和按钮权限。</p></div>
                <button type="button" onClick={() => setRoleDraft(null)}><X size={18} /></button>
              </div>
              <div className="px-6 py-6">
                <Field label="角色名称" required><input value={roleDraft.name} onChange={(event) => setRoleDraft({ ...roleDraft, name: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" /></Field>
              </div>
              <div className="border-t border-black/[0.06] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-bold text-[#344054]">角色权限</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#98a2b3]">包含模块菜单和按钮操作权限。带子级的权限可展开后精细勾选。</p>
                  </div>
                  <span className="rounded-full bg-[var(--gov-red-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--gov-red)]">{roleDraft.permissions.length} 项已选</span>
                </div>
                <div className="mt-3 max-h-[360px] space-y-1 overflow-auto rounded-[12px] border border-black/[0.06] bg-[#fbfbfc] p-3">
                  {rolePermissionTree.map((node) => renderRolePermissionNode(node))}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4">
                <button type="button" onClick={() => setRoleDraft(null)} className="h-10 rounded-[8px] border border-black/[0.08] px-5 text-[12px] font-semibold">取消</button>
                <button className="gov-button-primary h-10 px-5 text-[12px] font-semibold">保存</button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
        {rolePendingDelete ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setRolePendingDelete(null)}>
            <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} className="w-full max-w-[460px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
              <div className="border-b border-black/[0.06] px-6 py-5">
                <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#fff1f0] px-3 text-[12px] font-bold text-[#d92d20]"><Trash2 size={14} />删除确认</div>
                <h3 className="mt-3 text-[18px] font-bold text-[#202124]">删除角色</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#667085]">确定删除“{rolePendingDelete.name}”吗？删除后该角色的用户绑定关系也会同步移除。</p>
              </div>
              <div className="flex justify-end gap-2 bg-[#fbfbfc] px-6 py-4">
                <button type="button" onClick={() => setRolePendingDelete(null)} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#596170] hover:bg-[#f7f8fa]">取消</button>
                <button type="button" onClick={() => deleteRole(rolePendingDelete)} className="h-10 rounded-[8px] bg-[#d92d20] px-5 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(217,45,32,0.20)] transition hover:brightness-105">确认删除</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showRoleUserPicker && selectedRole ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <motion.div initial={{ y: 18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.98 }} className="w-full max-w-3xl overflow-hidden rounded-[14px] border border-black/[0.08] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.2)]">
              <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-[15px] font-bold text-[#202124]"><ShieldCheck size={17} className="text-[var(--gov-red)]" />添加角色用户</div>
                  <p className="mt-1 text-[12px] text-[#667085]">角色：{selectedRole.name}</p>
                </div>
                <button type="button" onClick={() => setShowRoleUserPicker(false)} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f5f5f5]"><X size={17} /></button>
              </div>
              <div className="grid min-h-[430px] grid-cols-[1.15fr_0.85fr]">
                <div className="border-r border-black/[0.06] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#344054]">部门用户列表</p>
                    <span className="rounded-full bg-[var(--gov-red-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--gov-red-deep)]">勾选后绑定</span>
                  </div>
                  <div className="max-h-[355px] space-y-1 overflow-auto pr-1">
                    {roleUserPermissionTree.map((node) => renderRoleUserNode(node))}
                  </div>
                </div>
                <div className="bg-[#fbfbfc] p-5">
                  <p className="text-[13px] font-bold text-[#344054]">已选用户 / 部门</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#98a2b3]">保存后，所选用户将绑定到该角色，并继承该角色的菜单与按钮权限。</p>
                  <div className="mt-4 space-y-2">
                    {selectedRoleUserNodes(roleUserPermissionTree).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-[9px] border border-black/[0.06] bg-white px-3 py-2.5">
                        <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#344054]">{item.name}</p><p className="mt-0.5 truncate text-[10px] text-[#98a2b3]">{item.type === 'all' ? '全部用户' : item.type === 'department' ? '部门（含下级用户）' : item.meta}</p></div>
                        <button type="button" onClick={() => toggleRoleUserPrincipal(item.id)} className="rounded-[6px] p-1 text-[#98a2b3] hover:bg-[#fff1f0] hover:text-[#d92d20]"><X size={13} /></button>
                      </div>
                    ))}
                    {roleUserSelectedIds.size === 0 ? <div className="rounded-[10px] border border-dashed border-black/[0.12] bg-white p-6 text-center text-[12px] text-[#98a2b3]">尚未选择用户或部门</div> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] bg-white px-5 py-4">
                <button type="button" onClick={() => setShowRoleUserPicker(false)} className="h-9 rounded-[8px] border border-black/[0.08] px-4 text-[12px] font-semibold text-[#596170] hover:bg-[#f5f5f5]">取消</button>
                <button type="button" onClick={saveRoleUsers} className="h-9 rounded-[8px] bg-[var(--gov-red)] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(225,61,78,0.22)]">保存</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuManagementPanel() {
  const [menus, setMenus] = useState<AdminMenuRecord[]>(initialMenuRecords);
  const [menuSearch, setMenuSearch] = useState('');
  const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(() => new Set(['menu-home', 'menu-doc', 'menu-write', 'menu-polish', 'menu-knowledge', 'menu-admin', 'menu-admin-user', 'menu-admin-role']));
  const [menuEditor, setMenuEditor] = useState<{ mode: 'create' | 'edit'; parentId?: string; menuId?: string } | null>(null);
  const [menuDraft, setMenuDraft] = useState<AdminMenuRecord | null>(null);
  const defaultIconUrl = DEFAULT_PRODUCT_ICON_URL;

  const openMenuEditor = (mode: 'create' | 'edit', menu?: AdminMenuRecord, parentId?: string) => {
    setMenuEditor({ mode, menuId: menu?.id, parentId });
    const stamp = Date.now();
    const siblingSortOrders = menus.filter((item) => item.parentId === parentId).map((item) => item.sortOrder ?? 0);
    const nextSortOrder = siblingSortOrders.length ? Math.max(...siblingSortOrders) + 10 : 10;
    setMenuDraft(menu ? { ...menu, resourceType: menu.resourceType ?? '菜单', sortOrder: menu.sortOrder ?? 10, iconUrl: menu.iconUrl ?? defaultIconUrl } : { id: `menu-${stamp}`, parentId, name: '', code: `resource_${stamp}`, path: '', visibleRange: '管理员可见', status: '已启用', resourceType: '菜单', sortOrder: nextSortOrder, iconUrl: defaultIconUrl, componentName: '', createdAt: '2026-07-28 14:30' });
  };
  const handleMenuIconUpload = (file?: File) => {
    if (!file || !menuDraft) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMenuDraft((current) => current ? { ...current, iconUrl: reader.result as string } : current);
      }
    };
    reader.readAsDataURL(file);
  };
  const saveMenuDraft = (event: React.FormEvent) => {
    event.preventDefault();
    if (!menuDraft?.name.trim()) return;
    const normalizedDraft = {
      ...menuDraft,
      code: menuDraft.code || `resource_${Date.now()}`,
      path: menuDraft.path || (menuDraft.resourceType === '按钮' ? 'action:custom' : '/custom'),
      visibleRange: menuDraft.visibleRange || '管理员可见',
      status: menuDraft.status || '已启用',
      resourceType: menuDraft.resourceType ?? '菜单',
      sortOrder: Number.isFinite(Number(menuDraft.sortOrder)) ? Number(menuDraft.sortOrder) : 10,
      iconUrl: menuDraft.resourceType === '菜单' ? (menuDraft.iconUrl || defaultIconUrl) : undefined,
      componentName: menuDraft.resourceType === '菜单' ? (menuDraft.componentName || '-') : '-',
      createdAt: menuDraft.createdAt || '2026-07-28 14:30',
    };
    setMenus((items) => menuEditor?.mode === 'edit' ? items.map((item) => item.id === menuEditor.menuId ? normalizedDraft : item) : [...items, normalizedDraft]);
    if (menuDraft.parentId) setExpandedMenuIds((current) => new Set(current).add(menuDraft.parentId!));
    setMenuDraft(null);
    setMenuEditor(null);
  };
  const filteredMenus = menus.filter((menu) => `${menu.name} ${menu.path} ${menu.resourceType ?? '菜单'} ${menu.sortOrder ?? ''}`.toLowerCase().includes(menuSearch.trim().toLowerCase()));
  const renderMenuRows = (parentId?: string, depth = 0): React.ReactNode[] => filteredMenus
    .filter((menu) => menu.parentId === parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'zh-Hans-CN'))
    .flatMap((menu) => {
      const children = menus.filter((item) => item.parentId === menu.id);
      const expanded = expandedMenuIds.has(menu.id);
      const type = menu.resourceType ?? '菜单';
      const row = (
        <tr key={menu.id} className="group hover:bg-[#fbfbfc]">
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
              {children.length > 0 ? (
                <button type="button" onClick={() => setExpandedMenuIds((current) => { const next = new Set(current); next.has(menu.id) ? next.delete(menu.id) : next.add(menu.id); return next; })} className="flex h-6 w-6 items-center justify-center rounded-[6px] hover:bg-[#f2f4f7]">
                  <ChevronRight size={14} className={`text-[#667085] transition ${expanded ? 'rotate-90' : ''}`} />
                </button>
              ) : <span className="h-6 w-6" />}
              <span className="font-semibold text-[#202124]">{menu.name}</span>
            </div>
          </td>
          <td className="px-4 py-3.5">
            {type === '菜单' ? (
              <img src={menu.iconUrl || defaultIconUrl} alt={`${menu.name}图标`} className="h-8 w-8 rounded-[9px] border border-black/[0.06] object-cover shadow-[0_6px_14px_rgba(15,23,42,0.06)]" />
            ) : (
              <span className="text-[12px] text-[#c5cad3]">-</span>
            )}
          </td>
          <td className="px-4 py-3.5 text-[#344054]">{type}</td>
          <td className="px-4 py-3.5 font-mono text-[12px] text-[#667085]">{type === '按钮' ? '-' : menu.path}</td>
          <td className="px-4 py-3.5 text-[#667085]">{menu.createdAt || '-'}</td>
          <td className="px-4 py-3.5 text-[#667085]">{menu.sortOrder ?? 0}</td>
          <td className="px-4 py-3.5 text-right">
            {type === '菜单' ? <button type="button" onClick={() => openMenuEditor('create', undefined, menu.id)} className="mr-4 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:text-[var(--gov-red)]">新增子菜单</button> : null}
            <button type="button" onClick={() => openMenuEditor('edit', menu)} className="mr-4 text-[12px] font-semibold text-[var(--gov-red-deep)] transition hover:text-[var(--gov-red)]">编辑</button>
            <button type="button" disabled={children.length > 0} onClick={() => setMenus((items) => items.filter((item) => item.id !== menu.id))} className="text-[12px] font-semibold text-[#d92d20] disabled:cursor-not-allowed disabled:text-[#c5cad3]">删除</button>
          </td>
        </tr>
      );
      return expanded ? [row, ...renderMenuRows(menu.id, depth + 1)] : [row];
    });

  return (
    <div className="ai-admin-card overflow-hidden bg-white">
      <div className="flex flex-col gap-4 border-b border-black/[0.06] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-[#202124]">菜单管理</h3>
          <p className="mt-1.5 text-[13px] text-[#667085]">维护平台菜单、按钮节点和展示图标，支持树形层级与排序调整。</p>
        </div>
        <button type="button" onClick={() => openMenuEditor('create')} className="gov-button-primary inline-flex h-10 items-center gap-2 px-5 text-[13px] font-semibold">
          <PlusCircle size={15} />
          新增
        </button>
      </div>
      <div className="flex flex-col gap-3 border-b border-black/[0.06] bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#344054]">
            菜单名称
            <input value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} className="gov-input h-10 w-[240px] px-3 text-[13px]" placeholder="请输入菜单名称" />
          </label>
          <button type="button" className="gov-button-primary h-10 px-5 text-[12px] font-semibold shadow-[0_8px_18px_rgba(230,76,88,0.18)]">查询</button>
          <button type="button" onClick={() => setMenuSearch('')} className="h-10 rounded-[8px] border border-black/[0.08] bg-white px-5 text-[12px] font-semibold text-[#344054] transition hover:bg-[#f7f8fa]">重置</button>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#98a2b3]">
          共 {filteredMenus.length} 项
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-[13px]">
          <thead className="bg-[#f7f8fa] text-[12px] text-[#667085]">
            <tr><th className="px-4 py-3.5">菜单名称</th><th className="px-4 py-3.5">图标</th><th className="px-4 py-3.5">菜单类型</th><th className="px-4 py-3.5">路由地址</th><th className="px-4 py-3.5">创建时间</th><th className="px-4 py-3.5">排序</th><th className="px-4 py-3.5 text-right">操作</th></tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">{renderMenuRows()}</tbody>
        </table>
      </div>
      <AnimatePresence>
        {menuDraft ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-5" onClick={() => setMenuDraft(null)}>
            <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} onSubmit={saveMenuDraft} className="w-full max-w-[720px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
                <div><h3 className="text-[17px] font-bold text-[#202124]">{menuEditor?.mode === 'edit' ? '编辑菜单' : '新增菜单'}</h3><p className="mt-1 text-[12px] text-[#667085]">{menuDraft.parentId ? '当前将创建为下级菜单或按钮。' : '配置菜单层级、图标和路由信息。'}</p></div>
                <button type="button" onClick={() => setMenuDraft(null)}><X size={18} /></button>
              </div>
              <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
                <Field label="父级菜单">
                  <select value={menuDraft.parentId ?? ''} onChange={(event) => setMenuDraft({ ...menuDraft, parentId: event.target.value || undefined })} className="gov-input h-11 w-full px-3 text-[13px]">
                    <option value="">无，作为根菜单</option>
                    {menus.filter((item) => (item.resourceType ?? '菜单') === '菜单' && item.id !== menuDraft.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="菜单类型" required>
                  <div className="flex h-11 items-center gap-6 text-[13px]">
                    {(['菜单', '按钮'] as const).map((type) => (
                      <label key={type} className="inline-flex cursor-pointer items-center gap-2 font-semibold text-[#344054]">
                        <input type="radio" className="accent-[var(--gov-red)]" checked={(menuDraft.resourceType ?? '菜单') === type} onChange={() => setMenuDraft({ ...menuDraft, resourceType: type, path: type === '按钮' ? '' : '/', iconUrl: type === '菜单' ? (menuDraft.iconUrl || defaultIconUrl) : undefined })} />
                        {type}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="菜单名称" required><input value={menuDraft.name} onChange={(event) => setMenuDraft({ ...menuDraft, name: event.target.value })} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="例如：工作台 / 查看" /></Field>
                {(menuDraft.resourceType ?? '菜单') === '菜单' ? (
                  <Field label="菜单图标">
                    <div className="flex items-center gap-3">
                      <img src={menuDraft.iconUrl || defaultIconUrl} alt="菜单图标预览" className="h-11 w-11 rounded-[11px] border border-black/[0.06] object-cover shadow-[0_8px_20px_rgba(15,23,42,0.08)]" />
                      <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[8px] border border-black/[0.08] bg-white px-4 text-[12px] font-semibold text-[#344054] transition hover:bg-[#f7f8fa]">
                        <FileUp size={14} />
                        上传图片
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => handleMenuIconUpload(event.target.files?.[0])} />
                      </label>
                    </div>
                  </Field>
                ) : (
                  <Field label="菜单图标"><div className="flex h-11 items-center rounded-[8px] border border-black/[0.08] bg-[#fbfbfc] px-3 text-[13px] text-[#98a2b3]">按钮类型无需上传图标</div></Field>
                )}
                {(menuDraft.resourceType ?? '菜单') === '菜单' ? (
                  <Field label="路由地址">
                    <input value={menuDraft.path} onChange={(event) => setMenuDraft({ ...menuDraft, path: event.target.value })} className="gov-input h-11 w-full px-3 font-mono text-[13px]" placeholder="/admin/users" />
                  </Field>
                ) : null}
                <Field label="排序"><input type="number" min={1} value={menuDraft.sortOrder ?? 10} onChange={(event) => setMenuDraft({ ...menuDraft, sortOrder: Number(event.target.value) })} className="gov-input h-11 w-full px-3 text-[13px]" placeholder="数字越小越靠前" /></Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4">
                <button type="button" onClick={() => setMenuDraft(null)} className="h-10 rounded-[8px] border border-black/[0.08] px-5 text-[12px] font-semibold">取消</button>
                <button className="gov-button-primary h-10 px-5 text-[12px] font-semibold">保存</button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SecurityPolicy() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {['密级', '脱敏规则', '访问控制', '国密/水印/导出策略'].map((item) => (
          <div key={item} className="rounded-[6px] border border-black/[0.06] bg-white p-4">
            <ShieldCheck size={16} className="text-[var(--gov-red)]" />
            <p className="mt-3 text-sm font-semibold text-gray-900">{item}</p>
            <p className="mt-2 text-[11px] leading-5 text-gray-500">由安全管理员维护，系统管理员仅可查看当前生效状态。</p>
          </div>
        ))}
      </div>
      <div className="rounded-[6px] border border-black/[0.06] bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">当前策略</h3>
        <div className="mt-4 divide-y divide-black/[0.04] rounded-[4px] border border-black/[0.06]">
          {policies.map((item) => (
            <div key={item.name} className="grid gap-3 p-3 text-xs md:grid-cols-[1fr_1fr_2fr_120px]">
              <strong className="text-gray-900">{item.name}</strong>
              <span className="text-gray-600">{item.scope}</span>
              <span className="text-gray-500">{item.strategy}</span>
              <Status tone="warning">{item.owner}</Status>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditTrail({ logs, auditSearch, onAuditSearch }: { logs: AuditLogItem[]; auditSearch: string; onAuditSearch: (value: string) => void }) {
  return (
    <div className="rounded-[6px] border border-black/[0.06] bg-white p-5">
      <div className="flex flex-col justify-between gap-3 border-b border-black/[0.05] pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><FileKey size={15} /> 操作日志、数据访问日志与配置变更日志</h3>
          <p className="mt-1 text-xs text-gray-500">安全审计员可只读查看并导出报表，其他后台角色不能删除审计日志。</p>
        </div>
        <div className="flex gap-2">
          <input value={auditSearch} onChange={(e) => onAuditSearch(e.target.value)} placeholder="过滤操作者、节点..." className="rounded-[4px] border border-black/[0.08] px-3 py-2 text-xs" />
          <button className="flex items-center gap-1.5 rounded-[4px] border border-black/[0.08] px-3 py-2 text-xs text-gray-700"><Download size={12} />导出报表</button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[11px]">
          <thead className="bg-[#FAF9F6] text-gray-500">
            <tr>
              <th className="p-3">操作者</th>
              <th className="p-3">资源</th>
              <th className="p-3">节点</th>
              <th className="p-3">访问范围</th>
              <th className="p-3">SM3签名</th>
              <th className="p-3 text-right">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-3 font-semibold text-gray-900">{log.operator}</td>
                <td className="p-3 text-gray-600">{log.agentName}</td>
                <td className="p-3 text-gray-500">{log.node}</td>
                <td className="p-3 font-mono text-[10px] text-gray-500">{log.dataAccessed}</td>
                <td className="p-3 font-mono text-[10px] text-gray-400">{log.nationalCryptHash.slice(0, 18)}...</td>
                <td className="p-3 text-right font-mono text-[10px] text-gray-400">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {systemSettings.map((item) => (
        <div key={item.name} className="rounded-[6px] border border-black/[0.06] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
              <p className="mt-2 text-xs leading-6 text-gray-500">{item.desc}</p>
            </div>
            <span className="rounded-[4px] bg-[#FAF9F6] px-2 py-1 text-[11px] text-gray-700">{item.value}</span>
          </div>
        </div>
      ))}
      <div className="rounded-[6px] border border-black/[0.06] bg-white p-5 lg:col-span-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><HardDrive size={15} /> 系统负载与限额</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['达梦数据库物理存储', '14.2 GB / 500 GB', '2.8%'],
            ['连接器配额', '6 / 50', '12%'],
            ['智能体部署配额', '42 / 100', '42%']
          ].map(([label, value, width]) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between text-[11px] text-gray-500"><span>{label}</span><strong className="text-gray-800">{value}</strong></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.04]"><div className="h-full rounded-full bg-gray-800" style={{ width }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-[#344054]">
        {label}
        {required ? <span className="ml-1 rounded-[4px] bg-[#fff1f0] px-1.5 py-0.5 text-[10px] text-[var(--gov-red-deep)]">必填</span> : null}
      </span>
      {children}
    </label>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] bg-[#FAF9F6] p-2">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="mt-1 truncate font-medium text-gray-700" title={value}>{value}</p>
    </div>
  );
}

function ResourcePanel({ title, value, items }: { title: string; value: string; items: string[] }) {
  return (
    <div className="rounded-[6px] border border-black/[0.06] bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">{value}</span>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-[4px] bg-[#FAF9F6] px-3 py-2 text-xs text-gray-600">
            <Database size={12} className="text-gray-400" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Status({ tone, children }: { tone: 'success' | 'warning' | 'danger'; children: React.ReactNode }) {
  const classes = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100'
  };
  return <span className={`inline-flex items-center justify-center rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold ${classes[tone]}`}>{children}</span>;
}
