# File Icon SVG Pack

用于设计交付给前端研发的文件类型图标包。所有图标为纯 SVG，默认尺寸为 64 x 64，可直接在 React、Vue、原生 HTML 或 CSS background 中使用。

## 目录

- `icons/`: 单个 SVG 文件。
- `file-icons-sprite.svg`: SVG symbol sprite，可通过 `<use href="...#file-icon-doc" />` 使用。
- `file-icon-map.json`: 文件后缀到图标 key 的映射。
- `preview.html`: 本地预览页。
- `generate-file-icons.mjs`: 图标生成脚本，便于后续批量改色或新增类型。

## 规格

- 画板: 64 x 64
- 圆角: 14px 容器 / 5px 角标
- 风格: 政务办公知识库同款轻拟物文件图标
- 字体: Inter / Arial fallback
- 背景: 浅色文件底 + 类型色描边 + 右下角类型角标

## 前端使用建议

优先按文件后缀读取 `file-icon-map.json`:

```ts
import iconMap from './file-icon-map.json';

const ext = filename.split('.').pop()?.toLowerCase() || 'unknown';
const iconKey = iconMap.extensions[ext] || iconMap.default;
const iconUrl = `/file-icons-svg/icons/file-${iconKey}.svg`;
```

## 已覆盖类型

- `doc`: doc, docx, wps, rtf
- `pdf`: pdf
- `xls`: xls, xlsx, et, csv
- `ppt`: ppt, pptx, dps
- `txt`: txt
- `ofd`: ofd
- `image`: png, jpg, jpeg, gif, webp, svg, bmp
- `zip`: zip, rar, 7z, tar, gz
- `html`: html, htm
- `json`: json
- `xml`: xml
- `md`: md, markdown
- `audio`: mp3, wav, aac, flac, m4a
- `video`: mp4, mov, avi, mkv, wmv
- `folder`: folder
- `unknown`: unknown
- `link`: url, link
- `db`: db, sql, sqlite
- `template`: dot, dotx, pot, potx, xlt, xltx
- `signature`: sig, p7s
