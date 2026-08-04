import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Plus,
  Settings2,
  X,
} from 'lucide-react';
import WebOfficeEditor from './WebOfficeEditor';

interface DocReviewViewProps {
  role: string;
}

interface ReviewRuleGroup {
  title: string;
  enabled: boolean;
  rules: string[];
}

interface ReviewScheme {
  id: string;
  name: string;
  tag: string;
  desc: string;
  rules: ReviewRuleGroup[];
}

const REVIEW_SCHEMES: ReviewScheme[] = [
  {
    id: 'system',
    name: '系统方案',
    tag: '系统',
    desc: '适用于党政机关及国企通用公文，覆盖基础质量、政治表述、领导信息和行文规范。',
    rules: [
      { title: '基础质量', enabled: true, rules: ['字词句', '标点符号', '句子重复', '生僻字', '逻辑性检测', '政治表述审核'] },
      { title: '意识形态', enabled: true, rules: ['领导干部相关', '落马官员', '表述错误 / 表述建议'] },
      { title: '公文规范', enabled: true, rules: ['发文字号', '标题层级', '字体字号', '版记与页码'] },
    ],
  },
  {
    id: 'official',
    name: '正式发文专项方案',
    tag: '推荐',
    desc: '用于通知、请示、报告等正式发文，强化格式规范、政治用语和法定要素检测。',
    rules: [
      { title: '基础质量', enabled: true, rules: ['错别字', '标点符号', '语句通顺', '句子重复'] },
      { title: '政治与合规', enabled: true, rules: ['政治表述', '政策依据', '敏感用语', '权责边界'] },
      { title: 'GB/T 9704', enabled: true, rules: ['版心尺寸', '标题格式', '发文字号', '落款日期', '页码'] },
    ],
  },
  {
    id: 'briefing',
    name: '简报材料审校方案',
    tag: '常用',
    desc: '适用于工作简报、汇报材料和领导讲话，重点检查数据、逻辑与表达质量。',
    rules: [
      { title: '表达质量', enabled: true, rules: ['语病', '冗余表达', '口语化', '段落衔接'] },
      { title: '事实核验', enabled: true, rules: ['时间一致性', '数据一致性', '机构名称', '领导职务'] },
      { title: '结构规范', enabled: true, rules: ['标题层级', '序号连续性', '前后呼应'] },
    ],
  },
];

