/**
 * Sửa nốt các lỗi ESLint của việc lên Next 16 / React 19:
 *  1. Dashboard: không setState đồng bộ trong thân effect → tách `reload`.
 *  2. Trang danh sách tuyển thủ: dùng <Link> thay <a> cho điều hướng nội bộ.
 *
 * Regex dùng `\r?\n` vì `app/admin/dashboard/page.tsx` là file CRLF.
 */
const fs = require('node:fs');
const path = require('node:path');

function editRegex(rel, pairs) {
  const p = path.join(process.cwd(), rel);
  let text = fs.readFileSync(p, 'utf8');
  for (const [re, replace, min = 1] of pairs) {
    const hits = text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [];
    if (hits.length < min) throw new Error(`${rel}: thiếu mẫu (${hits.length} < ${min}): ${re}`);
    text = text.replace(re, replace);
  }
  fs.writeFileSync(p, text);
  console.log('✓', rel);
}

editRegex('app/admin/dashboard/page.tsx', [
  [
    / {2}const load = useCallback\(async \(\) => \{\r?\n {4}setLoading\(true\);\r?\n {4}setError\(''\);\r?\n {4}try \{/,
    [
      '  // Không setState đồng bộ ở đầu `load`: effect gọi nó ngay sau mount, và',
      '  // setState đồng bộ trong thân effect tạo thêm một vòng render thừa. Cờ',
      "  // `loading` đã khởi tạo `true`; khi người dùng bấm tải lại, `reload` bật cờ trước.",
      '  const load = useCallback(async () => {',
      '    try {',
    ].join('\r\n'),
  ],
  [
    / {2}useEffect\(\(\) => \{\r?\n {4}load\(\);\r?\n {2}\}, \[load\]\);/,
    [
      '  const reload = useCallback(async () => {',
      '    setLoading(true);',
      "    setError('');",
      '    await load();',
      '  }, [load]);',
      '',
      '  useEffect(() => {',
      '    void load();',
      '  }, [load]);',
    ].join('\r\n'),
  ],
  [/await load\(\);/, 'await reload();', 7],
]);

editRegex('app/tuyen-thu/page.tsx', [
  [
    /import type \{ Metadata \} from 'next';/,
    "import Link from 'next/link';" + '\n' + "import type { Metadata } from 'next';",
  ],
  [
    /<a href="\/tuyen-thu" className="btn btn-ghost">\r?\n(\s*)Xoá lọc\r?\n\s*<\/a>/,
    '<Link href="/tuyen-thu" className="btn btn-ghost">\n$1Xoá lọc\n          </Link>',
  ],
]);
