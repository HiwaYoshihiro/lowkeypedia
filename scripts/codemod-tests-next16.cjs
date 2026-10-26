/**
 * Codemod test: Next 16 truyền params/searchParams dạng Promise, nên test gọi
 * thẳng page component phải bọc bằng Promise.resolve.
 */
const fs = require('node:fs');
const path = require('node:path');

const files = fs
  .readdirSync(path.join(process.cwd(), 'tests/unit/pages'))
  .filter((f) => f.endsWith('.tsx'));

let total = 0;
for (const f of files) {
  const rel = `tests/unit/pages/${f}`;
  const p = path.join(process.cwd(), rel);
  const before = fs.readFileSync(p, 'utf8');
  let after = before;

  after = after.replace(/params: \{ slug: '([^']*)' \}/g, "params: Promise.resolve({ slug: '$1' })");
  after = after.replace(/searchParams: \{([^{}]*)\}/g, 'searchParams: Promise.resolve({$1})');

  if (after !== before) {
    fs.writeFileSync(p, after);
    const n = (after.match(/Promise\.resolve\(/g) || []).length;
    console.log('✓', rel, '→', n, 'Promise.resolve');
    total += 1;
  }
}
console.log('Tổng file sửa:', total);
