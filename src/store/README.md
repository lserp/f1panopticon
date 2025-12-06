# State Management

This directory contains the global state management implementation for the F1 Analysis Platform using Zustand and React Query.

## Architecture

The state management system is split into two complementary approaches:

### 1. Zustand Store (Client State)
Located in `src/store/index.ts`, this manages application-level state including:

- **Session State**: Current session, selected laps, session history
- **Telemetry State**: Active telemetry, comparison data, current position/time
- **UI State**: Sidebar, fullscreen mode, active view, chart layout
- **User Preferences**: Theme, units, dashboard configs, API credentials

#### Features:
- **Persistence**: User preferences and dashboard configs are persisted to localStorage
- **Cross-tab Sync**: Uses BroadcastChannel API to synchronize state across browser tabs
- **Type Safety**: Full TypeScript support with strict typing

#### Usage Example:
```typescript
import { useAppStore } from './store';

function MyComponent() {
  const currentSession = useAppStore((state) => state.currentSession);
  const setCurrentSession = useAppStore((state) => state.setCurrentSession);
  
  // Or use selectors
  const currentSession = useAppStore(selectCurrentSession);
}
```

### 2. React Query (Server State)
Located in `src/hooks/`, this manages server data fetching and caching:

- **Session Queries**: Fetch and cache session data from multiple APIs
- **Lap Queries**: Fetch and cache lap data with telemetry
- **Automatic Caching**: Intelligent cache management with configurable TTLs
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Retry Logic**: Exponential backoff for failed requests

#### Features:
- **Multi-source Data**: Merges data from Ergast, OpenF1, and FastF1 APIs
- **Prefetching**: Optimistic data loading for better UX
- **Cache Invalidation**: Smart cache invalidation strategies
- **Query Keys**: Hierarchical query key structure for efficient cache management

#### Usage Example:
```typescript
import { useSession, useLaps } from './hooks';

function SessionView({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, error } = useSession(sessionId);
  const { data: laps } = useLaps(sessionId, 'VER');
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{session.circuitName}</div>;
}
```

## Property-Based Tests

The state management system includes comprehensive property-based tests that verify:

1. **Property 7: Dashboard configuration round-trip** - Saved configs can be loaded with exact fidelity
2. **Property 11: Time synchronization preservation** - Time sync is maintained across view switches
3. **Property 24: Cross-device configuration sync** - State changes sync across browser tabs

All tests run 100+ iterations with randomly generated data to ensure correctness.

## Files

- `types.ts` - TypeScript interfaces for all state slices
- `index.ts` - Main Zustand store implementation
- `store.property.test.ts` - Property-based tests
- `../hooks/queryClient.ts` - React Query configuration
- `../hooks/useSessionQuery.ts` - Session data query hooks
- `../hooks/useLapQuery.ts` - Lap data query hooks
- `../providers/QueryProvider.tsx` - React Query provider component

## Integration

The state management is integrated into the app via:

1. Zustand store is imported directly in components
2. React Query is provided via `QueryProvider` in `main.tsx`

Both systems work together seamlessly - Zustand manages UI state while React Query handles server data.
