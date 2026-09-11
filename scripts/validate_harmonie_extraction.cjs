// Validate stdin or a supplied JSON path. Ajv is available through the existing npm dependencies.
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const schema = require('../data/references/harmonie/2026/extraction.schema.json');
function validate(data) {
  const check = new Ajv({allErrors: true}).compile(schema);
  if (!check(data)) throw new Error(JSON.stringify(check.errors));
  const docs = new Map(data.documents.map(d => [d.sourceFile, d]));
  if (docs.size !== data.documents.length) throw new Error('Duplicate source document');
  const ids = new Set();
  for (const r of data.guarantees) {
    const d = docs.get(r.sourceFile);
    if (!d || r.reference !== d.reference || r.family !== d.family || r.regime !== d.regime || r.sourceSha256 !== d.sha256 || r.sourcePage > d.pageCount)
      throw new Error('Invalid provenance: ' + r.id);
    if (r.family === 'CCN' || r.reference.startsWith('IDCC ') || path.isAbsolute(r.sourceFile) || r.sourceFile.split('/').includes('..'))
      throw new Error('CCN or invalid source path');
    if (ids.has(r.id)) throw new Error('Duplicate guarantee identity');
    ids.add(r.id);
  }
  for (const d of data.documents) {
    if (d.pages.length !== d.pageCount || new Set(d.pages.map(p => p.page)).size !== d.pageCount) throw new Error('Incomplete page coverage');
    for (const p of d.pages) {
      if (p.page > d.pageCount || data.guarantees.filter(r => r.sourceFile === d.sourceFile && r.sourcePage === p.page).length !== p.recordCount)
        throw new Error('Incorrect page record count');
    }
  }
}
if (require.main === module) {
  try {
    validate(JSON.parse(fs.readFileSync(process.argv[2] || 0, 'utf8')));
    console.log('Schéma et provenance valides.');
  } catch (e) {console.error(e.message); process.exitCode = 1;}
}
module.exports = {validate};
