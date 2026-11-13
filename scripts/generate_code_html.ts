import fs from 'fs';
import path from 'path';

interface FileEntry {
  path: string;
  category: string;
  description: string;
  language: string;
  content: string;
}

const FILES_TO_INCLUDE = [
  // Backend & Config
  {
    path: 'server.ts',
    category: '后端核心服务 (Express + Gemini API)',
    description: 'Node.js Express 服务端，集成 Gemini 双模型降级、超时控制、小学三年级适配 OCR 及举一反三变式题生成接口',
    language: 'typescript',
  },
  {
    path: 'package.json',
    category: '工程与依赖配置',
    description: '项目依赖声明、npm 启动与构建脚本',
    language: 'json',
  },
  {
    path: 'vite.config.ts',
    category: '工程与依赖配置',
    description: 'Vite 8 构建配置、Tailwind CSS v4 插件与 React 插件集成',
    language: 'typescript',
  },
  {
    path: 'tsconfig.json',
    category: '工程与依赖配置',
    description: 'TypeScript 编译器配置及路径别名',
    language: 'json',
  },
  {
    path: 'metadata.json',
    category: '工程与依赖配置',
    description: 'AI Studio 平台元数据与服务端 Gemini 权限配置',
    language: 'json',
  },
  {
    path: 'index.html',
    category: '页面入口',
    description: '单页面 HTML 入口与 Meta 标签设置',
    language: 'html',
  },

  // Frontend Core
  {
    path: 'src/main.tsx',
    category: '前端入口',
    description: 'React 19 应用启动与 Root 挂载',
    language: 'typescript',
  },
  {
    path: 'src/App.tsx',
    category: '前端核心框架',
    description: '应用主控制器：双标签页路由、状态持久化、错题本收录与快速打印调度',
    language: 'typescript',
  },
  {
    path: 'src/index.css',
    category: '全局样式',
    description: 'Tailwind CSS 全局引入及打印专用样式',
    language: 'css',
  },
  {
    path: 'src/types/index.ts',
    category: '类型定义',
    description: '错题记录、变式题、答题状态等数据结构的 TypeScript 类型定义',
    language: 'typescript',
  },

  // Components
  {
    path: 'src/components/Header.tsx',
    category: '界面组件',
    description: '顶部导航栏组件：星球品牌主题、错题本计数器与代码下载入口',
    language: 'typescript',
  },
  {
    path: 'src/components/RecognitionPage.tsx',
    category: '界面组件',
    description: '核心识别页：错题拍照上传、智能轻量化压缩、小学三年级专项知识点提炼、3道变式生成、易错点剖析及会话防丢恢复',
    language: 'typescript',
  },
  {
    path: 'src/components/NotebookPage.tsx',
    category: '界面组件',
    description: '历史错题本页：学科与掌握度筛选、单选/多选批量操作、星标攻克与打印导出',
    language: 'typescript',
  },
  {
    path: 'src/components/MistakeDetailModal.tsx',
    category: '界面组件',
    description: '错题详情弹窗：原题查看、学生原错答回顾、变式题互动答题与答案解析高亮展开',
    language: 'typescript',
  },
  {
    path: 'src/components/PrintPreviewModal.tsx',
    category: '界面组件',
    description: 'A4 试卷打印预览弹窗：支持单题或批量错题排版并生成 PDF/纸质打印',
    language: 'typescript',
  },
  {
    path: 'src/components/PrintableDocument.tsx',
    category: '界面组件',
    description: 'A4 标准排版打印模版：错题题干、变式题与易错点答案解析分页布局',
    language: 'typescript',
  },

  // Data & Utilities
  {
    path: 'src/data/sampleMistakes.ts',
    category: '数据与预设',
    description: '内置经典错题库与 8 岁小学三年级两步乘减、看图算高差等精品预设',
    language: 'typescript',
  },
  {
    path: 'src/utils/imageCompressor.ts',
    category: '工具函数',
    description: '客户端 Canvas 图片秒级智能轻量化压缩工具（大图压缩至 40KB）',
    language: 'typescript',
  },
  {
    path: 'src/utils/highlight.tsx',
    category: '工具函数',
    description: '易错点关键词智能高亮渲染工具',
    language: 'typescript',
  },
  {
    path: 'src/utils/storage.ts',
    category: '工具函数',
    description: 'LocalStorage 错题持久化存储与初始化管理',
    language: 'typescript',
  },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateHtml(): string {
  const rootDir = process.cwd();
  const fileEntries: FileEntry[] = [];
  let totalLines = 0;
  let totalChars = 0;

  for (const item of FILES_TO_INCLUDE) {
    const fullPath = path.join(rootDir, item.path);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      totalLines += lines;
      totalChars += content.length;
      fileEntries.push({
        ...item,
        content,
      });
    }
  }

  // Categories map
  const categories = Array.from(new Set(fileEntries.map((f) => f.category)));

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>久久的闯关星球 - 完整应用源代码文档</title>
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --bg-dark: #0f172a;
      --bg-card: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --code-bg: #0b1120;
      --accent: #f59e0b;
      --emerald: #10b981;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      line-height: 1.6;
    }
    header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%);
      border-bottom: 1px solid #4338ca;
      padding: 2.5rem 1.5rem;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-icon {
      font-size: 2rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      background: linear-gradient(to right, #ffffff, #c7d2fe, #fef08a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-subtitle {
      font-size: 0.875rem;
      color: #cbd5e1;
      margin-top: 0.25rem;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #000;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .stats-bar {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .stats-item span {
      color: #38bdf8;
      font-weight: 700;
    }

    .layout {
      max-width: 1400px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 2rem;
    }
    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: static !important;
      }
    }
    .sidebar {
      position: sticky;
      top: 160px;
      height: calc(100vh - 180px);
      overflow-y: auto;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.25rem;
    }
    .sidebar::-webkit-scrollbar {
      width: 6px;
    }
    .sidebar::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 3px;
    }
    .search-box {
      width: 100%;
      padding: 0.6rem 0.8rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      color: #fff;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      outline: none;
    }
    .search-box:focus {
      border-color: #6366f1;
    }
    .category-group {
      margin-bottom: 1.25rem;
    }
    .category-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .file-nav-link {
      display: block;
      padding: 0.4rem 0.6rem;
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.825rem;
      border-radius: 0.375rem;
      transition: all 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .file-nav-link:hover {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
    }
    .main-content {
      min-width: 0;
    }
    .file-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      margin-bottom: 2.5rem;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }
    .file-header {
      padding: 1rem 1.5rem;
      background: #172033;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .file-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 1.05rem;
      font-weight: 700;
      color: #38bdf8;
    }
    .file-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      font-weight: 600;
    }
    .badge-lang {
      background: #312e81;
      color: #c7d2fe;
    }
    .badge-lines {
      background: #334155;
      color: #94a3b8;
    }
    .btn-copy {
      background: #1e293b;
      border: 1px solid #475569;
      color: #e2e8f0;
      padding: 0.35rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-copy:hover {
      background: #334155;
      color: #fff;
    }
    .file-desc {
      padding: 0.6rem 1.5rem;
      background: #131c2e;
      color: #94a3b8;
      font-size: 0.85rem;
      border-bottom: 1px solid #1e293b;
    }
    .code-container {
      background: var(--code-bg);
      padding: 1.25rem;
      overflow-x: auto;
      font-family: "JetBrains Mono", Consolas, Monaco, "Courier New", monospace;
      font-size: 0.85rem;
      line-height: 1.6;
    }
    pre {
      margin: 0;
      white-space: pre;
    }
    .line-number {
      color: #475569;
      user-select: none;
      display: inline-block;
      width: 45px;
      text-align: right;
      padding-right: 15px;
    }
    footer {
      text-align: center;
      padding: 3rem 1.5rem;
      color: #64748b;
      font-size: 0.875rem;
      border-top: 1px solid var(--border);
    }
    @media print {
      header, .sidebar, .btn-copy, .actions {
        display: none !important;
      }
      .layout {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .file-card {
        page-break-inside: avoid;
        border: 1px solid #000;
        box-shadow: none;
      }
      body {
        background: #fff;
        color: #000;
      }
      .code-container {
        background: #fff;
        color: #000;
      }
    }
  </style>
</head>
<body>

  <header>
    <div class="header-content">
      <div>
        <div class="brand-title">
          <div class="brand-icon">🪐</div>
          <div>
            <h1>久久的闯关星球 · 完整项目源码文档</h1>
            <div class="brand-subtitle">全科智能错题学习 · 拍照OCR识别 · 小学三年级专项诊断 · 举一反三变式生成 · A4无损打印</div>
          </div>
        </div>
        <div class="stats-bar">
          <div class="stats-item">文件总数：<span>${fileEntries.length} 个核心文件</span></div>
          <div class="stats-item">代码行数：<span>${totalLines.toLocaleString()} 行</span></div>
          <div class="stats-item">文档生成时间：<span>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span></div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" onclick="downloadCurrentDocument()">
          <span>📥 下载此 HTML 完整文档</span>
        </button>
        <button class="btn btn-secondary" onclick="window.print()">
          <span>🖨️ 打印为 PDF</span>
        </button>
        <a href="/" class="btn btn-secondary">
          <span>🚀 返回主应用</span>
        </a>
      </div>
    </div>
  </header>

  <div class="layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <input type="text" class="search-box" id="fileSearch" placeholder="🔍 快速搜索文件名或模块..." oninput="filterFiles()">
      
      ${categories
        .map((cat) => {
          const catFiles = fileEntries.filter((f) => f.category === cat);
          return `
        <div class="category-group" data-category="${escapeHtml(cat)}">
          <div class="category-title">${escapeHtml(cat)}</div>
          ${catFiles
            .map(
              (f) => `
            <a href="#${escapeHtml(f.path.replace(/[^a-zA-Z0-9_-]/g, '_'))}" class="file-nav-link" data-filename="${escapeHtml(
                f.path.toLowerCase()
              )}" title="${escapeHtml(f.path)}">
              📄 ${escapeHtml(f.path)}
            </a>
          `
            )
            .join('')}
        </div>
      `;
        })
        .join('')}
    </aside>

    <!-- Main Code View -->
    <main class="main-content">
      ${fileEntries
        .map((f) => {
          const anchorId = f.path.replace(/[^a-zA-Z0-9_-]/g, '_');
          const lines = f.content.split('\n');
          const codeWithLineNumbers = lines
            .map(
              (line, idx) =>
                `<span class="line-number">${idx + 1}</span>${escapeHtml(line)}`
            )
            .join('\n');

          return `
        <article class="file-card" id="${escapeHtml(anchorId)}" data-filepath="${escapeHtml(f.path.toLowerCase())}">
          <div class="file-header">
            <div class="file-title">
              <span>📄</span>
              <span>${escapeHtml(f.path)}</span>
            </div>
            <div class="file-meta">
              <span class="badge badge-lang">${escapeHtml(f.language.toUpperCase())}</span>
              <span class="badge badge-lines">${lines.length} 行代码</span>
              <button class="btn-copy" onclick="copyCode(this, '${escapeHtml(anchorId)}')">复制全部代码</button>
            </div>
          </div>
          <div class="file-desc">
            💡 <strong>模块作用</strong>：${escapeHtml(f.description)}
          </div>
          <div class="code-container">
            <pre><code id="code-${escapeHtml(anchorId)}">${codeWithLineNumbers}</code></pre>
            <textarea id="raw-${escapeHtml(anchorId)}" style="display:none;">${escapeHtml(f.content)}</textarea>
          </div>
        </article>
      `;
        })
        .join('')}
    </main>
  </div>

  <footer>
    <p>久久的闯关星球 (JiuJiu Learning Quest Planet) · 完整项目源码文档 (HTML格式独立可运行)</p>
    <p style="margin-top: 0.5rem; font-size: 0.8rem;">此 HTML 单文件包含全项目前后端完整代码，可离线保存或在任意浏览器中打开浏览。</p>
  </footer>

  <script>
    // Download this current HTML document as a standalone file
    function downloadCurrentDocument() {
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '久久的闯关星球_完整应用源代码文档.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Copy single file code
    function copyCode(button, anchorId) {
      const rawTextarea = document.getElementById('raw-' + anchorId);
      if (rawTextarea) {
        navigator.clipboard.writeText(rawTextarea.value).then(() => {
          const original = button.innerText;
          button.innerText = '✅ 已复制!';
          button.style.backgroundColor = '#059669';
          setTimeout(() => {
            button.innerText = original;
            button.style.backgroundColor = '';
          }, 2000);
        }).catch(err => {
          alert('复制失败，请手动选取');
        });
      }
    }

    // Filter files in sidebar and cards
    function filterFiles() {
      const query = document.getElementById('fileSearch').value.toLowerCase().trim();
      const fileCards = document.querySelectorAll('.file-card');
      const navLinks = document.querySelectorAll('.file-nav-link');
      const groups = document.querySelectorAll('.category-group');

      navLinks.forEach(link => {
        const fn = link.getAttribute('data-filename') || '';
        if (fn.includes(query)) {
          link.style.display = 'block';
        } else {
          link.style.display = 'none';
        }
      });

      fileCards.forEach(card => {
        const fp = card.getAttribute('data-filepath') || '';
        if (fp.includes(query)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      groups.forEach(g => {
        const visibleLinks = g.querySelectorAll('.file-nav-link[style="display: block;"]');
        if (query && visibleLinks.length === 0) {
          g.style.display = 'none';
        } else {
          g.style.display = 'block';
        }
      });
    }
  </script>
</body>
</html>`;

  return html;
}

const html = generateHtml();
const outPath = path.join(process.cwd(), 'public', 'jiujiu-planet-source-code.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`Successfully generated full code HTML document at: ${outPath} (${Math.round(html.length / 1024)} KB)`);
