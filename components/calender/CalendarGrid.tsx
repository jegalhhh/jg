'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildMonthGrid, toDateString, isSameDay } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';
import type { Schedule } from '@/lib/types/calendar';

interface CalendarGridProps {
  year: number;
  month: number;
  schedules: Schedule[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function CalendarGrid({ year, month, schedules, selectedDate, onDateSelect, onMonthChange }: CalendarGridProps) {
  const today = new Date();
  const cells = buildMonthGrid(year, month);

  // 날짜별 일정 유무 체크 (빠른 조회용 Set)
  const scheduledDates = new Set(schedules.map(s => s.date));

  const prevMonth = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.button>

        <h2 className="text-lg font-bold">
          {year}년 {MONTHS_KO[month]}
        </h2>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS_KO.map((d, i) => (
          <div key={d} className={cn('text-xs font-semibold py-1', i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-foreground/40')}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;

          const dateStr = toDateString(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const hasSchedule = scheduledDates.has(dateStr);
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const dayOfWeek = date.getDay();

          return (
            <motion.button
              key={dateStr}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDateSelect(date)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-medium transition-colors',
                isPast ? 'opacity-40' : '',
                isSelected
                  ? 'bg-foreground text-background'
                  : isToday
                  ? 'bg-yellow-400/20 border border-yellow-400/60 text-foreground'
                  : 'hover:bg-foreground/8 text-foreground',
                dayOfWeek === 0 && !isSelected ? 'text-red-400' : '',
                dayOfWeek === 6 && !isSelected ? 'text-blue-400' : '',
              )}
            >
              <span>{date.getDate()}</span>
              {hasSchedule && (
                <span className={cn(
                  'mt-0.5 h-1 w-1 rounded-full',
                  isSelected ? 'bg-background' : 'bg-yellow-400'
                )} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
