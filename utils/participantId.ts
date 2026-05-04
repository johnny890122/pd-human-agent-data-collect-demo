/**
 * Participant ID Management for Mixed Mode with Device Fingerprinting
 * 
 * Generates and manages stable participant identifiers using browser device fingerprinting
 * to prevent duplicate submissions and enable session resume in Mixed Mode experiments.
 * 
 * Privacy-first approach:
 * - Uses only non-invasive browser attributes (canvas, WebGL, fonts, timezone)
 * - Respects Do Not Track (DNT) headers
 * - No PII collection, no biometric data, no cross-site tracking
 * - Falls back gracefully to random IDs on errors
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Storage keys
const PARTICIPANT_ID_KEY = 'pd_participant_id';
const FINGERPRINT_KEY = 'pd_fingerprint_v1';
const ID_LENGTH = 16;

// Cache for initialized FingerprintJS agent
let fpAgent: any = null;

/**
 * Generate a random participant ID with prefix
 * @param prefix - Prefix to identify ID type (e.g., 'random', 'dnt', 'fallback')
 * @returns Random participant ID
 */
function generateRandomId(prefix: string = 'random'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

/**
 * Check if Do Not Track is enabled
 * @returns true if DNT is enabled
 */
function isDNTEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check navigator.doNotTrack
  const dnt = navigator.doNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    return true;
  }
  
  // Check for older implementations
  const win = window as any;
  if (win.doNotTrack === '1' || win.doNotTrack === 'yes') {
    return true;
  }
  
  return false;
}

/**
 * Initialize FingerprintJS agent (cached)
 * @returns FingerprintJS agent or null on error
 */
async function getFingerprintAgent(): Promise<any> {
  if (fpAgent) {
    return fpAgent;
  }
  
  try {
    fpAgent = await FingerprintJS.load({
      monitoring: false,  // Disable telemetry for privacy
    });
    return fpAgent;
  } catch (error) {
    console.error('[Fingerprint] Failed to load FingerprintJS:', error);
    return null;
  }
}

/**
 * Generate device fingerprint
 * Uses browser attributes: Canvas, WebGL, fonts, timezone, screen, etc.
 * 
 * @returns Fingerprint ID with prefix indicating type
 */
async function generateFingerprint(): Promise<string> {
  // Check DNT (Do Not Track) header
  if (isDNTEnabled()) {
    console.log('[Fingerprint] DNT enabled, using anonymous mode');
    return generateRandomId('dnt');
  }
  
  try {
    // Get or initialize FingerprintJS agent
    const fp = await getFingerprintAgent();
    if (!fp) {
      console.warn('[Fingerprint] Agent not available, using fallback');
      return generateRandomId('fallback');
    }
    
    // Generate fingerprint
    const result = await fp.get();
    
    // Check confidence score
    const confidence = result.confidence?.score ?? 1.0;
    
    if (confidence < 0.5) {
      console.warn('[Fingerprint] Low confidence score:', confidence);
      // Hybrid ID: combine fingerprint with random component
      const fpHash = result.visitorId.substring(0, 8);
      const randomPart = generateRandomId('hybrid').substring(7, 15);
      return `fp-${fpHash}-${randomPart}`;
    }
    
    // Return fingerprint-based ID
    return `fp-${result.visitorId}`;
    
  } catch (error) {
    console.error('[Fingerprint] Generation failed:', error);
    return generateRandomId('fallback');
  }
}

/**
 * Get or create a participant ID using device fingerprinting
 * 
 * Strategy:
 * 1. Check if fingerprint matches stored fingerprint → reuse ID
 * 2. New fingerprint → create new ID
 * 3. Migrate old random IDs to fingerprint-based IDs
 * 
 * @returns Promise<string> Participant ID
 */
export async function getParticipantId(): Promise<string> {
  // Server-side or no localStorage: generate temporary ID
  if (typeof window === 'undefined' || !window.localStorage) {
    return generateRandomId('server');
  }
  
  try {
    // Check stored values
    const storedId = localStorage.getItem(PARTICIPANT_ID_KEY);
    const storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
    
    // Generate current fingerprint
    const currentFingerprint = await generateFingerprint();
    
    // If fingerprint matches stored fingerprint, reuse existing ID
    if (storedFingerprint === currentFingerprint && storedId) {
      console.log('[Fingerprint] Reusing existing ID (fingerprint match)');
      return storedId;
    }
    
    // Fingerprint changed or doesn't exist
    let participantId: string;
    
    if (!storedId) {
      // No stored ID: use new fingerprint as ID
      participantId = currentFingerprint;
      console.log('[Fingerprint] Created new ID:', participantId.substring(0, 15) + '...');
    } else if (!storedId.startsWith('fp-') && !storedId.startsWith('dnt-') && !storedId.startsWith('fallback-')) {
      // Legacy random ID: migrate to fingerprint-based
      console.log('[Fingerprint] Migrating legacy random ID to fingerprint');
      participantId = currentFingerprint;
    } else {
      // Fingerprint changed: likely browser config changed or different device
      console.log('[Fingerprint] Fingerprint changed, creating new ID');
      participantId = currentFingerprint;
    }
    
    // Store both ID and fingerprint
    localStorage.setItem(PARTICIPANT_ID_KEY, participantId);
    localStorage.setItem(FINGERPRINT_KEY, currentFingerprint);
    
    return participantId;
    
  } catch (error) {
    console.error('[Fingerprint] Error in getParticipantId:', error);
    // Critical error: use fallback
    const fallbackId = generateRandomId('error');
    localStorage.setItem(PARTICIPANT_ID_KEY, fallbackId);
    return fallbackId;
  }
}

/**
 * Clear the participant ID and fingerprint (for testing or reset)
 */
export function clearParticipantId(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(PARTICIPANT_ID_KEY);
    localStorage.removeItem(FINGERPRINT_KEY);
    console.log('[Fingerprint] Cleared participant ID and fingerprint');
  }
}

/**
 * Get participant ID for a specific group (namespaced)
 * Currently returns global participant ID
 * 
 * @param groupId - The group ID
 * @returns Promise<string> Participant ID
 */
export async function getGroupParticipantId(groupId: string): Promise<string> {
  // For now, just return the global participant ID
  // In the future, we could namespace by group: `${groupId}_participant_id`
  return getParticipantId();
}

/**
 * Debug utility: Get detailed fingerprint information
 * Only use in development for debugging
 * 
 * @returns Promise with fingerprint details or null
 */
export async function getParticipantIdDebug(): Promise<any> {
  if (typeof window === 'undefined') {
    return { error: 'Not in browser environment' };
  }
  
  try {
    const storedId = localStorage.getItem(PARTICIPANT_ID_KEY);
    const storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
    const dntEnabled = isDNTEnabled();
    
    const fp = await getFingerprintAgent();
    if (!fp) {
      return {
        storedId,
        storedFingerprint,
        dntEnabled,
        error: 'FingerprintJS agent not available'
      };
    }
    
    const result = await fp.get();
    
    return {
      storedId,
      storedFingerprint,
      currentFingerprint: `fp-${result.visitorId}`,
      dntEnabled,
      confidence: result.confidence?.score ?? 'N/A',
      visitorId: result.visitorId,
      components: Object.keys(result.components || {}).length,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
