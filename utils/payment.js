// Points → payment conversion (REQ-408.1). The only place the rate and fee are defined:
// imported by the backend (drawRealisedRound) and by every participant-facing screen.

/** NT$ paid per point earned in the realised round. */
export const POINT_TO_NTD = 100;

/**
 * Guaranteed participation fee (NT$) for participants who complete the experiment.
 * 0 until the PI confirms the consent form promises a fee (requirements.md Open Question #8);
 * set to 100 if it does. Every screen, the persisted payout and the payment ledger follow it.
 */
export const PARTICIPATION_FEE_NTD = 0;

/** How the payment is delivered, as shown to participants. */
export const PAYMENT_METHOD_TEXT = '電子禮券';

/** When the payment is sent (Open Question #9), e.g. '實驗結束後 14 天內' once confirmed. */
export const PAYMENT_TIMELINE_TEXT = '實驗結束後盡快';

export const MIN_POINTS = 0;
export const MAX_POINTS = 3;

/**
 * Points the participant earns in one round (same outcomes as PayoffMatrix and the quiz).
 * @param {boolean} myGive whether the participant gave their point
 * @param {boolean} oppGive whether the partner gave their point
 * @returns {number} 2 both give · 0 only you give · 3 only the partner gives · 1 neither gives
 */
export function payoffPoints(myGive, oppGive) {
  if (myGive) return oppGive ? 2 : 0;
  return oppGive ? 3 : 1;
}

/**
 * @param {number} points
 * @returns {number} NT$ earned from points alone
 */
export function pointPayoutNtd(points) {
  return points * POINT_TO_NTD;
}

/**
 * @param {number} points
 * @param {number} [fee] participation fee in NT$ (defaults to PARTICIPATION_FEE_NTD)
 * @returns {number} NT$ the participant is paid
 */
export function totalPayoutNtd(points, fee = PARTICIPATION_FEE_NTD) {
  return pointPayoutNtd(points) + fee;
}

export const MIN_TOTAL_NTD = totalPayoutNtd(MIN_POINTS);
export const MAX_TOTAL_NTD = totalPayoutNtd(MAX_POINTS);
