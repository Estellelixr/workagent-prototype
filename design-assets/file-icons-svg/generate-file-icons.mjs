import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const outDir = new URL('./', import.meta.url);
const iconsDir = new URL('./icons/', outDir);

const iconDefinitions = [
  { key: 'doc', label: 'DOC', name: 'Word document', exts: ['doc', 'docx', 'wps', 'rtf'], color: '#3B82D6', soft: '#EAF4FF', mark: 'lines' },
  { key: 'pdf', label: 'PDF', name: 'PDF document', exts: ['pdf'], color: '#E94B5F', soft: '#FFF0F2', mark: 'pdf' },
  { key: 'xls', label: 'XLS', name: 'Spreadsheet', exts: ['xls', 'xlsx', 'et', 'csv'], color: '#27A86C', soft: '#ECFAF2', mark: 'grid' },
  { key: 'ppt', label: 'PPT', name: 'Presentation', exts: ['ppt', 'pptx', 'dps'], color: '#EA7A45', soft: '#FFF4EB', mark: 'chart' },
  { key: 'txt', label: 'TXT', name: 'Plain text', exts: ['txt'], color: '#64748B', soft: '#F2F5F8', mark: 'lines' },
  { key: 'ofd', label: 'OFD', name: 'OFD document', exts: ['ofd'], color: '#C8102E', soft: '#FFF2F4', mark: 'seal' },
  { key: 'image', label: 'IMG', name: 'Image', exts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'], color: '#8B5CF6', soft: '#F5F0FF', mark: 'image' },
  { key: 'zip', label: 'ZIP', name: 'Archive', exts: ['zip', 'rar', '7z', 'tar', 'gz'], color: '#B7791F', soft: '#FFF7E6', mark: 'zip' },
  { key: 'html', label: 'HTML', name: 'HTML file', exts: ['html', 'htm'], color: '#F97316', soft: '#FFF4E8', mark: 'code' },
  { key: 'json', label: 'JSON', name: 'JSON data', exts: ['json'], color: '#D99A00', soft: '#FFF8DC', mark: 'braces' },
  { key: 'xml', label: 'XML', name: 'XML data', exts: ['xml'], color: '#2563EB', soft: '#EEF4FF', mark: 'code' },
  { key: 'md', label: 'MD', name: 'Markdown', exts: ['md', 'markdown'], color: '#334155', soft: '#F3F5F8', mark: 'md' },
  { key: 'audio', label: 'AUD', name: 'Audio', exts: ['mp3', 'wav', 'aac', 'flac', 'm4a'], color: '#DB2777', soft: '#FFF0F7', mark: 'wave' },
  { key: 'video', label: 'VID', name: 'Video', exts: ['mp4', 'mov', 'avi', 'mkv', 'wmv'], color: '#6366F1', soft: '#F0F1FF', mark: 'play' },
  { key: 'folder', label: '', name: 'Folder', exts: ['folder'], color: '#4E9DE6', soft: '#EAF6FF', mark: 'folder' },
  { key: 'unknown', label: 'FILE', name: 'Unknown file', exts: ['unknown'], color: '#94A3B8', soft: '#F5F7FA', mark: 'question' },
  { key: 'link', label: 'URL', name: 'Link', exts: ['url', 'link'], color: '#0891B2', soft: '#EAFBFF', mark: 'link' },
  { key: 'db', label: 'DB', name: 'Database', exts: ['db', 'sql', 'sqlite'], color: '#0F766E', soft: '#EBFAF7', mark: 'database' },
  { key: 'template', label: 'TPL', name: 'Template', exts: ['dot', 'dotx', 'pot', 'potx', 'xlt', 'xltx'], color: '#B453D9', soft: '#FAF0FF', mark: 'template' },
  { key: 'signature', label: 'SIGN', name: 'Signed file', exts: ['sig', 'p7s'], color: '#D97706', soft: '#FFF7EA', mark: 'signature' },
];

const markSvg = (type, color) => {
  switch (type) {
    case 'lines':
      return `<path d="M19 27h22M19 34h18M19 41h24" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`;
    case 'pdf':
      return `<path d="M18 41c5.2-8.1 8.4-15.5 8.8-22.2.2-3.5 5.5-3.8 5.8-.3.4 5.8-5 15.7-10.3 21.8 7.8-3.4 17.2-5.4 21.1-2.4 2.5 1.9.7 6.2-2.6 5.2-6.2-1.9-13.7-2.2-22.8-2.1Z" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'grid':
      return `<path d="M18 23h25M18 32h25M18 41h25M26 23v18M35 23v18" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
    case 'chart':
      return `<path d="M21 41a11 11 0 1 0 0-22v11h11" fill="${color}" opacity=".18"/><path d="M21 41a11 11 0 1 0 0-22v11h11" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'seal':
      return `<circle cx="31" cy="32" r="11" fill="${color}" opacity=".12"/><path d="M31 20l3.2 6.5 7.1 1-5.1 5 1.2 7.1L31 36.2l-6.4 3.4 1.2-7.1-5.1-5 7.1-1L31 20Z" fill="none" stroke="${color}" stroke-width="2.8" stroke-linejoin="round"/>`;
    case 'image':
      return `<path d="M18 41l8.2-9.2 5.8 6.1 4.5-4.9L45 41H18Z" fill="${color}" opacity=".22"/><path d="M18 23h27v18H18Z" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><circle cx="38.5" cy="28" r="2.5" fill="${color}"/>`;
    case 'zip':
      return `<path d="M28 17v25M23 19h10M23 25h10M23 31h10M23 37h10" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/><rect x="34" y="23" width="8" height="18" rx="3" fill="${color}" opacity=".16" stroke="${color}" stroke-width="2.5"/>`;
    case 'code':
      return `<path d="M25 24l-7 8 7 8M37 24l7 8-7 8" fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 22l-6 20" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" opacity=".72"/>`;
    case 'braces':
      return `<path d="M26 22c-4 0-5 2.2-5 5v2c0 2-1.5 3-3.5 3 2 0 3.5 1 3.5 3v2c0 2.8 1 5 5 5M36 22c4 0 5 2.2 5 5v2c0 2 1.5 3 3.5 3-2 0-3.5 1-3.5 3v2c0 2.8-1 5-5 5" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
    case 'md':
      return `<path d="M17 25h28v14H17Z" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><path d="M22 36v-8l4 5 4-5v8M37 28v8M33.5 32.5L37 36l3.5-3.5" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'wave':
      return `<path d="M17 34h4l3-9 5 18 5-24 4 15h7" fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'play':
      return `<rect x="17" y="23" width="28" height="18" rx="4" fill="${color}" opacity=".16" stroke="${color}" stroke-width="2.8"/><path d="M29 28.5v7l6-3.5-6-3.5Z" fill="${color}"/>`;
    case 'folder':
      return `<path d="M9 22.5a5 5 0 0 1 5-5h10l4 4h22a5 5 0 0 1 5 5v3H9Z" fill="${color}" opacity=".42"/><path d="M9 27h46l-4.1 18.8A6 6 0 0 1 45 50.5H15.2a6 6 0 0 1-5.9-5.3Z" fill="${color}" opacity=".88"/><path d="M9 27h46l-4.1 18.8A6 6 0 0 1 45 50.5H15.2a6 6 0 0 1-5.9-5.3Z" fill="none" stroke="#2D6EA8" stroke-opacity=".35" stroke-width="2"/>`;
    case 'question':
      return `<path d="M25 25.5c.8-3.1 3.2-5.1 6.7-5.1 4.2 0 7.1 2.6 7.1 6.1 0 3.1-1.8 4.7-4.5 6.2-2.2 1.2-3.1 2.2-3.1 4.4" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/><circle cx="31.2" cy="43" r="2.1" fill="${color}"/>`;
    case 'link':
      return `<path d="M27 38l-2.4 2.4a7 7 0 0 1-9.9-9.9l5-5a7 7 0 0 1 9.9 0M35 26l2.4-2.4a7 7 0 0 1 9.9 9.9l-5 5a7 7 0 0 1-9.9 0M25 35l12-12" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
    case 'database':
      return `<ellipse cx="31" cy="23" rx="12" ry="5" fill="${color}" opacity=".16" stroke="${color}" stroke-width="2.8"/><path d="M19 23v16c0 2.8 5.4 5 12 5s12-2.2 12-5V23M19 31c0 2.8 5.4 5 12 5s12-2.2 12-5" fill="none" stroke="${color}" stroke-width="2.8"/>`;
    case 'template':
      return `<path d="M18 22h26M18 30h12M34 30h10M18 38h26" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/><path d="M31 17v29" fill="none" stroke="${color}" stroke-width="2.4" opacity=".45"/>`;
    case 'signature':
      return `<path d="M17 40c4-7.5 7.4-14 10.2-19.4 1-2 4-.8 3.4 1.4L27 36c2.6-4 5.5-6 8.5-6 2.7 0 3.4 2.6 1.9 4.5 3.2-2.2 6.7-3 10.6-2.5" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    default:
      return '';
  }
};

const fileSvg = ({ key, label, name, color, soft, mark }) => {
  if (mark === 'folder') {
    return `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name} icon">
  <rect x="4" y="7" width="56" height="50" rx="14" fill="${soft}"/>
  ${markSvg(mark, color)}
</svg>
`;
  }

  return `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name} icon">
  <defs>
    <linearGradient id="${key}-page" x1="15" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="${soft}"/>
    </linearGradient>
    <filter id="${key}-shadow" x="6" y="5" width="52" height="58" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#345986" flood-opacity="0.12"/>
    </filter>
  </defs>
  <g filter="url(#${key}-shadow)">
    <path d="M18 8h21.5L50 18.5V52a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="url(#${key}-page)"/>
    <path d="M39.5 8v10.5H50" fill="${soft}"/>
    <path d="M18 8h21.5L50 18.5V52a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" stroke="${color}" stroke-opacity="0.52" stroke-width="2"/>
    <path d="M39.5 8v10.5H50" stroke="${color}" stroke-opacity="0.44" stroke-width="2" stroke-linejoin="round"/>
    ${markSvg(mark, color)}
    <rect x="30" y="45" width="24" height="15" rx="5" fill="${color}"/>
    <text x="42" y="55.5" fill="white" font-family="Inter, Arial, sans-serif" font-size="${label.length > 3 ? 6.2 : 7.5}" font-weight="800" text-anchor="middle">${label}</text>
  </g>
</svg>
`;
};

const symbolSvg = ({ key, label, color, soft, mark }) => {
  if (mark === 'folder') {
    return `  <symbol id="file-icon-${key}" viewBox="0 0 64 64">
    <rect x="4" y="7" width="56" height="50" rx="14" fill="${soft}"/>
    ${markSvg(mark, color)}
  </symbol>`;
  }

  return `  <symbol id="file-icon-${key}" viewBox="0 0 64 64">
    <path d="M18 8h21.5L50 18.5V52a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="${soft}"/>
    <path d="M18 8h21.5L50 18.5V52a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="#fff" fill-opacity=".72"/>
    <path d="M39.5 8v10.5H50" fill="${soft}"/>
    <path d="M18 8h21.5L50 18.5V52a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" stroke="${color}" stroke-opacity=".52" stroke-width="2"/>
    <path d="M39.5 8v10.5H50" stroke="${color}" stroke-opacity=".44" stroke-width="2" stroke-linejoin="round"/>
    ${markSvg(mark, color)}
    <rect x="30" y="45" width="24" height="15" rx="5" fill="${color}"/>
    <text x="42" y="55.5" fill="white" font-family="Inter, Arial, sans-serif" font-size="${label.length > 3 ? 6.2 : 7.5}" font-weight="800" text-anchor="middle">${label}</text>
  </symbol>`;
};

const previewHtml = (defs) => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>File Icon SVG Pack</title>
  <style>
    body { margin: 0; background: #f6f8fb; color: #1f2937; font: 14px/1.5 Inter, Arial, "PingFang SC", sans-serif; }
    main { max-width: 1080px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { margin: 0 0 28px; color: #667085; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 14px; }
    .card { border: 1px solid rgba(31,41,55,.08); border-radius: 14px; background: white; padding: 18px 12px; text-align: center; box-shadow: 0 10px 30px rgba(30,57,94,.06); }
    img { width: 56px; height: 56px; }
    strong { display: block; margin-top: 10px; font-size: 12px; }
    span { color: #98a2b3; font-size: 11px; }
  </style>
</head>
<body>
  <main>
    <h1>File Icon SVG Pack</h1>
    <p>64x64 SVG, matching the knowledge-library visual style.</p>
    <div class="grid">
      ${defs.map((item) => `<div class="card"><img src="./icons/file-${item.key}.svg" alt="${item.name}" /><strong>${item.name}</strong><span>${item.exts.join(', ')}</span></div>`).join('\n      ')}
    </div>
  </main>
</body>
</html>
`;

const readme = `# File Icon SVG Pack

用于设计交付给前端研发的文件类型图标包。所有图标为纯 SVG，默认尺寸为 64 x 64，可直接在 React、Vue、原生 HTML 或 CSS background 中使用。

## 目录

- \`icons/\`: 单个 SVG 文件。
- \`file-icons-sprite.svg\`: SVG symbol sprite，可通过 \`<use href="...#file-icon-doc" />\` 使用。
- \`file-icon-map.json\`: 文件后缀到图标 key 的映射。
- \`preview.html\`: 本地预览页。
- \`generate-file-icons.mjs\`: 图标生成脚本，便于后续批量改色或新增类型。

## 规格

- 画板: 64 x 64
- 圆角: 14px 容器 / 5px 角标
- 风格: 政务办公知识库同款轻拟物文件图标
- 字体: Inter / Arial fallback
- 背景: 浅色文件底 + 类型色描边 + 右下角类型角标

## 前端使用建议

优先按文件后缀读取 \`file-icon-map.json\`:

\`\`\`ts
import iconMap from './file-icon-map.json';

const ext = filename.split('.').pop()?.toLowerCase() || 'unknown';
const iconKey = iconMap.extensions[ext] || iconMap.default;
const iconUrl = \`/file-icons-svg/icons/file-\${iconKey}.svg\`;
\`\`\`

## 已覆盖类型

${iconDefinitions.map((item) => `- \`${item.key}\`: ${item.exts.join(', ')}`).join('\n')}
`;

const extensionMap = iconDefinitions.reduce((acc, item) => {
  for (const ext of item.exts) acc[ext] = item.key;
  return acc;
}, {});

await mkdir(iconsDir, { recursive: true });

for (const icon of iconDefinitions) {
  await writeFile(new URL(`./icons/file-${icon.key}.svg`, outDir), fileSvg(icon), 'utf8');
}

await writeFile(
  new URL('./file-icons-sprite.svg', outDir),
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${iconDefinitions.map(symbolSvg).join('\n')}\n</svg>\n`,
  'utf8',
);

await writeFile(
  new URL('./file-icon-map.json', outDir),
  JSON.stringify({
    version: '1.0.0',
    size: 64,
    default: 'unknown',
    icons: iconDefinitions.map(({ key, label, name, exts, color }) => ({ key, label, name, exts, color })),
    extensions: extensionMap,
  }, null, 2) + '\n',
  'utf8',
);

await writeFile(new URL('./preview.html', outDir), previewHtml(iconDefinitions), 'utf8');
await writeFile(new URL('./README.md', outDir), readme, 'utf8');

console.log(`Generated ${iconDefinitions.length} SVG icons in ${fileURLToPath(iconsDir)}`);
