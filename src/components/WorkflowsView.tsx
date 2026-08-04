import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bot, Clock3, MessageSquare, Play, Plus, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';

interface RunHistoryEntry {
  sessionId: string;
  sessionTitle: string;
  timestamp: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  frequency: string;
  timeVal: string;
  weekDays?: number[];
  monthDays?: number[];
  status: 'running' | 'idle';
  lastRun: string;
  history: RunHistoryEntry[];
  agentId?: string;
  model?: string;
}

interface WorkflowsViewProps {
  onRunTask: (taskName: string, prompt: string) => string;
  onOpenSession: (sessionId: string) => void;
}

const FREQUENCY_OPTIONS = [
  { value: '每天', label: '每天' },
  { value: '工作日', label: '工作日' },
  { value: '每周', label: '每周' },
  { value: '每月', label: '每月' }
];

const WEEK_DAY_OPTIONS = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' }
];

const AGENT_OPTIONS = [
  { value: 'agent-gongwen', label: '公文写作专家' },
  { value: 'agent-proofread', label: '文档校对专家' },
  { value: 'agent-contract', label: '合同审核专家' },
  { value: 'agent-meeting', label: '会议纪要专家' },
  { value: 'agent-report', label: '报告撰写专家' },
];

const MODEL_OPTIONS = [
  { value: 'jinshan-gov', label: '金山政务办公大模型' },
  { value: 'deepseek-v4', label: 'DeepSeek-V4-Pro' },
  { value: 'glm-5', label: 'GLM-5.1' },
  { value: 'qwen-max', label: 'Qwen-Max' },
];

const formatFrequencyLabel = (task: ScheduledTask): string => {
  switch (task.frequency) {
    case '每周': {
      const days = (task.weekDays && task.weekDays.length > 0)
        ? task.weekDays.sort().map(d => WEEK_DAY_OPTIONS.find(o => o.value === d)?.label).join('、')
        : '周一';
      return `每周 ${days} ${task.timeVal}`;
    }
    case '每月': {
      const days = (task.monthDays && task.monthDays.length > 0)
        ? task.monthDays.sort((a, b) => a - b).map(d => `${d}号`).join('、')
        : '1号';
      return `每月 ${days} ${task.timeVal}`;
    }
    default:
      return `${task.frequency} ${task.timeVal}`;
  }
};

const TASK_TEMPLATES = [
  {
    title: '每日重要政策速递',
    desc: '每天定时拉取最新政策并生成结构化简报。',
    frequency: '每天',
    timeVal: '08:00'
  },
  {
    title: '公文格式自动校验',
    desc: '定时对草稿进行格式和敏感词检查。',
    frequency: '每天',
    timeVal: '10:00'
  },
  {
    title: '合同风险定时扫描',
    desc: '每个工作日对新合同执行风险扫描。',
    frequency: '工作日',
    timeVal: '09:00'
  }
];

const defaultTasks: ScheduledTask[] = [
  {
    id: 'task-1',
    name: '每日政策速递调度',
    prompt: '每天早上拉取最新政策并输出结构化政策简报。',
    frequency: '每天',
    timeVal: '08:30',
    status: 'running',
    lastRun: '今天 08:30 已完成，结果已推送至文档中台。',
    history: [
      { sessionId: 'auto-task-1-a', sessionTitle: '自动化任务-2026-06-24-每日政策速递调度', timestamp: '今天 08:30' },
      { sessionId: 'auto-task-1-b', sessionTitle: '自动化任务-2026-06-23-每日政策速递调度', timestamp: '昨天 08:30' }
    ]
  },
  {
    id: 'task-2',
    name: '公文合规抽检调度',
    prompt: '工作日对新增公文草稿执行格式与合规校验。',
    frequency: '工作日',
    timeVal: '10:00',
    status: 'running',
    lastRun: '刚刚执行，3 份公文抽检全部通过。',
    history: [
      { sessionId: 'auto-task-2-a', sessionTitle: '自动化任务-2026-06-24-公文合规抽检调度', timestamp: '刚刚' }
    ]
  },
  {
    id: 'task-3',
    name: '法务专家晨间巡检',
    prompt: '每周一、周四对新上传合同执行风险扫描。',
    frequency: '每周',
    timeVal: '09:10',
    weekDays: [1, 4],
    status: 'idle',
    lastRun: '昨天 09:10 已完成，生成 1 条重点风险提醒。',
    history: [
      { sessionId: 'auto-task-3-a', sessionTitle: '自动化任务-2026-06-20-法务专家晨间巡检', timestamp: '昨天 09:10' }
    ]
  }
];

