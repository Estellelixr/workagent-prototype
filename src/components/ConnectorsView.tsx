import React, { useMemo, useState } from 'react';
import { Connector, Role } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Building2,
  Check,
  Cpu,
  Database,
  Grid2X2,
  KeyRound,
  Menu,
  Monitor,
  MoreHorizontal,
  Network,
  PlugZap,
  Search,
  SearchCheck,
  UserRound,
  Wrench,
  X
} from 'lucide-react';

import zhiyuanOaLogo from '../../致远OA.svg';
import yonyouLogo from '../../YONGYOU.svg';
import damengLogo from '../../达梦数据库.svg';
import jinshanDocLogo from '../../金山文档.svg';

interface ConnectorsViewProps {
  connectors: Connector[];
  role: Role;
  onAddConnector: (newConn: Connector) => void;
}

type ConnectorCategoryId = '我的' | '全部' | '官方自研' | '开发工具' | '办公协作' | '政务数据' | '搜索引擎' | '更多';

const getConnectorTools = (name: string) => {
  if (name.includes('致远')) return [
    ['list_approval_todos', '查询当前用户的待办审批'],
    ['get_approval_detail', '读取审批单、表单字段和流转记录'],
    ['create_official_document', '创建公文拟稿与呈批单'],
    ['submit_approval', '提交审批并进入指定流程'],
    ['get_workflow_status', '查询流程节点和办理状态'],
  ];
  if (name.includes('金山文档')) return [
    ['search_documents', '按名称和正文内容检索企业文档'],
    ['read_document', '读取文档正文、表格和基础属性'],
    ['create_document', '在指定目录创建在线文档'],
    ['update_document', '更新文档正文和结构化内容'],
    ['share_document', '创建受控协作与分享权限'],
  ];
  if (name.includes('金山协作')) return [
    ['send_message', '发送单聊、群聊和机器人通知'],
    ['list_group_members', '查询群成员与组织关系'],
    ['create_schedule', '创建会议和工作日程'],
    ['get_messages', '获取授权范围内的消息记录'],
  ];
  if (name.includes('用友')) return [
    ['query_budget', '查询预算额度与执行情况'],
    ['list_vouchers', '获取财务凭证和审批状态'],
    ['get_receivables', '查询应收应付往来明细'],
    ['create_reimbursement', '创建费用报销单'],
  ];
  if (name.includes('达梦')) return [
    ['query_authorized_view', '查询授权业务视图'],
    ['get_table_schema', '读取数据表结构与字段定义'],
    ['search_audit_records', '检索审计底稿和历史记录'],
    ['execute_readonly_sql', '执行受控只读查询'],
  ];
  if (name.includes('国资委')) return [
    ['validate_report', '校验国资监管报表数据'],
    ['submit_regulatory_data', '提交监管指标和产权数据'],
    ['get_submission_status', '查询报送处理状态'],
  ];
  if (name.includes('招采')) return [
    ['search_tenders', '检索招标项目与公告'],
    ['read_bid_document', '读取授权投标文件'],
    ['compare_bid_responses', '对比商务与技术响应'],
    ['get_evaluation_status', '查询评标进度和结果'],
  ];
  return [
    ['search_records', '检索授权范围内的业务记录'],
    ['get_record_detail', '读取单条业务记录详情'],
    ['create_record', '创建新的业务记录'],
  ];
};

const getLogo = (name: string, sizeClass = 'h-12 w-12') => {
  const n = name || '';
  if (n.includes('致远')) return <img src={zhiyuanOaLogo} alt="致远OA" className={sizeClass} />;
  if (n.includes('用友')) return <img src={yonyouLogo} alt="用友" className={sizeClass} />;
  if (n.includes('达梦')) return <img src={damengLogo} alt="达梦数据库" className={sizeClass} />;
  if (n.includes('金山协作') || n.includes('金山文档')) return <img src={jinshanDocLogo} alt="金山" className={sizeClass} />;
  if (n.includes('国资委')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass} aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="#fff1f2" />
        <path d="M13 19h22v2H13v-2Zm3 5h3v9h-3v-9Zm6 0h3v9h-3v-9Zm6 0h3v9h-3v-9Zm-16 11h24v2H12v-2Zm12-25 12 6H12l12-6Z" fill="#e74d5e" />
      </svg>
    );
  }
  if (n.includes('招采')) {
    return (
      <svg viewBox="0 0 48 48" className={sizeClass} aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="#eefdf8" />
        <path d="M16 20a6 6 0 0 1 12 0m-2 4a6 6 0 1 1-12 0m18-5a6 6 0 0 0-8.2-5.6" fill="none" stroke="#0f9f8f" strokeWidth="3" strokeLinecap="round" />
        <path d="M31 26h5m-2.5-2.5v5" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <span className={`${sizeClass} flex items-center justify-center rounded-[16px] bg-[#f6f7fb] text-[#667085]`}>
      <PlugZap size={24} />
    </span>
  );
};

