export interface SetData {
  set: number;
  weight: number;
  reps: number;
}

export interface WorkoutSessionExercise {
  exercise_id: string;
  exercise_name: string;
  sets: SetData[];
  maxWeight: number;
  totalReps: number;
  setsCount: number;
}

export interface WorkoutSession {
  date: string; // YYYY-MM-DD
  exercises: WorkoutSessionExercise[];
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
  durationMin: number;
}

export interface RawWorkout {
  id: string;
  workout_date: string;
  weight: number | null;
  reps: number | null;
  sets: SetData[] | null;
  exercise_id: string;
  exercise_name: string;
}

export const normalizeSets = (w: { sets: SetData[] | null; weight: number | null; reps: number | null }): SetData[] => {
  if (w.sets && Array.isArray(w.sets) && w.sets.length > 0) {
    return w.sets.map((s, i) => ({
      set: s.set ?? i + 1,
      weight: Number(s.weight) || 0,
      reps: Number(s.reps) || 0,
    }));
  }
  if (w.weight != null) {
    return [{ set: 1, weight: Number(w.weight) || 0, reps: Number(w.reps) || 0 }];
  }
  return [];
};

/**
 * Build a workout session for a given date.
 * - allWorkouts: all workouts of the user
 * - date: YYYY-MM-DD of the session
 */
export const buildSession = (allWorkouts: RawWorkout[], date: string): WorkoutSession => {
  const sessionRows = allWorkouts.filter((w) => w.workout_date === date);

  // Group by exercise
  const byExercise = new Map<string, RawWorkout[]>();
  sessionRows.forEach((w) => {
    const k = w.exercise_id || w.exercise_name;
    if (!byExercise.has(k)) byExercise.set(k, []);
    byExercise.get(k)!.push(w);
  });

  const exercises: WorkoutSessionExercise[] = [];
  let totalVolume = 0;
  let totalSets = 0;

  byExercise.forEach((rows, key) => {
    const allSets: SetData[] = [];
    rows.forEach((r) => allSets.push(...normalizeSets(r)));
    if (allSets.length === 0) return;

    const maxWeight = allSets.reduce((m, s) => Math.max(m, s.weight), 0);
    const totalReps = allSets.reduce((m, s) => m + s.reps, 0);
    const volume = allSets.reduce((m, s) => m + s.weight * s.reps, 0);

    exercises.push({
      exercise_id: key,
      exercise_name: rows[0].exercise_name,
      sets: allSets,
      maxWeight,
      totalReps,
      setsCount: allSets.length,
    });
    totalVolume += volume;
    totalSets += allSets.length;
  });

  return {
    date,
    exercises: exercises.sort((a, b) => b.maxWeight - a.maxWeight),
    totalVolume: Math.round(totalVolume),
    totalSets,
    exerciseCount: exercises.length,
    durationMin: 60,
  };
};

/**
 * Convert total weight (kg) into a relatable metaphor string.
 */
export const volumeMetaphor = (totalKg: number): string => {
  if (totalKg <= 0) return "";
  if (totalKg < 1000) {
    const dogs = Math.max(1, Math.round(totalKg / 30));
    return `大型犬 約${dogs}匹分 🐕`;
  }
  if (totalKg < 3000) {
    const cars = Math.max(1, Math.round(totalKg / 900));
    return `軽自動車 約${cars}台分 🚗`;
  }
  if (totalKg < 10000) {
    const elephants = Math.max(1, Math.round(totalKg / 6000));
    return `アフリカゾウ 約${elephants}頭分 🐘`;
  }
  const whales = Math.max(1, Math.round(totalKg / 30000));
  return `シロナガスクジラ 約${whales}頭分 🐋`;
};

export const formatShareDate = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dows = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return `${y}.${m}.${day} ${dows[d.getDay()]}`;
};