import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BookOpenCheck,
  Bold,
  Brain,
  Brush,
  ChevronDown,
  Eraser,
  FileText,
  Fullscreen,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Languages,
  List,
  MessageCircle,
  PaintBucket,
  PenLine,
  Plus,
  Printer,
  Redo2,
  Search,
  Sparkles,
  Strikethrough,
  Underline,
  Undo2,
  Wand2,
} from 'lucide-react';

interface WebOfficeEditorProps {
  value: string;
  onChange: (value: string) => void;
  documentTitle: string;
  variant?: 'draft' | 'polished';
}

const visualButtons = [
  { label: '撤销', icon: Undo2 },
  { label: '重做', icon: Redo2 },
  { label: '格式刷', icon: Brush },
  { label: '清除格式', icon: Eraser },
  { label: '粗体', icon: Bold },
  { label: '斜体', icon: Italic },
  { label: '下划线', icon: Underline },
  { label: '删除线', icon: Strikethrough },
  { label: '文字颜色', icon: PaintBucket },
  { label: '左对齐', icon: AlignLeft },
  { label: '居中', icon: AlignCenter },
  { label: '右对齐', icon: AlignRight },
  { label: '两端对齐', icon: AlignJustify },
  { label: '项目列表', icon: List },
  { label: '减少缩进', icon: IndentDecrease },
  { label: '增加缩进', icon: IndentIncrease },
];

const aiMenuItems = [
  { label: 'AI帮我写', desc: '生成正文、提纲和补充段落', icon: PenLine },
  { label: 'AI帮我改', desc: '优化表达、压缩口语化内容', icon: Wand2 },
  { label: 'AI文档问答', desc: '围绕当前文稿进行提问', icon: MessageCircle },
  { label: 'AI全文总结', desc: '提炼全文要点和结论', icon: FileText },
  { label: 'AI段落总结', desc: '概括选中段落内容', icon: BookOpenCheck },
  { label: 'AI翻译', desc: '中英互译并保持正式语气', icon: Languages },
  { label: 'AI解释', desc: '解释政策、术语和复杂表述', icon: Highlighter },
  { label: '深度思考', desc: '拓展分析角度和论证框架', icon: Brain },
];

function ToolButton({ label, icon: Icon }: { key?: React.Key; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }) {
  return (
    <button
      type="button"
      title={`${label}（界面展示）`}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      className="weboffice-icon-button inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-600 transition hover:bg-stone-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b8def]"
    >
      <Icon size={16} strokeWidth={1.8} />
    </button>
  );
}

function ToolbarSelect({ children, width = 'w-[82px]' }: { children: React.ReactNode; width?: string }) {
  return (
    <button
      type="button"
      title="界面展示"
      onMouseDown={(event) => event.preventDefault()}
      className={`inline-flex h-8 ${width} shrink-0 items-center justify-between rounded border border-stone-200 bg-white px-2.5 text-[12px] text-stone-600 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b8def]`}
    >
      <span className="truncate">{children}</span>
      <ChevronDown size={11} className="shrink-0 text-stone-400" />
    </button>
  );
}

