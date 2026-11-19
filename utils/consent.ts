// REQ-417: consent given on the welcome page, kept in this browser tab until the submission is created.
// Change CONSENT_VERSION whenever the welcome / consent text changes.
export const CONSENT_VERSION = 'welcome-2026-11-18';
const KEY = 'survey_consent';

export interface Consent {
  consentedAt: string;
  version: string;
}

export function saveConsent(): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ consentedAt: new Date().toISOString(), version: CONSENT_VERSION }));
  } catch {
    // storage unavailable — the server then refuses to start (CONSENT_REQUIRED) rather than store no consent
  }
}

export function readConsent(): Consent | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}
