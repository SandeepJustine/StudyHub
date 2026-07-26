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
let stub = 0, real = 0;
const stubs = [];
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  if (c.startsWith('# StudyHub Malawi')) { stub++; stubs.push(f); }
  else real++;
}
console.log('Stub:', stub, 'Real:', real, 'Total:', files.length);
stubs.slice(0, 20).forEach(s => console.log('  STUB:', s));
