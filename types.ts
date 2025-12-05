export type ViewState = 'dashboard' | 'chat' | 'tutorials' | 'terminal' | 'diagnostics' | 'teacher' | 'settings';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isErrorLog?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  content: string; // Markdown content
  author: string;
}

export interface UserProgress {
  completedTutorials: string[];
  savedSnippets: { id: string; title: string; code: string; language: string }[];
  streak: number;
}

export enum OS {
  Windows = 'Windows',
  MacOS = 'macOS',
  Linux = 'Linux'
}

export interface TerminalCommand {
  command: string;
  description: string;
  os: OS[];
}