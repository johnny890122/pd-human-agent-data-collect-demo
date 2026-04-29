export interface SurveySession {
  submissionId: string; // Renamed from entryId to match new API
  path: string;
}

const getSessionKey = (sessionId: string) => `survey_session_${sessionId}`;

export function saveSession(sessionId: string, submissionId: string, path: string): void {
  const session: SurveySession = { submissionId, path };
  localStorage.setItem(getSessionKey(sessionId), JSON.stringify(session));
}

export function loadSession(sessionId: string): SurveySession | null {
  const stored = localStorage.getItem(getSessionKey(sessionId));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as SurveySession;
  } catch (e) {
    console.error('Failed to parse survey session from localStorage', e);
    return null;
  }
}

export function clearSession(sessionId: string): void {
  localStorage.removeItem(getSessionKey(sessionId));
}
