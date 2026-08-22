'use strict';

const { exportAll } = require('./src/lib/export');
const { glyphs } = require('./src/glyphs');

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const svgMode = process.argv.includes('--static-svg') ? 'static' : 'flipbook';

if (only.length) {
  console.log(`Exporting ${only.length} glyph(s)…`);
} else {
  console.log(`Exporting ${glyphs.length} glyphs…`);
}

const catalog = exportAll({ only: only.length ? only : undefined, svgMode });
const fs = require('fs');
const path = require('path');
fs.writeFileSync(
  path.join(__dirname, 'dist', 'catalog.json'),
  JSON.stringify({ schema_version: 'AGENT_GLYPH_MASTER_1.0', count: catalog.length, glyphs: catalog }, null, 2)
);

function previewHtml(items) {
  const cards = items.map((g) => `
    <article class="card" data-batch="${g.id.slice(0, 2)}">
      <img src="gif/${g.id}.gif" alt="${g.id} ${g.state}" width="128" height="128"/>
      <div class="meta">
        <code>${g.id}</code>
        <span class="state">${g.state}</span>
        <span class="src">${g.source}${g.status === 'revised' ? ' · revised' : ''}</span>
      </div>
    </article>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Agent Glyph Library — ${items.length} glyphs</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #0b0d12; color: #d7dde8; }
    header { padding: 28px 32px 12px; }
    h1 { margin: 0 0 6px; font-size: 22px; font-weight: 650; }
    p { margin: 0; color: #8b95a8; }
    nav { padding: 12px 32px 20px; display: flex; gap: 8px; flex-wrap: wrap; }
    nav button { background: #1a2030; color: #d7dde8; border: 1px solid #2a3348; border-radius: 999px; padding: 6px 12px; cursor: pointer; }
    nav button.on { background: #20c7c7; color: #0b0d12; border-color: #20c7c7; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 0 32px 48px; }
    .card { background: #12141a; border: 1px solid #222838; border-radius: 12px; padding: 12px; }
    .card img { display: block; margin: 0 auto 10px; image-rendering: auto; background: #12141a; border-radius: 8px; }
    .meta { display: flex; flex-direction: column; gap: 2px; }
    code { color: #ffa500; font-size: 12px; }
    .state { font-size: 11px; color: #c9d4e3; word-break: break-all; }
    .src { font-size: 10px; color: #7d8799; }
  </style>
</head>
<body>
  <header>
    <h1>Agent Glyph Library</h1>
    <p>${items.length} procedural canvas animations exported as GIF/SVG · schema AGENT_GLYPH_MASTER_1.0</p>
  </header>
  <nav>
    <button class="on" data-f="all">All</button>
    <button data-f="B1">B1 Muse Spark</button>
    <button data-f="B2">B2 GLM</button>
    <button data-f="B3">B3 Sol</button>
    <button data-f="B4">B4 Gemini</button>
    <button data-f="B5">B5 Grok</button>
    <button data-f="B6">B6 Sonnet</button>
  </nav>
  <section class="grid">${cards}</section>
  <script>
    document.querySelectorAll('nav button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        const f = btn.dataset.f;
        document.querySelectorAll('.card').forEach(c => {
          c.style.display = (f === 'all' || c.dataset.batch === f) ? '' : 'none';
        });
      };
    });
  </script>
</body>
</html>`;
}

fs.writeFileSync(path.join(__dirname, 'dist', 'preview.html'), previewHtml(catalog));
console.log(`done: ${catalog.length} glyphs → dist/gif dist/svg dist/preview.html`);
