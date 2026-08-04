import React, { useState } from 'react';
import { Agent, Role } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Terminal, 
  MessageSquare,
  ChevronDown,
  ArrowUp,
  Paperclip,
  Network,
  Cpu,
  Bot,
  Trash2,
  File,
  History,
  Briefcase,
  Copy,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Scale,
  PenSquare,
  ShieldAlert
} from 'lucide-react';

interface WorkConsoleViewProps {
  agents: Agent[];
  role: Role;
  onStartChat: (agentId: string) => void;
  onStartChatWithPrompt?: (agentId: string, initialPrompt: string) => void;
  onOpenSession?: (sessionId: string) => void;
}

interface UploadedMockFile {
  name: string;
  size: string;
  type: string;
}

export default function WorkConsoleView({ agents, role: _role, onStartChat, onStartChatWithPrompt, onOpenSession }: WorkConsoleViewProps) {
  const [taskPrompt, setTaskPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setConsoleLogs] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [executedPrompt, setExecutedPrompt] = useState('');
  
  // Custom interactive selectors states
  const [selectedModel, setSelectedModel] = useState('DeepSeek-V4-Pro');
  const [selectedAssistant, setSelectedAssistant] = useState(agents[0]?.id ?? '');
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>(['致远OA', '金山文档']);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMockFile[]>([]);
  
  // UI dropdown toggles
  const [activeDropdown, setActiveDropdown] = useState<'model' | 'connector' | 'assistant' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedExpertFilter, setSelectedExpertFilter] = useState<string | null>(null);

  const currentAgent = agents.find(a => a.id === selectedAssistant) || agents[0];
 
  // Selector Options
  const MODELS = ['DeepSeek-V4-Pro', 'DeepSeek-V4-Flash', 'GLM-5.1', 'Qwen-Max'];
  
  const CONNECTORS = [
    { name: '金山文档', desc: 'WPS云端多人协同盘口及文件库', color: 'text-indigo-600' },
    { name: '金山协作', desc: '集团即时协同通知及安全群组通道', color: 'text-sky-600' },
    { name: '致远OA', desc: '国企收发文、签呈及审批流底盘', color: 'text-emerald-600' },
    { name: 'ERP', desc: '用友 U8/Cloud 核心账期与项目凭证', color: 'text-amber-600' },
    { name: '流程中心', desc: '集团内部大流程引擎及级联事务链', color: 'text-rose-600' },
    { name: '合同库', desc: '法务历史合规履约及抗辩模版归档', color: 'text-teal-600' },
    { name: '制度库', desc: '国资国企及合规管理规范全量文本', color: 'text-cyan-600' }
  ];

  // Helper toggle for active connectors list
  const handleToggleConnector = (name: string) => {
    if (selectedConnectors.includes(name)) {
      setSelectedConnectors(selectedConnectors.filter(c => c !== name));
    } else {
      setSelectedConnectors([...selectedConnectors, name]);
    }
  };

  // Simulated file upload triggers
  const handleSimulateUpload = () => {
    const mockFiles = [
      { name: '郑州总部工程总承包合同(送审稿).pdf', size: '2.4 MB', type: 'pdf' },
      { name: '关于印发安全生产自查行动的紧急通知(草案).docx', size: '420 KB', type: 'doc' },
      { name: '供应商标书三方交叉核验数据池.xlsx', size: '1.2 MB', type: 'xls' },
      { name: 'ERP上季度超限差旅报销明细表.csv', size: '680 KB', type: 'csv' }
    ];
    // Grab a random file not already added
    const available = mockFiles.filter(f => !uploadedFiles.some(uf => uf.name === f.name));
    if (available.length > 0) {
      setUploadedFiles([...uploadedFiles, available[0]]);
    } else {
      // Refresh list
      setUploadedFiles([mockFiles[Math.floor(Math.random() * mockFiles.length)]]);
    }
  };

  const handleClearFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleTaskSubmit = (promptText: string) => {
    if (!promptText.trim() && uploadedFiles.length === 0) return;

    let finalPromptText = promptText || `分析上传的文件: ${uploadedFiles.map(f => f.name).join(', ')}`;
    setExecutedPrompt(finalPromptText);
    setIsProcessing(true);
    setShowResult(false);
    setActiveDropdown(null);

    // Formulate realistic steps depending on selections
    const modelUsed = selectedModel;
    const connectorsActiveList = selectedConnectors.join('、') || '无物理通道';
    const assistantUsed = currentAgent?.name || selectedAssistant;

    setConsoleLogs([
      `[${new Date().toLocaleTimeString()}] [信创计算底座] 启动推理链路，调用模型 ${modelUsed}`,
      `[${new Date().toLocaleTimeString()}] [连接器联通] 已接入 ${connectorsActiveList} 业务上下文`,
      `[${new Date().toLocaleTimeString()}] [专家分派] 当前由 ${assistantUsed} 执行规则校验`
    ]);

    setTimeout(() => {
      setConsoleLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [规则分析] 开始处理输入内容与 ${uploadedFiles.length} 个附件`,
        `[${new Date().toLocaleTimeString()}] [安全隔离] 已对敏感字段执行脱敏与沙箱过滤`,
        `[${new Date().toLocaleTimeString()}] [审计完成] 已生成存证摘要 SM3_${Math.random().toString(16).substring(2, 10).toUpperCase()}`
      ]);

      setTimeout(() => {
        setIsProcessing(false);
        setShowResult(true);
      }, 800);

    }, 1200);
  };

  const handleRedirectToSessions = () => {
    if (currentAgent && onStartChatWithPrompt) {
      onStartChatWithPrompt(currentAgent.id, executedPrompt);
    } else {
      onStartChat(currentAgent.id);
    }
  };

  // Recent Work items matching enterprise workflow
  const recentWorkList = [
    {
      title: '审查中建国投总部建筑工程框架协议',
      preview: '本合同第2.2条关于争议解决的条款存在中高风险，建议将管辖条款修正为原告所在地...',
      time: '10分钟前',
      agent: '合同审核专家',
      model: 'DeepSeek-V4-Pro',
      sessionId: 'session-contract',
      agentId: 'agent-contract'
    },
    {
      title: '起草安全生产靶向治理公文通知',
      preview: '已自动对标公文格式，发文字号六角括号符合国标，已补足正文与发文机构间4行标准空字...',
      time: '1小时前',
      agent: '公文写作专家',
      model: 'GLM-5.1',
      sessionId: 'session-safety',
      agentId: 'agent-gongwen'
    },
    {
      title: '整理安全生产自查报告会议纪要',
      preview: '经对照《数据安全法》，自查报告内未见达梦数据库DM8异地容灾冷备份控制校验演练记录...',
      time: '昨日',
      agent: '会议纪要专家',
      model: 'Qwen-Max',
      sessionId: 'session-analysis',
      agentId: 'agent-meeting'
    }
  ];

  const filteredRecentWork = selectedExpertFilter
    ? recentWorkList.filter((w) => w.agentId === selectedExpertFilter)
    : recentWorkList;

  // Configured Top-performing Digital Experts cards
  const favoriteWorkers = [
    {
      name: '公文写作专家',
      dept: '办公室公文枢纽科',
      desc: '起草通知、请示、报告、批复等公文，100%覆盖国标GB/T 9704，支持6种公文文种。',
      runs: 388,
      agentId: 'agent-gongwen',
      icon: PenSquare
    },
    {
      name: '合同审核专家',
      dept: '法律合规事务中心',
      desc: '专解国资管理条例，《民法典》典型违约合规预控，20+类风险条款自动识别。',
      runs: 142,
      agentId: 'agent-contract',
      icon: Scale
    },
    {
      name: '文档校对专家',
      dept: '质量管理与标准化部',
      desc: '错别字、标点符号、敏感词、公文格式规范全面检查，输出结构化校对报告。',
      runs: 95,
      agentId: 'agent-proofread',
      icon: ShieldAlert
    }
  ];

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

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
          <div key={idx} className="flex items-start gap-2 text-[13px] text-stone-700 pl-1.5 py-0.5 font-sans leading-relaxed">
            <span className="text-stone-300 select-none">•</span>
            <span className="flex-1">{renderFormattedText(trimmed.replace(/^[*+-]\s+/, ''))}</span>
          </div>
        );
      }
      if (trimmed.startsWith('>')) {
        return (
          <blockquote key={idx} className="border-l-[3px] border-stone-200 pl-4 py-1 italic my-2 text-stone-500 text-[12px] bg-stone-50/40 rounded-r block leading-relaxed font-sans">
            {renderFormattedText(trimmed.replace('>', '').trim())}
          </blockquote>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-stone-700 text-[13.5px] leading-relaxed font-sans">
          {renderFormattedText(trimmed)}
        </p>
      );
    });
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getResultText = () => {
    if (selectedAssistant === 'agent-contract' || executedPrompt.includes('合同')) {
      return `### 《郑州总部工程总承包合同》法律风险预警

本合同第 **2.22 条** 关于争议解决的条款存在中高风险：
> “2.22 因本合同引起的或与本合同有关的任何争议……任何一方均可向乙方所在地有管辖权的人民法院提起诉讼。”

* **风险释明**：管辖限定在“乙方（承包商）所在地”人民法院，弱化了我方属地诉讼话语权。异地起诉维权不仅差旅成本高昂，也不利于案件审判保全。
* **修改建议**：建议将该争议管辖条款修正为：**“双方友好协商。若协商不成的，应向合同实际签约地或项目实施所在地具有管辖权的人民法院诉讼解决”**。`;
    } else if (selectedAssistant === 'agent-gongwen' || (executedPrompt.includes('通知') || executedPrompt.includes('公文'))) {
      return `### 公文格式与措辞校核意见

我已经完成了对这份公文格式及措辞的校准：

* **符号修正**：自动将标题序列中的非对称括号修剪为严格党政机关文书专用的 **“〔2026〕”** 六角括号结构。
* **文字调优**：抓取错别字“贯彻彻安全”自动修正为“切实**贯彻落实**本单位安全生产主体责任”。
* **排版规整**：通过留空排布重排末行，空出红头及电子印章叠加空行，有效避免盖印遮挡错位。`;
    } else if (selectedAssistant === 'agent-proofread' || executedPrompt.includes('校对')) {
      return `### 供应商关联关系与围标风险比对

通过对标书数据深度穿透，分析结论如下：

* **关联核验**：经穿透“新能标书”与“大兴总承包”数据池，发现投标商 B 与投标商 C 底层受益人属于同一自然人直系亲属，存在潜在关联。
* **内容雷察**：两家投标商的技术偏离表 PDF 属性与生成硬件终端偏离特征高度堆叠。建议对该项标段启动留置并由法律合规部门提前介入。`;
    } else {
      return `### 经营分析稽核意见

经对预算报销等数据智能对标比对，分析结果如下：

* **拆分拦截**：同一科室将单笔超出标准的违规接待划分为两笔连续申请，拆单操作以此企图规避主管签批。
* **合规锁定**：已向财务科目提示“风险锁定”，暂时退回，保障项目记账合规。`;
    }
  };

  const isChatActive = isProcessing || showResult;

  const renderInputBlock = () => {
    return (
      <div className="bg-white border border-neutral-200 rounded-[12px] shadow-[0_8px_20px_rgba(15,15,15,0.05)] transition-all duration-200 focus-within:border-neutral-300">
        <div className="px-4 pt-4 pb-4">
        {/* Uploaded Files horizontal preview tray if any */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3.5 pb-3 border-b border-neutral-100">
            {uploadedFiles.map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-[8px] text-[11px] text-neutral-800 font-medium"
              >
                <File size={12} className="text-[var(--gov-red)] shrink-0" />
                <span className="truncate max-w-[180px]" title={file.name}>{file.name}</span>
                <span className="text-[9px] text-gray-400 font-mono">({file.size})</span>
                <button 
                  onClick={() => handleClearFile(idx)}
                  className="hover:text-[var(--gov-red)] transition-colors pl-1 shrink-0 cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Core Textarea */}
        <div className="bg-white">
          <textarea
            rows={isChatActive ? 3 : 6}
            className="w-full text-[14px] text-neutral-800 placeholder-neutral-400 focus:outline-hidden resize-none leading-7 bg-transparent font-sans px-1 py-1"
            placeholder={isChatActive ? "继续补充要求，或对当前分析结果提出追问..." : "发送消息给 AI，输入业务任务、审查要求或上传材料后的处理指令..."}
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTaskSubmit(taskPrompt);
              }
            }}
          />
        </div>

        {/* Bottom Horizontal Actions tray containing the 4 strict requirements */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 relative mt-3 bg-stone-50/60 -mx-4 px-4 pb-0 rounded-b-[12px]">
          
          {/* Left: Four interactive tools selectors */}
          <div className="flex flex-wrap items-center gap-1.5">
            
            {/* Tool 1: 上传文件 */}
            <button
              onClick={handleSimulateUpload}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium cursor-pointer select-none rounded-[8px] border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              title="模拟上传发文、标书、合同、或导出的ERP明细数据文件"
            >
              <Paperclip size={12} className="text-gray-500 shrink-0" />
              <span>上传文件</span>
            </button>

            {/* Tool 2: 数据接入 */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'connector' ? null : 'connector')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border transition-colors cursor-pointer select-none text-[11px] font-medium ${
                  selectedConnectors.length > 0 
                    ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red)] border-[var(--gov-red-line)] hover:bg-[rgba(200,16,46,0.08)]' 
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <Network size={12} className={`${selectedConnectors.length > 0 ? 'text-[var(--gov-red)]' : 'text-gray-500'} shrink-0`} />
                <span>连接器 ({selectedConnectors.length})</span>
                <ChevronDown size={10} className="opacity-60" />
              </button>

              {/* Popup mimicking Enterprise WeChat style Menu */}
              <AnimatePresence>
                {activeDropdown === 'connector' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 bottom-full mb-2 w-72 bg-white border border-black/[0.08] rounded-[6px] shadow-lg z-45 py-2.5 px-3 font-sans"
                    >
                      <div className="border-b border-neutral-100 pb-1.5 mb-1.5">
                        <h4 className="text-[11px] font-bold text-gray-905">数据源连接器选择</h4>
                        <p className="text-[9px] text-gray-400 mt-0.5">选择可信数据通道直读上下文以精确审计</p>
                      </div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {CONNECTORS.map((conn) => {
                          const isChecked = selectedConnectors.includes(conn.name);
                          return (
                            <div 
                              key={conn.name}
                              onClick={() => handleToggleConnector(conn.name)}
                              className={`flex items-start gap-2.5 p-1.5 rounded cursor-pointer transition-colors hover:bg-neutral-50 ${
                                isChecked ? 'bg-[var(--gov-red-soft)] text-[var(--gov-text)] font-medium' : 'text-gray-700'
                              }`}
                            >
                              <div className="flex items-center h-4 shrink-0 mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // Controlled globally via parent div click
                                  className="rounded border-gray-300 text-[var(--gov-red)] focus:ring-[var(--gov-red)] h-3 w-3"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10.5px] leading-tight font-bold">{conn.name}</p>
                                <p className="text-[9px] text-gray-400 leading-snug truncate mt-0.5">{conn.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Tool 3: 模型选择 */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'model' ? null : 'model')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium cursor-pointer select-none rounded-[8px] border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                <Cpu size={12} className="text-gray-500 shrink-0" />
                <span>{selectedModel}</span>
                <ChevronDown size={10} className="opacity-60" />
              </button>

              <AnimatePresence>
                {activeDropdown === 'model' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 bottom-full mb-2 w-48 bg-white border border-black/[0.08] rounded-[6px] shadow-lg z-45 py-1 font-sans"
                    >
                      <div className="px-3 py-1.5 border-b border-neutral-150 text-[9.5px] text-gray-400 uppercase font-bold tracking-wider bg-neutral-50/50">
                        切换计算模型算力
                      </div>
                      <div className="py-1">
                        {MODELS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setSelectedModel(m);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors hover:bg-neutral-50 ${
                              selectedModel === m ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red)] font-bold border-l-2 border-[var(--gov-red)] pl-3' : 'text-gray-700 font-normal'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Tool 4: 数字专家 */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'assistant' ? null : 'assistant')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer select-none rounded-[8px] border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                <Bot size={12} className="text-[var(--gov-red)] shrink-0" />
                <span>{currentAgent?.name || '选择专家'}</span>
                <ChevronDown size={10} className="opacity-60" />
              </button>

              <AnimatePresence>
                {activeDropdown === 'assistant' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-black/[0.08] rounded-[6px] shadow-lg z-45 py-1 font-sans"
                    >
                      <div className="px-3 py-1.5 border-b border-neutral-100 text-[9.5px] text-gray-400 uppercase font-bold tracking-wider bg-neutral-50">
                        分配专属业务助手
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {agents.map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => {
                              setSelectedAssistant(agent.id);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-neutral-50 flex items-center gap-2.5 ${
                              selectedAssistant === agent.id ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red)] border-l-2 border-[var(--gov-red)] pl-2.5 font-bold' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-bold text-[11px] truncate">{agent.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Right: Circle Upward Dispatch button */}
          <button
            onClick={() => handleTaskSubmit(taskPrompt)}
            disabled={isProcessing || (!taskPrompt.trim() && uploadedFiles.length === 0)}
            className="disabled:bg-neutral-100 disabled:text-neutral-300 h-9 min-w-9 px-3 rounded-[8px] transition-all cursor-pointer flex items-center justify-center bg-[var(--gov-red)] text-white hover:bg-[var(--gov-red-deep)] shadow-2xs shrink-0"
            title="发送/立即召集运行"
          >
            <ArrowUp size={14} strokeWidth={2.8} />
          </button>
        </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-[1120px] mx-auto py-8 px-4 flex flex-col ${isChatActive ? 'min-h-[82vh] justify-between space-y-6' : 'space-y-10'}`}>
      
      {/* 1. Header Area - Only visible in standard initial state */}
      {!isChatActive && (
        <div className="flex flex-col items-center text-center space-y-3 pt-6">
          <span className="gov-badge px-2.5 py-1 text-[10px] font-bold tracking-wide">统一任务入口</span>
          <h2 className="text-[32px] font-extrabold tracking-tight text-neutral-900 font-sans">
            今天需要处理什么？
          </h2>
          <p className="text-[13px] text-[var(--gov-text-muted)] font-sans tracking-wide max-w-2xl">
            输入具体业务任务或上传材料，系统会结合连接器、专家助手和审计规则生成可追溯的处理意见。
          </p>
        </div>
      )}

      {/* Immersive Q&A Header Bar - Only visible in active Q&A state */}
      {isChatActive && (
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-2 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 font-sans flex items-center gap-1.5 leading-none">
                智能工作对标沙箱
              </h3>
              <p className="text-[11px] text-gray-400 font-sans mt-1.5">
                协作助手: {currentAgent?.name || '未选择'} · 数据算力: {selectedModel}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsProcessing(false);
              setShowResult(false);
              setTaskPrompt('');
              setUploadedFiles([]);
            }}
            className="gov-button-secondary text-[12px] px-3 py-1.5 transition-all cursor-pointer font-sans shadow-3xs font-medium shrink-0"
          >
            返回主工作台
          </button>
        </div>
      )}

      {/* Main Container Layout Shifts dynamically */}
      {isChatActive ? (
        // Immersive full screener: results go first, input is pinned to the bottom
        <div className="flex-1 flex flex-col justify-between space-y-8 min-h-[420px]">
          
          {/* Output Results panel */}
          <div className="space-y-6 flex-1 max-w-[880px] mx-auto w-full">
            <AnimatePresence mode="wait">
              {isProcessing && (
                <motion.div
                  key="console-logs"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                    <div className="flex items-center gap-2 text-[12px] text-stone-400 font-sans py-4">
                      <Terminal size={12} className="animate-pulse text-stone-400" />
                    <span>正在执行规则校验与结果生成...</span>
                  </div>
                </motion.div>
              )}

              {showResult && !isProcessing && (
                <motion.div
                  key="output-result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col space-y-6 w-full"
                >
                  {/* User question pill on the right */}
                  <div className="flex justify-end">
                    <div className="bg-[var(--gov-panel-muted)] border border-black/[0.05] transition-colors rounded-[6px] px-4.5 py-2 text-[13px] text-stone-850 max-w-md break-words leading-relaxed shadow-3xs font-sans">
                      {executedPrompt || '分析执行大纲'}
                    </div>
                  </div>

                  {/* AI Response left-aligned with no outer border cards */}
                  <div className="w-full space-y-4 rounded-[12px] border border-stone-200 bg-white p-5">
                    <div className="space-y-3 select-text prose prose-stone max-w-none text-stone-850">
                      {renderCleanAgentMessage(getResultText())}
                    </div>

                    {/* Action Row Underneath */}
                    <div className="flex items-center justify-between border-t border-stone-105 pt-5 mt-6 pb-2">
                      <div className="flex items-center gap-4 text-stone-400">
                        <button 
                          onClick={() => handleCopyText(getResultText(), 'console-result')}
                          className="hover:text-stone-700 transition-colors p-0.5 cursor-pointer flex items-center justify-center font-sans text-xs"
                          title="复制回复"
                        >
                          {copiedId === 'console-result' ? (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1 py-0.2 rounded">已复制</span>
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <button 
                          className="hover:text-stone-700 transition-colors p-0.5 cursor-pointer" 
                          title="暂存至文档中心"
                          onClick={() => alert('已自动暂存当前核准意见')}
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

                      <button
                        onClick={handleRedirectToSessions}
                        className="gov-button-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs group"
                      >
                        <MessageSquare size={12} className="text-stone-500 group-hover:text-stone-800 transition-colors" />
                        导入安全多轮对话
                        <ArrowRight size={11} className="text-gray-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Block pushed directly to the bottom when Chat Q&A is active */}
          <div className="max-w-[880px] mx-auto w-full bg-transparent mt-4 animate-slide-up">
            {renderInputBlock()}
          </div>

        </div>
      ) : (
        // Standard non-active home stage view
        <>
          {renderInputBlock()}
          
          {/* 4. Home page list widgets: Recent and Favorites */}
          <div className="space-y-10">
            
            {/* SECTION B: Two-column grid for Recent Work and Favorite Digital Workers */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 pt-2">
              
              {/* Left: 最近会话 (Recent Sessions) */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest font-sans flex items-center gap-1.5">
                    <History size={13} className="text-neutral-500" />
                    最近会话
                  </h3>
                  {selectedExpertFilter && (
                    <button
                      onClick={() => setSelectedExpertFilter(null)}
                      className="text-[10px] text-[var(--gov-red)] hover:underline"
                    >
                      清除筛选
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {filteredRecentWork.map((work, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onOpenSession?.(work.sessionId)}
                      className="gov-panel gov-list-hover w-full text-left p-3.5 duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 group-hover:bg-[var(--gov-red-soft)] transition-colors">
                          <MessageSquare size={14} className="text-stone-400 group-hover:text-[var(--gov-red)] transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-neutral-800 truncate group-hover:text-[var(--gov-red)] transition-colors">
                              {work.title}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono shrink-0">{work.time}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{agents.find(a => a.id === work.agentId)?.name || work.agent}</span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400 font-mono">{work.model}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-1.5 leading-relaxed">
                            {work.preview}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: 常用数字专家 */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest font-sans flex items-center gap-1.5">
                    <Briefcase size={13} className="text-neutral-500" />
                    常用专家
                  </h3>
                  <span className="text-[10px] text-[var(--gov-text-muted)] font-bold">快捷入口</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {favoriteWorkers.map((worker, index) => {
                    const isFiltered = selectedExpertFilter === worker.agentId;
                    return (
                    <button
                      key={index}
                      onClick={() => {
                        const matchedAgent = agents.find(a => a.id === worker.agentId) || agents[0];
                        if (matchedAgent) setSelectedAssistant(matchedAgent.id);
                        if (isFiltered) {
                          setSelectedExpertFilter(null);
                        } else {
                          setSelectedExpertFilter(worker.agentId);
                        }
                      }}
                      className={`gov-panel gov-list-hover w-full grid grid-cols-[auto_1fr_auto] items-start gap-3 p-3.5 text-left duration-200 cursor-pointer group ${
                        isFiltered ? 'ring-2 ring-[var(--gov-red)] bg-[var(--gov-red-soft)]' : ''
                      }`}
                    >
                      <span className="shrink-0 mt-0.5 p-1.5 bg-white rounded-[4px] border border-black/[0.05] shadow-3xs group-hover:bg-[var(--gov-red-soft)] transition-all">
                        <worker.icon size={14} className="text-[var(--gov-red)]" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-[11px] font-bold text-neutral-900 group-hover:text-[var(--gov-red)] transition-colors">
                          {agents.find(a => a.id === worker.agentId)?.name || worker.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 truncate tracking-tight">{worker.dept}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-snug">
                          {worker.desc}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded shrink-0 border border-black/[0.05]">
                          会话 {worker.runs}
                        </span>
                        <span className={`text-[9px] font-medium ${isFiltered ? 'text-emerald-600' : 'text-[var(--gov-red)]'}`}>
                          {isFiltered ? '已筛选' : '筛选会话'}
                        </span>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
