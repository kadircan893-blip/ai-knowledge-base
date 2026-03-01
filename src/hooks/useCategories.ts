import { useMemo } from 'react';
import type { Note } from '../types';

export interface CategoryStat {
  name: string;
  count: number;
  lastUpdated: Date | null;
  totalWords: number;
}

export function useCategories(notes: Note[]) {
  const categories = useMemo((): CategoryStat[] => {
    const map: Record<string, CategoryStat> = {};

    notes.forEach((n) => {
      if (!map[n.category]) {
        map[n.category] = { name: n.category, count: 0, lastUpdated: null, totalWords: 0 };
      }
      map[n.category].count++;
      map[n.category].totalWords += n.content.split(/\s+/).filter(Boolean).length;

      if (!map[n.category].lastUpdated || n.updatedAt > map[n.category].lastUpdated!) {
        map[n.category].lastUpdated = n.updatedAt;
      }
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [notes]);

  const topCategory = categories[0]?.name;
  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const totalWords = useMemo(
    () => notes.reduce((sum, n) => sum + n.content.split(/\s+/).filter(Boolean).length, 0),
    [notes]
  );

  // Notes added in last 7 days
  const addedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return notes.filter((n) => n.createdAt.getTime() >= cutoff).length;
  }, [notes]);

  return { categories, topCategory, categoryNames, totalWords, addedThisWeek };
}
