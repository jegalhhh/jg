'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

interface KakaoPlace {
  place_name: string;
  road_address_name: string;
  address_name: string;
}

interface LocationSearchInputProps {
  value: string;
  onChange: (place: string) => void;
}

export function LocationSearchInput({ value, onChange }: LocationSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 검색 디바운스
  useEffect(() => {
    if (!query.trim() || query === value) { setResults([]); setOpen(false); return; }
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!apiKey) return;

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=7`,
          { headers: { Authorization: `KakaoAK ${apiKey}` } }
        );
        const json = await res.json();
        setResults(json.documents ?? []);
        setOpen((json.documents ?? []).length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place: KakaoPlace) => {
    const label = place.place_name;
    setQuery(label);
    onChange(label);
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative flex items-center">
        <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-foreground/30" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="장소명 또는 주소 검색"
          className="w-full rounded-xl border border-foreground/15 bg-foreground/5 py-2 pl-9 pr-8 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30"
        />
        {query && (
          <button type="button" onClick={handleClear} className="absolute right-2 text-foreground/30 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading && (
        <p className="mt-1 px-1 text-xs text-foreground/40">검색 중...</p>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-lg">
          {results.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(p)}
              className="flex w-full flex-col items-start px-3 py-2.5 text-left hover:bg-foreground/5 transition-colors border-b border-foreground/5 last:border-0"
            >
              <span className="text-sm font-medium">{p.place_name}</span>
              <span className="text-xs text-foreground/40">{p.road_address_name || p.address_name}</span>
            </button>
          ))}
        </div>
      )}

      {!process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY && (
        <p className="mt-1 text-xs text-foreground/30">
          장소 검색을 사용하려면 .env.local에 NEXT_PUBLIC_KAKAO_REST_API_KEY를 설정하세요.
        </p>
      )}
    </div>
  );
}
