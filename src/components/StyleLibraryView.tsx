import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Database,
  Edit3,
  Feather,
  FileText,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';

type StyleDimension = {
  dimension: string;
  experiences: string[];
};

type StyleTemplateStatus = 'ready' | 'extracting';

type StyleTemplate = {
  id: string;
  title: string;
  createdAt: string;
  materialCount: number;
  status: StyleTemplateStatus;
  progress: number;
  materials: Array<{ id: string; name: string; type: 'docx' | 'pdf' | 'txt' }>;
  dimensions: StyleDimension[];
  wordCloud: Record<string, number>;
};

const SAMPLE_DIMENSIONS: StyleDimension[] = [
  {
    dimension: '组织结构',
    experiences: [
      '开篇常采用“背景+场合+身份”的正式结构，先交代会议、活动或工作背景，再通过称谓和目的说明迅速进入主题，整体节奏庄重直接。',
      '主体偏好“总-分-总”框架，通过并列式段落标题自然划分板块，段内再以“这里有……；这里有……”或“一是……二是……”展开，使层次清晰、便于听众跟随。',
      '结尾通常使用对仗短句或固定祝福句式进行收束，先完成情感升华，再发出号召或提出工作要求，形成庄重有力的结束语。',
    ],
  },
  {
    dimension: '语言表达',
    experiences: [
      '偏好正式、书面、节奏鲜明的公文语体，高频使用“从严从实、抓主抓重、补短补弱”等四字短语强化力度。',
      '在致辞和讲话场景中，会适度使用典故引用、对仗句和排比句营造文化厚度，形成“铺陈-总结-邀请”的表达节奏。',
      '在总结汇报中常使用“现将……情况报告如下”“为……提供有力支撑”等承上启下和成果收束表达，语气稳健务实。',
    ],
  },
  {
    dimension: '创作手法',
    experiences: [
      '习惯采用“定性概括+分层展开+实证支撑”的组合方式，先提出核心判断，再用数据、案例和典型问题支撑论点。',
      '常通过“宏观形势研判+核心理念阐释+具体突破路径”的三段式结构，从战略判断自然落脚到可执行举措。',
      '善于使用对仗工整的短语、俗语或诗句增强感染力，使行政表达兼具执行紧迫感和文学韵律。',
    ],
  },
  {
    dimension: '关键词',
    experiences: [
      '总-分-总、严谨务实、主题聚焦、公文语体、典故引用、典雅含蓄、号召有力、四字短语、官方正式、对仗工整。',
      '层层递进、层级分明、庄重宏大、情感升华、意象营造、承上启下、指令清晰、排比铺陈、收束有力、数字概括。',
    ],
  },
];

const SAMPLE_WORD_CLOUD: Record<string, number> = {
  '总-分-总': 92,
  严谨务实: 86,
  主题聚焦: 71,
  公文语体: 91,
  典故引用: 81,
  典雅含蓄: 77,
  号召有力: 83,
  四字短语: 94,
  官方正式: 73,
  对仗工整: 96,
  层层递进: 74,
  层级分明: 85,
  庄重宏大: 98,
  情感升华: 87,
  意象营造: 88,
  承上启下: 70,
  指令清晰: 68,
  排比铺陈: 95,
  收束有力: 67,
  数字概括: 89,
  数据支撑: 82,
  文化厚重: 69,
  文学引入: 90,
  气势磅礴: 79,
  结构规范: 80,
  节奏鲜明: 84,
};

const TEMPLATE_CARD_ACCENTS = [
  {
    shell: 'from-[#fff6f7] via-white to-[#f6f0ff]',
    iconBg: 'bg-[rgba(231,77,94,0.10)]',
    iconText: 'text-[var(--gov-red)]',
    line: 'bg-[linear-gradient(90deg,rgba(231,77,94,0.95),rgba(139,124,246,0.72))]',
  },
  {
    shell: 'from-[#f5f2ff] via-white to-[#f7fbff]',
    iconBg: 'bg-[#efeaff]',
    iconText: 'text-[#8b7cf6]',
    line: 'bg-[linear-gradient(90deg,rgba(139,124,246,0.90),rgba(77,201,217,0.65))]',
  },
  {
    shell: 'from-[#fff7f2] via-white to-[#f3fbf8]',
    iconBg: 'bg-[#fff0e8]',
    iconText: 'text-[#ff8a4c]',
    line: 'bg-[linear-gradient(90deg,rgba(255,138,76,0.92),rgba(78,205,196,0.62))]',
  },
  {
    shell: 'from-[#f2fbf8] via-white to-[#fff5f7]',
    iconBg: 'bg-[#e7f8f3]',
    iconText: 'text-[#39b89f]',
    line: 'bg-[linear-gradient(90deg,rgba(57,184,159,0.92),rgba(231,77,94,0.62))]',
  },
];

