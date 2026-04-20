import { addMonths, parseISO } from "date-fns";
import { PlanType, planOptions } from "./dummyData";

/**
 * Plan名から月間セッション回数を導出
 * 通い放題は -1 (= 上限なし)、未設定/不明は null
 */
export const getMonthlySessionCount = (plan: string | null | undefined): number | null => {
  if (!plan) return null;
  if (plan === "通い放題") return -1;
  // "月4回" / "月6回" / "月8回" のような形式から数字を抽出
  const match = plan.match(/月(\d+)回/);
  if (match) return parseInt(match[1], 10);
  return null;
};

export interface CycleWindow {
  start: Date;
  end: Date;
}

/**
 * cycle_start_date を起算日として、targetDate を含むサイクル期間 [start, end) を求める
 */
export const getCycleWindow = (cycleStartDate: string | null | undefined, targetDate: Date): CycleWindow | null => {
  if (!cycleStartDate) return null;
  let start = parseISO(cycleStartDate);
  // 過去すぎる場合は前進
  while (addMonths(start, 1) <= targetDate) {
    start = addMonths(start, 1);
  }
  // 未来すぎる場合は後退（targetDate が cycleStartDate より前のケース）
  while (start > targetDate) {
    start = addMonths(start, -1);
  }
  return { start, end: addMonths(start, 1) };
};

export interface BookingForProgress {
  id: string;
  booking_date: string; // ISO string
  status: string;
}

export interface CourseProgress {
  /** 0回目（未設定や対象外）なら null */
  cycle: CycleWindow | null;
  monthlyTotal: number | null; // -1 = 通い放題, null = 未設定
  /** サイクル内の有効予約（キャンセル除外、日時順） */
  cycleBookings: BookingForProgress[];
  /** 実施済み（過去）件数 */
  completedCount: number;
  /** 予約済み（未来）件数 */
  upcomingCount: number;
  /** 合計（completed + upcoming） */
  totalUsed: number;
  isUnlimited: boolean;
  isUnconfigured: boolean;
}

export const computeCourseProgress = (
  cycleStartDate: string | null | undefined,
  plan: string | null | undefined,
  bookings: BookingForProgress[],
  referenceDate: Date = new Date(),
): CourseProgress => {
  const monthlyTotal = getMonthlySessionCount(plan);
  const isUnlimited = monthlyTotal === -1;
  const isUnconfigured = monthlyTotal === null || !cycleStartDate;

  const cycle = getCycleWindow(cycleStartDate, referenceDate);

  if (!cycle) {
    return {
      cycle: null,
      monthlyTotal,
      cycleBookings: [],
      completedCount: 0,
      upcomingCount: 0,
      totalUsed: 0,
      isUnlimited,
      isUnconfigured,
    };
  }

  const now = referenceDate;
  const cycleBookings = bookings
    .filter((b) => b.status !== "キャンセル済み")
    .filter((b) => {
      const d = new Date(b.booking_date);
      return d >= cycle.start && d < cycle.end;
    })
    .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

  const completedCount = cycleBookings.filter((b) => new Date(b.booking_date) <= now).length;
  const upcomingCount = cycleBookings.length - completedCount;

  return {
    cycle,
    monthlyTotal,
    cycleBookings,
    completedCount,
    upcomingCount,
    totalUsed: cycleBookings.length,
    isUnlimited,
    isUnconfigured,
  };
};

/**
 * 特定の予約がそのお客様の今期の何回目に当たるかを返す
 * 戻り値: { index: 1始まり, total: 月間回数 or null(通い放題/未設定) }
 */
export const getBookingProgressIndex = (
  bookingId: string,
  cycleStartDate: string | null | undefined,
  plan: string | null | undefined,
  bookings: BookingForProgress[],
): { index: number; total: number | null; isUnlimited: boolean; isUnconfigured: boolean; isOverflow: boolean } | null => {
  const target = bookings.find((b) => b.id === bookingId);
  if (!target) return null;
  const targetDate = new Date(target.booking_date);
  const progress = computeCourseProgress(cycleStartDate, plan, bookings, targetDate);
  if (!progress.cycle) {
    return { index: 0, total: progress.monthlyTotal, isUnlimited: progress.isUnlimited, isUnconfigured: progress.isUnconfigured, isOverflow: false };
  }
  const index = progress.cycleBookings.findIndex((b) => b.id === bookingId) + 1;
  if (index === 0) return null;
  const total = progress.monthlyTotal;
  const isOverflow = !progress.isUnlimited && total !== null && index > total;
  return {
    index,
    total,
    isUnlimited: progress.isUnlimited,
    isUnconfigured: progress.isUnconfigured,
    isOverflow,
  };
};
