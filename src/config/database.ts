import Dexie, { type Table } from 'dexie';

// Define interfaces for database tables
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number; // milliseconds
  size: number; // bytes
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  hitRate: number; // 0-1
  oldestEntry: Date;
  newestEntry: Date;
}

// Define the database schema
export class F1AnalysisDB extends Dexie {
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('F1AnalysisDB');

    // Define database schema
    this.version(1).stores({
      cache: 'key, timestamp, lastAccessed, ttl',
    });
  }
}

// Create and export database instance
export const db = new F1AnalysisDB();

// Helper function to initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    if (import.meta.env.DEV) {
      console.log('IndexedDB initialized successfully');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to initialize IndexedDB:', error);
    }
    throw error;
  }
}

// Helper function to clear expired cache entries
export async function clearExpiredEntries(): Promise<number> {
  const now = Date.now();
  const expiredKeys: string[] = [];

  await db.cache.each((entry) => {
    const expirationTime = entry.timestamp.getTime() + entry.ttl;
    if (expirationTime < now) {
      expiredKeys.push(entry.key);
    }
  });

  if (expiredKeys.length > 0) {
    await db.cache.bulkDelete(expiredKeys);
  }

  return expiredKeys.length;
}

// Helper function to get cache statistics
export async function getCacheStats(): Promise<CacheStats> {
  const entries = await db.cache.toArray();

  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      oldestEntry: new Date(),
      newestEntry: new Date(),
    };
  }

  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
  const hitRate = totalAccesses > 0 ? totalAccesses / entries.length : 0;

  const timestamps = entries.map((e) => e.timestamp.getTime());
  const oldestEntry = new Date(Math.min(...timestamps));
  const newestEntry = new Date(Math.max(...timestamps));

  return {
    totalEntries: entries.length,
    totalSize,
    hitRate,
    oldestEntry,
    newestEntry,
  };
}