export default function DocReviewView({ role: _role }: DocReviewViewProps) {
  const [schemeManagerOpen, setSchemeManagerOpen] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('system');
  const [detectionMode, setDetectionMode] = useState<'page' | 'full'>('page');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [reviewComplete, setReviewComplete] = useState(false);

  const selectedScheme = REVIEW_SCHEMES.find((scheme) => scheme.id === selectedSchemeId) ?? REVIEW_SCHEMES[0];
  const documentTitle = uploadedFile?.name.replace(/\.[^.]+$/, '') || '未命名审校文稿';


  const renderSchemeManagerModal = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/25 p-5 backdrop-blur-[1px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setSchemeManagerOpen(false); }}>
      <motion.div initial={{ opacity: 0, y: 8, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.99 }} className="flex h-[min(760px,90vh)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[12px] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(35,31,32,0.18)]">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.06] px-5">
          <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--gov-red-soft)] text-[var(--gov-red)]"><Settings2 size={15} /></span><div><h2 className="text-[14px] font-semibold text-[var(--gov-text)]">审校方案管理</h2><p className="mt-0.5 text-[9px] text-[var(--gov-text-muted)]">维护检测范围与规则配置</p></div></div>
          <div className="flex items-center gap-2"><button type="button" className="inline-flex items-center gap-1.5 rounded-[7px] border border-black/[0.08] px-3 py-1.5 text-[10px] font-medium text-[var(--gov-text)] hover:bg-stone-50"><Plus size={12} />新建方案</button><button type="button" onClick={() => setSchemeManagerOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-stone-400 hover:bg-stone-100 hover:text-stone-600" aria-label="关闭方案管理"><X size={15} /></button></div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-[268px] shrink-0 border-r border-black/[0.06] bg-[var(--gov-panel-muted)] p-4">
            <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-semibold text-[var(--gov-text)]">方案列表</span><span className="text-[9px] text-[var(--gov-text-muted)]">{REVIEW_SCHEMES.length} 个</span></div>
            <div className="space-y-1.5">{REVIEW_SCHEMES.map((scheme) => { const selected = scheme.id === selectedSchemeId; return <button key={scheme.id} type="button" onClick={() => setSelectedSchemeId(scheme.id)} className={`w-full rounded-[8px] border p-3 text-left transition ${selected ? 'border-[var(--gov-red)] bg-white shadow-sm' : 'border-transparent hover:border-black/[0.06] hover:bg-white'}`}><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[var(--gov-text)]">{scheme.name}</span><span className={`rounded px-1.5 py-0.5 text-[8px] ${selected ? 'bg-[var(--gov-red-soft)] text-[var(--gov-red)]' : 'bg-stone-100 text-stone-500'}`}>{scheme.tag}</span></div><p className="mt-1.5 line-clamp-2 text-[9px] leading-4 text-[var(--gov-text-muted)]">{scheme.desc}</p></button>; })}</div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-black/[0.05] px-5 py-4"><div className="flex items-start justify-between gap-5"><div><div className="flex items-center gap-2"><h3 className="text-[13px] font-semibold text-[var(--gov-text)]">{selectedScheme.name}</h3><span className="rounded bg-stone-100 px-2 py-0.5 text-[8px] text-stone-500">{selectedScheme.tag}</span></div><p className="mt-1.5 max-w-2xl text-[9px] leading-4 text-[var(--gov-text-muted)]">{selectedScheme.desc}</p></div><button type="button" className="rounded-[6px] border border-black/[0.08] px-2.5 py-1.5 text-[9px] text-stone-600 hover:bg-stone-50">编辑信息</button></div></div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-3 flex items-center gap-7 rounded-[8px] border border-black/[0.06] bg-[var(--gov-panel-muted)] px-4 py-3"><span className="text-[10px] font-semibold text-[var(--gov-text)]">默认检测模式</span><label className="flex cursor-pointer items-center gap-2 text-[10px] text-stone-600"><input type="radio" checked={detectionMode === 'page'} onChange={() => setDetectionMode('page')} className="accent-[var(--gov-red)]" />仅页面内容</label><label className="flex cursor-pointer items-center gap-2 text-[10px] text-stone-600"><input type="radio" checked={detectionMode === 'full'} onChange={() => setDetectionMode('full')} className="accent-[var(--gov-red)]" />全面检测</label></div>
              <div className="space-y-2.5">{selectedScheme.rules.map((group) => <section key={group.title} className="overflow-hidden rounded-[8px] border border-black/[0.07]"><div className="flex items-center gap-2 border-b border-black/[0.05] bg-[var(--gov-panel-muted)] px-4 py-2.5"><span className={`flex h-4 w-4 items-center justify-center rounded border ${group.enabled ? 'border-[var(--gov-red)] bg-[var(--gov-red)] text-white' : 'border-stone-300'}`}>{group.enabled ? <Check size={9} /> : null}</span><span className="text-[10px] font-semibold text-[var(--gov-text)]">{group.title}</span><Info size={10} className="text-stone-400" /></div><div className="grid grid-cols-3 gap-x-6 gap-y-2.5 px-4 py-3.5">{group.rules.map((rule) => <div key={rule} className="flex items-center gap-2 text-[9px] text-stone-600"><span className="flex h-4 w-4 items-center justify-center rounded border border-black/[0.08] bg-white text-[var(--gov-red)]"><Check size={8} /></span>{rule}</div>)}</div></section>)}</div>
            </div>
            <div className="flex items-center justify-between border-t border-black/[0.06] bg-white px-5 py-3.5"><span className="text-[9px] text-[var(--gov-text-muted)]">已启用 {selectedScheme.rules.reduce((count, group) => count + group.rules.length, 0)} 项检测规则</span><div className="flex items-center gap-2"><button type="button" onClick={() => setSchemeManagerOpen(false)} className="rounded-[7px] border border-black/[0.08] px-4 py-2 text-[10px] font-medium text-stone-600 hover:bg-stone-50">取消</button><button type="button" onClick={() => setSchemeManagerOpen(false)} className="rounded-[7px] bg-[var(--gov-red)] px-4 py-2 text-[10px] font-semibold text-white hover:opacity-90">保存方案</button></div></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div key="review-workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-stone-200 bg-neutral-50/70 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600"><ClipboardCheck size={13} /></span><span className="truncate text-[11px] font-medium text-stone-800">{uploadedFile?.name || '未命名审校文稿'}</span><span className="hidden text-[10px] text-stone-300 sm:inline">|</span><span className="hidden text-[11px] text-stone-500 sm:inline">AI 审校工作台</span></div>
        <div className="flex items-center gap-2">{reviewComplete ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700"><CheckCircle2 size={11} />校对完成</span> : null}{documentText ? <button type="button" onClick={() => { setUploadedFile(null); setDocumentText(''); setReviewComplete(false); }} className="rounded px-2.5 py-1 text-[10px] text-stone-500 hover:bg-stone-200/70">新建审校</button> : null}</div>
      </div>
      <WebOfficeEditor value={documentText} onChange={setDocumentText} documentTitle={documentTitle} />
      <AnimatePresence>{schemeManagerOpen ? renderSchemeManagerModal() : null}</AnimatePresence>
    </motion.div>
  );
}
