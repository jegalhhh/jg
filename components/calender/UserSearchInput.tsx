'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CalendarUser, CollaboratorEntry } from '@/lib/types/calendar';

interface UserSearchInputProps {
  selected: CollaboratorEntry[];
  onSelect: (entry: CollaboratorEntry) => void;
  onRemove: (key: string) => void; // member: userId, guest: "guest:이름"
  placeholder?: string;
}

function Avatar({ user }: { user: CalendarUser }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name ?? user.email}
        className="h-6 w-6 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="h-6 w-6 rounded-full bg-foreground/15 flex items-center justify-center text-[10px] font-bold shrink-0">
      {(user.name ?? user.email)[0].toUpperCase()}
    </div>
  );
}

function entryKey(e: CollaboratorEntry) {
  return e.type === 'member' ? e.user.id : `guest:${e.name}`;
}

export function UserSearchInput({ selected, onSelect, onRemove, placeholder = '이름 또는 이메일 검색' }: UserSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CalendarUser[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedMemberIds = new Set(
    selected.filter(e => e.type === 'member').map(e => (e as Extract<CollaboratorEntry, { type: 'member' }>).user.id)
  );
  const selectedGuestNames = new Set(
    selected.filter(e => e.type === 'guest').map(e => (e as Extract<CollaboratorEntry, { type: 'guest' }>).name)
  );

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
        const filtered = (data as CalendarUser[]).filter(u => !selectedMemberIds.has(u.id));
        setResults(filtered);
        setOpen(true);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectMember = (user: CalendarUser) => {
    onSelect({ type: 'member', user });
    setQuery(''); setResults([]); setOpen(false);
  };

  const handleAddGuest = () => {
    const name = query.trim();
    if (!name || selectedGuestNames.has(name)) return;
    onSelect({ type: 'guest', name });
    setQuery(''); setResults([]); setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length === 0 && query.trim()) handleAddGuest();
    }
  };

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map(entry => (
            <span
              key={entryKey(entry)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                entry.type === 'member'
                  ? 'bg-yellow-400/20 border-yellow-400/40'
                  : 'bg-foreground/10 border-foreground/20'
              }`}
            >
              {entry.type === 'member' ? (
                <>
                  <Avatar user={entry.user} />
                  {entry.user.name ?? entry.user.email}
                </>
              ) : (
                <>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[9px] font-bold">
                    {entry.name[0].toUpperCase()}
                  </span>
                  {entry.name}
                  <span className="ml-0.5 rounded bg-foreground/20 px-1 text-[9px]">비회원</span>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemove(entryKey(entry))}
                className="ml-0.5 text-foreground/40 hover:text-foreground leading-none"
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
        onFocus={() => (results.length > 0 || query.trim()) && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30"
      />

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-lg">
          {results.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelectMember(u)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-foreground/5 transition-colors"
            >
              <Avatar user={u} />
              <div>
                <div className="font-medium">{u.name ?? '이름 없음'}</div>
                <div className="text-xs text-foreground/40">{u.email}</div>
              </div>
            </button>
          ))}
          {query.trim() && !selectedGuestNames.has(query.trim()) && (
            <button
              type="button"
              onClick={handleAddGuest}
              className="flex w-full items-center gap-2 border-t border-foreground/5 px-3 py-2 text-left text-sm text-foreground/60 hover:bg-foreground/5 transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold shrink-0">
                {query.trim()[0]?.toUpperCase()}
              </span>
              <span>
                <span className="font-medium text-foreground">"{query.trim()}"</span>
                <span className="ml-1 text-xs text-foreground/40">비회원으로 추가 (Enter)</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
