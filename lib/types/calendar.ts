export type Schedule = {
  id: string;
  title: string;
  date: string;         // "YYYY-MM-DD"
  start_block: number;  // 0-47 (0=00:00, 1=00:30, ..., 47=23:30)
  end_block: number;    // exclusive
  created_by: string | null;
  collaborators: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleRequest = {
  id: string;
  title: string;
  date: string;
  start_block: number;
  end_block: number;
  requester_user_id: string | null;
  requester_name: string;
  requester_email: string | null;
  collaborators: string[];
  notes: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarUser = {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
};
