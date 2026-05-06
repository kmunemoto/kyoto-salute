/**
 * 通知ON/OFFフラグ。
 * 顧客向けのLINE通知は将来復活させる可能性があるため、コードは残しつつフラグで制御する。
 * リマインド通知（前日21:00）はEdge Function `line-booking-reminder` 側で送信されるため
 * このフラグの影響を受けない。
 */
export const NOTIFICATION_FLAGS = {
  /** 顧客への新規予約完了LINE通知 */
  customerBookingConfirmationLine: false,
  /** 顧客への予約キャンセル完了LINE通知 */
  customerBookingCancellationLine: false,
} as const;
