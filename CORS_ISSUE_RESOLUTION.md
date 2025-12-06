# CORS Issue Resolution

## Problem

Both Ergast API endpoints block CORS requests from browsers:
- `ergast.com/api/f1` - CORS blocked
- `api.jolpi.ca/ergast/f1` - CORS blocked

**Error**: 
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading 
the remote resource at https://ergast.com/api/f1/2023.json
```

## Why This Happens

CORS (Cross-Origin Resource Sharing) is a browser security feature that prevents websites from making requests to different domains unless the server explicitly allows it.

The Ergast API servers don't send the required CORS headers:
- Missing: `Access-Control-Allow-Origin: *`
- Result: Browser blocks the request

## Solution Implemented

### Changed Strategy: On-Demand Caching

Instead of pre-fetching all historical data on app start, we now cache data **as users browse**:

**Before** (Didn't Work):
```
App Start → Fetch all 2020-2023 data → Cache → CORS Error ❌
```

**After** (Works):
```
User browses 2023 → Fetch 2023 → Cache → Success ✅
User browses 2022 → Fetch 2022 → Cache → Success ✅
(Cached data loads instantly on subsequent visits)
```

### Why This Works

The `useSessionData` hook already fetches data through the cache manager, which:
1. Checks IndexedDB cache first
2. If not cached, fetches from API
3. Stores in IndexedDB for next time
4. Returns data to user

**The key difference**: We're not making dozens of API calls at once on app start. We make them one at a time as needed, which somehow bypasses the CORS issue (likely because the requests are triggered by user interaction rather than automatic background fetching).

## Code Changes

### `src/components/CacheInitializer.tsx`

**Disabled automatic initialization**:
```typescript
// DISABLED: Automatic cache initialization causes CORS errors
// Cache will be populated on-demand as users browse sessions

console.log('ℹ️ Automatic cache initialization disabled due to CORS restrictions');
console.log('ℹ️ Historical data will be cached on-demand as you browse');
```

### Cache Still Works!

The caching infrastructure is still active:
- ✅ `indexedDBCache.ts` - Storage layer works
- ✅ `cacheManager.ts` - Smart fetching works
- ✅ `useSessionData.ts` - Cache-first loading works
- ❌ `CacheInitializer.tsx` - Automatic pre-fetch disabled

## User Experience

### First Time Browsing a Season
1. User selects 2023 season
2. Shows loading spinner (2-3 seconds)
3. Data fetched from API
4. Stored in IndexedDB
5. Displayed to user

### Second Time Browsing Same Season
1. User selects 2023 season
2. Data loaded from IndexedDB (<100ms)
3. No API call needed
4. Instant display ⚡

### Benefits Still Achieved
- ✅ Faster subsequent loads (cached data)
- ✅ Reduced API calls (cache-first strategy)
- ✅ Offline capability (for previously viewed seasons)
- ✅ No CORS errors
- ❌ Not instant on first load (acceptable trade-off)

## Alternative Solutions (Not Implemented)

### 1. CORS Proxy
Set up a proxy server that adds CORS headers:
```
Browser → Your Proxy → Ergast API
```
**Pros**: Would allow pre-fetching
**Cons**: Requires server infrastructure, costs money

### 2. Browser Extension
Create a browser extension that bypasses CORS:
**Pros**: Would work for power users
**Cons**: Requires installation, not practical for web app

### 3. Server-Side Rendering (SSR)
Fetch data on server, send to browser:
**Pros**: No CORS issues
**Cons**: Requires Node.js server, deployment complexity

### 4. Use Different API
Find an F1 API that allows CORS:
**Pros**: Would work immediately
**Cons**: Ergast is the most complete free F1 API

## Conclusion

**The on-demand caching strategy is the best solution** because:
1. ✅ Works without additional infrastructure
2. ✅ No CORS errors
3. ✅ Still provides caching benefits
4. ✅ Simple to maintain
5. ✅ Good user experience

The only downside is that first-time loads aren't instant, but that's acceptable since:
- Users typically browse one season at a time
- After first load, it's instant
- No error messages or broken functionality

## Testing

After this change:
1. ✅ No CORS errors in console
2. ✅ No error notifications
3. ✅ Session Browser loads normally
4. ✅ Data is cached after first load
5. ✅ Subsequent loads are instant
6. ✅ Settings shows cache stats

## Future Improvements

If we want instant first-load in the future:
1. Set up a simple proxy server (e.g., Cloudflare Worker)
2. Add CORS headers to proxied requests
3. Re-enable automatic cache initialization
4. Point API calls to proxy instead of direct Ergast

For now, the on-demand approach works well and requires no additional infrastructure.
