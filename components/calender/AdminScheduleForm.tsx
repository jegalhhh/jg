'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toDateString, blocksToTimeRange } from '@/lib/calendar-utils';
import { TimeBlockGrid } from './TimeBlockGrid';
import { UserSearchInput } from './UserSearchInput';
import { LocationSearchInput } from './LocationSearchInput';
import type { Schedule, CollaboratorEntry } from '@/lib/types/calendar';

interface AdminScheduleFormProps {
  date: Date;
  occupiedBlocks: Set<number>;
  adminId: string;
  onAdded: (schedule: Schedule) => void;
  onCancel: () => void;
  prefillBlocks?: Set<number>;
  prefillTitle?: string;
  prefillCollaborators?: CollaboratorEntry[];
  prefillLocation?: string;
  prefillRequesterName?: string;
}

export function AdminScheduleForm({
  date,
  occupiedBlocks,
  adminId,
  onAdded,
  onCancel,
  prefillBlocks,
  prefillTitle = '',
  prefillCollaborators = [],
  prefillLocation = '',
  prefillRequesterName = '',
}: AdminScheduleFormProps) {
  const [step, setStep] = useState<'select' | 'fill'>(prefillBlocks ? 'fill' : 'select');
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(prefillBlocks ?? new Set());
  const [title, setTitle] = useState(prefillTitle);
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>(prefillCollaborators);
  const [location, setLocation] = useState(prefillLocation);
  const [requesterName, setRequesterName] = useState(prefillRequesterName);
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

    setSubmitting(true);
    setError('');
    const supabase = createClient();

    const memberCollaborators = collaborators
      .filter(e => e.type === 'member')
      .map(e => (e as Extract<CollaboratorEntry, { type: 'member' }>).user.id);
    const guestCollaborators = collaborators
      .filter(e => e.type === 'guest')
      .map(e => (e as Extract<CollaboratorEntry, { type: 'guest' }>).name);

    const { data, error: err } = await supabase
      .from('schedules')
      .insert({
        title: title.trim(),
        date: toDateString(date),
        start_block: startBlock,
        end_block: endBlock,
        created_by: adminId,
        collaborators: memberCollaborators,
        guest_collaborators: guestCollaborators,
        location: location.trim() || null,
        requester_name: requesterName.trim() || null,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    setSubmitting(false);
    if (err) { setError('등록 중 오류가 발생했습니다.'); return; }
    if (data) onAdded(data as Schedule);
  };

  if (step === 'select') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-foreground/70">일정을 등록할 시간 블록을 선택하세요</p>
        <div className="max-h-80 overflow-y-auto pr-1">
          <TimeBlockGrid occupiedBlocks={occupiedBlocks} selectedBlocks={selectedBlocks} onBlockToggle={toggleBlock} />
        </div>
        {selectedBlocks.size > 0 && (
          <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-3 py-2 text-sm">
            <span className="font-medium">선택된 시간: </span>{blocksToTimeRange(startBlock, endBlock)}
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-medium text-foreground/60 hover:bg-foreground/5 transition-colors">
            취소
          </button>
          <button type="button" disabled={selectedBlocks.size === 0} onClick={() => setStep('fill')}
            className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-foreground disabled:opacity-30 hover:bg-yellow-300 transition-colors">
            다음 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-3 py-2 text-sm">
        <span className="font-medium">선택된 시간: </span>{blocksToTimeRange(startBlock, endBlock)}
        <button type="button" onClick={() => setStep('select')} className="ml-2 text-xs text-foreground/50 hover:text-foreground underline">변경</button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">할일 *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목"
          className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground/60">요청자 이름 (선택)</label>
        <input type="text" value={requesterName} onChange={e => setRequesterName(e.target.value)} placeholder="홍길동"
          className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30" />
      </div>

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
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="추가 메모..."
          className="w-full resize-none rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/30" />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => setStep('select')}
          className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-medium text-foreground/60 hover:bg-foreground/5 transition-colors">
          ← 이전
        </button>
        <button type="submit" disabled={submitting}
          className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-foreground disabled:opacity-50 hover:bg-yellow-300 transition-colors">
          {submitting ? '등록 중...' : '일정 등록'}
        </button>
      </div>
    </form>
  );
}
