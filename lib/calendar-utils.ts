import type { Schedule } from './types/calendar';

// 7열 달력 그리드 생성 (null = 빈 셀)
export function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=일요일
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  // 6행 맞추기
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

// 블록 인덱스 → "HH:MM" 레이블
export function blockToLabel(block: number): string {
  const h = Math.floor(block / 2);
  const m = block % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}

// Date → "YYYY-MM-DD" (로컬 시간 기준)
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// "YYYY-MM-DD" → Date (자정 로컬)
export function fromDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// 확정 일정에서 점유된 블록 인덱스 Set 반환
export function getOccupiedBlocks(schedules: Schedule[]): Set<number> {
  const occupied = new Set<number>();
  for (const s of schedules) {
    for (let i = s.start_block; i < s.end_block; i++) {
      occupied.add(i);
    }
  }
  return occupied;
}

// 두 날짜가 같은 날인지 비교
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// 블록 범위를 "09:00 – 10:30" 형식으로 표시
export function blocksToTimeRange(start: number, end: number): string {
  return `${blockToLabel(start)} – ${blockToLabel(end)}`;
}

// 현재 달의 첫날과 마지막날 문자열 반환 (Supabase 쿼리용)
export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}
