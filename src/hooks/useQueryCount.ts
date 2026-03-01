import { useState, useCallback } from 'react';
import { loadQueryCount, incrementQueryCount } from '../utils/noteStorage';

export function useQueryCount() {
  const [count, setCount] = useState<number>(() => loadQueryCount());

  const increment = useCallback(() => {
    const next = incrementQueryCount();
    setCount(next);
    return next;
  }, []);

  return { count, increment };
}
