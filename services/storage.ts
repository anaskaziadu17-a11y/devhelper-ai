import { ChatSession, Tutorial, UserProgress } from '../types';
import { MOCK_TUTORIALS } from '../constants';

const STORAGE_KEYS = {
  SESSIONS: 'devmentor_sessions',
  PROGRESS: 'devmentor_progress',
  CUSTOM_TUTORIALS: 'devmentor_custom_tutorials',
  THEME: 'devmentor_theme',
  USER_KEYS: 'devmentor_vault' // Mock vault
};

export const loadSessions = (): ChatSession[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return stored ? JSON.parse(stored) : [];
};

export const saveSession = (session: ChatSession) => {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const deleteSession = (id: string) => {
    const sessions = loadSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export const loadTutorials = (): Tutorial[] => {
  const customStored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TUTORIALS);
  const custom = customStored ? JSON.parse(customStored) : [];
  return [...MOCK_TUTORIALS, ...custom];
};

export const saveCustomTutorial = (tutorial: Tutorial) => {
  const customStored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TUTORIALS);
  const custom = customStored ? JSON.parse(customStored) : [];
  custom.push(tutorial);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_TUTORIALS, JSON.stringify(custom));
};

export const getUserProgress = (): UserProgress => {
  const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  return stored ? JSON.parse(stored) : { completedTutorials: [], savedSnippets: [], streak: 1 };
};

export const getTheme = (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark';
}

export const setTheme = (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}