'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { CalendarGrid } from '@/components/calender/CalendarGrid';
import { DayView } from '@/components/calender/DayView';
import { RequestQueue } from '@/components/calender/RequestQueue';
import { TutorialOverlay } from '@/components/calender/TutorialOverlay';
import { getMonthRange, isSameDay, toDateString } from '@/lib/calendar-utils';
import type { Schedule, ScheduleRequest, CalendarUser } from '@/lib/types/calendar';

interface Props {
  initialSchedules: Schedule[];
  initialRequests: ScheduleRequest[];
  initialYear: number;
  initialMonth: number;
}

export function CalendarPageClient({ initialSchedules, initialRequests, initialYear, initialMonth }: Props) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.is_admin ?? false;
  const isLoggedIn = !!user;

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [requests, setRequests] = useState<ScheduleRequest[]>(initialRequests);
  const [allUsers, setAllUsers] = useState<CalendarUser[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 협업자 이름 조회용 유저 목록
  useEffect(() => {
    const supabase = createClient();
    supabase.from('users').select('id, name, email, avatar_url').then(({ data }) => {
      if (data) setAllUsers(data as CalendarUser[]);
    });
  }, []);

  // 월 변경 시 일정 재조회
  useEffect(() => {
    const supabase = createClient();
    const { from, to } = getMonthRange(currentYear, currentMonth);
    supabase
      .from('schedules')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .then(({ data }) => { if (data) setSchedules(data as Schedule[]); });
  }, [currentYear, currentMonth]);

  const handleMonthChange = (y: number, m: number) => {
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDate(null);
  };

  // 선택된 날짜의 확정 일정
  const daySchedules = selectedDate
    ? schedules.filter(s => s.date === toDateString(selectedDate))
    : [];

  const handleRequestSubmitted = (req: ScheduleRequest) => {
    setRequests(prev => [req, ...prev]);
  };

  const handleScheduleAdded = (schedule: Schedule) => {
    setSchedules(prev => [...prev, schedule]);
  };

  const handleRequestAccepted = (requestId: string, newSchedule: Schedule) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' as const } : r));
    setSchedules(prev => [...prev, newSchedule]);
  };

  const handleRequestRejected = (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r));
  };

  const handleScheduleDeleted = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleRequestDeleted = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const userProfile = user && profile
    ? { id: profile.id, name: profile.name, email: profile.email }
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 md:px-8 md:py-12">

      <TutorialOverlay />

      {/* 배경 질감 레이어 */}
      {/* 노이즈 그레인 */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* 황금빛 글로우 블롭 - 좌상단 */}
      <div className="pointer-events-none fixed -left-32 -top-32 z-0 h-[500px] w-[500px] rounded-full bg-yellow-400/8 blur-[120px]" />
      {/* 글로우 블롭 - 우하단 */}
      <div className="pointer-events-none fixed -bottom-40 -right-40 z-0 h-[600px] w-[600px] rounded-full bg-yellow-300/6 blur-[140px]" />
      {/* 중앙 미드톤 블롭 */}
      <div className="pointer-events-none fixed left-1/2 top-1/3 z-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-foreground/3 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <a href="/" className="text-sm text-foreground/40 hover:text-foreground transition-colors">← 홈으로</a>
          <h1 className="mt-2 text-3xl font-extrabold">약속 캘린더</h1>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground"
          >
            날짜를 클릭해 일정을 요청하세요
            <motion.span
              animate={{ y: [0, 4, 0], scale: [1, 0.85, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
              className="inline-block text-base select-none"
            >
              👆
            </motion.span>
          </motion.p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* 왼쪽: 캘린더 + DayView */}
          <div className="flex flex-col gap-4 lg:w-[55%]">
            <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/60 p-6 shadow-sm backdrop-blur-sm">
              {/* 카드 내부 상단 하이라이트 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
              <CalendarGrid
                year={currentYear}
                month={currentMonth}
                schedules={schedules}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onMonthChange={handleMonthChange}
              />
            </div>

            <AnimatePresence>
              {selectedDate && (
                <DayView
                  date={selectedDate}
                  schedules={daySchedules}
                  isAdmin={isAdmin}
                  isLoggedIn={isLoggedIn}
                  userProfile={userProfile}
                  allUsers={allUsers}
                  onClose={() => setSelectedDate(null)}
                  onRequestSubmitted={handleRequestSubmitted}
                  onScheduleAdded={handleScheduleAdded}
                  onScheduleDeleted={handleScheduleDeleted}
                />
              )}
            </AnimatePresence>
          </div>

          {/* 오른쪽: 요청 큐 */}
          <div className="lg:w-[45%]">
            <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/60 p-6 shadow-sm backdrop-blur-sm">
              {/* 카드 내부 상단 하이라이트 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold">요청 큐</h2>
                <span className="rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2.5 py-0.5 text-xs font-semibold text-foreground/60">
                  {requests.filter(r => r.status === 'pending').length} 대기중
                </span>
              </div>
              <RequestQueue
                requests={requests}
                isAdmin={isAdmin}
                allUsers={allUsers}
                onAccepted={handleRequestAccepted}
                onRejected={handleRequestRejected}
                onDeleted={handleRequestDeleted}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
