# Cache Manager

The Cache Manager provides a robust, IndexedDB-based caching solution for the F1 Analysis Platform. It implements LRU (Least Recently Used) eviction, TTL-based expiration, and data validation.

## Features

- **IndexedDB Storage**: Persistent browser storage using Dexie.js
- **LRU Eviction**: Automatically removes least recently used entries when cache is full
- **TTL-Based Expiration**: Configurable time-to-live for cache entries
- **Data Validation**: Validates cached data on retrieval to ensure integrity
- **Cache Statistics**: Track hit rate, size, and entry counts
- **Pattern-Based Operations**: Expire or query entries by key patterns

## Usage

### Basic Operations

```typescript
import { cacheManager } from './services';

// Store data
await cacheManager.set('session:2024:1', sessionData);

// Retrieve data
const data = await cacheManager.get('session:2024:1');

// Check if key exists
const exists = await cacheManager.has('session:2024:1');

// Delete a key
await cacheManager.delete('session:2024:1');

// Clear all cache
await cacheManager.clear();
```

### Custom TTL

```typescript
// Store with 7-day TTL
const sevenDays = 7 * 24 * 60 * 60 * 1000;
await cacheManager.set('session:2024:1', sessionData, sevenDays);
```

### Cache Statistics

```typescript
const stats = await cacheManager.getStats();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
```

### Freshness Tracking

```typescript
const freshness = await cacheManager.getFreshness('session:2024:1');
if (freshness && freshness.isFresh) {
  console.log(`Data is fresh, ${freshness.remainingTTL}ms remaining`);
} else {
  console.log('Data is expired or not found');
}
```

### Pattern-Based Expiration

```typescript
// Expire all sessions from 2024
await cacheManager.expireByPattern('session:2024');

// Get all keys
const keys = await cacheManager.keys();
```

## Data Validation

The cache manager automatically validates data on retrieval. By default, it validates `SessionData` objects stored with keys starting with `session:`.

### Custom Validators

```typescript
// Register a custom validator
cacheManager.registerValidator('lap:', (value: unknown) => {
  const lap = value as LapData;
  return (
    typeof lap === 'object' &&
    lap !== null &&
    typeof lap.lapNumber === 'number' &&
    typeof lap.lapTime === 'number'
  );
});
```

## Configuration

### Cache Size Limit

```typescript
// Create a cache manager with custom size limit (50MB)
const customCache = new CacheManager(50 * 1024 * 1024);
```

### Default Configuration

- **Max Cache Size**: 100MB
- **Default TTL**: 30 days
- **Eviction Policy**: LRU (Least Recently Used)

## Implementation Details

### LRU Eviction

When the cache reaches its size limit, the least recently used entries are automatically evicted to make space for new entries. Access time is tracked on every `get()` operation.

### TTL Expiration

Entries are checked for expiration on retrieval. Expired entries are automatically deleted and return `null`. A background cleanup process runs on initialization to remove expired entries.

### Data Integrity

- All data is JSON-serialized for storage
- Corrupted entries are automatically removed
- Validation failures result in entry removal
- `null` values cannot be stored (reserved as sentinel value)

## Testing

The cache manager includes comprehensive test coverage:

- **Unit Tests**: 25 tests covering basic operations, edge cases, and validation
- **Property-Based Tests**: 6 tests with 100+ iterations each validating:
  - Property 1: Cached data validity
  - Property 2: Session completion consistency
  - Property 3: Cache retention

Run tests with:
```bash
npm test -- src/services/cacheManager
```

## Performance Considerations

- IndexedDB operations are asynchronous and non-blocking
- Cache size is tracked in memory for fast limit checks
- LRU eviction is optimized to minimize database queries
- Validation is performed only on retrieval, not on storage

## Browser Compatibility

Requires browsers with IndexedDB support:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## Related Requirements

- **Requirement 1.2**: Real-time data caching
- **Requirement 1.4**: Data persistence
- **Requirement 2.2**: Historical data retention
- **Requirement 2.4**: Data integrity