const MATERIAL_LIBRARY = [
  { id: 'm-1', name: '仿写文件：在第三届怀化市旅游发展大会开幕式上的致辞.docx', type: 'docx' as const },
  { id: 'm-2', name: '仿写文件：总结讲话.docx', type: 'docx' as const },
  { id: 'm-3', name: '仿写文件：余欣荣副部长在全国农业物联网成果观摩交流活动上的讲话.docx', type: 'docx' as const },
  { id: 'm-4', name: '宣城市文广新局2018年工作总结报告.docx', type: 'docx' as const },
  { id: 'm-5', name: '报告3干扰2-“千万工程”蕴含的科学方法论.pdf', type: 'pdf' as const },
  { id: 'm-6', name: '报告3可参考-“放管服”经验上升为法规.docx', type: 'docx' as const },
];

const initialTemplates: StyleTemplate[] = [
  {
    id: 'style-speech',
    title: '讲话',
    createdAt: '2026-08-11 17:46:56',
    materialCount: 4,
    status: 'ready',
    progress: 100,
    materials: MATERIAL_LIBRARY.slice(0, 4),
    dimensions: SAMPLE_DIMENSIONS,
    wordCloud: SAMPLE_WORD_CLOUD,
  },
  {
    id: 'style-speech-draft',
    title: '讲话稿',
    createdAt: '2026-07-15 11:08:22',
    materialCount: 1,
    status: 'ready',
    progress: 100,
    materials: MATERIAL_LIBRARY.slice(1, 2),
    dimensions: SAMPLE_DIMENSIONS,
    wordCloud: { ...SAMPLE_WORD_CLOUD, 人文关怀: 98, 产业定位: 91, 功能明确: 83 },
  },
  {
    id: 'style-address',
    title: '致辞',
    createdAt: '2026-06-15 14:13:42',
    materialCount: 1,
    status: 'ready',
    progress: 100,
    materials: MATERIAL_LIBRARY.slice(2, 3),
    dimensions: SAMPLE_DIMENSIONS,
    wordCloud: { ...SAMPLE_WORD_CLOUD, 平台化: 96, 产业化: 93, 专业术语: 82 },
  },
];

const formatNow = () => {
  const now = new Date();
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const cloneExtractedResult = () => ({
  dimensions: SAMPLE_DIMENSIONS.map((dimension) => ({
    dimension: dimension.dimension,
    experiences: [...dimension.experiences],
  })),
  wordCloud: { ...SAMPLE_WORD_CLOUD },
});

function WordCloudPreview({ words, compact = false }: { words: Record<string, number>; compact?: boolean }) {
  const entries = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, compact ? 18 : 30);
  const colors = ['#e74d5e', '#8b7cf6', '#ff8a4c', '#39b89f', '#52606d'];
  return (
    <div className={`relative overflow-hidden rounded-[12px] bg-[#fff8fa] ${compact ? 'h-[150px]' : 'min-h-[168px] p-5'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(231,77,94,0.16),transparent_28%),radial-gradient(circle_at_80%_72%,rgba(139,124,246,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,245,247,0.72))]" />
      <div className={`relative flex h-full flex-wrap items-center justify-center gap-x-3 gap-y-1 ${compact ? 'px-4 py-3' : ''}`}>
        {entries.map(([word, weight], index) => {
          const size = compact ? 13 + Math.round((weight - 65) / 7) : 15 + Math.round((weight - 65) / 5);
          const opacity = 0.62 + Math.min((weight - 65) / 60, 0.35);
          return (
            <span
              key={`${word}-${index}`}
              className="font-extrabold leading-none"
              style={{ fontSize: size, opacity, color: colors[index % colors.length] }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MaterialIcon({ type }: { type: 'docx' | 'pdf' | 'txt' }) {
  const color = type === 'pdf' ? 'bg-[#ff4d5d]' : type === 'txt' ? 'bg-[#8b7cf6]' : 'bg-[#1c9bf0]';
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] ${color} text-[10px] font-black uppercase text-white shadow-[0_8px_18px_rgba(15,23,42,0.10)]`}>
      {type === 'docx' ? 'W' : type}
    </span>
  );
}

