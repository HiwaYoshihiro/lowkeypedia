'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/types';
import { KIND_HREF, KIND_LABEL, KIND_ORDER } from '@/lib/entities';

/**
 * Ô tìm kiếm có gợi ý trực tiếp.
 *
 * Gọi `/api/search` (đọc từ Vercel Blob qua `searchAll`) và hiện gợi ý ngay khi gõ,
 * kèm điều hướng bàn phím. Được nối với danh sách gợi ý theo mẫu ARIA combobox để
 * screen reader đọc được mục đang chọn.
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
  // Chỉ request mới nhất được phép cập nhật state (tránh response về muộn ghi đè).
  const reqId = useRef(0);
  const listId = 'search-listbox';
  const optionId = (index: number) => `search-opt-${index}`;

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const myId = ++reqId.current;
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SearchResult[];
        if (myId !== reqId.current) return; // đã có request mới hơn
        setResults(data);
      } catch (error) {
        if (myId === reqId.current && (error as Error).name !== 'AbortError') setResults([]);
      } finally {
        if (myId === reqId.current) setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Gom nhóm một lượt và đánh luôn chỉ số từng mục để tra cứu O(1) lúc render —
  // trước đây mỗi mục phải `flat.indexOf(item)` nên thành O(n²).
  const { groups, flat, indexOf } = useMemo(() => {
    const groups = KIND_ORDER.map((type) => ({
      type,
      label: KIND_LABEL[type],
      items: results.filter((r) => r.type === type),
    })).filter((group) => group.items.length > 0);
    const flat = groups.flatMap((group) => group.items);
    const indexOf = new Map(flat.map((item, index) => [item, index]));
    return { groups, flat, indexOf };
  }, [results]);

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
      router.push(KIND_HREF[result.type](result.slug));
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
          aria-label="Tìm kiếm trong Lwkypedia"
          role="combobox"
          aria-expanded={showPanel && flat.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && flat[highlight] ? optionId(highlight) : undefined}
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
        <div
          className="search-results scroll-thin"
          id={listId}
          role="listbox"
          aria-label="Kết quả tìm kiếm"
        >
          {flat.length === 0 ? (
            <div className="search-empty" role="status" aria-live="polite">
              {loading ? 'Đang tìm…' : <>Không tìm thấy kết quả cho “{query}”.</>}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.type} role="group" aria-label={group.label}>
                <div className="search-group-title" aria-hidden="true">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const index = indexOf.get(item) ?? 0;
                  return (
                    <button
                      key={`${item.type}-${item.slug}`}
                      id={optionId(index)}
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
