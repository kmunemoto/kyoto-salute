export interface Session {
  id: string;
  clientName: string;
  clientAvatar: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Client {
  id: string;
  name: string;
  avatar: string;
  goal: string;
  nextSession: string;
  totalSessions: number;
  memberSince: string;
  progress: number;
}

export interface BodyMetric {
  date: string;
  weight: number;
  bodyFat: number;
  muscle: number;
}

export const sessions: Session[] = [
  { id: '1', clientName: '田中 太郎', clientAvatar: 'T', date: '2026-04-09', time: '10:00', duration: 60, type: '上半身トレーニング', status: 'upcoming' },
  { id: '2', clientName: '鈴木 花子', clientAvatar: 'S', date: '2026-04-09', time: '11:30', duration: 60, type: '下半身トレーニング', status: 'upcoming' },
  { id: '3', clientName: '佐藤 健太', clientAvatar: 'K', date: '2026-04-09', time: '14:00', duration: 45, type: 'HIIT', status: 'upcoming' },
  { id: '4', clientName: '高橋 美咲', clientAvatar: 'M', date: '2026-04-09', time: '16:00', duration: 60, type: '全身トレーニング', status: 'upcoming' },
  { id: '5', clientName: '田中 太郎', clientAvatar: 'T', date: '2026-04-07', time: '10:00', duration: 60, type: '下半身トレーニング', status: 'completed' },
  { id: '6', clientName: '鈴木 花子', clientAvatar: 'S', date: '2026-04-05', time: '11:00', duration: 60, type: '上半身トレーニング', status: 'completed' },
  { id: '7', clientName: '佐藤 健太', clientAvatar: 'K', date: '2026-04-06', time: '15:00', duration: 45, type: 'ストレッチ', status: 'cancelled' },
];

export const clients: Client[] = [
  { id: '1', name: '田中 太郎', avatar: 'T', goal: '筋力アップ', nextSession: '4/9 10:00', totalSessions: 24, memberSince: '2025-10', progress: 72 },
  { id: '2', name: '鈴木 花子', avatar: 'S', goal: 'ダイエット', nextSession: '4/9 11:30', totalSessions: 18, memberSince: '2025-12', progress: 58 },
  { id: '3', name: '佐藤 健太', avatar: 'K', goal: '体力向上', nextSession: '4/9 14:00', totalSessions: 32, memberSince: '2025-08', progress: 85 },
  { id: '4', name: '高橋 美咲', avatar: 'M', goal: 'ボディメイク', nextSession: '4/9 16:00', totalSessions: 12, memberSince: '2026-01', progress: 40 },
  { id: '5', name: '山田 翔太', avatar: 'Y', goal: '減量', nextSession: '4/10 10:00', totalSessions: 45, memberSince: '2025-04', progress: 92 },
];

export const bodyMetrics: BodyMetric[] = [
  { date: '1月', weight: 78, bodyFat: 22, muscle: 32 },
  { date: '2月', weight: 76.5, bodyFat: 21, muscle: 32.5 },
  { date: '3月', weight: 75, bodyFat: 19.5, muscle: 33.2 },
  { date: '4月', weight: 73.8, bodyFat: 18, muscle: 34 },
];

export const customerUpcomingSessions = [
  { id: '1', date: '4月9日（水）', time: '10:00 - 11:00', type: '上半身トレーニング', trainer: '山本 コーチ' },
  { id: '2', date: '4月12日（土）', time: '14:00 - 15:00', type: '下半身トレーニング', trainer: '山本 コーチ' },
];

export const customerHistory = [
  { id: '1', date: '4月7日', type: '下半身トレーニング', duration: 60, calories: 420 },
  { id: '2', date: '4月4日', type: '上半身トレーニング', duration: 60, calories: 380 },
  { id: '3', date: '4月1日', type: 'HIIT', duration: 45, calories: 510 },
  { id: '4', date: '3月29日', type: '全身トレーニング', duration: 60, calories: 450 },
];
