const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const CACHE_FILE = path.join(ROOT, 'cache.json');

const STYLE = `
<style>
  :root {
    --bg: #0d1117; --surface: #161b22; --border: #30363d;
    --text: #c9d1d9; --text-secondary: #8b949e; --link: #58a6ff;
    --accent: #f78166; --green: #3fb950; --orange: #d2991d; --red: #f85149;
    --purple: #a371f7;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
    background: var(--bg); color: var(--text); line-height: 1.6; min-height: 100vh;
  }
  header {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-bottom: 1px solid var(--border);
    padding: 40px 0 32px; text-align: center;
    position: sticky; top: 0; z-index: 100;
  }
  header h1 {
    font-size: 2rem;
    background: linear-gradient(135deg, #ff6b6b, #ffd93d);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin-bottom: 8px;
  }
  header .sub { color: var(--text-secondary); font-size: 0.95rem; }
  .update-badge {
    display: inline-block; background: rgba(63,185,80,0.15); color: var(--green);
    padding: 4px 14px; border-radius: 12px; font-size: 0.8rem; margin-top: 8px;
  }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
  .search-bar {
    position: sticky; top: 120px; z-index: 99;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 20px; margin: 24px auto; max-width: 1100px;
  }
  .search-bar input {
    width: 100%; padding: 14px 20px; background: var(--bg); border: 2px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 1.05rem; outline: none;
    transition: border-color 0.2s;
  }
  .search-bar input:focus { border-color: var(--link); }
  .search-info { color: var(--text-secondary); font-size: 0.85rem; margin-top: 8px; text-align: center; }
  .search-info span { color: var(--link); font-weight: bold; }
  .content { max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 1.6rem; margin: 32px 0 8px; color: #ff6b6b; }
  h2 {
    color: var(--link); font-size: 1.35rem; margin: 36px 0 16px; padding-bottom: 8px;
    border-bottom: 2px solid var(--border); display: flex; align-items: center; gap: 10px;
  }
  h2 .count { font-size: 0.8rem; color: var(--text-secondary); font-weight: normal; margin-left: auto; }
  h3 { color: var(--accent); font-size: 1.1rem; margin: 24px 0 12px; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .table-wrapper {
    overflow-x: auto; margin: 12px 0 28px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--surface);
  }
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 700px; }
  thead { background: var(--bg); position: sticky; top: 0; }
  th {
    text-align: left; padding: 10px 14px; color: var(--text-secondary);
    font-weight: 600; font-size: 0.8rem; text-transform: uppercase;
    letter-spacing: 0.5px; border-bottom: 2px solid var(--border); white-space: nowrap;
  }
  td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(88,166,255,0.04); }
  tr.hidden { display: none !important; }
  td:first-child { white-space: nowrap; }
  td:first-child a { font-weight: 600; }
  .tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 0.75rem; font-weight: 600; white-space: nowrap;
  }
  .tag-auth { background: rgba(163,113,247,0.15); color: var(--purple); }
  .tag-https-yes { background: rgba(63,185,80,0.15); color: var(--green); }
  .tag-https-no { background: rgba(248,81,73,0.15); color: var(--red); }
  .tag-cors { background: rgba(210,153,29,0.15); color: var(--orange); }
  h2.hidden, h3.hidden, h1.hidden { display: none !important; }
  .table-wrapper.hidden { display: none !important; }
  footer { text-align: center; padding: 40px 0; color: var(--text-secondary); border-top: 1px solid var(--border); margin-top: 48px; }
  footer a { color: var(--link); }
  @media (max-width: 768px) {
    header { padding: 24px 0 20px; }
    header h1 { font-size: 1.4rem; }
    .search-bar { margin: 12px; padding: 14px; }
    .search-bar input { padding: 12px 14px; font-size: 0.95rem; }
    .container { padding: 0 8px; }
    table { font-size: 0.8rem; }
    th, td { padding: 8px 10px; }
  }
  .tag-cloud-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; margin: 20px auto; padding: 14px 18px; max-width: 1100px; }
  .tag-cloud-toggle { background: none; border: none; color: var(--link); font-size: 0.95rem; cursor: pointer; padding: 4px 8px; display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border-radius: 6px; transition: background 0.2s; }
  .tag-cloud-toggle:hover { background: rgba(88,166,255,0.08); }
  .tag-cloud-toggle .arrow { display: inline-block; transition: transform 0.3s; font-size: 0.7rem; color: var(--text-secondary); }
  .tag-cloud-toggle.open .arrow { transform: rotate(90deg); }
  .tag-cloud-toggle .badge { margin-left: auto; background: rgba(88,166,255,0.15); padding: 2px 10px; border-radius: 10px; font-size: 0.78rem; }
  .tag-cloud { display: none; flex-wrap: wrap; gap: 8px; padding-top: 12px; justify-content: center; }
  .tag-cloud.show { display: flex; }
  .cloud-tag { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 0.85rem; border: 1px solid; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s; cursor: pointer; white-space: nowrap; font-weight: 500; }
  .cloud-tag:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-decoration: none; }
  .cloud-tag.dimmed { opacity: 0.2; pointer-events: none; }
  .intro-section { max-width: 1100px; margin: 16px auto; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; }
  .intro-section summary { color: var(--link); cursor: pointer; font-size: 0.95rem; padding: 4px 0; outline: none; user-select: none; list-style: none; }
  .intro-section summary::-webkit-details-marker { display: none; }
  .intro-section summary::marker { display: none; }
  .intro-section summary:hover { color: #79c0ff; }
  .intro-section[open] summary { margin-bottom: 12px; color: var(--green); }
  .intro-section h1 { font-size: 1.2rem; margin: 8px 0 4px; }
  .intro-section ul { padding-left: 20px; margin: 8px 0; }
  .intro-section li { color: var(--text-secondary); font-size: 0.88rem; margin: 4px 0; }
</style>`;