const getServiceLabel = (connector: Connector) => {
  if (connector.category === '文件管理') return '文档服务';
  if (connector.category === '协作') return '办公协作';
  if (connector.category === '金融') return '财务数据';
  if (connector.category === '分析') return '数据库';
  if (connector.category === '自动化') return '政务报送';
  if (connector.category === '生产力') return '采购协同';
  return connector.category || 'MCP 服务';
};

const getConnectorAccent = (connector: Connector) => {
  if (connector.name.includes('用友')) return 'from-[#f8fbff] via-[#f6f9ff] to-[#eef4ff]';
  if (connector.name.includes('达梦')) return 'from-[#f6f7ff] via-[#f7fbff] to-[#eef9ff]';
  if (connector.name.includes('金山')) return 'from-[#fff7f6] via-[#fffafa] to-[#f8fbff]';
  if (connector.name.includes('国资委')) return 'from-[#fff7f7] via-[#fffafa] to-[#fff4f5]';
  if (connector.name.includes('招采')) return 'from-[#f3fffb] via-[#f8fffd] to-[#eefbf8]';
  return 'from-[#fbfbfc] via-white to-[#f6f7f9]';
};

export default function ConnectorsView({ connectors, role, onAddConnector }: ConnectorsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<ConnectorCategoryId>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  void onAddConnector;

  const categories = [
    { id: '我的' as const, label: '我的', icon: UserRound },
    { id: '全部' as const, label: '全部', icon: Grid2X2 },
    { id: '官方自研' as const, label: '官方自研', icon: Network },
    { id: '开发工具' as const, label: '开发工具', icon: Cpu },
    { id: '办公协作' as const, label: '办公协作', icon: Monitor },
    { id: '政务数据' as const, label: '政务数据', icon: Building2 },
    { id: '搜索引擎' as const, label: '搜索引擎', icon: SearchCheck },
    { id: '更多' as const, label: '更多', icon: Menu },
  ];

  const filteredConnectors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return connectors.filter((connector) => {
      const matchesSearch = !query ||
        connector.name.toLowerCase().includes(query) ||
        connector.purpose.toLowerCase().includes(query) ||
        (connector.developer || '').toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === '全部' ||
        (selectedCategory === '我的' && connector.status === 'connected') ||
        (selectedCategory === '官方自研' && (connector.developer || '').includes('金山')) ||
        (selectedCategory === '开发工具' && ['分析', '自动化'].includes(connector.category || '')) ||
        (selectedCategory === '办公协作' && ['协作', '文件管理', '生产力'].includes(connector.category || '')) ||
        (selectedCategory === '政务数据' && (connector.name.includes('国资委') || connector.category === '金融')) ||
        (selectedCategory === '搜索引擎' && connector.name.includes('搜索')) ||
        selectedCategory === '更多';

      return matchesSearch && matchesCategory;
    });
  }, [connectors, searchQuery, selectedCategory]);

  return (
    <div className="min-h-full overflow-y-auto bg-white px-8 py-7">
      <div className="mx-auto max-w-[1560px]">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <nav className="flex flex-wrap items-center gap-x-9 gap-y-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group inline-flex items-center gap-2.5 rounded-[12px] px-2 py-2 text-[17px] font-semibold tracking-normal transition ${
                      isActive ? 'text-[#151922]' : 'text-[#6f747c] hover:text-[#242832]'
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} className={isActive ? 'text-[#151922]' : 'text-[#6f747c] group-hover:text-[#242832]'} />
                    <span>{category.label}</span>
                    {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--gov-red)]" /> : null}
                  </button>
                );
              })}
            </nav>

            <div className="relative w-full max-w-[320px] xl:w-[320px]">
              <Search size={22} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#6f747c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索MCP服务"
                className="h-14 w-full rounded-full border border-black/[0.14] bg-white pl-14 pr-5 text-[16px] font-semibold text-[#20242c] outline-none transition placeholder:text-[#73777f] hover:border-black/[0.22] focus:border-[var(--gov-red)] focus:shadow-[0_0_0_4px_rgba(231,77,94,0.08)]"
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[20px] font-bold tracking-normal text-[#151922]">
                {selectedCategory}MCP服务 <span className="font-semibold text-[#333]">({filteredConnectors.length})</span>
              </p>
              <p className="mt-2 text-[13px] leading-6 text-[#858b96]">
                面向智能体与业务方案的授权数据通道，支持按服务类型快速查找、查看工具和权限边界。
              </p>
            </div>
            <span className="hidden rounded-full bg-[#fff1f2] px-4 py-2 text-[12px] font-semibold text-[var(--gov-red)] md:inline-flex">
              {role === 'admin' ? '系统管理员视图' : '用户授权视图'}
            </span>
          </div>

          {filteredConnectors.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-2">
              {filteredConnectors.map((connector) => (
                <button
                  key={connector.id}
                  type="button"
                  onClick={() => setSelectedConnector(connector)}
                  className={`group relative min-h-[252px] overflow-hidden rounded-[26px] bg-gradient-to-br ${getConnectorAccent(connector)} p-7 text-left shadow-[0_16px_40px_rgba(15,23,42,0.055)] ring-1 ring-black/[0.035] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.09)]`}
                >
                  <div className="absolute inset-x-8 bottom-[70px] h-px bg-black/[0.06]" />
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex min-w-0 items-start gap-5">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]">
                        {getLogo(connector.name, 'h-11 w-11')}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[22px] font-bold leading-8 tracking-normal text-[#07090d]">{connector.name}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="h-3 w-[138px] rounded-full bg-gradient-to-r from-[#dde2e9] via-[#eef0f3] to-transparent blur-[1px]" />
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${connector.status === 'connected' ? 'bg-[#eafaf2] text-[#087443]' : connector.status === 'pending' ? 'bg-[#fff3df] text-[#b76b00]' : 'bg-[#feecef] text-[#cf3348]'}`}>
                            {connector.status === 'connected' ? '已连接' : connector.status === 'pending' ? '待授权' : '未连接'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <MoreHorizontal size={24} className="mt-1 shrink-0 text-[#191b20]" />
                  </div>

                  <p className="mt-7 line-clamp-2 min-h-[64px] text-[17px] font-medium leading-8 tracking-normal text-[#5f636b]">
                    {connector.purpose}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-[8px] bg-black/[0.055] px-3 py-1.5 text-[14px] font-semibold text-[#666a72]">
                      {getServiceLabel(connector)}
                    </span>
                    <span className="rounded-[8px] bg-white/75 px-3 py-1.5 text-[14px] font-semibold text-[#7a808a]">
                      {getConnectorTools(connector.name).length} 个工具
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between gap-4">
                    <span className="h-7 w-[220px] rounded-full bg-gradient-to-r from-[#edf2fb] via-[#f4f5f7] to-transparent blur-[2px]" />
                    <span className="shrink-0 text-[13px] font-semibold text-[#8c929d]">{connector.developer || '官方适配'} · {connector.syncTime}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[26px] border border-dashed border-black/[0.12] bg-[#fafafa] text-center">
              <Search size={34} className="text-[#b6bcc7]" />
              <p className="mt-4 text-[16px] font-semibold text-[#596170]">暂未找到匹配的 MCP 服务</p>
              <p className="mt-2 text-[13px] text-[#98a2b3]">可以切换分类，或输入系统名称、用途关键词继续检索。</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedConnector ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedConnector(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.99 }}
              className="flex max-h-[88vh] w-full max-w-[780px] flex-col overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(35,31,32,0.18)]"
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gov-panel-muted)]">
                    {getLogo(selectedConnector.name, 'h-8 w-8')}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold text-[var(--gov-text)]">{selectedConnector.name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${selectedConnector.status === 'connected' ? 'bg-[var(--gov-success-soft)] text-[var(--gov-success)]' : selectedConnector.status === 'pending' ? 'bg-[var(--gov-warning-soft)] text-[var(--gov-warning)]' : 'bg-red-50 text-red-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedConnector.status === 'connected' ? 'bg-[var(--gov-success)]' : selectedConnector.status === 'pending' ? 'bg-[var(--gov-warning)]' : 'bg-red-500'}`} />
                        {selectedConnector.status === 'connected' ? '连接正常' : selectedConnector.status === 'pending' ? '等待授权' : '连接断开'}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--gov-text-muted)]">{selectedConnector.developer || '官方适配'} · MCP 连接器</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedConnector(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-stone-400 hover:bg-stone-100 hover:text-stone-600" aria-label="关闭连接器详情"><X size={15} /></button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[12px] border border-black/[0.06] bg-[var(--gov-panel-muted)] p-3.5"><div className="flex items-center gap-1.5 text-[10px] text-[var(--gov-text-muted)]"><Activity size={12} />连接状态</div><p className="mt-2 text-[13px] font-semibold text-[var(--gov-text)]">{selectedConnector.status === 'connected' ? '服务可用' : selectedConnector.status === 'pending' ? '等待授权' : '当前不可用'}</p></div>
                  <div className="rounded-[12px] border border-black/[0.06] bg-[var(--gov-panel-muted)] p-3.5"><div className="flex items-center gap-1.5 text-[10px] text-[var(--gov-text-muted)]"><KeyRound size={12} />认证方式</div><p className="mt-2 text-[13px] font-semibold text-[var(--gov-text)]">企业 SSO / OAuth 2.0</p></div>
                  <div className="rounded-[12px] border border-black/[0.06] bg-[var(--gov-panel-muted)] p-3.5"><div className="flex items-center gap-1.5 text-[10px] text-[var(--gov-text-muted)]"><Wrench size={12} />可用工具</div><p className="mt-2 text-[13px] font-semibold text-[var(--gov-text)]">{getConnectorTools(selectedConnector.name).length} 个</p></div>
                </div>

                <section className="mt-4 rounded-[12px] border border-black/[0.06] p-4">
                  <div className="flex items-center gap-2"><Database size={14} className="text-[var(--gov-red)]" /><h4 className="text-[12px] font-semibold text-[var(--gov-text)]">连接信息</h4></div>
                  <p className="mt-3 text-[12px] leading-6 text-stone-600">{selectedConnector.purpose}</p>
                  <div className="mt-3 rounded-[9px] bg-[var(--gov-panel-muted)] px-3 py-2.5 text-[10px] leading-5 text-[var(--gov-text-muted)]"><span className="font-medium text-stone-600">数据访问边界：</span>{selectedConnector.dataReadPermission}</div>
                </section>

                <section className="mt-4">
                  <div className="mb-2.5 flex items-center justify-between"><div className="flex items-center gap-2"><Wrench size={14} className="text-[var(--gov-red)]" /><h4 className="text-[12px] font-semibold text-[var(--gov-text)]">提供的工具</h4></div><span className="text-[10px] text-[var(--gov-text-muted)]">供 AI 会话和自动化方案调用</span></div>
                  <div className="divide-y divide-black/[0.05] overflow-hidden rounded-[12px] border border-black/[0.07]">
                    {getConnectorTools(selectedConnector.name).map(([toolName, description]) => (
                      <div key={toolName} className="flex items-center gap-3 bg-white px-3.5 py-3 hover:bg-[var(--gov-panel-muted)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--gov-red-soft)] text-[var(--gov-red)]"><Wrench size={13} /></span>
                        <div className="min-w-0 flex-1"><code className="text-[11px] font-semibold text-[var(--gov-text)]">{toolName}</code><p className="mt-0.5 text-[10px] text-[var(--gov-text-muted)]">{description}</p></div>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] ${selectedConnector.status === 'connected' ? 'bg-[var(--gov-success-soft)] text-[var(--gov-success)]' : 'bg-stone-100 text-stone-400'}`}>{selectedConnector.status === 'connected' ? '可用' : '停用'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.06] bg-white px-5 py-3.5">
                <span className="text-[10px] text-[var(--gov-text-muted)]">连接器 ID：{selectedConnector.id}</span>
                <button type="button" onClick={() => setSelectedConnector(null)} className="gov-button-primary rounded-[8px] px-4 py-2 text-[11px] font-semibold">关闭</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
