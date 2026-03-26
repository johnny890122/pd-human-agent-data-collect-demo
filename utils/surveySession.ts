export interface SurveySession {
  entryId: string;
  path: string;
}

const getSessionKey = (setupId: string) => `survey_session_${setupId}`;

export function saveSession(setupId: string, entryId: string, path: string): void {
  const session: SurveySession = { entryId, path };
  localStorage.setItem(getSessionKey(setupId), JSON.stringify(session));
}

export function loadSession(setupId: string): SurveySession | null {
  const stored = localStorage.getItem(getSessionKey(setupId));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as SurveySession;
  } catch (e) {
    console.error('Failed to parse survey session from localStorage', e);
    return null;
  }
}

export function clearSession(setupId: string): void {
  localStorage.removeItem(getSessionKey(setupId));
}