const SCRIPT = `<script>
(function() {
  var search = document.getElementById('search');
  var info = document.getElementById('search-info');
  var visibleCount = 0, totalCount = 0;

  function initCount() {
    var allRows = document.querySelectorAll('table tbody tr');
    totalCount = allRows.length; visibleCount = totalCount; updateInfo();
  }
  function updateInfo() {
    info.innerHTML = visibleCount === totalCount
      ? '\u5171 <span>' + totalCount + '<\/span> \u4e2a API'
      : '\u5339\u914d <span>' + visibleCount + '<\/span> / ' + totalCount + ' \u4e2a API';
  }
  function searchAPI(term) {
    visibleCount = 0;
    document.querySelectorAll('.table-wrapper').forEach(function(w) {
      var rows = w.querySelectorAll('tbody tr');
      var has = false;
      rows.forEach(function(r) {
        if (!term || r.textContent.toLowerCase().indexOf(term) !== -1) {
          r.classList.remove('hidden'); has = true; visibleCount++;
        } else { r.classList.add('hidden'); }
      });
      if (!term) { w.classList.remove('hidden'); visibleCount = rows.length; }
      else { w.classList[has ? 'remove' : 'add']('hidden'); }
    });
    document.querySelectorAll('h2,h3').forEach(function(h) {
      if (!term) { h.classList.remove('hidden'); return; }
      var n = h.nextElementSibling, has = false;
      while (n && n.tagName !== 'H2' && n.tagName !== 'H3' && n.tagName !== 'H1') {
        if (n.classList && n.classList.contains('table-wrapper') && !n.classList.contains('hidden')) { has = true; break; }
        n = n.nextElementSibling;
      }
      h.classList[has ? 'remove' : 'add']('hidden');
    });
    updateInfo();
  }

  search.addEventListener('input', function() { searchAPI(this.value.toLowerCase().trim()); });
  search.addEventListener('keydown', function(e) { if (e.key === 'Escape') { this.value = ''; searchAPI(''); this.blur(); } });

  var toggleBtn = document.querySelector('.tag-cloud-toggle');
  var cloudDiv = document.querySelector('.tag-cloud');
  if (toggleBtn && cloudDiv) {
    toggleBtn.addEventListener('click', function() {
      var open = cloudDiv.classList.toggle('show');
      toggleBtn.classList[open ? 'add' : 'remove']('open');
    });
  }
  document.querySelectorAll('.cloud-tag').forEach(function(tag) {
    tag.addEventListener('click', function(e) {
      e.preventDefault();
      var id = this.getAttribute('href').replace('#', '');
      var t = document.getElementById(id);
      if (t) {
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (cloudDiv) cloudDiv.classList.remove('show');
        if (toggleBtn) toggleBtn.classList.remove('open');
      }
    });
  });

  var _orig = searchAPI;
  searchAPI = function(t) {
    _orig(t);
    document.querySelectorAll('.cloud-tag').forEach(function(tag) {
      if (!t) { tag.classList.remove('dimmed'); return; }
      var id = tag.getAttribute('href').replace('#', '');
      var target = document.getElementById(id);
      tag.classList[(target && !target.classList.contains('hidden')) ? 'remove' : 'add']('dimmed');
    });
  };
  initCount();
})();
<\/script>`;

function enhanceHtml(h) {
  var ts = h.match(/<table>[\s\S]*?<\/table>/g);
  if (!ts) return h;
  ts.forEach(function(t) {
    var e = t.replace(/<td[^>]*>/g, function(m) {
      var txt = m.replace(/<[^>]+>/g, '');
      if (/^\u2705$|^\u662f$|^yes$/i.test(txt.trim())) return '<td><span class="tag tag-https-yes">\u2705<\/span>';
      if (/^\u5426$|^no$/i.test(txt.trim())) return '<td><span class="tag tag-https-no">\u5426<\/span>';
      if (/^\u2753$|^unknown$/i.test(txt.trim())) return '<td><span class="tag tag-cors">\u2753<\/span>';
      return match;
    });
    h = h.replace(t, '<div class="table-wrapper">' + e + '<\/div>');
  });
  return h;
}

