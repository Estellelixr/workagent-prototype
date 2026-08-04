import React, { useState } from 'react';
import { Agent, Role } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Check, CheckCircle2, Award, ArrowUpRight, Plus } from 'lucide-react';

function renderAgentIcon(agentId: string, className = "w-5 h-5") {
  switch (agentId) {
    case 'agent-gongwen': // 公文写作专家
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" className="text-[var(--gov-red)]" />
          <polyline points="14 2 14 8 20 8" className="text-[#d85b6d]" />
          <line x1="16" y1="13" x2="8" y2="13" className="text-stone-400" />
          <line x1="16" y1="17" x2="8" y2="17" className="text-stone-400" />
          <line x1="10" y1="9" x2="8" y2="9" className="text-stone-400" />
        </svg>
      );
    case 'agent-proofread': // 文档校对专家
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="text-[var(--gov-red)]" />
          <path d="m9 12 2 2 4-4" strokeWidth="2.5" className="text-[#d85b6d]" />
        </svg>
      );
    case 'agent-contract': // 合同审核专家
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" className="text-[var(--gov-red)]" />
          <line x1="12" y1="9" x2="12" y2="13" className="text-[#d85b6d]" />
          <line x1="12" y1="17" x2="12.01" y2="17" className="text-[#d85b6d]" />
        </svg>
      );
    case 'agent-meeting': // 会议纪要专家
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="text-[var(--gov-red)]" />
          <circle cx="12" cy="12" r="6" className="text-[#d85b6d]" />
          <circle cx="12" cy="12" r="2" className="text-stone-400" fill="currentColor" />
        </svg>
      );
    case 'agent-report': // 报告撰写专家
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" className="text-[var(--gov-red)]" />
          <line x1="2" y1="10" x2="22" y2="10" className="text-[#d85b6d]" />
          <rect x="6" y="14" width="4" height="2" className="text-stone-400" fill="currentColor" />
        </svg>
      );
    case 'agent-policy': // 政策解读助手
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" className="text-[var(--gov-red)]" />
          <path d="M12 6v12M9 12h6" className="text-stone-400" />
        </svg>
      );
    case 'agent-dangjian': // 党建学习助手
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" className="text-[var(--gov-red)]" />
        </svg>
      );
    case 'expert-bidding': // 电子招投标预审助手
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" className="text-[var(--gov-red)]" />
          <line x1="12" y1="20" x2="12" y2="4" className="text-[#d85b6d]" />
          <line x1="6" y1="20" x2="6" y2="14" className="text-stone-400" />
        </svg>
      );
    case 'expert-safety': // 安全生产管理助手
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" className="text-[var(--gov-red)]" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" className="text-stone-400" />
        </svg>
      );
    case 'expert-audit': // 督查督办助手
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" className="text-stone-400" />
          <path d="M12 2C6.5 2 2 6.5 2 12c0 1.3.25 2.54.71 3.68L7 11h4v4l-4.68 4.29C7.46 19.75 8.7 20 10 20c5.5 0 10-4.5 10-10S15.5 2 12 2z" className="text-[var(--gov-red)]" />
          <path d="M19 5l-4 4" className="text-[#d85b6d]" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="text-gray-500" />
          <path d="M12 16v-4M12 8h.01" className="text-gray-450" />
        </svg>
      );
  }
}

const getAgentBg = (_id: string) => 'bg-[#fcf8f8] border-[rgba(200,16,46,0.10)]';

interface AgentsViewProps {
  agents: Agent[];
  role: Role;
  usedAgentIds: Set<string>;
  onToggleEnable: (agentId: string) => void;
  onStartChat: (agentId: string) => void;
  onAddToMyExperts: (agentId: string) => void;
}

