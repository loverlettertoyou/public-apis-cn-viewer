const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const CACHE_FILE = path.join(ROOT, 'cache.json');
const cache = (() => {
  try {
    const c = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (c.readme) return c;
  } catch(e) {}
  return null;
})();

if (!cache || !cache.readme) {
  console.error('No data available. Run the server version first to generate cache.json');
  process.exit(1);
}

const { buildPage } = require('./build.js');
const html = buildPage(cache.readme, cache.updatedAt || 'local');
fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('Done: index.html');