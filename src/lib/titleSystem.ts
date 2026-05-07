export interface TitleDef {
  key: string;
  name: string;
  condition: string;
}

export const TITLES: TitleDef[] = [
  { key: "chest_master", name: "胸板の鬼", condition: "胸トレが全体の40%以上" },
  { key: "back_master", name: "背中の鬼", condition: "背中トレが全体の40%以上" },
  { key: "leg_master", name: "脚の王", condition: "脚トレが全体の40%以上" },
  { key: "shoulder_master", name: "肩メロン", condition: "肩トレが全体の40%以上" },
  { key: "arm_master", name: "腕自慢", condition: "腕トレが全体の40%以上" },
  { key: "early_bird", name: "朝活の達人", condition: "午前セッションが70%以上" },
  { key: "night_owl", name: "夜型トレーニー", condition: "19時以降セッションが70%以上" },
  { key: "consistency_king", name: "継続の王", condition: "12週連続来店" },
  { key: "volume_monster", name: "ボリュームモンスター", condition: "月間総挙上量10万kg以上" },
  { key: "all_rounder_title", name: "オールラウンダー", condition: "毎月5部位以上を3ヶ月連続" },
  { key: "boss_slayer", name: "ボスハンター", condition: "レイドボス3回撃破に貢献" },
  { key: "mission_addict", name: "ミッション中毒", condition: "デイリーミッション累計50回達成" },
  { key: "combo_master", name: "コンボマスター", condition: "5コンボ以上を3回達成" },
];

export const getTitleDef = (key: string | null | undefined): TitleDef | undefined =>
  key ? TITLES.find((t) => t.key === key) : undefined;

const PART_KEY_MAP: Record<string, string> = {
  胸: "chest_master",
  背中: "back_master",
  脚: "leg_master",
  肩: "shoulder_master",
  腕: "arm_master",
};

export interface TitleEvalInput {
  workouts: { workout_date: string; exercise_name?: string; sets?: { weight: number; reps: number }[] | null; weight: number | null; reps: number | null }[];
  bookingHours: number[]; // hour-of-day for each non-cancelled past booking (JST)
  bestStreakWeeks: number;
  raidsContributedAndDefeated: number;
  totalMissionCompletions: number;
  combo5Reached: number;
  exerciseMuscleGroup: (name: string) => string;
}

export function computeTitles(input: TitleEvalInput): string[] {
  const keys: string[] = [];
  const ws = input.workouts;

  // Body part dominance: 40%+ of total sets count
  if (ws.length > 0) {
    const partCounts: Record<string, number> = {};
    let total = 0;
    for (const w of ws) {
      const grp = input.exerciseMuscleGroup(w.exercise_name || "");
      const setsLen = (w.sets && w.sets.length) || (w.weight != null ? 1 : 0);
      if (setsLen === 0) continue;
      partCounts[grp] = (partCounts[grp] || 0) + setsLen;
      total += setsLen;
    }
    if (total > 0) {
      for (const [grp, cnt] of Object.entries(partCounts)) {
        const k = PART_KEY_MAP[grp];
        if (k && cnt / total >= 0.4) keys.push(k);
      }
    }
  }

  // early_bird / night_owl
  if (input.bookingHours.length >= 5) {
    const morning = input.bookingHours.filter((h) => h < 12).length;
    const night = input.bookingHours.filter((h) => h >= 19).length;
    if (morning / input.bookingHours.length >= 0.7) keys.push("early_bird");
    if (night / input.bookingHours.length >= 0.7) keys.push("night_owl");
  }

  if (input.bestStreakWeeks >= 12) keys.push("consistency_king");

  // volume_monster: any month total volume >= 100,000 kg
  const monthVol = new Map<string, number>();
  for (const w of ws) {
    const m = w.workout_date.substring(0, 7);
    const sets = w.sets || (w.weight != null ? [{ weight: w.weight as number, reps: (w.reps as number) || 0 }] : []);
    const v = sets.reduce((s, st) => s + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0);
    monthVol.set(m, (monthVol.get(m) || 0) + v);
  }
  if ([...monthVol.values()].some((v) => v >= 100000)) keys.push("volume_monster");

  // all_rounder_title: 3 consecutive months with 5+ distinct muscle groups
  const monthGroups = new Map<string, Set<string>>();
  for (const w of ws) {
    const m = w.workout_date.substring(0, 7);
    if (!monthGroups.has(m)) monthGroups.set(m, new Set());
    monthGroups.get(m)!.add(input.exerciseMuscleGroup(w.exercise_name || ""));
  }
  const sortedMonths = [...monthGroups.keys()].sort();
  let streak = 0;
  let prev: string | null = null;
  for (const m of sortedMonths) {
    const ok = (monthGroups.get(m)?.size || 0) >= 5;
    const consecutive = prev != null && isNextMonth(prev, m);
    streak = ok ? (consecutive ? streak + 1 : 1) : 0;
    if (streak >= 3) { keys.push("all_rounder_title"); break; }
    prev = m;
  }

  if (input.raidsContributedAndDefeated >= 3) keys.push("boss_slayer");
  if (input.totalMissionCompletions >= 50) keys.push("mission_addict");
  if (input.combo5Reached >= 3) keys.push("combo_master");

  return keys;
}

function isNextMonth(prev: string, cur: string): boolean {
  const [py, pm] = prev.split("-").map(Number);
  const [cy, cm] = cur.split("-").map(Number);
  if (cy === py && cm === pm + 1) return true;
  if (cy === py + 1 && pm === 12 && cm === 1) return true;
  return false;
}