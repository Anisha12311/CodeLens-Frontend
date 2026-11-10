const STORAGE_KEY = 'code-lens-creator-id';

// Used when storage is blocked; lasts until the page is reloaded.
let sessionId: string | null = null;

/**
 * An anonymous id for this browser, sent with every library call so that only the person who
 * created a problem can delete it. Clearing site data creates a new id, and with it the ability
 * to delete earlier problems is lost.
 */
function creatorId(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    sessionId ??= crypto.randomUUID();
    return sessionId;
  }
}

export function creatorHeaders(): Record<string, string> {
  return { 'X-Creator-Id': creatorId() };
}
