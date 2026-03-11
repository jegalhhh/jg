'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { blocksToTimeRange, fromDateString } from '@/lib/calendar-utils';
import type { Schedule, ScheduleRequest, CalendarUser } from '@/lib/types/calendar';

interface RequestQueueProps {
  requests: ScheduleRequest[];
  isAdmin: boolean;
  allUsers: CalendarUser[];
  onAccepted: (requestId: string, newSchedule: Schedule) => void;
  onRejected: (requestId: string) => void;
  onDeleted: (requestId: string) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dateStr: string): string {
  const d = fromDateString(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

function getUser(userId: string, allUsers: CalendarUser[]): CalendarUser | undefined {
  return allUsers.find(u => u.id === userId);
}

function UserAvatar({ user }: { user: CalendarUser }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.name ?? user.email} className="h-5 w-5 rounded-full object-cover shrink-0" />;
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/15 text-[9px] font-bold shrink-0">
      {(user.name ?? user.email)[0].toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: ScheduleRequest['status'] }) {
  const map = {
    pending: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/40',
    accepted: 'bg-green-400/20 text-green-600 border-green-400/40',
    rejected: 'bg-red-400/20 text-red-500 border-red-400/40',
  };
  const label = { pending: '대기중', accepted: '수락됨', rejected: '거절됨' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export function RequestQueue({ requests, isAdmin, allUsers, onAccepted, onRejected, onDeleted }: RequestQueueProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAccept = async (req: ScheduleRequest) => {
    setLoadingId(req.id);
    const supabase = createClient();
    const { data: newSchedule, error: schedErr } = await supabase
      .from('schedules')
      .insert({
        title: req.title,
        date: req.date,
        start_block: req.start_block,
        end_block: req.end_block,
        created_by: null,
        collaborators: req.collaborators,
        guest_collaborators: req.guest_collaborators,
        location: req.location,
        requester_name: req.requester_name,
        notes: req.notes,
      })
      .select()
      .single();
    if (schedErr || !newSchedule) { setLoadingId(null); return; }
    await supabase.from('schedule_requests').update({ status: 'accepted' }).eq('id', req.id);
    setLoadingId(null);
    onAccepted(req.id, newSchedule as Schedule);
  };

  const handleReject = async (req: ScheduleRequest) => {
    setLoadingId(req.id);
    const supabase = createClient();
    await supabase.from('schedule_requests')
      .update({ status: 'rejected', admin_note: rejectNote.trim() || null })
      .eq('id', req.id);
    setLoadingId(null);
    setRejectingId(null);
    setRejectNote('');
    onRejected(req.id);
  };

  const handleDelete = async (req: ScheduleRequest) => {
    setLoadingId(req.id);
    const supabase = createClient();
    await supabase.from('schedule_requests').delete().eq('id', req.id);
    setLoadingId(null);
    onDeleted(req.id);
  };

  const pending = requests.filter(r => r.status === 'pending');
  const others = requests.filter(r => r.status !== 'pending');

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-foreground/30">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-sm">아직 요청이 없습니다</p>
      </div>
    );
  }

  const renderCard = (req: ScheduleRequest) => (
    <div key={req.id} className="rounded-2xl border border-foreground/10 bg-foreground/3 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{req.title}</p>
          <p className="text-xs text-foreground/50 mt-0.5">
            {formatDate(req.date)} · {blocksToTimeRange(req.start_block, req.end_block)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={req.status} />
          {isAdmin && (
            <button
              onClick={() => handleDelete(req)}
              disabled={loadingId === req.id}
              className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/30 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-30"
              title="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-foreground/60">
        <span className="font-medium">요청자:</span>
        <span>{req.requester_name}</span>
      </div>

      {req.location && (
        <p className="text-xs text-foreground/50">📍 {req.location}</p>
      )}

      {/* 공동작업자 - 회원 + 비회원 */}
      {(req.collaborators.length > 0 || req.guest_collaborators.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {req.collaborators.map(id => {
            const u = getUser(id, allUsers);
            return u ? (
              <span key={id} className="flex items-center gap-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2 py-0.5 text-[10px]">
                <UserAvatar user={u} />
                {u.name ?? u.email}
              </span>
            ) : null;
          })}
          {req.guest_collaborators.map(name => (
            <span key={name} className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px]">
              {name} <span className="opacity-50">비회원</span>
            </span>
          ))}
        </div>
      )}

      {req.notes && (
        <p className="text-xs text-foreground/50 italic">💬 "{req.notes}"</p>
      )}

      {req.admin_note && req.status === 'rejected' && (
        <p className="text-xs text-red-400">거절 사유: {req.admin_note}</p>
      )}

      {isAdmin && req.status === 'pending' && (
        <>
          {rejectingId === req.id ? (
            <div className="flex flex-col gap-2 mt-1">
              <input type="text" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="거절 사유 (선택)" className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-xs outline-none" />
              <div className="flex gap-2">
                <button onClick={() => setRejectingId(null)}
                  className="flex-1 rounded-xl border border-foreground/15 py-1.5 text-xs text-foreground/60 hover:bg-foreground/5">취소</button>
                <button onClick={() => handleReject(req)} disabled={loadingId === req.id}
                  className="flex-1 rounded-xl bg-red-500/80 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50">
                  {loadingId === req.id ? '처리 중...' : '거절 확정'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-1">
              <button onClick={() => { setRejectingId(req.id); setRejectNote(''); }}
                className="flex-1 rounded-xl border border-red-400/30 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50/10 transition-colors">
                거절
              </button>
              <button onClick={() => handleAccept(req)} disabled={loadingId === req.id}
                className="flex-1 rounded-xl bg-foreground py-1.5 text-xs font-bold text-background hover:bg-foreground/80 disabled:opacity-50 transition-colors">
                {loadingId === req.id ? '처리 중...' : '수락'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {pending.length > 0 && (
        <>
          <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">대기중 ({pending.length})</p>
          {pending.map(renderCard)}
        </>
      )}
      {others.length > 0 && (
        <>
          <p className="text-xs font-semibold text-foreground/30 uppercase tracking-wider mt-2">처리 완료</p>
          {others.map(renderCard)}
        </>
      )}
    </div>
  );
}
