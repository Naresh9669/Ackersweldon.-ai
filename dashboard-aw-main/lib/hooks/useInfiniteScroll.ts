import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  loading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  disabled?: boolean;
  delayInMs?: number;
}

export function useInfiniteScroll({
  loading,
  hasNextPage,
  onLoadMore,
  rootMargin = '0px 0px 400px 0px',
  disabled = false,
  delayInMs = 100
}: UseInfiniteScrollOptions) {
  const [infiniteRef, setInfiniteRef] = useState<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadMore = useCallback(() => {
    if (loading || disabled || !hasNextPage) return;
    
    // Add delay to prevent rapid firing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onLoadMore();
    }, delayInMs);
  }, [loading, disabled, hasNextPage, onLoadMore, delayInMs]);

  useEffect(() => {
    if (!infiniteRef || disabled) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !loading) {
          loadMore();
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    // Start observing
    observerRef.current.observe(infiniteRef);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [infiniteRef, disabled, hasNextPage, loading, loadMore, rootMargin]);

  return [setInfiniteRef];
}
