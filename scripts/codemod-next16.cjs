/**
 * Codemod nâng cấp Next.js 14 → 16: API params/searchParams/cookies thành async.
 * Mọi thay đổi đều khẳng định (assert) là tìm thấy mẫu trước khi thay, nên nếu
 * cấu trúc file đã khác thì script dừng và báo rõ file nào chưa đổi được.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const changed = [];
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text);
  changed.push(rel);
}

/** Thay thế bắt buộc: phải khớp ít nhất 1 lần. */
function mustReplace(rel, text, find, replace, minCount = 1) {
  const count = text.split(find).length - 1;
  if (count < minCount) {
    failures.push(`${rel}: không tìm thấy mẫu ${JSON.stringify(find)} (có ${count}, cần ${minCount})`);
    return text;
  }
  return text.split(find).join(replace);
}

// ---------- 1. API route [id]: params là Promise ----------
for (const rel of [
  'app/api/admin/players/[id]/route.ts',
  'app/api/admin/teams/[id]/route.ts',
  'app/api/admin/tournaments/[id]/route.ts',
]) {
  let t = read(rel);
  t = mustReplace(rel, t, '{ params }: { params: { id: string } }', '{ params }: { params: Promise<{ id: string }> }', 2);
  t = mustReplace(
    rel,
    t,
    '  const denied = requireAdmin();',
    '  const { id } = await params;\n  const denied = await requireAdmin();',
    2
  );
  t = mustReplace(rel, t, 'params.id', 'id', 1);
  write(rel, t);
}

// ---------- 2. API route list: requireAdmin phải await ----------
for (const rel of [
  'app/api/admin/players/route.ts',
  'app/api/admin/teams/route.ts',
  'app/api/admin/tournaments/route.ts',
]) {
  const t = mustReplace(rel, read(rel), 'const denied = requireAdmin();', 'const denied = await requireAdmin();', 2);
  write(rel, t);
}

// ---------- 3. Login / logout: cookie helper thành async ----------
{
  const rel = 'app/api/admin/login/route.ts';
  const t = mustReplace(rel, read(rel), '    setAdminCookie();', '    await setAdminCookie();', 1);
  write(rel, t);
}
{
  const rel = 'app/api/admin/logout/route.ts';
  const t = mustReplace(rel, read(rel), '  clearAdminCookie();', '  await clearAdminCookie();', 1);
  write(rel, t);
}

// ---------- 4. Trang chi tiết: params là Promise ----------
for (const [rel, marker] of [
  ['app/tuyen-thu/[slug]/page.tsx', 'params'],
  ['app/doi-tuyen/[slug]/page.tsx', 'params'],
  ['app/giai-dau/[slug]/page.tsx', 'params'],
]) {
  let t = read(rel);
  const before = t.split('params: { slug: string }').length - 1;
  t = mustReplace(rel, t, 'params: { slug: string }', 'params: Promise<{ slug: string }>', 2);
  const usage = t.split('params.slug').length - 1;
  if (usage < 2) failures.push(`${rel}: chỉ thấy ${usage} chỗ dùng params.slug (mong đợi ≥2)`);
  t = t.split('params.slug').join('(await params).slug');
  write(rel, t);
  if (before < 2) failures.push(`${rel}: chỉ thấy ${before} chỗ khai báo params slug`);
}

// ---------- 5. Trang danh sách: searchParams là Promise ----------
{
  const rel = 'app/tuyen-thu/page.tsx';
  let t = read(rel);
  t = mustReplace(
    rel,
    t,
    'searchParams: { q?: string | string[]; team?: string | string[]; role?: string | string[] };',
    'searchParams: Promise<{ q?: string | string[]; team?: string | string[]; role?: string | string[] }>;',
    1
  );
  t = mustReplace(rel, t, '  const [players, teams] = await Promise.all', '  const sp = await searchParams;\n  const [players, teams] = await Promise.all', 1);
  t = mustReplace(rel, t, 'searchParams.q', 'sp.q', 1);
  t = mustReplace(rel, t, 'searchParams.team', 'sp.team', 1);
  t = mustReplace(rel, t, 'searchParams.role', 'sp.role', 1);
  write(rel, t);
}
{
  const rel = 'app/tim-kiem/page.tsx';
  let t = read(rel);
  t = mustReplace(
    rel,
    t,
    'searchParams: { q?: string | string[] };',
    'searchParams: Promise<{ q?: string | string[] }>;',
    1
  );
  t = mustReplace(rel, t, 'const q = firstParam(searchParams.q).trim();', 'const sp = await searchParams;\n  const q = firstParam(sp.q).trim();', 1);
  write(rel, t);
}

console.log('Đã sửa:', changed.length, 'file');
for (const f of changed) console.log('  ✓', f);
if (failures.length) {
  console.error('\nLỖI:');
  for (const f of failures) console.error('  ✗', f);
  process.exit(1);
}