export default function StyleLibraryView() {
  const [templates, setTemplates] = useState<StyleTemplate[]>(initialTemplates);
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftMaterials, setDraftMaterials] = useState(MATERIAL_LIBRARY.slice(0, 3));
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editedDimensions, setEditedDimensions] = useState<StyleDimension[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTemplates((prev) =>
        prev.map((template) => {
          if (template.status !== 'extracting') return template;
          const nextProgress = Math.min(100, template.progress + 12);
          if (nextProgress >= 100) {
            const result = cloneExtractedResult();
            return {
              ...template,
              status: 'ready',
              progress: 100,
              dimensions: result.dimensions,
              wordCloud: result.wordCloud,
            };
          }
          return { ...template, progress: nextProgress };
        })
      );
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  const filteredTemplates = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return templates;
    return templates.filter((template) => template.title.includes(trimmed));
  }, [query, templates]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const isEditing = Boolean(selectedTemplate && editingTemplateId === selectedTemplate.id);

  const resetCreateForm = () => {
    setDraftTitle('');
    setDraftMaterials(MATERIAL_LIBRARY.slice(0, 3));
    setIsMaterialMenuOpen(false);
  };

  const createTemplate = () => {
    if (!draftTitle.trim() || draftMaterials.length === 0) return;
    const newTemplate: StyleTemplate = {
      id: `style-${Date.now()}`,
      title: draftTitle.trim(),
      createdAt: formatNow(),
      materialCount: draftMaterials.length,
      status: 'extracting',
      progress: 0,
      materials: draftMaterials,
      dimensions: [],
      wordCloud: {},
    };
    setTemplates((prev) => [newTemplate, ...prev]);
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const retrainTemplate = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? { ...template, status: 'extracting', progress: 0, dimensions: [], wordCloud: {} }
          : template
      )
    );
    setEditingTemplateId(null);
  };

  const startEditing = (template: StyleTemplate) => {
    setEditedDimensions(template.dimensions.map((dimension) => ({
      dimension: dimension.dimension,
      experiences: [...dimension.experiences],
    })));
    setEditingTemplateId(template.id);
  };

  const saveEditing = () => {
    if (!selectedTemplate) return;
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === selectedTemplate.id ? { ...template, dimensions: editedDimensions } : template
      )
    );
    setEditingTemplateId(null);
  };

  const toggleDraftMaterial = (materialId: string) => {
    const material = MATERIAL_LIBRARY.find((item) => item.id === materialId);
    if (!material) return;
    setDraftMaterials((prev) => {
      if (prev.some((item) => item.id === materialId)) return prev.filter((item) => item.id !== materialId);
      if (prev.length >= 6) return prev;
      return [...prev, material];
    });
  };

  const addLocalMaterial = () => {
    if (draftMaterials.length >= 6) return;
    setDraftMaterials((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, name: `本地文稿-${prev.length + 1}.docx`, type: 'docx' },
    ]);
  };

  const detailDimensions = isEditing ? editedDimensions : selectedTemplate?.dimensions ?? [];

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_18%_10%,rgba(231,77,94,0.10),transparent_28%),radial-gradient(circle_at_84%_4%,rgba(139,124,246,0.11),transparent_30%),#fafbfc] px-8 py-7">
      <div className="mx-auto max-w-[1560px]">
        <div className="mb-6 overflow-hidden rounded-[18px] border border-white/70 bg-white/82 p-6 shadow-[0_22px_58px_rgba(40,37,43,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(231,77,94,0.14),rgba(139,124,246,0.13))] text-[var(--gov-red)] shadow-[inset_0_-6px_14px_rgba(231,77,94,0.08)]">
                <Feather size={28} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[25px] font-extrabold text-[#202124]">文风库</h2>
                <p className="mt-2 max-w-[760px] text-[13px] leading-6 text-[#7d8794]">把领导文风、单位范文和高频材料沉淀为可复用模板，提取结构、表达、手法与关键词，后续可直接参与公文生成。</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[linear-gradient(135deg,var(--gov-red),#d83d79)] px-5 text-[14px] font-bold text-white shadow-[0_14px_30px_rgba(190,51,62,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(190,51,62,0.24)]"
            >
              <Plus size={17} />
              新建文风模板
            </button>
          </div>

          <div className="mt-6 flex h-11 w-full max-w-[520px] items-center gap-2 rounded-[12px] border border-black/[0.07] bg-white px-3 shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
            <Search size={17} className="text-[#a0a7b2]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索文风标题、关键词"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#202124] outline-none placeholder:text-[#a0a7b2]"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
          {filteredTemplates.map((template, index) => {
            const accent = TEMPLATE_CARD_ACCENTS[index % TEMPLATE_CARD_ACCENTS.length];
            return (
            <button
              key={template.id}
              type="button"
              onClick={() => template.status === 'ready' && setSelectedTemplateId(template.id)}
              className={`group relative overflow-hidden rounded-[16px] border border-white/80 bg-gradient-to-br ${accent.shell} p-5 text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] transition hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(82,38,46,0.12)] disabled:cursor-wait`}
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${accent.line}`} />
              <div className="mb-4 flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-[13px] ${accent.iconBg} ${accent.iconText} shadow-[inset_0_-5px_12px_rgba(255,255,255,0.45)]`}>
                  <Feather size={22} />
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-[17px] font-extrabold text-[#202124]">{template.title}</span>
                  <span className="mt-1 block text-[12px] font-semibold text-[#98a2b3]">文风模板</span>
                </div>
              </div>

              {template.status === 'extracting' ? (
                <div className="flex h-[150px] flex-col items-center justify-center rounded-[12px] bg-white/66 text-center ring-1 ring-black/[0.04]">
                  <Loader2 size={28} className="animate-spin text-[var(--gov-red)]" />
                  <p className="mt-3 text-[14px] font-bold text-[#344054]">{template.progress}%</p>
                  <p className="mt-2 text-[13px] font-semibold text-[#98a2b3]">文风正在生成中</p>
                  <p className="mt-1 text-[12px] text-[#a0a7b2]">生成后可在写作中被使用</p>
                </div>
              ) : (
                <WordCloudPreview words={template.wordCloud} compact />
              )}

              <div className="mt-4 flex items-center justify-between text-[13px] text-[#667085]">
                <span>{template.createdAt}</span>
                <span>已选{template.materialCount}篇素材</span>
              </div>
            </button>
          );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isCreateOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="flex max-h-[86vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
            >
              <div className="flex h-16 items-center justify-between border-b border-black/[0.06] bg-[linear-gradient(135deg,#fff7f8,#f8f4ff)] px-7">
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-extrabold text-[#202124]">新建文风模板</h3>
                  <span className="text-[13px] font-semibold text-[#98a2b3]">训练文本少于100字或者为英文时训练不生效</span>
                </div>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-[9px] p-2 text-[#667085] hover:bg-white hover:text-[#202124]">
                  <X size={22} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
                <div className="mb-7">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-6 w-1 rounded-full bg-[var(--gov-red)]" />
                    <span className="text-[16px] font-extrabold text-[#202124]">文风标题（必填）</span>
                  </div>
                  <div className="relative">
                    <input
                      value={draftTitle}
                      maxLength={50}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      placeholder="请输入文风标题"
                      className="h-12 w-full rounded-[10px] border border-black/[0.10] px-4 pr-16 text-[14px] outline-none transition focus:border-[var(--gov-red)] focus:ring-4 focus:ring-[rgba(231,77,94,0.10)]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#98a2b3]">{draftTitle.length} / 50</span>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-1 rounded-full bg-[var(--gov-red)]" />
                      <span className="text-[16px] font-extrabold text-[#202124]">文风素材（必填）</span>
                      <span className="rounded-full bg-[rgba(231,77,94,0.09)] px-2 py-1 text-[11px] font-bold text-[var(--gov-red)]">最多 6 篇</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-[320px] items-center gap-2 rounded-[9px] border border-black/[0.10] bg-white px-3">
                        <Search size={16} className="text-[#a0a7b2]" />
                        <input placeholder="请输入关键词" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#a0a7b2]" />
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsMaterialMenuOpen((value) => !value)}
                          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[linear-gradient(135deg,var(--gov-red),#8b7cf6)] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_24px_rgba(190,51,62,0.18)] transition hover:-translate-y-0.5"
                        >
                          <Plus size={17} />
                          文风素材 {draftMaterials.length}/6
                        </button>
                        {isMaterialMenuOpen ? (
                          <div className="absolute right-0 top-12 z-20 w-[260px] rounded-[10px] border border-black/[0.08] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
                            {[
                              { label: '上传本地文稿', icon: UploadCloud, onClick: addLocalMaterial },
                              { label: '从素材库添加', icon: Database, onClick: () => toggleDraftMaterial('m-5') },
                              { label: '从知识管理添加', icon: FileText, onClick: () => toggleDraftMaterial('m-6') },
                              { label: '手动输入文本', icon: Edit3, onClick: () => addLocalMaterial() },
                              { label: '从历史记录添加', icon: History, onClick: () => toggleDraftMaterial('m-4') },
                            ].map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={item.onClick}
                                  className="flex h-11 w-full items-center gap-3 px-4 text-left text-[14px] font-semibold text-[#30343b] transition hover:bg-[rgba(231,77,94,0.07)] hover:text-[var(--gov-red)]"
                                >
                                  <Icon size={17} className="text-[#8a93a3]" />
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {draftMaterials.map((material) => (
                      <div key={material.id} className="flex h-14 items-center justify-between rounded-[9px] border border-black/[0.08] bg-white px-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <MaterialIcon type={material.type} />
                          <span className="truncate text-[14px] font-semibold text-[#202124]">{material.name}</span>
                        </div>
                        <button type="button" onClick={() => setDraftMaterials((prev) => prev.filter((item) => item.id !== material.id))} className="rounded-[8px] p-1.5 text-[#98a2b3] hover:bg-[#f6f7fb] hover:text-[var(--gov-red)]">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-h-[72px] items-center justify-end gap-3 border-t border-black/[0.08] px-7 py-4">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="h-10 rounded-[8px] border border-black/[0.10] bg-white px-5 text-[14px] font-bold text-[#667085] hover:bg-[#f7f8fb]">取消</button>
                <button type="button" disabled={!draftTitle.trim() || draftMaterials.length === 0} onClick={createTemplate} className="h-10 rounded-[8px] bg-[linear-gradient(135deg,var(--gov-red),#d83d79)] px-6 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(190,51,62,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#d6dbe6] disabled:shadow-none">保存并提取</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTemplate ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="flex max-h-[88vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
            >
              <div className="flex h-16 items-center justify-between border-b border-black/[0.06] bg-[linear-gradient(135deg,#fff7f8,#f8f4ff)] px-7">
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-extrabold text-[#202124]">文风详情</h3>
                  <span className="text-[13px] font-semibold text-[#98a2b3]">训练文本少于100字或者为英文时训练不生效</span>
                </div>
                <button type="button" onClick={() => setSelectedTemplateId(null)} className="rounded-[9px] p-2 text-[#667085] hover:bg-white hover:text-[#202124]">
                  <X size={22} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[rgba(231,77,94,0.10)] text-[var(--gov-red)]">
                    <Feather size={22} />
                  </span>
                  <div>
                    <p className="text-[18px] font-extrabold text-[#202124]">{selectedTemplate.title}</p>
                    <p className="mt-1 text-[12px] font-medium text-[#8a93a3]">{selectedTemplate.createdAt} · 已选{selectedTemplate.materialCount}篇素材</p>
                  </div>
                </div>

                <div className="mb-7">
                  <span className="mb-2 inline-flex rounded-t-[8px] bg-[linear-gradient(135deg,var(--gov-red),#8b7cf6)] px-3 py-1.5 text-[13px] font-bold text-white">文风关键词</span>
                  <WordCloudPreview words={selectedTemplate.wordCloud} />
                </div>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-1 rounded-full bg-[var(--gov-red)]" />
                    <span className="text-[16px] font-extrabold text-[#202124]">文风素材（必填）</span>
                    <span className="text-[12px] font-semibold text-[#98a2b3]">如果修改文风素材，则会在保存后重新生成该文风模板</span>
                  </div>
                  <div className="flex h-10 w-[320px] items-center gap-2 rounded-[9px] border border-black/[0.10] bg-white px-3">
                    <Search size={16} className="text-[#a0a7b2]" />
                    <input placeholder="请输入关键词" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#a0a7b2]" />
                  </div>
                </div>

                <div className="mb-7 space-y-3">
                  {selectedTemplate.materials.map((material) => (
                    <div key={material.id} className="flex h-14 items-center rounded-[9px] border border-black/[0.08] bg-white px-4">
                      <MaterialIcon type={material.type} />
                      <span className="ml-3 truncate text-[14px] font-semibold text-[#202124]">{material.name}</span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {detailDimensions.map((dimension, dimensionIndex) => (
                    <div key={dimension.dimension} className="rounded-[14px] border border-black/[0.06] bg-[linear-gradient(135deg,#ffffff,#fff9fb)] p-4 shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[rgba(231,77,94,0.10)] text-[12px] font-black text-[var(--gov-red)]">{dimensionIndex + 1}</span>
                        <span className="text-[15px] font-extrabold text-[#202124]">{dimension.dimension}</span>
                      </div>
                      <div className="space-y-2">
                        {dimension.experiences.map((experience, experienceIndex) => (
                          isEditing ? (
                            <textarea
                              key={`${dimension.dimension}-${experienceIndex}`}
                              value={experience}
                              onChange={(event) =>
                                setEditedDimensions((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === dimensionIndex
                                      ? {
                                          ...item,
                                          experiences: item.experiences.map((text, textIndex) => textIndex === experienceIndex ? event.target.value : text),
                                        }
                                      : item
                                  )
                                )
                              }
                              rows={4}
                              className="w-full resize-none rounded-[10px] border border-black/[0.08] bg-white px-3 py-2 text-[12px] leading-6 text-[#344054] outline-none focus:border-[var(--gov-red)] focus:ring-4 focus:ring-[rgba(231,77,94,0.10)]"
                            />
                          ) : (
                            <p key={`${dimension.dimension}-${experienceIndex}`} className="rounded-[10px] bg-white px-3 py-2 text-[12px] leading-6 text-[#475467] ring-1 ring-black/[0.04]">
                              {experience}
                            </p>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-h-[72px] items-center justify-end gap-3 border-t border-black/[0.08] px-7 py-4">
                {isEditing ? (
                  <>
                    <button type="button" onClick={() => setEditingTemplateId(null)} className="h-10 rounded-[8px] border border-black/[0.10] bg-white px-5 text-[14px] font-bold text-[#667085] hover:bg-[#f7f8fb]">取消编辑</button>
                    <button type="button" onClick={saveEditing} className="h-10 rounded-[8px] bg-[linear-gradient(135deg,var(--gov-red),#d83d79)] px-6 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(190,51,62,0.18)] transition hover:-translate-y-0.5">保存</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => retrainTemplate(selectedTemplate.id)} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-black/[0.10] bg-white px-5 text-[14px] font-bold text-[#667085] hover:bg-[#f7f8fb]">
                      <RefreshCw size={15} />
                      重新提取
                    </button>
                    <button type="button" onClick={() => startEditing(selectedTemplate)} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-black/[0.10] bg-white px-5 text-[14px] font-bold text-[#667085] hover:bg-[#f7f8fb]">
                      <Edit3 size={15} />
                      编辑
                    </button>
                    <button type="button" onClick={() => setSelectedTemplateId(null)} className="h-10 rounded-[8px] bg-[linear-gradient(135deg,var(--gov-red),#d83d79)] px-6 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(190,51,62,0.18)] transition hover:-translate-y-0.5">关闭</button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
