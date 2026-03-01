import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import type { Note } from '../types';
import type { SortBy, DateFilter } from '../types';

export function useSearch(notes: Note[], initialCategory = '') {
  const [query, setQuery]                   = useState('');
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterTag, setFilterTag]           = useState('');
  const [filterDate, setFilterDate]         = useState<DateFilter>('all');
  const [sortBy, setSortBy]                 = useState<SortBy>('newest');

  // Apply external category filter when it changes (e.g. from CategoriesPage navigation)
  useEffect(() => {
    if (initialCategory) setFilterCategory(initialCategory);
  }, [initialCategory]);

  const debouncedQuery = useDebounce(query, 280);

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // ① Text search
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // ② Category
    if (filterCategory) {
      result = result.filter((n) => n.category === filterCategory);
    }

    // ③ Tag
    if (filterTag) {
      result = result.filter((n) => n.tags.includes(filterTag));
    }

    // ④ Date range
    if (filterDate !== 'all') {
      const MS: Record<Exclude<DateFilter, 'all'>, number> = {
        today: 86_400_000,
        week:  604_800_000,
        month: 2_592_000_000,
      };
      const cutoff = Date.now() - MS[filterDate as Exclude<DateFilter, 'all'>];
      result = result.filter((n) => n.updatedAt.getTime() >= cutoff);
    }

    // ⑤ Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':           return a.createdAt.getTime() - b.createdAt.getTime();
        case 'alphabetical':     return a.title.localeCompare(b.title);
        case 'recently-updated': return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:                 return b.createdAt.getTime() - a.createdAt.getTime(); // newest
      }
    });

    return result;
  }, [notes, debouncedQuery, filterCategory, filterTag, filterDate, sortBy]);

  const clearFilters = () => {
    setQuery('');
    setFilterCategory('');
    setFilterTag('');
    setFilterDate('all');
    setSortBy('newest');
  };

  const activeFilterCount = [
    debouncedQuery.trim(),
    filterCategory,
    filterTag,
    filterDate !== 'all' ? filterDate : '',
  ].filter(Boolean).length;

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return [...s].sort();
  }, [notes]);

  return {
    query, setQuery,
    filterCategory, setFilterCategory,
    filterTag, setFilterTag,
    filterDate, setFilterDate,
    sortBy, setSortBy,
    filteredNotes,
    clearFilters,
    activeFilterCount,
    allTags,
    debouncedQuery,
  };
}
