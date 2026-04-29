/**
 * Participant ID Management for Mixed Mode
 * 
 * Generates and manages stable participant identifiers for Mixed Mode experiments
 * to prevent duplicate submissions and enable session resume.
 */

const PARTICIPANT_ID_KEY = 'pd_participant_id';
const ID_LENGTH = 16;

/**
 * Generate a random participant ID
 * @returns {string} Participant ID
 */
function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get or create a participant ID from localStorage
 * @returns {string} Participant ID
 */
export function getParticipantId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    // Server-side or no localStorage: generate temporary ID
    return generateId();
  }

  let participantId = localStorage.getItem(PARTICIPANT_ID_KEY);
  
  if (!participantId) {
    participantId = generateId();
    localStorage.setItem(PARTICIPANT_ID_KEY, participantId);
  }
  
  return participantId;
}

/**
 * Clear the participant ID (for testing or reset)
 */
export function clearParticipantId(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(PARTICIPANT_ID_KEY);
  }
}

/**
 * Get participant ID for a specific group (namespaced)
 * Useful if we want different IDs per group in the future
 * 
 * @param {string} groupId - The group ID
 * @returns {string} Participant ID
 */
export function getGroupParticipantId(groupId: string): string {
  // For now, just return the global participant ID
  // In the future, we could namespace by group: `${groupId}_participant_id`
  return getParticipantId();
}
