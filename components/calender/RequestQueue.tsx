'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { blocksToTimeRange, fromDateString } from '@/lib/calendar-utils';
import type { Schedule, ScheduleRequest, CalendarUser } from '@/lib/types/calendar';

interface RequestQueueProps {
  requests: ScheduleRequest[];
  isAdmin: boolean;
  allUsers: CalendarUser[];
  onAccepted: (requestId: string, newSchedule: Schedule) => void;
  onRejected: (requestId: string) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dateStr: string): string {
  const d = fromDateString(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

function getUserName(userId: string, allUsers: CalendarUser[]): string {
  const u = allUsers.find(u => u.id === userId);
  return u?.name ?? u?.email ?? userId;
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

export function RequestQueue({ requests, isAdmin, allUsers, onAccepted, onRejected }: RequestQueueProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAccept = async (req: ScheduleRequest) => {
    setLoadingId(req.id);
    const supabase = createClient();

    // 1. schedules에 삽입
    const { data: newSchedule, error: schedErr } = await supabase
      .from('schedules')
      .insert({
        title: req.title,
        date: req.date,
        start_block: req.start_block,
        end_block: req.end_block,
        created_by: null,
        collaborators: req.collaborators,
        notes: req.notes,
      })
      .select()
      .single();

    if (schedErr || !newSchedule) { setLoadingId(null); return; }

    // 2. 요청 상태 업데이트
    await supabase
      .from('schedule_requests')
      .update({ status: 'accepted' })
      .eq('id', req.id);

    setLoadingId(null);
    onAccepted(req.id, newSchedule as Schedule);
  };

  const handleReject = async (req: ScheduleRequest) => {
    setLoadingId(req.id);
    const supabase = createClient();
    await supabase
      .from('schedule_requests')
      .update({ status: 'rejected', admin_note: rejectNote.trim() || null })
      .eq('id', req.id);
    setLoadingId(null);
    setRejectingId(null);
    setRejectNote('');
    onRejected(req.id);
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
        <div>
          <p className="font-semibold text-sm">{req.title}</p>
          <p className="text-xs text-foreground/50 mt-0.5">
            {formatDate(req.date)} · {blocksToTimeRange(req.start_block, req.end_block)}
          </p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="flex items-center gap-1 text-xs text-foreground/60">
        <span className="font-medium">요청자:</span>
        <span>{req.requester_name}</span>
      </div>

      {req.collaborators.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {req.collaborators.map(id => (
            <span key={id} className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px]">
              {getUserName(id, allUsers)}
            </span>
          ))}
        </div>
      )}

      {req.notes && (
        <p className="text-xs text-foreground/50 italic">"{req.notes}"</p>
      )}

      {req.admin_note && req.status === 'rejected' && (
        <p className="text-xs text-red-400">거절 사유: {req.admin_note}</p>
      )}

      {isAdmin && req.status === 'pending' && (
        <>
          {rejectingId === req.id ? (
            <div className="flex flex-col gap-2 mt-1">
              <input
                type="text"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="거절 사유 (선택)"
                className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-xs outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setRejectingId(null)}
                  className="flex-1 rounded-xl border border-foreground/15 py-1.5 text-xs text-foreground/60 hover:bg-foreground/5">
                  취소
                </button>
                <button onClick={() => handleReject(req)} disabled={loadingId === req.id}
                  className="flex-1 rounded-xl bg-red-500/80 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50">
                  {loadingId === req.id ? '처리 중...' : '거절 확정'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { setRejectingId(req.id); setRejectNote(''); }}
                className="flex-1 rounded-xl border border-red-400/30 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50/10 transition-colors"
              >
                거절
              </button>
              <button
                onClick={() => handleAccept(req)}
                disabled={loadingId === req.id}
                className="flex-1 rounded-xl bg-foreground py-1.5 text-xs font-bold text-background hover:bg-foreground/80 disabled:opacity-50 transition-colors"
              >
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