export default function AgentsView({ agents, role, usedAgentIds, onToggleEnable: _onToggleEnable, onStartChat, onAddToMyExperts }: AgentsViewProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'general' | 'expert'>('my');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const filteredAgents = agents.filter(agent => {
    // Tab filter
    if (activeTab === 'my') {
      // 我的专家 = 预置专家(type='my') + 使用过的专家
      if (agent.type !== 'my' && !usedAgentIds.has(agent.id)) return false;
    } else if (activeTab === 'general') {
      if (agent.type !== 'general') return false;
    } else if (activeTab === 'expert') {
      if (agent.type !== 'expert') return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and Quick Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[8px] border border-black/[0.06] shadow-[0_4px_14px_rgba(15,15,15,0.03)]">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            className="w-full pl-8.5 pr-3 py-2 border border-black/[0.06] rounded-[8px] focus:outline-hidden focus:border-black/20 text-xs text-gray-700 bg-stone-50/70"
            placeholder="搜索数字专家名称或描述分类..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-[10.5px]">
          <span className="flex items-center gap-1 bg-[#E2F5EC] text-[#137A4C] border border-[#CDEEDB]/50 px-2.5 py-0.5 rounded-[3px] font-medium">
            <Check size={11} /> 信创环境就绪
          </span>
          <span className="flex items-center gap-1 bg-[#F1F1EF] text-gray-600 border border-black/[0.03] px-2.5 py-0.5 rounded-[3px]">
            <Award size={11} /> SSO统一授权生效中
          </span>
        </div>
      </div>

      {/* Recommended Hero Section inspired by user-provided image */}
      <div className="bg-white p-6 rounded-[10px] border border-black/[0.06] shadow-[0_4px_14px_rgba(15,15,15,0.03)] space-y-5">
        {/* Title and decorative card overlapping graphic */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-[4px] text-[10px] font-bold">
              全新升维
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-[#111111] tracking-tight">
              面向业务场景的数字专家
            </h2>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              从公文写作、合同审查到经营分析，数字专家可协同处理各类业务任务。
            </p>
          </div>

          {/* Right side cartoon-style tiled overlapping bubbles */}
          <div className="relative flex items-center justify-center w-36 h-14 self-center md:self-auto select-none">
            {/* Card 1 */}
            <div className="absolute transform -translate-x-10 -rotate-12 bg-white rounded-lg border border-black/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-2 w-12 h-12 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                {renderAgentIcon('agent-gongwen', 'w-4 h-4')}
              </div>
            </div>
            {/* Card 2 */}
            <div className="absolute transform -rotate-3 bg-white rounded-lg border border-black/[0.05] shadow-[0_4px_16px_rgba(0,0,0,0.05)] p-2 w-12 h-12 flex items-center justify-center z-10">
              <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                {renderAgentIcon('agent-proofread', 'w-4 h-4')}
              </div>
            </div>
            {/* Card 3 */}
            <div className="absolute transform translate-x-10 rotate-12 bg-white rounded-lg border border-black/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-2 w-12 h-12 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                {renderAgentIcon('agent-contract', 'w-4 h-4')}
              </div>
            </div>
          </div>
        </div>

        {/* Bento Recommended Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: 公文写作专家 (Left) */}
          <div className="bg-[#EBF5FF]/50 border border-[#BFDBFE]/60 hover:border-[#93C5FD] transition-all rounded-[8px] p-5 flex flex-col justify-between min-h-[145px] relative overflow-hidden group">
            <div className="space-y-2.5 z-10 max-w-[72%]">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-white border border-blue-200/50 px-2.5 py-0.5 rounded-full shadow-2xs">
                ✨ 重点推荐
              </div>
              <h3 className="text-[13.5px] font-bold text-[#1E3A8A] tracking-tight">
                公文写作专家
              </h3>
              <p className="text-[11px] text-blue-900/70 leading-relaxed font-sans mt-0.5">
                起草通知、请示、报告、批复等公文，按GB/T 9704标准排版，覆盖6种公文文种。
              </p>
            </div>
            <div className="pt-3.5 z-10">
              <button
                onClick={() => onStartChat('agent-gongwen')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:text-blue-700 hover:underline cursor-pointer transition-colors"
              >
                立即探索 <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-blue-100/90 rounded-full flex items-center justify-center shadow-2xs border border-blue-200/40 select-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-600">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="#FFF" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>

          {/* Card 2: 文档校对专家 (Right) */}
          <div className="bg-[#FEFAF0]/85 border border-[#FDE68A]/80 hover:border-[#F59E0B]/50 transition-all rounded-[8px] p-5 flex flex-col justify-between min-h-[145px] relative overflow-hidden group">
            <div className="space-y-2.5 z-10 max-w-[72%]">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-white border border-amber-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                🔍 质量把关
              </div>
              <h3 className="text-[13.5px] font-bold text-amber-900 tracking-tight">
                文档校对专家
              </h3>
              <p className="text-[11px] text-amber-800/80 leading-relaxed font-sans mt-0.5">
                检查错别字、标点错误、敏感词、公文格式规范，输出校对报告确保公文质量。
              </p>
            </div>
            <div className="pt-3.5 z-10">
              <button
                onClick={() => onStartChat('agent-proofread')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 hover:underline cursor-pointer transition-colors"
              >
                立即体验 <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shadow-2xs border border-amber-200/40 select-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-700">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#FFF" />
                <path d="m9 12 2 2 4-4" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Tabs */}
      <div className="border-b border-black/[0.06]">
        <nav className="flex space-x-6" aria-label="Tabs">
          {[
            { id: 'my', label: '我的专家' },
            { id: 'general', label: '通用专家' },
            { id: 'expert', label: '场景专家' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  relative py-2.5 px-0.5 text-xs font-medium transition-all duration-150 focus:outline-hidden cursor-pointer
                  ${isActive ? 'text-[var(--gov-red)] font-bold' : 'text-gray-400 hover:text-gray-700'}
                `}
                id={`tab-${tab.id}`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeAgentTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--gov-red)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >


          {/* Unified Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => {
                const isMyExpert = agent.type === 'my' || usedAgentIds.has(agent.id);
                return (
                  <div
                    key={agent.id}
                    id={`agent-card-${agent.id}`}
                    className="bg-white rounded-[8px] border border-black/[0.06] hover:border-[rgba(200,16,46,0.14)] transition-colors flex flex-col justify-between shadow-[0_4px_14px_rgba(15,15,15,0.03)]"
                  >
                    <div className="p-4 space-y-3.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center border ${getAgentBg(agent.id)}`}>
                            {renderAgentIcon(agent.id, "w-5 h-5")}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              {agent.name}
                              {agent.recommendReason && (
                                <span className="bg-stone-50 text-stone-600 text-[9px] px-1 rounded border border-black/[0.05] font-medium">推荐</span>
                              )}
                            </h4>
                          </div>
                        </div>
                        {agent.type === 'my' && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#137A4C] bg-[#E2F5EC] px-1.5 py-0.2 rounded-[3px] border border-[#CDEEDB]/50">
                            <CheckCircle2 size={10} /> 已就绪
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 leading-relaxed min-h-[36px] font-sans">
                        {agent.description}
                      </p>
                    </div>

                    <div className="bg-stone-50/70 px-4 py-2.5 rounded-b-[8px] border-t border-black/[0.04] flex items-center justify-between">
                      {isMyExpert ? (
                        <button
                          onClick={() => onStartChat(agent.id)}
                          className="text-xs font-semibold bg-[#f7f4f2] text-stone-700 hover:bg-stone-100 px-2.5 py-1.5 rounded-[6px] transition-colors flex items-center gap-1 cursor-pointer border border-black/[0.08]"
                        >
                          进入会话交互 <ArrowUpRight size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onAddToMyExperts(agent.id)}
                          className="text-xs font-semibold bg-[var(--gov-red)] text-white hover:bg-[#C5282E] px-2.5 py-1.5 rounded-[6px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> 添加到我的专家
                        </button>
                      )}
                      {role === 'admin' && (
                        <button
                          onClick={() => alert(`[权限演示] 已穿透 Keycloak 为此代理配置底层数据沙箱`)}
                          className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                        >
                          管理配置
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400 font-sans text-sm">
                没有找到符合过滤条件的智能体。
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>


    </div>
  );
}
