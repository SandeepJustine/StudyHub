const fs = require('fs');
const { execSync } = require('child_process');
const stubs = execSync('grep -rl "^# StudyHub Malawi" src --include="*.ts" --include="*.tsx"', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
const byBase = {};
for (const s of stubs) { const b = s.split('/').pop(); (byBase[b] = byBase[b] || []).push(s); }
// Print each route stub file path grouped by basename
for (const b of ['error.tsx', 'loading.tsx', 'layout.tsx', 'page.tsx', 'index.ts']) {
  console.log('### ' + b);
  (byBase[b] || []).forEach(s => console.log(s));
}
console.log('### FEATURE_FILES');
for (const b of Object.keys(byBase)) {
  if (!['error.tsx', 'loading.tsx', 'layout.tsx', 'page.tsx', 'index.ts'].includes(b)) {
    byBase[b].forEach(s => console.log(s));
  }
}
