'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toDateString, blocksToTimeRange } from '@/lib/calendar-utils';
import { TimeBlockGrid } from './TimeBlockGrid';
import { UserSearchInput } from './UserSearchInput';
import { LocationSearchInput } from './LocationSearchInput';
import type { ScheduleRequest, CollaboratorEntry } from '@/lib/types/calendar';

interface RequestFormProps {
  date: Date;
  occupiedBlocks: Set<number>;
  isLoggedIn: boolean;
  userProfile: { id: string; name: string | null; email: string } | null;
  onSubmitted: (req: ScheduleRequest) => void;
  onCancel: () => void;
}

export function RequestForm({ date, occupiedBlocks, isLoggedIn, userProfile, onSubmitted, onCancel }: RequestFormProps) {
  const [step, setStep] = useState<'select' | 'fill'>('select');
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState('');
  const [guestName, setGuestName] = useState('');
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>([]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleBlock = (i: number) => {
    setSelectedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const sortedBlocks = [...selectedBlocks].sort((a, b) => a - b);
  const startBlock = sortedBlocks[0];
  const endBlock = sortedBlocks[sortedBlocks.length - 1] + 1;

  const handleRemoveCollaborator = (key: string) => {
    setCollaborators(prev => prev.filter(e => {
      if (e.type === 'member') return e.user.id !== key;
      return `guest:${e.name}` !== key;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('할일을 입력해주세요.'); return; }
    if (selectedBlocks.size === 0) { setError('시간을 선택해주세요.'); return; }
    if (!isLoggedIn && !guestName.trim()) { setError('이름을 입력해주세요.'); return; }

    setSubmitting(true);
    setError('');
    const supabase = createClient();

    const memberCollaborators = collaborators
      .filter(e => e.type === 'member')
      .map(e => (e as Extract<CollaboratorEntry, { type: 'member' }>).user.id);
    const guestCollaborators = collaborators
      .filter(e => e.type === 'guest')
      .map(e => (e as Extract<CollaboratorEntry, { type: 'guest' }>).name);

    const payload = {
      title: title.trim(),
      date: toDateString(date),
      start_block: startBlock,
      end_block: endBlock,
      requester_user_id: isLoggedIn ? userProfile!.id : null,
      requester_name: isLoggedIn ? (userProfile!.name ?? userProfile!.email) : guestName.trim(),
      requester_email: isLoggedIn ? userProfile!.email : null,
      collaborators: memberCollaborators,
      guest_collaborators: guestCollaborators,
      location: location.trim() || null,
      notes: notes.trim() || null,
    };

    const { data, error: err } = await supabase
      .from('schedule_requests')
      .insert(payload)
      .select()
      .single();

    setSubmitting(false);
    if (err) { setError('요청 중 오류가 발생했습니다.'); return; }
    if (data) onSubmitted(data as ScheduleRequest);
  };

  if (step === 'select') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-foreground/70">원하는 시간 블록을 선택하세요</p>
        <div className="max-h-80 overflow-y-auto pr-1">
          <TimeBlockGrid occupiedBlocks={occupiedBlocks} selectedBlocks={selectedBlocks} onBlockToggle={toggleBlock} />
        </div>
        {selectedBlocks.size > 0 && (
          <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-3 py-2 text-sm">
            <span className="font-medium">선택된 시간: </span>
            {blocksToTimeRange(startBlock, endBlock)}
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-medium text-foreground/60 hover:bg-foreground/5 transition-colors">
            취소
          </button>
          <button type="button" disabled={selectedBlocks.size === 0} onClick={() => setStep('fill')}
            className="flex-1 rounded-xl bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-30 hover:bg-foreground/80 transition-colors">
            다음 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-3 py-2 text-sm">
        <span className="font-medium">선택된 시간: </span>
        {blocksToTimeRange(startBlock, endBlock)}
        <button type="button" onClick={() => setStep('select')} className="ml-2 text-xs text-foreground/50 hover:text-foreground underline">변경</button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">할일 *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="무엇을 할 예정인가요?"
          className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30" />
      </div>

      {!isLoggedIn && (
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground/60">이름 *</label>
          <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="홍길동"
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30" />
        </div>
      )}

      {isLoggedIn && (
        <div className="rounded-xl bg-foreground/5 px-3 py-2 text-sm text-foreground/60">
          요청자: <span className="font-medium text-foreground">{userProfile?.name ?? userProfile?.email}</span>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">장소 (선택)</label>
        <LocationSearchInput value={location} onChange={setLocation} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">공동작업자 (선택)</label>
        <UserSearchInput
          selected={collaborators}
          onSelect={e => setCollaborators(prev => [...prev, e])}
          onRemove={handleRemoveCollaborator}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">메모 (선택)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="추가 메모가 있다면..."
          className="w-full resize-none rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30" />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => setStep('select')}
          className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-medium text-foreground/60 hover:bg-foreground/5 transition-colors">
          ← 이전
        </button>
        <button type="submit" disabled={submitting}
          className="flex-1 rounded-xl bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-50 hover:bg-foreground/80 transition-colors">
          {submitting ? '요청 중...' : '요청 보내기'}
        </button>
      </div>
    </form>
  );
}
