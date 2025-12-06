# Troubleshooting New Features

## Issue: Features Not Working

### Problem
The Sector Analysis and Race Pace Analysis pages show "No drivers" or fail to load data.

### Root Causes

1. **Session doesn't have OpenF1 session key**
   - The selected session might be from Ergast only
   - OpenF1 sessions have IDs like `openf1-9662`
   - Ergast sessions have IDs like `ergast-2024-4`

2. **Session doesn't have drivers populated**
   - Some sessions from Ergast don't include driver lists
   - Need to fetch drivers from OpenF1 API

3. **OpenF1 API returns empty data**
   - Session might be too old (OpenF1 only has 2024+ data)
   - Session might not have telemetry data available yet

### Solutions

#### Solution 1: Use 2024 Sessions
The new features work best with 2024 sessions because:
- OpenF1 has complete 2024 data
- All telemetry, lap times, and sector data available
- Driver information is complete

**Steps:**
1. Go to Session Browser
2. Select year: **2024**
3. Choose any race or qualifying session
4. Navigate to Sector Analysis or Race Pace

#### Solution 2: Check Console for Errors
Open browser console (F12) and look for:
- `✓ Using X drivers from session data` - Good!
- `✓ Loaded X drivers from OpenF1` - Good!
- `Error loading drivers` - Problem!
- `Invalid session key` - Wrong session type

#### Solution 3: Verify Session Has OpenF1 Data
Check the selected session banner:
- Should show session details
- If it's a 2024 session, it should work
- If it's 2023 or earlier, OpenF1might not have data

### Expected Behavior

#### Sector Analysis:
1. Select session → Drivers appear
2. Select drivers (up to 6) → Lap list appears
3. Select lap → Sector comparison table appears

#### Race Pace:
1. Select session → Drivers appear
2. Select drivers (up to 6) → Chart and stats appear immediately

### Debug Checklist

- [ ] Session is from 2024
- [ ] Session type is Race or Qualifying
- [ ] Browser console shows no CORS errors
- [ ] Drivers list populates after selecting session
- [ ] OpenF1 API calls succeed (check Network tab)

### Known Limitations

1. **2023 and earlier**: OpenF1 API might not have data
2. **Practice sessions**: May have incomplete data
3. **Very recent sessions**: Data might not be available yet
4. **CORS errors**: If you see CORS errors, the API is blocking requests

### Quick Test

Try this known working session:
- **Year**: 2024
- **Circuit**: Abu Dhabi (Yas Marina)
- **Session**: Race
- **Date**: December 8, 2024

This session definitely has:
- ✅ Full driver list
- ✅ Complete lap data
- ✅ Sector times
- ✅ Telemetry data

### Still Not Working?

If the features still don't work after trying a 2024 session:

1. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Check browser console**
   - Look for specific error messages
   - Share the error with developer

3. **Try different session**
   - Some sessions might have incomplete data
   - Try multiple 2024 races

4. **Rebuild the app**
   ```bash
   npm run build
   npm run dev
   ```

### API Status

Check if APIs are working:
- OpenF1: https://api.openf1.org/v1/sessions?year=2024&limit=1
- Should return JSON data, not an error

If you get CORS errors or empty responses, the API might be down.
