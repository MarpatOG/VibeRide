export type MockRole = 'client' | 'trainer' | 'admin';

export type MockSession = {
  email: string;
  name: string;
  lastName?: string;
  role: MockRole;
};

const STORAGE_KEY = 'viberide-auth-session';
const CHANGE_EVENT = 'viberide-auth-changed';

export function roleFromEmail(email: string): MockRole {
  const value = email.toLowerCase();
  if (value.startsWith('admin@')) return 'admin';
  if (value.startsWith('trainer@')) return 'trainer';
  return 'client';
}

export function getMockSession(): MockSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockSession;
  } catch {
    return null;
  }
}

export function setMockSession(session: MockSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearMockSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const mockAuthStorageKey = STORAGE_KEY;
export const mockAuthChangeEvent = CHANGE_EVENT;
