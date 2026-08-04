import React, { useState } from 'react';
import { Connector, Role } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  Search,
  Users,
  TrendingUp,
  BarChart3,
  Zap,
  FileText,
  Briefcase,
  Check,
  Activity,
  Database,
  KeyRound,
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

const getLogo = (name: string, sizeClass = "w-10 h-10") => {
  const n = name || '';
  if (n.includes('致远')) {
    return <img src={zhiyuanOaLogo} alt="致远OA" className={sizeClass} />;
  }
  if (n.includes('用友')) {
    return <img src={yonyouLogo} alt="用友" className={sizeClass} />;
  }
  if (n.includes('达梦')) {
    return <img src={damengLogo} alt="达梦数据库" className={sizeClass} />;
  }
  if (n.includes('金山协作') || n.includes('金山文档')) {
    return <img src={jinshanDocLogo} alt="金山" className={sizeClass} />;
  }
  if (n.includes('国资委')) {
    return (
      <svg viewBox="0 0 40 40" className={sizeClass}>
        <rect width="40" height="40" rx="10" fill="#dc2626" />
        <path d="M12 14 H28 V16 H12 Z M14 18 V26 H16 V18 Z M19 18 V26 H21 V18 Z M24 18 V26 H26 V18 Z M12 28 H28 V30 H12 Z" fill="white" />
      </svg>
    );
  }
  if (n.includes('招采')) {
    return (
      <svg viewBox="0 0 40 40" className={sizeClass}>
        <defs>
          <linearGradient id="zcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#zcGrad)" />
        <circle cx="16" cy="20" r="5" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="24" cy="20" r="5" stroke="white" strokeWidth="2" fill="none" />
        <line x1="19.5" y1="20" x2="20.5" y2="20" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <div className={`${sizeClass} rounded-lg bg-stone-100 border border-stone-200/50 flex items-center justify-center text-lg`}>
      📦
    </div>
  );
};

export default function ConnectorsView({ connectors, role, onAddConnector }: ConnectorsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  void onAddConnector;

  const filteredConnectors = connectors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === '全部') return matchesSearch;
    return matchesSearch && c.category === selectedCategory;
  });

  // Pick specific items to highlight as "精选连接" (Featured)
  const featuredConnectors = connectors.filter(c => 
    c.name.includes('致远') || 
    c.name.includes('用友') || 
    c.name.includes('达梦') || 
    c.name.includes('金山')
  );

  const categories = [
    { id: '全部', label: '全部', icon: <Network size={12} /> },
    { id: '协作', label: '协作', icon: <Users size={12} /> },
    { id: '金融', label: '金融', icon: <TrendingUp size={12} /> },
    { id: '分析', label: '分析', icon: <BarChart3 size={12} /> },
    { id: '自动化', label: '自动化', icon: <Zap size={12} /> },
    { id: '文件管理', label: '文件管理', icon: <FileText size={12} /> },
    { id: '生产力', label: '生产力', icon: <Briefcase size={12} /> }
  ];

  return (
    <div className="space-y-6">
      {/* View Title Banner */}
      <div className="gov-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div>
          <h3 className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
            <Network size={14} className="text-neutral-500" /> 双底座物理连接：数据连接器中台 (Connectors Hub)
          </h3>
          <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed font-sans">
            {role === 'admin' 
              ? '当前身份为【系统管理员·FDE】。您可以查看已纳入管理的信创 MCP 连接器，掌握跨系统底层数据调用状态。' 
              : '当前身份为【张三 · 法务专员】。您可以只读查验已为您授权挂载的集团系统业务数据源，禁止配置底层安全掩码。'
            }
          </p>
        </div>
      </div>

      {/* 1. Featured Connectors / 精选连接 */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-bold text-stone-800 tracking-wider">:: 精选连接</span>
          <span className="w-1.5 h-1.5 bg-[var(--gov-red)] rounded-full animate-pulse" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {featuredConnectors.map((conn) => (
            <div 
              key={conn.id}
              onClick={() => setSelectedConnector(conn)}
              className="gov-panel overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:border-black/[0.12]"
            >
              {/* Product Card Top Half: Logo Canvas */}
              <div className="bg-[var(--gov-panel-muted)] p-5.5 flex items-center justify-center relative group-hover:bg-[#f4f1ec] transition-colors duration-300">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-3xs group-hover:scale-105 transition-transform duration-300">
                  {getLogo(conn.name, "w-10 h-10")}
                </div>
                {conn.status === 'pending' && (
                  <span className="absolute top-2 right-2 text-[8px] font-bold bg-[var(--gov-warning-soft)] text-[var(--gov-warning)] px-1 py-0.2 rounded border border-[rgba(138,90,22,0.14)]">
                    待授权
                  </span>
                )}
              </div>
              
              {/* Product Card Bottom Half: Info Row */}
              <div className="p-3 border-t border-stone-100 bg-white space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-stone-850 truncate group-hover:text-black transition-colors">{conn.name}</span>
                  <span className="text-[8.5px] font-mono bg-stone-50 text-stone-500 border border-stone-200/50 px-1 py-0.2 rounded font-medium">
                    免费
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9.5px] text-stone-400">
                  <span>{conn.metrics || '↓ 1.4万'}</span>
                  <span className="text-stone-300 truncate max-w-[48px] font-sans text-[9px] text-right">{conn.developer}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. List & Dynamic Filtering */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-black/[0.05] pb-3">
          {/* Categories select row inside pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[10.5px] font-medium transition-all duration-200 whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-[var(--gov-red-soft)] border-[var(--gov-red-line)] text-[var(--gov-red)] shadow-3xs'
                      : 'bg-white border-stone-200/60 text-stone-600 hover:border-stone-300 hover:text-stone-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search bar right-aligned */}
          <div className="relative w-full md:w-60">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-stone-400">
              <Search size={12} />
            </span>
            <input
              type="text"
              className="gov-input w-full pl-8 pr-3 py-1.5 text-[11px] text-stone-700"
              placeholder="搜索连接器名称或功能说明..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Connector List cards */}
        <div className="space-y-3">
          {filteredConnectors.map((conn) => (
            <div
              key={conn.id}
              onClick={() => setSelectedConnector(conn)}
              className="gov-panel p-4 flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-black/[0.12] transition-all duration-200"
            >
              {/* Left Logo and detailed text metadata */}
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <div className="w-12 h-12 bg-[var(--gov-panel-muted)] rounded-[6px] flex items-center justify-center shrink-0 shadow-3xs p-1">
                  {getLogo(conn.name, "w-9 h-9")}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-stone-900">{conn.name}</h4>
                    {conn.status === 'connected' ? (
                      <span className="bg-[var(--gov-success-soft)] text-[var(--gov-success)] border border-[rgba(31,107,69,0.14)] text-[9px] px-1.5 py-0.2 rounded tracking-wider scale-95 origin-left">
                        已连接
                      </span>
                    ) : (
                      <span className="bg-[var(--gov-warning-soft)] text-[var(--gov-warning)] border border-[rgba(138,90,22,0.14)] text-[9px] px-1.5 py-0.2 rounded tracking-wider scale-95 origin-left">
                        待授权
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-stone-605 leading-relaxed max-w-3xl font-sans">
                    {conn.purpose}
                  </p>

                  <div className="flex items-center gap-2.5 text-[10px] text-stone-400 pt-1 flex-wrap font-sans">
                    <span className="flex items-center gap-0.5 text-[var(--gov-red)] font-semibold text-[9.5px]">
                      {conn.developer || '官方适配'} <Check size={8} className="stroke-[3]" />
                    </span>
                    <span>•</span>
                    <span className="bg-[#FAF9F6] text-stone-600 px-1.5 py-0.5 rounded border border-stone-200/30 inline-flex items-center gap-1 max-w-[150px] sm:max-w-[320px]" title={conn.dataReadPermission}>
                      <span className="shrink-0 font-medium text-stone-500">安全过滤限界:</span>
                      <span className="truncate">{conn.dataReadPermission}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action columns */}
              <div className="flex items-center space-x-2 shrink-0 sm:self-center self-end">
                {role === 'admin' ? (
                  <span className="text-[9.5px] font-bold text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100/80 flex items-center gap-1">
                    已纳入连接器管理
                  </span>
                ) : (
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100/60 flex items-center gap-1">
                    ✓ 仅授权我只读
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredConnectors.length === 0 && (
            <div className="p-12 text-center text-stone-400 bg-white rounded-xl border border-stone-100 font-sans text-xs">
              🔍 暂未检索到符合条件的信创连接器模块
            </div>
          )}
        </div>
      </div>

      {/* Connector detail modal */}
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
              className="flex max-h-[88vh] w-full max-w-[780px] flex-col overflow-hidden rounded-[12px] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(35,31,32,0.18)]"
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[var(--gov-panel-muted)]">
                    {getLogo(selectedConnector.name, 'h-8 w-8')}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-semibold text-[var(--gov-text)]">{selectedConnector.name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${selectedConnector.status === 'connected' ? 'bg-[var(--gov-success-soft)] text-[var(--gov-success)]' : selectedConnector.status === 'pending' ? 'bg-[var(--gov-warning-soft)] text-[var(--gov-warning)]' : 'bg-red-50 text-red-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedConnector.status === 'connected' ? 'bg-[var(--gov-success)]' : selectedConnector.status === 'pending' ? 'bg-[var(--gov-warning)]' : 'bg-red-500'}`} />
                        {selectedConnector.status === 'connected' ? '连接正常' : selectedConnector.status === 'pending' ? '等待授权' : '连接断开'}
                      </span>
                    </div>
                    <p className="mt-1 text-[9px] text-[var(--gov-text-muted)]">{selectedConnector.developer || '官方适配'} · MCP 连接器</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedConnector(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-stone-400 hover:bg-stone-100 hover:text-stone-600" aria-label="关闭连接器详情"><X size={15} /></button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[9px] border border-black/[0.06] bg-[var(--gov-panel-muted)] p-3.5"><div className="flex items-center gap-1.5 text-[9px] text-[var(--gov-text-muted)]"><Activity size={11} />连接状态</div><p className="mt-2 text-[12px] font-semibold text-[var(--gov-text)]">{selectedConnector.status === 'connected' ? '服务可用' : selectedConnector.status === 'pending' ? '等待授权' : '当前不可用'}</p></div>
                  <div className="rounded-[9px] border border-black/[0.06] bg-[var(--gov-panel-muted)] p-3.5"><div className="flex items-center gap-1.5 text-[9px] text-[var(--gov-text-muted)]"><KeyRound size={11} />认证方式</div><p className="mt-2 text-[12px] font-semibold text-[var(--gov-text)]">企业 SSO / OAuth 2.0</p></div>
                  <div className="rounded-[9px] border border-black/[0.06] bg-[var(--gov-panel-muted)] p-3.5"><div className="flex items-center gap-1.5 text-[9px] text-[var(--gov-text-muted)]"><Wrench size={11} />可用工具</div><p className="mt-2 text-[12px] font-semibold text-[var(--gov-text)]">{getConnectorTools(selectedConnector.name).length} 个</p></div>
                </div>

                <section className="mt-4 rounded-[9px] border border-black/[0.06] p-4">
                  <div className="flex items-center gap-2"><Database size={13} className="text-[var(--gov-red)]" /><h4 className="text-[11px] font-semibold text-[var(--gov-text)]">连接信息</h4></div>
                  <p className="mt-3 text-[10px] leading-5 text-stone-600">{selectedConnector.purpose}</p>
                  <div className="mt-3 rounded-[7px] bg-[var(--gov-panel-muted)] px-3 py-2.5 text-[9px] leading-4 text-[var(--gov-text-muted)]"><span className="font-medium text-stone-600">数据访问边界：</span>{selectedConnector.dataReadPermission}</div>
                </section>

                <section className="mt-4">
                  <div className="mb-2.5 flex items-center justify-between"><div className="flex items-center gap-2"><Wrench size={13} className="text-[var(--gov-red)]" /><h4 className="text-[11px] font-semibold text-[var(--gov-text)]">提供的工具</h4></div><span className="text-[9px] text-[var(--gov-text-muted)]">供 AI 会话和自动化流程调用</span></div>
                  <div className="divide-y divide-black/[0.05] overflow-hidden rounded-[9px] border border-black/[0.07]">
                    {getConnectorTools(selectedConnector.name).map(([toolName, description]) => (
                      <div key={toolName} className="flex items-center gap-3 bg-white px-3.5 py-3 hover:bg-[var(--gov-panel-muted)]">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[var(--gov-red-soft)] text-[var(--gov-red)]"><Wrench size={12} /></span>
                        <div className="min-w-0 flex-1"><code className="text-[10px] font-semibold text-[var(--gov-text)]">{toolName}</code><p className="mt-0.5 text-[9px] text-[var(--gov-text-muted)]">{description}</p></div>
                        <span className={`rounded px-1.5 py-0.5 text-[8px] ${selectedConnector.status === 'connected' ? 'bg-[var(--gov-success-soft)] text-[var(--gov-success)]' : 'bg-stone-100 text-stone-400'}`}>{selectedConnector.status === 'connected' ? '可用' : '停用'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.06] bg-white px-5 py-3.5">
                <span className="text-[9px] text-[var(--gov-text-muted)]">连接器 ID：{selectedConnector.id}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setSelectedConnector(null)} className="gov-button-primary rounded-[6px] px-4 py-2 text-[10px] font-semibold">关闭</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </div>
  );
}
