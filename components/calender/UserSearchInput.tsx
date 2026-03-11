'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CalendarUser } from '@/lib/types/calendar';

interface UserSearchInputProps {
  selectedUsers: CalendarUser[];
  onSelect: (user: CalendarUser) => void;
  onRemove: (userId: string) => void;
  placeholder?: string;
}

export function UserSearchInput({ selectedUsers, onSelect, onRemove, placeholder = '이름 또는 이메일 검색' }: UserSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CalendarUser[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const supabase = createClient();
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(8);
      if (data) {
        const filtered = data.filter(u => !selectedUsers.find(s => s.id === u.id));
        setResults(filtered as CalendarUser[]);
        setOpen(filtered.length > 0);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selectedUsers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (user: CalendarUser) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* 선택된 유저 pill */}
      {selectedUsers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedUsers.map(u => (
            <span key={u.id} className="flex items-center gap-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 px-2.5 py-0.5 text-xs font-medium">
              {u.name ?? u.email}
              <button
                type="button"
                onClick={() => onRemove(u.id)}
                className="ml-0.5 text-foreground/50 hover:text-foreground leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30"
      />

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-foreground/10 bg-background shadow-lg overflow-hidden">
          {results.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelect(u)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-foreground/5 transition-colors"
            >
              <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold shrink-0">
                {(u.name ?? u.email)[0].toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-foreground">{u.name ?? '이름 없음'}</div>
                <div className="text-xs text-foreground/50">{u.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
