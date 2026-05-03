// Search cache and debouncing utilities
interface SearchCache {
  query: string;
  results: SearchResult[];
  timestamp: number;
}

interface SearchResult {
  path: string;
  name: string;
  line: number;
  preview: string;
}

class SearchCacheManager {
  private cache = new Map<string, SearchCache>();
  private readonly maxCacheSize = 100;
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get cached results if valid
  get(query: string): SearchResult[] | null {
    const cached = this.cache.get(query);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(query);
      return null;
    }

    return cached.results;
  }

  // Store search results in cache
  set(query: string, results: SearchResult[]): void {
    // Remove oldest entries if cache is too large
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(query, {
      query,
      results,
      timestamp: Date.now(),
    });
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need tracking for actual implementation
    };
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for rapid updates
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export const searchCache = new SearchCacheManager();
export type { SearchResult };
