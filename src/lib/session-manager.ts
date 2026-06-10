// Session management (Simplified to remove architecture drift)

export const sessionManager = {
  cleanupSession: () => {
    // 1. Clear non-httpOnly storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();

      // 2. Trigger IndexedDB/Offline data cleanup via custom event
      window.dispatchEvent(new CustomEvent('clear-offline-data'));
    }
  },

  redirectToLanding: (router?: { push: (path: string) => void }) => {
    if (typeof window === 'undefined') return;
    if (router) {
      router.push('/');
    } else {
      window.location.href = '/';
    }
  }
};
