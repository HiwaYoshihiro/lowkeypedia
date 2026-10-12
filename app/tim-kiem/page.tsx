import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { searchAll } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const results = q ? await searchAll(q) : [];
  const players = results.filter((r) => r.type === 'player');
  const teams = results.filter((r) => r.type === 'team');

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-wiki-darkblue">Tìm kiếm</h1>
      <div className="mt-4 max-w-xl">
        <SearchBar defaultValue={q} />
      </div>

      {!q ? (
        <p className="mt-8 text-gray-500 text-sm">Nhập từ khoá để tìm tuyển thủ hoặc đội tuyển (không phân biệt dấu).</p>
      ) : results.length === 0 ? (
        <p className="mt-8 text-gray-500">
          Không tìm thấy kết quả nào cho “<strong>{q}</strong>”.
        </p>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-4">
            Tìm thấy {results.length} kết quả cho “<strong>{q}</strong>”
          </p>

          {players.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-wiki-darkblue mb-3">Tuyển thủ ({players.length})</h2>
              <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {players.map((r) => (
                  <li key={`p-${r.slug}`}>
                    <Link href={`/tuyen-thu/${r.slug}`} className="block px-4 py-3 hover:bg-gray-50">
                      <p className="font-bold text-wiki-darkblue">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.subtitle}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {teams.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-wiki-darkblue mb-3">Đội tuyển ({teams.length})</h2>
              <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {teams.map((r) => (
                  <li key={`t-${r.slug}`}>
                    <Link href={`/doi-tuyen/${r.slug}`} className="block px-4 py-3 hover:bg-gray-50">
                      <p className="font-bold text-wiki-darkblue">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.subtitle}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
