'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getOccupiedBlocks, blockToLabel } from '@/lib/calendar-utils';
import { RequestForm } from './RequestForm';
import { AdminScheduleForm } from './AdminScheduleForm';
import type { Schedule, ScheduleRequest, CalendarUser } from '@/lib/types/calendar';

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

interface DayViewProps {
  date: Date;
  schedules: Schedule[];           // 해당 날짜의 확정 일정
  isAdmin: boolean;
  isLoggedIn: boolean;
  userProfile: { id: string; name: string | null; email: string } | null;
  onClose: () => void;
  onRequestSubmitted: (req: ScheduleRequest) => void;
  onScheduleAdded: (schedule: Schedule) => void;
}

export function DayView({
  date,
  schedules,
  isAdmin,
  isLoggedIn,
  userProfile,
  onClose,
  onRequestSubmitted,
  onScheduleAdded,
}: DayViewProps) {
  const [tab, setTab] = useState<'request' | 'admin'>(isAdmin ? 'admin' : 'request');
  const [success, setSuccess] = useState(false);
  const occupiedBlocks = getOccupiedBlocks(schedules);

  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAYS_KO[date.getDay()]})`;

  const handleRequestSubmitted = (req: ScheduleRequest) => {
    onRequestSubmitted(req);
    setSuccess(true);
  };

  const handleScheduleAdded = (schedule: Schedule) => {
    onScheduleAdded(schedule);
    setSuccess(true);
  };

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
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 탭 (관리자만 탭 보임) */}
      {isAdmin && (
        <div className="flex gap-1 border-b border-foreground/10 px-5 py-2">
          <button
            onClick={() => { setTab('admin'); setSuccess(false); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'admin' ? 'bg-yellow-400/20 text-foreground' : 'text-foreground/40 hover:text-foreground'}`}
          >
            일정 등록
          </button>
          <button
            onClick={() => { setTab('request'); setSuccess(false); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'request' ? 'bg-foreground/10 text-foreground' : 'text-foreground/40 hover:text-foreground'}`}
          >
            요청 보내기
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* 이미 확정된 일정 표시 */}
        {schedules.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-foreground/40 uppercase tracking-wider">확정 일정</p>
            <div className="flex flex-col gap-2">
              {schedules.map(s => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-foreground/50">{blockToLabel(s.start_block)} – {blockToLabel(s.end_block)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 성공 메시지 */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-lg font-bold">
                {tab === 'admin' ? '일정이 등록됐어요!' : '요청을 보냈어요!'}
              </p>
              <p className="mt-1 text-sm text-foreground/50">
                {tab === 'admin' ? '캘린더에 바로 반영됩니다.' : '관리자가 확인 후 수락할 거예요.'}
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 rounded-xl border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-foreground/5 transition-colors"
              >
                다시 {tab === 'admin' ? '등록' : '요청'}하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 폼 */}
        {!success && (
          <>
            {tab === 'request' && (
              <RequestForm
                date={date}
                occupiedBlocks={occupiedBlocks}
                isLoggedIn={isLoggedIn}
                userProfile={userProfile}
                onSubmitted={handleRequestSubmitted}
                onCancel={onClose}
              />
            )}
            {tab === 'admin' && isAdmin && (
              <AdminScheduleForm
                date={date}
                occupiedBlocks={occupiedBlocks}
                adminId={userProfile!.id}
                onAdded={handleScheduleAdded}
                onCancel={onClose}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
