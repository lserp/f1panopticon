# Getting Started with F1 Analysis Platform

Welcome to the F1 Analysis Platform! This guide will help you get the application up and running on your local machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [First Steps](#first-steps)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (version 18 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
  
- **npm** (comes with Node.js)
  - Verify installation: `npm --version`

### System Requirements

- **Operating System**: macOS, Windows, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for dependencies and cache
- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd f1panopticon
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React and TypeScript
- Visualization libraries (Plotly.js, Recharts)
- State management (Zustand, React Query)
- Testing frameworks (Vitest, fast-check)

**Note**: Installation may take 2-5 minutes depending on your internet connection.

### Step 3: Verify Installation

Check that everything installed correctly:

```bash
npm run lint
```

If you see no errors, you're ready to proceed!

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

You should see output similar to:

```
  VITE v7.2.4  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Accessing the Application

1. Open your web browser
2. Navigate to `http://localhost:5173`
3. The F1 Analysis Platform dashboard should load

**Note**: The first load may take a few seconds as the application initializes IndexedDB for caching.

### Stopping the Server

Press `Ctrl+C` in the terminal where the dev server is running.

## First Steps

### 1. Browse Available Sessions

- Navigate to the **Session Browser** page
- Use filters to find sessions by:
  - Season (e.g., 2024)
  - Race (e.g., Monaco Grand Prix)
  - Session type (Practice, Qualifying, Race)
  - Driver

### 2. View Telemetry Data

- Select a session from the browser
- Choose a driver and lap number
- View interactive telemetry charts showing:
  - Speed traces
  - Throttle position
  - Brake pressure
  - Gear changes

### 3. Compare Laps

- Select up to 4 laps to overlay
- Use the synchronized distance axis to compare performance
- Hover over charts to see exact values at any point

### 4. Explore the Track Map

- View the circuit layout with corners and sectors
- Click on the track to jump to that position in telemetry
- See DRS zones and pit entry/exit locations

## Troubleshooting

### Common Issues and Solutions

#### Issue: Port 5173 is already in use

**Solution**: Either stop the other process using that port, or specify a different port:

```bash
npm run dev -- --port 3000
```

#### Issue: `npm install` fails with permission errors

**Solution**: 
- On macOS/Linux: Don't use `sudo`. If you have permission issues, fix npm permissions:
  ```bash
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  export PATH=~/.npm-global/bin:$PATH
  ```
- On Windows: Run terminal as Administrator

#### Issue: Browser shows blank page

**Solutions**:
1. Check browser console for errors (F12 → Console tab)
2. Clear browser cache and reload (Ctrl+Shift+R or Cmd+Shift+R)
3. Verify dev server is running in terminal
4. Try a different browser

#### Issue: "Cannot find module" errors

**Solution**: Delete `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### Issue: IndexedDB errors in browser console

**Solutions**:
1. Clear browser data (Settings → Privacy → Clear browsing data)
2. Check if browser has IndexedDB enabled
3. Try incognito/private browsing mode
4. Check available disk space

#### Issue: Slow performance or charts not rendering

**Solutions**:
1. Close other browser tabs to free up memory
2. Reduce the number of concurrent telemetry channels displayed
3. Clear the local cache (Settings → Cache Management → Clear Cache)
4. Check browser console for performance warnings

#### Issue: API rate limit errors

**Solution**: The application respects API rate limits automatically. If you see rate limit errors:
1. Wait a few minutes before making more requests
2. The cache will serve previously fetched data
3. Consider configuring premium API credentials for higher limits

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages (F12 → Console)
2. Check the terminal where `npm run dev` is running for server errors
3. Review the [Feature Documentation](./FEATURES.md) for usage guidance
4. Check the [Developer Documentation](./DEVELOPER.md) for technical details
5. Open an issue on GitHub with:
   - Your operating system and version
   - Node.js version (`node --version`)
   - Browser and version
   - Complete error message
   - Steps to reproduce the issue

## Next Steps

Now that you have the application running:

1. **Explore Features**: Read the [Feature Documentation](./FEATURES.md) to learn about all capabilities
2. **Configure APIs**: See the [API Configuration Guide](./API_CONFIGURATION.md) to set up premium features
3. **Export Data**: Learn about data export options in the [Data Export Guide](./DATA_EXPORT.md)
4. **Contribute**: If you're a developer, check the [Developer Documentation](./DEVELOPER.md)

## Quick Reference

### Essential Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Fix linting issues
npm run lint:fix
```

### Keyboard Shortcuts

Once the application is running, press `?` or `h` to view available keyboard shortcuts.

### Default Settings

- **Cache retention**: 30 days
- **API rate limiting**: Automatic
- **Telemetry channels**: 8 concurrent (free tier)
- **Chart resolution**: Adaptive based on zoom level

---

**Ready to analyze F1 data?** Start exploring sessions and discovering performance insights!
