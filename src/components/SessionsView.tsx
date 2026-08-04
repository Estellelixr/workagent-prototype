import React, { useState, useEffect, useRef } from 'react';
import { Agent, ChatMessage, Role } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  ChevronDown, 
  Copy, 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowUp, 
  Share2, 
  MessageSquarePlus, 
  MoreHorizontal,
  Paperclip,
  Network,
  Cpu,
  Bot
} from 'lucide-react';

interface SessionsViewProps {
  agents: Agent[];
  role: Role;
  activeSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  initialSelectedAgentId?: string | null;
  initialPrompt?: string | null;
  onClearRedirect: () => void;
}

export default function SessionsView({ 
  agents, 
  role: _role, 
  activeSessionId, 
  onSelectSession: _onSelectSession,
  initialSelectedAgentId, 
  initialPrompt, 
  onClearRedirect 
}: SessionsViewProps) {
  // Select active Agent
  const defaultAgent = agents.find(a => a.id === 'agent-gongwen') || agents[0];
  const [selectedAgent, setSelectedAgent] = useState<Agent>(defaultAgent);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('DeepSeek-V4');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dropdown States
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Selector choices
  const MODELS = ['DeepSeek-V4', 'DeepSeek-Flash', 'GLM-5.1', 'Qwen-Max'];

  // Automatically switch showing agent when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      if (activeSessionId === 'session-contract') {
        const ag = agents.find(a => a.id === 'agent-contract');
        if (ag) setSelectedAgent(ag);
      } else if (activeSessionId === 'session-safety') {
        const ag = agents.find(a => a.id === 'agent-gongwen');
        if (ag) setSelectedAgent(ag);
      } else if (activeSessionId === 'session-jinshan' || activeSessionId === 'session-analysis') {
        const ag = agents.find(a => a.id === 'agent-meeting');
        if (ag) setSelectedAgent(ag);
      } else {
        const ag = agents.find(a => a.id === activeSessionId) || agents.find(a => a.id === 'agent-meeting');
        if (ag) setSelectedAgent(ag);
      }
    }
  }, [activeSessionId, agents]);

  useEffect(() => {
    if (initialSelectedAgentId) {
      const found = agents.find(a => a.id === initialSelectedAgentId);
      if (found) {
        setSelectedAgent(found);
      }
      if (initialPrompt) {
        setInputText(initialPrompt);
      }
      onClearRedirect();
    }
  }, [initialSelectedAgentId, initialPrompt, agents]);

  // Unified dialogue database supporting sidebars sessions
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    'session-contract': [
      {
        id: 'msg-1-1',
        sender: 'user',
        content: '请根据国家合规规范和《中央企业合规管理办法》，审查一下“中建国投总部建筑工程框架协议”草案的法律纠纷风险条款。',
        timestamp: '今天 09:12'
      },
      {
        id: 'msg-1-2',
        sender: 'agent',
        content: `### ⚖️ 审查报告：项目总包框架意见

本合同第 **2.2 条** 关于争议解决的条款存在中高风险：
> “2.2 因本合同引起的或与本合同有关的任何争议……任何一方均可向**乙方所在地**有管辖权的人民法院提起诉讼。”

**法律风险评估：**
* **风险等级**：🔴 中高风险段落
* **风险释明**：管辖限定在“乙方（承包商）所在地”人民法院，直接弱化了甲方（我方中央企业）属地司法保全话语权，由于涉及12.8亿元的重大标的额，跨省维权、诉讼和差旅成本极高，不贴合《央国企合同风险防线守则》。
  
**建议修改版本：**
建议将该争议管辖条款修正为：
> “2.2 协商不成的，任何一方均可向**原告所在地**或**合同履行地**具有管辖权的人民法院提起诉讼。”`,
        timestamp: '今天 09:13'
      }
    ],
    'session-safety': [
      {
        id: 'msg-2-1',
        sender: 'user',
        content: '校对下关于安全生产靶向治理的公文草稿，特别是发文字号、用词错误和格式合规。',
        timestamp: '今天 09:30'
      },
      {
        id: 'msg-2-2',
        sender: 'agent',
        content: `### ✍️ 公文格式校对报告

我已自动与既有草件格式对标，以下为校对校准报告：

* **文字与逻辑订正**：
  * 原文：“为深入*贯彻贯彻*落实《数据安全法》……” 
  * 订正后：“为深入**贯彻落实**《数据安全法》……” (优化一处语境重影复字)。

* **发文字号建议**：
  * 原文：“国资厅发〔2026〕42号” 
  * 检验：字号数字使用六角括号【〔〕】符合国家公文标准规范，行文中括号格式已自动转为国标标准半角。

* **空行与排版规范**：
  * 系统已自动补足正文与发文机构之间的 4 行标准空字，确保电子印章叠加盖印不被遮挡。`,
        timestamp: '今天 09:31'
      }
    ],
    'session-jinshan': [
      {
        id: 'msg-js-1',
        sender: 'user',
        content: '请整理一下金山文档中关于安全生产自查整改的汇总内容，提取所有的关键时间节点和责任科室。',
        timestamp: '今天 10:15'
      },
      {
        id: 'msg-js-2',
        sender: 'agent',
        content: `### 📋 金山文档安全生产自查汇总报告
        
我已自动完成对上传汇总表单的梳理，提报如下：

* **核心时间节点**：
  * **2026年6月20日前**：各二级子单位完成第一轮关键设备高频端口与未授权访问摸底排查。
  * **2026年7月15日前**：完成自主整改底表上报并存入安全沙盒。

* **责任科室划分**：
  * **安环部**：负责施工现场防汛及临边防护物资核验。
  * **数字化办公室**：负责业务系统及Keycloak单点访问审计。`,
        timestamp: '今天 10:16'
      }
    ],
    'session-analysis': [
      {
        id: 'msg-an-1',
        sender: 'user',
        content: '请分析一下我们的安全自查报告，对照网络安全监管政策看看有什么疏漏？',
        timestamp: '今天 11:02'
      },
      {
        id: 'msg-an-2',
        sender: 'agent',
        content: `### 🔒 《网络安全自查合规分析》

经对照《数据安全法》以及有关国有企业常态化系统安全红线，我已对本次提交的自查明细进行了全面审理：

* **关键安全点评估**：
  * **优势**：自评数据已全部在信创专用网络隔离环境内进行SM2/SM3算法安全交互，未涉及涉密敏感资产流至公网沙盒。
  
* **存在合规漏配**：
  * ⚠️ 自查报告内未见对达梦数据库（DM8）在“异地容灾冷备份”及“一岗双责”高危访问权层面的控制校验演练。
  
* **纠偏落实建议**：
  * 建议数字化管理部门组织在第三季度内补足DM8容灾演练记录。`,
        timestamp: '今天 11:03'
      }
    ]
  });

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isTyping, selectedAgent, activeSessionId]);

  // Format and style inline elements dynamically
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Convert plain paragraphs and block lists to super clean elements
  const renderCleanAgentMessage = (content: string) => {
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="font-bold text-stone-900 text-sm md:text-base pt-3 pb-1 first:pt-0 font-sans tracking-tight">
            {renderFormattedText(trimmed.replace('###', '').trim())}
          </h3>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h2 key={idx} className="font-extrabold text-stone-900 text-base md:text-lg pt-3 pb-1 first:pt-0 font-sans tracking-tight">
            {renderFormattedText(trimmed.replace('##', '').trim())}
          </h2>
        );
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <div key={idx} className="flex items-start gap-2 text-[13.5px] text-stone-700 pl-1.5 py-0.5 font-sans leading-relaxed">
            <span className="text-stone-300 select-none">•</span>
            <span className="flex-1">{renderFormattedText(trimmed.replace(/^[*+-]\s+/, ''))}</span>
          </div>
        );
      }
      if (trimmed.startsWith('>')) {
        return (
          <blockquote key={idx} className="border-l-[3px] border-stone-200 pl-4 py-1 italic my-2 text-stone-500 text-[12.5px] bg-stone-50/40 rounded-r block leading-relaxed font-sans">
            {renderFormattedText(trimmed.replace('>', '').trim())}
          </blockquote>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-stone-700 text-[13.5px] leading-relaxed font-sans">
          {renderFormattedText(trimmed)}
        </p>
      );
    });
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    handleTaskSubmitText();
  };

  const handleTaskSubmitText = () => {
    if (!inputText.trim()) return;

    const activeKey = activeSessionId || selectedAgent.id;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content: inputText,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    const currentMsgs = conversations[activeKey] || [];
    setConversations(prev => ({
      ...prev,
      [activeKey]: [...currentMsgs, userMsg]
    }));
    
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = '';
      if (activeKey.includes('contract') || activeKey === 'agent-contract') {
        responseText = `### ⚖️ 合规审查要点已为您提出

针对您的问题：“${userMsg.content}”，已经为您与数据库中的判例以及《民法典》及管辖要求对标：

* **争议解决保障防线**：
  * 国企大中型资产项目中，合同管辖权应当贯彻“原告所在地”或者“项目所在地”，这是法务防范风险的核心底线。
  * 建议法务专员坚持协调为双方所在地的折中管辖方案。
  
需要我帮您起草正式的意见流转建议书吗？`;
      } else if (activeKey.includes('safety') || activeKey === 'agent-gongwen') {
        responseText = `### ✍️ 公文润色与修改建议已就绪

针对润色诉求 “${userMsg.content}”，系统已为您处理完毕：

* **主旨措辞提纲**：
  * 精准微调首发通知中的标点符号结构，确保符合 GB/T 9704 文体规范。
  * 建议使用“**科学研判安全痛点，强化主体责任闭环**”代替口语化句式。

如果您需要，可以直接点击下方的加号并入文档中台。`;
      } else if (activeKey.includes('jinshan') || activeKey.includes('analysis') || activeKey === 'agent-meeting') {
        responseText = `### 📋 智能文书整理反馈

我已经根据您的提示 “${userMsg.content}” 对文档中台和金山文档的数据源进行了深度提取与对标：

* **整理意见**：
  * 当前提取的关键责任要素已在安全信创沙盒内整理就绪。
  * 如需一键导出为标准的致远OA呈批文件格式，请随时告知。`;
      } else {
        responseText = `### 🤖 工作中枢智能分析完毕

我已为您梳理关于 “${userMsg.content}” 的工作大纲与核心建议：

* **安全认证与核验**：
  * 底层物理数据接口读取已成功，信息均已通过加密传输。
  * 已经根据您的专员岗位白名单对输出内容做出了规范微调。

若需要进一步导出为工作批示红头格式，请告诉我。`;
      }

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        content: responseText,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => ({
        ...prev,
        [activeKey]: [...(prev[activeKey] || []), agentMsg]
      }));
      setIsTyping(false);
    }, 1100);
  };

  const activeKey = activeSessionId || selectedAgent.id;
  const currentMessages = conversations[activeKey] || [];

  return (
    <div className="h-full w-full flex flex-col justify-between bg-white relative font-sans">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-100 bg-white">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-stone-800">{selectedAgent?.name || '安全交互对话'}</span>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-3">
          <button className="text-stone-400 hover:text-stone-600 p-1 rounded transition-colors cursor-pointer" title="分享会话">
            <Share2 size={14} />
          </button>
          <button className="text-stone-400 hover:text-stone-600 p-1 rounded transition-colors cursor-pointer" title="添加评论">
            <MessageSquarePlus size={14} />
          </button>
          <button className="text-stone-400 hover:text-stone-600 p-1 rounded transition-colors cursor-pointer" title="通用菜单">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* 2. Messages lists - Single Centered Column */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 flex flex-col justify-start">
        <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col justify-start">
          
          {currentMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-3">
              <h2 className="text-sm font-bold text-stone-800">使用 AI 处理各种任务...</h2>
              <p className="text-xs text-stone-400 max-w-sm font-sans leading-relaxed">
                在这里随时输入业务诉求。当前的对话数据均在信创本地沙盒环境下完美加密存储与审核。
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {currentMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {isUser ? (
                      /* User Bubble: Light Grey Rounded Pill on the Right */
                      <div className="bg-neutral-100 hover:bg-neutral-200/50 transition-colors rounded-3xl px-4.5 py-2.1 text-[13px] text-stone-800 font-sans select-text max-w-md break-words leading-relaxed shadow-3xs">
                        {msg.content}
                      </div>
                    ) : (
                      /* Agent Message: Left-aligned, raw text, no card border or block backgrounds, spacious spacing */
                      <div className="w-full space-y-3.5 border-b border-stone-50 pb-6 last:border-0">
                        <div className="space-y-3 select-text prose prose-stone text-stone-800">
                          {renderCleanAgentMessage(msg.content)}
                        </div>

                        {/* Minimal grey icons at the bottom of the AI message */}
                        <div className="flex items-center gap-4 text-stone-400 pl-1 pt-1">
                          <button 
                            onClick={() => handleCopyMessage(msg.content, msg.id)}
                            className="hover:text-stone-700 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                            title="复制回复"
                          >
                            {copiedId === msg.id ? (
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1 py-0.2 rounded">已复制!</span>
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                          <button 
                            className="hover:text-stone-700 transition-colors p-0.5 cursor-pointer" 
                            title="协同添加至文档"
                            onClick={() => alert('已将当前问答成果快捷关联至文档中台暂存')}
                          >
                            <Plus size={13} />
                          </button>
                          <button className="hover:text-stone-700 transition-colors p-0.5 cursor-pointer" title="点赞">
                            <ThumbsUp size={13} />
                          </button>
                          <button className="hover:text-stone-700 transition-colors p-0.5 cursor-pointer" title="踩">
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start pt-6">
              <div className="flex items-center gap-2 text-xs text-stone-400 font-sans">
                <Loader2 size={12} className="animate-spin text-stone-400" />
                <span>AI 正在处理中...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. Dialogue Bar — shared visual language with the new-session composer */}
      <div className="px-6 pb-6 pt-3 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-[920px] mx-auto">
          
          <form onSubmit={handleSend} className="overflow-visible rounded-[12px] border border-neutral-200 bg-white shadow-[0_8px_20px_rgba(15,15,15,0.05)] transition focus-within:border-neutral-300">
            <div className="px-4 pb-4 pt-4">
              <textarea
                className="w-full resize-none bg-transparent px-1 py-1 font-sans text-[14px] leading-7 text-neutral-800 placeholder-neutral-400 focus:outline-hidden"
                rows={3}
                placeholder="继续补充要求，或对当前分析结果提出追问..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTaskSubmitText();
                  }
                }}
                disabled={isTyping}
              />

              <div className="relative -mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-b-[12px] border-t border-neutral-100 bg-stone-50/60 px-4 pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={() => alert('已呼叫文档连接器，支持关联 Excel、Word 与 PDF 资产')} className="flex items-center gap-1 rounded-[8px] border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50">
                    <Paperclip size={12} className="text-gray-500" />上传文件
                  </button>
                  <button type="button" onClick={() => alert('当前会话已接入致远OA与金山文档')} className="flex items-center gap-1 rounded-[8px] border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--gov-red)] hover:bg-[rgba(200,16,46,0.08)]">
                    <Network size={12} />连接器 (2)
                  </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-1 rounded-[8px] border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <Cpu size={12} className="text-gray-500" /><span>{selectedModel}</span><ChevronDown size={10} className="opacity-60" />
                  </button>

                  <AnimatePresence>
                    {isModelDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsModelDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 bottom-full mb-2 w-44 bg-white border border-stone-200 rounded-lg shadow-xl z-40 py-1"
                        >
                          <div className="px-2.5 py-1 border-b border-stone-105 text-[8.5px] text-stone-400 uppercase font-bold tracking-wider">
                            分配计算引擎
                          </div>
                          {MODELS.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setSelectedModel(m);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.8 text-xs transition-colors hover:bg-stone-50 ${
                                selectedModel === m ? 'bg-stone-50 font-bold text-stone-900 border-l-2 border-stone-700 pl-2' : 'text-stone-600'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                    className="flex items-center gap-1 rounded-[8px] border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    <Bot size={12} className="text-[var(--gov-red)]" /><span>{selectedAgent.name}</span><ChevronDown size={10} className="opacity-60" />
                  </button>

                  <AnimatePresence>
                    {isAgentDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-35" onClick={() => setIsAgentDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-stone-200 rounded-lg shadow-xl z-40 py-1"
                        >
                          <div className="px-3 py-1.5 border-b border-stone-100 text-[9.5px] text-stone-400 uppercase font-bold tracking-wider">
                            切换专家
                          </div>
                          {agents.map((agent) => (
                            <button
                              key={agent.id}
                              type="button"
                              onClick={() => {
                                setSelectedAgent(agent);
                                setIsAgentDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs transition-colors hover:bg-stone-50 ${
                                selectedAgent?.id === agent.id ? 'bg-stone-50/70 font-bold text-stone-900' : 'text-stone-600'
                              }`}
                            >
                              <span className="truncate">{agent.name}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                </div>

                <button
                  type="submit"
                  disabled={isTyping || !inputText.trim()}
                  className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--gov-red)] px-3 text-white shadow-2xs transition hover:bg-[var(--gov-red-deep)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-300"
                  title="发送"
                >
                  <ArrowUp size={14} strokeWidth={2.8} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
