// enumerate.js - list stub files using Node fs walk (shell-independent)
const fs = require('fs');
const path = require('path');

function walk(d, a) {
  try {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (['node_modules', '.next', '.git'].includes(e.name)) continue; walk(p, a); }
      else if (/\.(ts|tsx)$/.test(e.name)) { a.push(p.replace(/\\/g, '/')); }
    }
  } catch (e) {}
  return a;
}

const files = walk('src', []);
const stubs = files.filter(f => {
  const head = fs.readFileSync(f, 'utf8').slice(0, 60);
  return head.startsWith('# StudyHub Malawi');
});

const byBase = {};
for (const s of stubs) { const b = s.split('/').pop(); (byBase[b] = byBase[b] || []).push(s); }
for (const b of Object.keys(byBase).sort()) { console.log('### ' + b); byBase[b].forEach(s => console.log(s)); }
console.log('TOTAL:', stubs.length);