function extractCategories(md) {
  var ts = md.indexOf('\n## \u76ee\u5f55');
  if (ts === -1) return { md: md, categories: [] };
  var rem = md.slice(ts), te = rem.indexOf('\n---');
  if (te === -1) return { md: md, categories: [] };
  var toc = rem.slice(0, te);
  var newMd = md.slice(0, ts) + '\n\n' + rem.slice(te);
  var cats = [], seen = new Set();
  var r = /\[([^\]]+)\]\(#([^)]+)\)/g, m;
  while ((m = r.exec(toc)) !== null) {
    if (m[1] === '\u516c\u5171 API \u76ee\u5f55 \ud83d\udd25' || m[1] === '\u76ee\u5f55' || seen.has(m[1])) continue;
    seen.add(m[1]);
    cats.push({ name: m[1], anchor: m[2].toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '') });
  }
  return { md: newMd, categories: cats };
}

function buildPage(md, updateTime) {
  var r = extractCategories(md);
  var palette = ['#58a6ff','#3fb950','#d2991d','#f78166','#a371f7','#f85149','#79c0ff','#56d364','#e3b341','#bc8cff','#ff7b72','#7ee787','#ffa657','#d2a8ff','#39d353','#f0883e','#b392f0','#db6d28','#9ecbff','#f778ba','#c792ea','#82aaff','#c3e88d','#ffcb6b','#f78c6c'];

  var tagCloud = '';
  if (r.categories.length > 0) {
    var tags = r.categories.map(function(c, i) {
      var col = palette[i % palette.length];
      return '<a class="cloud-tag" href="#' + c.anchor + '" style="background:' + col + '18;color:' + col + ';border-color:' + col + '40">' + c.name + '<\/a>';
    }).join('');
    tagCloud = '<div class="tag-cloud-wrapper"><button class="tag-cloud-toggle"><span class="arrow">\u25b6<\/span> \u5206\u7c7b\u76ee\u5f55 <span class="badge">' + r.categories.length + ' \u4e2a<\/span><\/button><div class="tag-cloud">' + tags + '<\/div><\/div>';
  }

  var content = marked.parse(r.md);
  content = enhanceHtml(content);
  var firstAPI = content.search(/<h[23]/);
  if (firstAPI > 0) {
    content = '<details class="intro-section"><summary>\ud83d\udcd6 \u9879\u76ee\u4ecb\u7ecd\uff08\u70b9\u51fb\u5c55\u5f00\uff09<\/summary>' + content.slice(0, firstAPI) + '<\/details>' + content.slice(firstAPI);
  }

  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Public APIs \u4e2d\u6587\u7248 - \u514d\u8d39 API \u5927\u5168<\/title>\n' + STYLE + '\n<\/head>\n<body>\n<header>\n  <h1>Public APIs \u4e2d\u6587\u7248<\/h1>\n  <p class="sub">\u514d\u8d39\u516c\u5171 API \u5927\u5168 \u00b7 \u4e2d\u6587\u7ffb\u8bd1 + \u56fd\u5185 API \u00b7 \u793e\u533a\u7ef4\u62a4<\/p>\n  <p class="update-badge">\u6570\u636e\u66f4\u65b0\u4e8e\uff1a' + updateTime + '<\/p>\n<\/header>\n<div class="search-bar">\n  <input type="text" id="search" placeholder="\ud83d\udd0d \u641c\u7d22 API\u2026\u652f\u6301\u4e2d\u6587\uff01\u641c\u201c\u5929\u6c14\u201d\u201cAI\u201d\u201c\u7269\u6d41\u201d\u201c\u56fe\u7247\u201d\u7b49" autocomplete="off" />\n  <p class="search-info" id="search-info">\u5171 <span>0<\/span> \u4e2a API<\/p>\n<\/div>\n' + tagCloud + '\n<div class="container content">\n  ' + content + '\n<\/div>\n<footer>\n  <p>\u6570\u636e\u6765\u6e90\uff1a<a href="https://github.com/llf007/public-apis-cn" target="_blank">llf007/public-apis-cn<\/a><\/p>\n<\/footer>\n' + SCRIPT + '\n<\/body>\n<\/html>';
}

module.exports = { buildPage: buildPage };
if (require.main === module && cache) {
  var html = buildPage(cache.readme, cache.updatedAt || 'local');
  fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
  console.log('Done: index.html (' + (Buffer.byteLength(html,'utf8')/1024).toFixed(0) + ' KB)');
}