export default function WebOfficeEditor({ value, onChange, documentTitle, variant = 'draft' }: WebOfficeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const aiTriggerRef = useRef<HTMLButtonElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const wordCount = value.trim() ? value.trim().length : 0;

  useEffect(() => {
    if (!focused && editorRef.current && editorRef.current.innerText !== value) {
      editorRef.current.innerText = value;
    }
  }, [focused, value]);

  useEffect(() => {
    if (!isAiMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const clickedTrigger = aiTriggerRef.current?.contains(target);
      const clickedMenu = aiMenuRef.current?.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setIsAiMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isAiMenuOpen]);

  return (
    <div className="weboffice-shell relative flex min-h-0 flex-1 flex-col bg-neutral-100">
      {isAiMenuOpen && (
        <div ref={aiMenuRef} className="weboffice-ai-menu" role="menu" aria-label="WPS AI 菜单">
          <div className="weboffice-ai-menu-title">
            <Sparkles size={15} strokeWidth={2} />
            <span>WPS AI</span>
          </div>
          <div className="py-1">
            {aiMenuItems.map(({ label, desc, icon: Icon }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                className="weboffice-ai-menu-item"
                onClick={(event) => {
                  event.preventDefault();
                  event.currentTarget.blur();
                }}
              >
                <span className="weboffice-ai-menu-icon">
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[13px] font-medium text-[#2f2a27]">{label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-stone-500">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="weboffice-toolbar shrink-0 border-b border-stone-200 bg-[#fafafa]">
        <div className="relative h-[48px] min-w-[1120px] px-3">
          <div className="absolute left-1/2 top-1/2 flex w-max -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1">
            <div className="flex items-center gap-0.5">
              {visualButtons.slice(0, 4).map((button) => <ToolButton key={button.label} label={button.label} icon={button.icon} />)}
            </div>
            <span className="mx-1 h-6 w-px bg-stone-200" />
            <ToolbarSelect width="w-[100px]">仿宋_GB2312</ToolbarSelect>
            <ToolbarSelect width="w-[58px]">三号</ToolbarSelect>
            <span className="mx-1 h-6 w-px bg-stone-200" />
            <div className="flex items-center gap-0.5">
              {visualButtons.slice(4, 9).map((button) => <ToolButton key={button.label} label={button.label} icon={button.icon} />)}
            </div>
            <span className="mx-1 h-6 w-px bg-stone-200" />
            <ToolbarSelect width="w-[64px]">正文</ToolbarSelect>
            <ToolbarSelect width="w-[58px]">样式</ToolbarSelect>
            <div className="flex items-center gap-0.5">
              {visualButtons.slice(9).map((button) => <ToolButton key={button.label} label={button.label} icon={button.icon} />)}
            </div>
            <span className="mx-1 h-6 w-px bg-stone-200" />
            <ToolButton label="插入" icon={Plus} />
            <ToolButton label="搜索" icon={Search} />
            <ToolButton label="打印" icon={Printer} />
            <ToolButton label="全屏" icon={Fullscreen} />
          </div>
          <button
            ref={aiTriggerRef}
            type="button"
            aria-expanded={isAiMenuOpen}
            className={`weboffice-ai-trigger absolute right-3 top-1/2 -translate-y-1/2 ${isAiMenuOpen ? 'weboffice-ai-trigger-active' : ''}`}
            onClick={() => setIsAiMenuOpen((open) => !open)}
          >
            <Sparkles size={15} strokeWidth={2} />
            <span>WPS AI</span>
            <ChevronDown size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="weboffice-workspace relative flex min-h-0 flex-1">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <article className="weboffice-paper mx-auto min-h-[1010px] w-full max-w-[714px] border border-stone-200/80 bg-white px-8 py-12 sm:px-16 sm:py-14">
            <h1 className="mb-8 text-center font-serif text-2xl font-bold tracking-[0.26em] text-[var(--gov-red)]">
              中国智海建设集团文件
            </h1>
            <p className="mb-7 text-center text-[11px] text-stone-500">智海发〔{new Date().getFullYear()}〕第　号</p>
            <h2 className="mb-8 text-center text-lg font-bold leading-8 text-stone-800">{documentTitle}</h2>
            <div
              ref={editorRef}
              role="textbox"
              aria-label={variant === 'polished' ? '润色结果编辑区' : '公文正文编辑区'}
              aria-multiline="true"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onFocus={() => setFocused(true)}
              onBlur={(event) => {
                setFocused(false);
                onChange(event.currentTarget.innerText);
              }}
              onInput={(event) => onChange(event.currentTarget.innerText)}
              className="weboffice-editor min-h-[650px] whitespace-pre-wrap text-justify font-serif text-[15px] leading-8 text-stone-800 outline-none"
            />
            <div className="mt-12 border-t border-stone-100 pt-5 text-center text-[11px] text-stone-500">
              （此件公开发布）　　第 1 页 / 共 1 页
            </div>
          </article>
        </div>
      </div>

      <footer className="weboffice-statusbar flex h-8 shrink-0 items-center justify-between border-t border-stone-200 bg-[#fafafa] px-3 text-[11px] text-stone-500">
        <div className="flex min-w-0 items-center gap-4 overflow-hidden">
          <span>第 1 页，共 1 页</span>
          <span className="hidden sm:inline">第 1 节</span>
          <span className="hidden md:inline">第 1 行，第 1 列</span>
          <span>字数 {wordCount}</span>
          <span className="hidden sm:inline">校对：中文</span>
        </div>
        <div className="flex items-center gap-2">
          <span>100%</span>
          <span className="h-1.5 w-24 rounded-full bg-[#d8dde6]">
            <span className="block h-full w-1/2 rounded-full bg-[#7c8798]" />
          </span>
        </div>
      </footer>
    </div>
  );
}
