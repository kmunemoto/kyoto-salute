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

export const clients: Client[] = [
  { id: '1', name: '田中 太郎', avatar: 'T', goal: '筋力アップ', nextSession: '4/9 10:00', totalSessions: 24, memberSince: '2025-10', progress: 72 },
  { id: '2', name: '鈴木 花子', avatar: 'S', goal: 'ダイエット', nextSession: '4/9 11:30', totalSessions: 18, memberSince: '2025-12', progress: 58 },
  { id: '3', name: '佐藤 健太', avatar: 'K', goal: '体力向上', nextSession: '4/9 14:00', totalSessions: 32, memberSince: '2025-08', progress: 85 },
  { id: '4', name: '高橋 美咲', avatar: 'M', goal: 'ボディメイク', nextSession: '4/9 16:00', totalSessions: 12, memberSince: '2026-01', progress: 40 },
  { id: '5', name: '山田 翔太', avatar: 'Y', goal: '減量', nextSession: '4/10 10:00', totalSessions: 45, memberSince: '2025-04', progress: 92 },
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

export const availableSlots: Record<string, TimeSlot[]> = {
  '2026-04-10': [
    { id: 's1', time: '10:00', available: true },
    { id: 's2', time: '11:00', available: false },
    { id: 's3', time: '13:00', available: true },
    { id: 's4', time: '14:00', available: true },
    { id: 's5', time: '16:00', available: false },
    { id: 's6', time: '17:00', available: true },
  ],
  '2026-04-11': [
    { id: 's7', time: '09:00', available: true },
    { id: 's8', time: '10:00', available: true },
    { id: 's9', time: '11:00', available: true },
    { id: 's10', time: '14:00', available: false },
    { id: 's11', time: '15:00', available: true },
  ],
  '2026-04-12': [
    { id: 's12', time: '10:00', available: true },
    { id: 's13', time: '13:00', available: true },
    { id: 's14', time: '15:00', available: false },
    { id: 's15', time: '16:00', available: true },
  ],
  '2026-04-14': [
    { id: 's16', time: '09:00', available: true },
    { id: 's17', time: '10:00', available: false },
    { id: 's18', time: '11:00', available: true },
    { id: 's19', time: '14:00', available: true },
    { id: 's20', time: '16:00', available: true },
    { id: 's21', time: '17:00', available: true },
  ],
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
