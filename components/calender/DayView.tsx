'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getOccupiedBlocks, blockToLabel } from '@/lib/calendar-utils';
import { RequestForm } from './RequestForm';
import { AdminScheduleForm } from './AdminScheduleForm';
import type { Schedule, ScheduleRequest, CalendarUser } from '@/lib/types/calendar';

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

interface DayViewProps {
  date: Date;
  schedules: Schedule[];
  isAdmin: boolean;
  isLoggedIn: boolean;
  userProfile: { id: string; name: string | null; email: string } | null;
  allUsers: CalendarUser[];
  onClose: () => void;
  onRequestSubmitted: (req: ScheduleRequest) => void;
  onScheduleAdded: (schedule: Schedule) => void;
  onScheduleDeleted: (id: string) => void;
}

function UserAvatar({ user }: { user: CalendarUser }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.name ?? user.email} className="h-4 w-4 rounded-full object-cover shrink-0" />;
  }
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground/15 text-[8px] font-bold shrink-0">
      {(user.name ?? user.email)[0].toUpperCase()}
    </span>
  );
}

export function DayView({
  date, schedules, isAdmin, isLoggedIn, userProfile, allUsers,
  onClose, onRequestSubmitted, onScheduleAdded, onScheduleDeleted,
}: DayViewProps) {
  const [tab, setTab] = useState<'request' | 'admin'>(isAdmin ? 'admin' : 'request');
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const occupiedBlocks = getOccupiedBlocks(schedules);

  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAYS_KO[date.getDay()]})`;

  const handleDeleteSchedule = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from('schedules').delete().eq('id', id);
    setDeletingId(null);
    onScheduleDeleted(id);
  };

  const getUser = (id: string) => allUsers.find(u => u.id === id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-background shadow-xl"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
        <div>
          <p className="text-xs font-medium text-foreground/40 uppercase tracking-wider">날짜 선택됨</p>
          <h3 className="text-lg font-bold">{dateLabel}</h3>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 탭 (관리자만) */}
      {isAdmin && (
        <div className="flex gap-1 border-b border-foreground/10 px-5 py-2">
          <button onClick={() => { setTab('admin'); setSuccess(false); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'admin' ? 'bg-yellow-400/20 text-foreground' : 'text-foreground/40 hover:text-foreground'}`}>
            일정 등록
          </button>
          <button onClick={() => { setTab('request'); setSuccess(false); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'request' ? 'bg-foreground/10 text-foreground' : 'text-foreground/40 hover:text-foreground'}`}>
            요청 보내기
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* 확정 일정 목록 */}
        {schedules.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-foreground/40 uppercase tracking-wider">확정 일정</p>
            <div className="flex flex-col gap-2">
              {schedules.map(s => (
                <div key={s.id} className="rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{s.title}</p>
                        <p className="text-xs text-foreground/50">{blockToLabel(s.start_block)} – {blockToLabel(s.end_block)}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        disabled={deletingId === s.id}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/30 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-30 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 상세 정보 */}
                  <div className="mt-2 ml-4 flex flex-col gap-1">
                    {s.requester_name && (
                      <p className="text-xs text-foreground/60">👤 요청자: <span className="font-medium text-foreground">{s.requester_name}</span></p>
                    )}
                    {s.location && (
                      <p className="text-xs text-foreground/60">📍 {s.location}</p>
                    )}
                    {s.notes && (
                      <p className="text-xs text-foreground/50 italic">💬 "{s.notes}"</p>
                    )}
                    {/* 공동작업자 */}
                    {(s.collaborators.length > 0 || s.guest_collaborators.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="text-xs text-foreground/40">👥</span>
                        {s.collaborators.map(id => {
                          const u = getUser(id);
                          return u ? (
                            <span key={id} className="flex items-center gap-1 rounded-full bg-yellow-400/20 border border-yellow-400/30 px-1.5 py-0.5 text-[10px]">
                              <UserAvatar user={u} />
                              {u.name ?? u.email}
                            </span>
                          ) : null;
                        })}
                        {s.guest_collaborators.map(name => (
                          <span key={name} className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px]">
                            {name} <span className="opacity-40">비회원</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 성공 메시지 */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-lg font-bold">{tab === 'admin' ? '일정이 등록됐어요!' : '요청을 보냈어요!'}</p>
              <p className="mt-1 text-sm text-foreground/50">{tab === 'admin' ? '캘린더에 바로 반영됩니다.' : '관리자가 확인 후 수락할 거예요.'}</p>
              <button onClick={() => setSuccess(false)}
                className="mt-4 rounded-xl border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors">
                다시 {tab === 'admin' ? '등록' : '요청'}하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <>
            {tab === 'request' && (
              <RequestForm
                date={date} occupiedBlocks={occupiedBlocks} isLoggedIn={isLoggedIn} userProfile={userProfile}
                onSubmitted={req => { onRequestSubmitted(req); setSuccess(true); }}
                onCancel={onClose}
              />
            )}
            {tab === 'admin' && isAdmin && (
              <AdminScheduleForm
                date={date} occupiedBlocks={occupiedBlocks} adminId={userProfile!.id}
                onAdded={s => { onScheduleAdded(s); setSuccess(true); }}
                onCancel={onClose}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
