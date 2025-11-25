import { nanoid } from 'nanoid';

const SESSION_ID_KEY = 'botcraft_session_id';

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export class SessionManager {
  private static sessionId: string | null = null;

  /**
   * Get or create the current session ID
   * Session ID is stored in sessionStorage (tab-isolated)
   */
  static getSessionId(): string {
    if (this.sessionId) {
      return this.sessionId;
    }

    if (!isBrowser()) {
      if (!this.sessionId) {
        this.sessionId = nanoid();
      }
      return this.sessionId;
    }

    try {
      const stored = sessionStorage.getItem(SESSION_ID_KEY);
      if (stored) {
        this.sessionId = stored;
        return stored;
      }

      const newSessionId = nanoid();
      sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
      this.sessionId = newSessionId;
      return newSessionId;
    } catch (e) {
      console.error('Error accessing sessionStorage:', e);
      if (!this.sessionId) {
        this.sessionId = nanoid();
      }
      return this.sessionId;
    }
  }

  /**
   * Clear the current session ID (useful for logout or reset)
   */
  static clearSession(): void {
    this.sessionId = null;
    if (!isBrowser()) {
      return;
    }
    try {
      sessionStorage.removeItem(SESSION_ID_KEY);
    } catch (e) {
      console.error('Error clearing sessionStorage:', e);
    }
  }

  /**
   * Create a prefixed storage key with session isolation
   */
  static createKey(baseKey: string): string {
    const sessionId = this.getSessionId();
    return `${sessionId}:${baseKey}`;
  }

  /**
   * Check if a key belongs to the current session
   */
  static isCurrentSessionKey(key: string): boolean {
    const sessionId = this.getSessionId();
    return key.startsWith(`${sessionId}:`);
  }

  /**
   * Get all localStorage keys that belong to the current session
   */
  static getCurrentSessionKeys(): string[] {
    if (!isBrowser()) {
      return [];
    }

    const sessionId = this.getSessionId();
    const prefix = `${sessionId}:`;
    const keys: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    } catch (e) {
      console.error('Error reading localStorage keys:', e);
    }

    return keys;
  }

  /**
   * Get all unprefixed (legacy) keys that match the old storage pattern
   */
  static getLegacyKeys(): string[] {
    if (!isBrowser()) {
      return [];
    }

    const legacyPatterns = [
      'botcraft_projects',
      'botcraft_tokens',
      'botcraft_templates',
      'botcraft_next_project_id',
      'botcraft_next_token_id',
      'botcraft_next_template_id',
    ];

    const keys: string[] = [];

    try {
      for (const pattern of legacyPatterns) {
        if (localStorage.getItem(pattern) !== null) {
          keys.push(pattern);
        }
      }
    } catch (e) {
      console.error('Error reading legacy localStorage keys:', e);
    }

    return keys;
  }

  /**
   * Migrate legacy data to current session
   */
  static migrateLegacyData(): boolean {
    if (!isBrowser()) {
      return false;
    }

    const legacyKeys = this.getLegacyKeys();
    
    if (legacyKeys.length === 0) {
      return false;
    }

    try {
      const sessionId = this.getSessionId();
      
      for (const legacyKey of legacyKeys) {
        const value = localStorage.getItem(legacyKey);
        if (value !== null) {
          const newKey = `${sessionId}:${legacyKey}`;
          localStorage.setItem(newKey, value);
        }
      }

      // Remove legacy keys after migration
      for (const legacyKey of legacyKeys) {
        localStorage.removeItem(legacyKey);
      }

      console.log(`Migrated ${legacyKeys.length} legacy storage keys to session ${sessionId}`);
      return true;
    } catch (e) {
      console.error('Error during legacy data migration:', e);
      return false;
    }
  }

  /**
   * Clear all data for the current session
   */
  static clearCurrentSessionData(): void {
    if (!isBrowser()) {
      return;
    }

    const keys = this.getCurrentSessionKeys();
    
    try {
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      console.log(`Cleared ${keys.length} items from current session`);
    } catch (e) {
      console.error('Error clearing session data:', e);
    }
  }
}
