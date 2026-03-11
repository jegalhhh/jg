import { createClient } from '@/lib/supabase/server';
import { CalendarPageClient } from './CalendarPageClient';
import type { Schedule, ScheduleRequest } from '@/lib/types/calendar';
import { getMonthRange } from '@/lib/calendar-utils';

export default async function CalenderPage() {
  const supabase = await createClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const { from, to } = getMonthRange(year, month);

  const [schedulesRes, requestsRes] = await Promise.all([
    supabase.from('schedules').select('*').gte('date', from).lte('date', to),
    supabase.from('schedule_requests').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <CalendarPageClient
      initialSchedules={(schedulesRes.data ?? []) as Schedule[]}
      initialRequests={(requestsRes.data ?? []) as ScheduleRequest[]}
      initialYear={year}
      initialMonth={month}
    />
  );
}
