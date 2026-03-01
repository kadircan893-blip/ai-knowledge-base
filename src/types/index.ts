export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  noteCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StatsCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  gradient: string;
  glowColor: string;
}

export type NavPage = 'dashboard' | 'notes' | 'chat' | 'categories' | 'settings';

export type SortBy = 'newest' | 'oldest' | 'alphabetical' | 'recently-updated';

export type DateFilter = 'all' | 'today' | 'week' | 'month';
