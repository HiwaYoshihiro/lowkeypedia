'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/types';

const HREF: Record<SearchResult['type'], (slug: string) => string> = {
  player: (s) => `/tuyen-thu/${s}`,
  team: (s) => `/doi-tuyen/${s}`,
  tournament: (s) => `/giai-dau/${s}`,
};

const GROUP_LABEL: Record<SearchResult['type'], string> = {
  player: 'Tuyển thủ',
  team: 'Đội tuyển',
  tournament: 'Giải đấu',
};

const GROUP_ORDER: SearchResult['type'][] = ['player', 'team', 'tournament'];

/**
 * Ô tìm kiếm có gợi ý trực tiếp.
 *
 * Trước đây chỉ là một <form> đẩy sang /tim-kiem. Nay gọi `/api/search` (đọc từ
 * Vercel Blob qua `searchAll`) và hiện gợi ý ngay, kèm điều hướng bàn phím.
 */
export default function SearchBox({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setResults((await res.json()) as SearchResult[]);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const groups = useMemo(() => {
    return GROUP_ORDER.map((type) => ({
      type,
      label: GROUP_LABEL[type],
      items: results.filter((r) => r.type === type),
    })).filter((group) => group.items.length > 0);
  }, [results]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const openResult = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery('');
      router.push(HREF[result.type](result.slug));
    },
    [router],
  );

  const goToSearchPage = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/tim-kiem?q=${encodeURIComponent(q)}`);
  }, [query, router]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (event.key === 'ArrowDown' && flat.length) {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => (current + 1) % flat.length);
      return;
    }
    if (event.key === 'ArrowUp' && flat.length) {
      event.preventDefault();
      setHighlight((current) => (current - 1 + flat.length) % flat.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const picked = flat[highlight];
      if (picked) openResult(picked);
      else goToSearchPage();
    }
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div className="search" ref={boxRef}>
      <div className="search-field">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder={placeholder ?? 'Tìm tuyển thủ, đội tuyển, giải đấu…'}
          aria-label="Tìm kiếm trong Lowkeypedia"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="search-clear"
            aria-label="Xoá nội dung tìm kiếm"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="search-results scroll-thin" role="listbox" aria-label="Kết quả tìm kiếm">
          {flat.length === 0 ? (
            <div className="search-empty">
              {loading ? 'Đang tìm…' : <>Không tìm thấy kết quả cho “{query}”.</>}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.type}>
                <div className="search-group-title">{group.label}</div>
                {group.items.map((item) => {
                  const index = flat.indexOf(item);
                  return (
                    <button
                      key={`${item.type}-${item.slug}`}
                      type="button"
                      role="option"
                      aria-selected={index === highlight}
                      className={`search-item${index === highlight ? ' is-highlighted' : ''}`}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => openResult(item)}
                    >
                      <span className="search-thumb is-initial" aria-hidden="true">
                        {item.title.charAt(0).toUpperCase()}
                      </span>
                      <span className="search-item-text">
                        <span className="search-item-title">{item.title}</span>
                        <span className="search-item-meta">{item.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}

          <div className="search-foot">
            <button type="button" className="link-button" onClick={goToSearchPage}>
              Xem tất cả kết quả cho “{query}” →
            </button>
            <span>
              <span className="kbd">↑</span> <span className="kbd">↓</span> chọn ·{' '}
              <span className="kbd">Enter</span> mở
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
