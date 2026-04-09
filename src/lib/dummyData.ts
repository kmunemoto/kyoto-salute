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
}

export interface ChatMessage {
  id: string;
  sender: 'trainer' | 'customer';
  text: string;
  time: string;
  date: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export type PlanType = '月4回プラン' | '月6回プラン' | '月8回プラン' | '通い放題プラン (月15回まで)';

export const planOptions: PlanType[] = [
  '月4回プラン',
  '月6回プラン',
  '月8回プラン',
  '通い放題プラン (月15回まで)',
];

export interface CustomerBookingEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export const currentPlan: PlanType = '月4回プラン';

export const myBookings: CustomerBookingEntry[] = [
  { id: 'b1', date: '2026-04-09', startTime: '10:00', endTime: '11:15' },
  { id: 'b2', date: '2026-04-14', startTime: '14:00', endTime: '15:15' },
  { id: 'b3', date: '2026-04-18', startTime: '11:00', endTime: '12:15' },
];

export interface Photo {
  id: string;
  url: string;
  date: string;
  note: string;
}

// Trainer sessions
export const sessions: Session[] = [
  { id: '1', clientName: '田中 太郎', clientAvatar: 'T', date: '2026-04-09', time: '10:00', duration: 60, type: '上半身トレーニング', status: 'upcoming' },
  { id: '2', clientName: '鈴木 花子', clientAvatar: 'S', date: '2026-04-09', time: '11:30', duration: 60, type: '下半身トレーニング', status: 'upcoming' },
  { id: '3', clientName: '佐藤 健太', clientAvatar: 'K', date: '2026-04-09', time: '14:00', duration: 45, type: 'HIIT', status: 'upcoming' },
  { id: '4', clientName: '高橋 美咲', clientAvatar: 'M', date: '2026-04-09', time: '16:00', duration: 60, type: '全身トレーニング', status: 'upcoming' },
  { id: '5', clientName: '田中 太郎', clientAvatar: 'T', date: '2026-04-07', time: '10:00', duration: 60, type: '下半身トレーニング', status: 'completed' },
  { id: '6', clientName: '鈴木 花子', clientAvatar: 'S', date: '2026-04-05', time: '11:00', duration: 60, type: '上半身トレーニング', status: 'completed' },
];

export interface Client {
  id: string;
  name: string;
  avatar: string;
  goal: string;
  nextSession: string;
  totalSessions: number;
  memberSince: string;
  progress: number;
  plan: PlanType;
}

export const clients: Client[] = [
  { id: '1', name: '田中 太郎', avatar: 'T', goal: '筋力アップ', nextSession: '4/9 10:00', totalSessions: 24, memberSince: '2025-10', progress: 72, plan: '月4回プラン' },
  { id: '2', name: '鈴木 花子', avatar: 'S', goal: 'ダイエット', nextSession: '4/9 11:30', totalSessions: 18, memberSince: '2025-12', progress: 58, plan: '月6回プラン' },
  { id: '3', name: '佐藤 健太', avatar: 'K', goal: '体力向上', nextSession: '4/9 14:00', totalSessions: 32, memberSince: '2025-08', progress: 85, plan: '月8回プラン' },
  { id: '4', name: '高橋 美咲', avatar: 'M', goal: 'ボディメイク', nextSession: '4/9 16:00', totalSessions: 12, memberSince: '2026-01', progress: 40, plan: '通い放題プラン (月15回まで)' },
  { id: '5', name: '山田 翔太', avatar: 'Y', goal: '減量', nextSession: '4/10 10:00', totalSessions: 45, memberSince: '2025-04', progress: 92, plan: '月4回プラン' },
];

// Customer-facing data
export const bodyMetrics: BodyMetric[] = [
  { date: '11月', weight: 80.2, bodyFat: 24.5 },
  { date: '12月', weight: 78.8, bodyFat: 23.0 },
  { date: '1月', weight: 78.0, bodyFat: 22.0 },
  { date: '2月', weight: 76.5, bodyFat: 21.0 },
  { date: '3月', weight: 75.0, bodyFat: 19.5 },
  { date: '4月', weight: 73.8, bodyFat: 18.0 },
];

// Generate 15-min increment slots from 10:00 to 21:15 (last start = 20:00 for 75-min session ending 21:15)
function generateTimeSlots(dateKey: string, bookedStarts: string[]): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 10; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 0) break; // last start is 20:00
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({
        id: `${dateKey}-${time}`,
        time,
        available: !bookedStarts.includes(time),
      });
    }
  }
  return slots;
}

