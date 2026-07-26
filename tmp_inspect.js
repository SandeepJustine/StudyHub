// inspect.js - reusable codebase inspection helper
// Usage: node tmp_inspect.js <mode>
const fs = require('fs');
const path = require('path');

function walk(d, a) {
  a = a || [];
  try {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (['node_modules', '.next', '.git'].includes(e.name)) continue; walk(p, a); }
      else { a.push(p.replace(/\\/g, '/')); }
    }
  } catch (e) {}
  return a;
}

const mode = process.argv[2] || 'features';
if (mode === 'features') {
  console.log('=== features subdirs ===');
  console.log(fs.readdirSync('src/components/features', { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).join(', '));
  console.log('\n=== feature index.ts (barrels) ===');
  walk('src/components/features').filter(f => f.endsWith('index.ts')).forEach(f => console.log(f));
} else if (mode === 'errors') {
  // Show full error text grouped by file
  const d = fs.readFileSync('D:/StudyHub/studyhub/_tsc.txt', 'utf8').split('\n').filter(l => l.includes('error TS'));
  const byFile = {};
  for (const l of d) { const m = l.match(/^([^(]+)/); if (m) { (byFile[m[1]] = byFile[m[1]] || []).push(l); } }
  const target = process.argv[3];
  if (target) {
    Object.keys(byFile).filter(f => f.includes(target)).forEach(f => { console.log('\n### ' + f); byFile[f].forEach(l => console.log(l)); });
  } else {
    console.log('Total errors:', d.length);
  }
}