export default function WorkflowsView({ onRunTask, onOpenSession }: WorkflowsViewProps) {
  const [tasks, setTasks] = useState<ScheduledTask[]>(defaultTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalPrompt, setModalPrompt] = useState('');
  const [modalFreq, setModalFreq] = useState('每天');
  const [modalTime, setModalTime] = useState('09:00');
  const [modalWeekDays, setModalWeekDays] = useState<number[]>([1]);
  const [modalMonthDays, setModalMonthDays] = useState<number[]>([1]);
  const [modalAgentId, setModalAgentId] = useState(AGENT_OPTIONS[0].value);
  const [modalModel, setModalModel] = useState(MODEL_OPTIONS[0].value);

  const openAddModal = () => {
    setModalName('');
    setModalPrompt('');
    setModalFreq('每天');
    setModalTime('09:00');
    setModalWeekDays([1]);
    setModalMonthDays([1]);
    setModalAgentId(AGENT_OPTIONS[0].value);
    setModalModel(MODEL_OPTIONS[0].value);
    setIsModalOpen(true);
  };

  const applyTemplate = (template: (typeof TASK_TEMPLATES)[number]) => {
    setModalName(template.title);
    setModalPrompt(template.desc);
    setModalFreq(template.frequency);
    setModalTime(template.timeVal);
    setModalWeekDays([1]);
    setModalMonthDays([1]);
    setIsModalOpen(true);
  };

  const toggleWeekDay = (day: number) => {
    setModalWeekDays((prev) =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleMonthDay = (day: number) => {
    setModalMonthDays((prev) =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleAddTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!modalName.trim()) return;

    const weekDays = modalFreq === '每周' ? modalWeekDays : undefined;
    const monthDays = modalFreq === '每月' ? modalMonthDays : undefined;

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        name: modalName.trim(),
        prompt: modalPrompt.trim(),
        frequency: modalFreq,
        timeVal: modalTime,
        weekDays,
        monthDays,
        status: 'running',
        lastRun: '新建任务，等待首次调度。',
        agentId: modalAgentId,
        model: modalModel,
      },
      ...prev
    ]);
    setIsModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: task.status === 'running' ? 'idle' : 'running' }
          : task
      )
    );
  };

  const handleExecute = (task: ScheduledTask) => {
    const sessionId = onRunTask(task.name, task.prompt);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const entry: RunHistoryEntry = {
      sessionId,
      sessionTitle: `自动化任务-${today}-${task.name}`,
      timestamp: `今天 ${timeStr}`
    };
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? { ...item, lastRun: `刚刚手动执行，已跳转至会话。`, history: [entry, ...item.history] }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[0.01em] text-[var(--gov-text)]">定时任务</h2>
          <p className="mt-1 text-[12px] text-[var(--gov-text-muted)]">配置定时调度任务，按周期自动执行提示词。</p>
        </div>
        <button type="button" onClick={openAddModal} className="gov-button-primary inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium">
          <Plus size={14} />
          添加任务
        </button>
      </div>

      <div className="gov-panel p-4">
        <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
          <div>
            <div className="text-[13px] font-semibold text-[var(--gov-text)]">已部署的调度任务 ({tasks.length})</div>
            <div className="mt-1 text-[11px] text-[var(--gov-text-muted)]">任务按设定周期定时调度执行。</div>
          </div>
          <span className="text-[10px] text-[var(--gov-text-muted)]">Scheduler · Cron Prototype</span>
        </div>

        <div className="mt-4 space-y-4">
          {tasks.map((task) => {
            const running = task.status === 'running';

            return (
              <div key={task.id} className="rounded-2xl border border-[rgba(35,31,32,0.08)] bg-white p-4 shadow-[0_10px_24px_rgba(15,15,15,0.03)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-[var(--gov-text)]">{task.name}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${running ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-50 text-stone-600'}`}>
                        {running ? '调度运行中' : '已暂停'}
                      </span>
                    </div>

                    {task.prompt && (
                      <p className="mt-2 text-[12px] leading-[20px] text-[var(--gov-text-muted)]">{task.prompt}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[10.5px] text-[var(--gov-text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} />
                        频率：<strong className="text-[var(--gov-text)]">{formatFrequencyLabel(task)}</strong>
                      </span>
                      {task.agentId && (
                        <span className="inline-flex items-center gap-1">
                          <Bot size={12} />
                          专家：<strong className="text-[var(--gov-text)]">{AGENT_OPTIONS.find(a => a.value === task.agentId)?.label || task.agentId}</strong>
                        </span>
                      )}
                      {task.model && (
                        <span className="inline-flex items-center gap-1">
                          模型：<strong className="text-[var(--gov-text)]">{MODEL_OPTIONS.find(m => m.value === task.model)?.label || task.model}</strong>
                        </span>
                      )}
                    </div>

                    {task.history.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--gov-text-muted)]">
                          <MessageSquare size={11} />
                          执行历史
                        </div>
                        <div className="space-y-1">
                          {task.history.map((entry) => (
                            <button
                              key={entry.sessionId}
                              type="button"
                              onClick={() => onOpenSession(entry.sessionId)}
                              className="flex w-full items-center justify-between rounded-lg border border-[rgba(35,31,32,0.05)] bg-[var(--gov-panel-muted)] px-3 py-2 text-left transition hover:border-[rgba(35,31,32,0.1)] hover:bg-white"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <Bot size={12} className="shrink-0 text-[var(--gov-text-muted)]" />
                                <span className="truncate text-[11px] font-medium text-[var(--gov-text)]">{entry.sessionTitle}</span>
                              </div>
                              <span className="shrink-0 text-[10px] text-[var(--gov-text-muted)]">{entry.timestamp}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleExecute(task)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] px-3 py-2 text-[11px] font-medium text-[var(--gov-red)] transition hover:bg-[var(--gov-red)] hover:text-white"
                    >
                      <Play size={13} className="fill-current" />
                      立即执行
                    </button>

                    <button type="button" onClick={() => handleToggleTask(task.id)} className="text-[#64748B] transition hover:text-[#22324A]">
                      {running ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>

                    <button type="button" onClick={() => handleDeleteTask(task.id)} className="rounded-lg p-2 text-[#94A3B8] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-[13px] font-semibold text-[var(--gov-text)]">从调度模板入手</div>
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_TEMPLATES.map((template) => (
            <button
              key={template.title}
              type="button"
              onClick={() => applyTemplate(template)}
              className="rounded-2xl border border-[rgba(35,31,32,0.08)] bg-white p-4 text-left shadow-[0_8px_20px_rgba(15,15,15,0.03)] transition hover:-translate-y-0.5 hover:border-[rgba(35,31,32,0.12)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2563EB]">
                <Clock3 size={16} />
              </div>
              <div className="mt-3 text-[13px] font-semibold text-[var(--gov-text)]">{template.title}</div>
              <div className="mt-2 text-[11px] leading-[18px] text-[var(--gov-text-muted)]">{template.desc}</div>
              <div className="mt-2 text-[10px] text-[var(--gov-text-muted)]">{template.frequency} {template.timeVal}</div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
            <motion.form
              onSubmit={handleAddTask}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-[rgba(35,31,32,0.08)] bg-white p-6 shadow-[0_24px_80px_rgba(15,15,15,0.18)]"
            >
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 rounded-full bg-[#F5F7FB] p-1.5 text-[#94A3B8] transition hover:text-[#22324A]">
                <X size={14} />
              </button>

              <div>
                <div className="text-[18px] font-semibold text-[var(--gov-text)]">添加任务</div>
                <div className="mt-1 text-[11px] text-[var(--gov-text-muted)]">配置任务名称、提示词和调度周期。</div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="space-y-1.5 text-[11px] text-[var(--gov-text-muted)] block">
                  <span>任务名称</span>
                  <input className="gov-input w-full px-3 py-2 text-[12px]" value={modalName} onChange={(event) => setModalName(event.target.value)} placeholder="例如：每日政策速递" />
                </label>

                <label className="space-y-1.5 text-[11px] text-[var(--gov-text-muted)] block">
                  <span>提示词</span>
                  <textarea className="gov-input w-full resize-none px-3 py-2 text-[12px] leading-[20px]" rows={4} value={modalPrompt} onChange={(event) => setModalPrompt(event.target.value)} placeholder="描述任务的执行内容..." />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1.5 text-[11px] text-[var(--gov-text-muted)] block">
                    <span>选择专家</span>
                    <select className="gov-input w-full px-3 py-2 text-[12px]" value={modalAgentId} onChange={(event) => setModalAgentId(event.target.value)}>
                      {AGENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-[11px] text-[var(--gov-text-muted)] block">
                    <span>选择模型</span>
                    <select className="gov-input w-full px-3 py-2 text-[12px]" value={modalModel} onChange={(event) => setModalModel(event.target.value)}>
                      {MODEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1.5 text-[11px] text-[var(--gov-text-muted)] block">
                    <span>执行频率</span>
                    <select className="gov-input w-full px-3 py-2 text-[12px]" value={modalFreq} onChange={(event) => setModalFreq(event.target.value)}>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-[11px] text-[var(--gov-text-muted)] block">
                    <span>执行时间</span>
                    <input type="time" className="gov-input w-full px-3 py-2 text-[12px]" value={modalTime} onChange={(event) => setModalTime(event.target.value)} />
                  </label>
                </div>

                {modalFreq === '每周' && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[var(--gov-text-muted)]">选择星期</span>
                    <div className="flex flex-wrap gap-1.5">
                      {WEEK_DAY_OPTIONS.map((opt) => {
                        const active = modalWeekDays.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleWeekDay(opt.value)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                              active
                                ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red)]'
                                : 'border-[var(--gov-border)] bg-white text-[var(--gov-text-muted)] hover:border-[var(--gov-border-strong)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {modalFreq === '每月' && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[var(--gov-text-muted)]">选择日期（可多选）</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const active = modalMonthDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleMonthDay(day)}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition min-w-[32px] text-center ${
                              active
                                ? 'border-[var(--gov-red-line)] bg-[var(--gov-red-soft)] text-[var(--gov-red)]'
                                : 'border-[var(--gov-border)] bg-white text-[var(--gov-text-muted)] hover:border-[var(--gov-border-strong)]'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="gov-button-secondary px-4 py-2 text-[12px] font-medium">
                  取消
                </button>
                <button type="submit" className="gov-button-primary px-4 py-2 text-[12px] font-medium">
                  创建任务
                </button>
              </div>
            </motion.form>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