export const availableSlots: Record<string, TimeSlot[]> = {
  '2026-04-10': generateTimeSlots('2026-04-10', ['11:00', '16:00']),
  '2026-04-11': generateTimeSlots('2026-04-11', ['14:00']),
  '2026-04-12': generateTimeSlots('2026-04-12', ['15:00']),
  '2026-04-14': generateTimeSlots('2026-04-14', ['10:00']),
  '2026-04-15': generateTimeSlots('2026-04-15', []),
  '2026-04-16': generateTimeSlots('2026-04-16', ['13:00']),
  '2026-04-17': generateTimeSlots('2026-04-17', []),
  '2026-04-18': generateTimeSlots('2026-04-18', ['11:00']),
};

export const chatMessages: ChatMessage[] = [
  { id: '1', sender: 'trainer', text: 'お疲れ様でした！今日のトレーニングは素晴らしかったです💪', time: '18:30', date: '4/7' },
  { id: '2', sender: 'customer', text: 'ありがとうございます！次回も頑張ります！', time: '18:45', date: '4/7' },
  { id: '3', sender: 'trainer', text: '次回は下半身メインでいきましょう。スクワットのフォームも確認しますね。', time: '18:50', date: '4/7' },
  { id: '4', sender: 'trainer', text: '食事記録を見ました。タンパク質の摂取量が良い感じです👍 この調子で続けていきましょう！', time: '10:00', date: '4/8' },
  { id: '5', sender: 'customer', text: 'プロテインを朝と夜に飲むようにしています！', time: '12:15', date: '4/8' },
  { id: '6', sender: 'trainer', text: '明日のセッション楽しみにしています。体調はいかがですか？', time: '20:00', date: '4/8' },
  { id: '7', sender: 'customer', text: '体調バッチリです！よろしくお願いします🔥', time: '20:30', date: '4/8' },
];

export const photos: Photo[] = [
  { id: '1', url: '', date: '2026-01-15', note: '開始時' },
  { id: '2', url: '', date: '2026-02-15', note: '1ヶ月目' },
  { id: '3', url: '', date: '2026-03-15', note: '2ヶ月目' },
  { id: '4', url: '', date: '2026-04-07', note: '3ヶ月目' },
];

export interface TrainingExercise {
  name: string;
  weight: number;
  reps: number;
}

export interface TrainingRecord {
  id: string;
  date: string;
  exercises: TrainingExercise[];
}

export const trainingRecords: TrainingRecord[] = [
  {
    id: 'tr1', date: '2026-04-07',
    exercises: [
      { name: 'ベンチプレス', weight: 60, reps: 10 },
      { name: 'インクラインダンベルプレス', weight: 22, reps: 12 },
      { name: 'ケーブルフライ', weight: 15, reps: 15 },
    ],
  },
  {
    id: 'tr2', date: '2026-04-02',
    exercises: [
      { name: 'スクワット', weight: 80, reps: 8 },
      { name: 'レッグプレス', weight: 120, reps: 10 },
      { name: 'レッグカール', weight: 35, reps: 12 },
    ],
  },
  {
    id: 'tr3', date: '2026-03-28',
    exercises: [
      { name: 'ベンチプレス', weight: 57.5, reps: 10 },
      { name: 'ダンベルフライ', weight: 14, reps: 12 },
      { name: 'トライセプスプッシュダウン', weight: 25, reps: 15 },
    ],
  },
  {
    id: 'tr4', date: '2026-03-24',
    exercises: [
      { name: 'デッドリフト', weight: 100, reps: 5 },
      { name: 'ベントオーバーロウ', weight: 50, reps: 10 },
      { name: 'ラットプルダウン', weight: 45, reps: 12 },
    ],
  },
  {
    id: 'tr5', date: '2026-03-19',
    exercises: [
      { name: 'ベンチプレス', weight: 55, reps: 10 },
      { name: 'ショルダープレス', weight: 30, reps: 10 },
      { name: 'サイドレイズ', weight: 8, reps: 15 },
    ],
  },
  {
    id: 'tr6', date: '2026-03-14',
    exercises: [
      { name: 'スクワット', weight: 75, reps: 8 },
      { name: 'ベンチプレス', weight: 52.5, reps: 10 },
      { name: 'ラットプルダウン', weight: 40, reps: 12 },
    ],
  },
  {
    id: 'tr7', date: '2026-03-07',
    exercises: [
      { name: 'ベンチプレス', weight: 50, reps: 10 },
      { name: 'スクワット', weight: 70, reps: 8 },
    ],
  },
  {
    id: 'tr8', date: '2026-02-28',
    exercises: [
      { name: 'ベンチプレス', weight: 47.5, reps: 10 },
      { name: 'デッドリフト', weight: 90, reps: 5 },
    ],
  },
];
