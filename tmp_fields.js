// tmp_fields.js - extract schema-field drift from tsc output
const fs = require('fs');
const d = fs.readFileSync('D:/StudyHub/studyhub/_tsc.txt', 'utf8').split('\n').filter(l => l.includes('error TS'));
// TS2339: Property X does not exist on type Model...
// TS2353: Object literal ... 'X' does not exist in type ...CreateInput
const fieldMissing = {};
for (const l of d) {
  let m = l.match(/Property '([a-zA-Z0-9_]+)' does not exist on type '([^']*?)'/);
  if (!m) m = l.match(/'([a-zA-Z0-9_]+)' does not exist in type '([^']*?)'/);
  if (m) {
    const field = m[1];
    let typeCtx = m[2];
    // Extract model name from Prisma type context like "...CreateInput" / "ModelWhereInput"
    const mm = typeCtx.match(/([A-Z][a-zA-Z0-9]*?)(Create|Update|Where|Unchecked|Include|OrderBy)/);
    const model = mm ? mm[1] : '?';
    fieldMissing[model] = fieldMissing[model] || {};
    fieldMissing[model][field] = (fieldMissing[model][field] || 0) + 1;
  }
}
for (const model of Object.keys(fieldMissing).sort()) {
  console.log('\n### ' + model);
  Object.entries(fieldMissing[model]).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log('  ' + n.toString().padStart(3) + '  ' + f));
}
