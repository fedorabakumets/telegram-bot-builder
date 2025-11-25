import { SessionManager } from "./session-manager";

/**
 * Debug utility to check session isolation status
 */
export function debugSession() {
  console.group('🔍 Session Isolation Debug');
  
  const sessionId = SessionManager.getSessionId();
  console.log('Session ID:', sessionId);
  
  try {
    console.log('\n📦 SessionStorage:');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        console.log(`  ${key}:`, sessionStorage.getItem(key));
      }
    }
    
    console.log('\n💾 LocalStorage (session-prefixed keys):');
    const sessionKeys = SessionManager.getCurrentSessionKeys();
    console.log(`  Found ${sessionKeys.length} keys for current session`);
    sessionKeys.forEach(key => {
      console.log(`  ${key}`);
    });
    
    console.log('\n⚠️  LocalStorage (legacy unprefixed keys):');
    const legacyKeys = SessionManager.getLegacyKeys();
    console.log(`  Found ${legacyKeys.length} legacy keys`);
    legacyKeys.forEach(key => {
      console.log(`  ${key}`);
    });
    
    console.log('\n📊 All LocalStorage keys:');
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        allKeys.push(key);
      }
    }
    console.log(`  Total: ${allKeys.length} keys`);
    allKeys.forEach(key => {
      const isSessionKey = key.includes(':botcraft_');
      console.log(`  ${isSessionKey ? '✅' : '❌'} ${key}`);
    });
    
  } catch (e) {
    console.error('Error reading storage:', e);
  }
  
  console.groupEnd();
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugSession = debugSession;
}
