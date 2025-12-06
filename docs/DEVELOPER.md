# Developer Documentation

This guide provides technical information for developers who want to understand, modify, or contribute to the F1 Analysis Platform.

## Table of Contents

- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Adding New Features](#adding-new-features)
- [Testing Approach](#testing-approach)
- [Code Style and Standards](#code-style-and-standards)
- [Build and Deployment](#build-and-deployment)
- [Contributing Guidelines](#contributing-guidelines)

## Project Architecture

### High-Level Architecture

The F1 Analysis Platform follows a client-side focused architecture with these key principles:

- **API-First Data Access**: All data fetched from public F1 APIs
- **Client-Side Processing**: Analysis and visualization in browser
- **Intelligent Caching**: Local IndexedDB cache for performance
- **Reactive State Management**: Zustand + React Query
- **Component-Based UI**: React with TypeScript

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Application                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Visualization│  │   Analysis   │  │   Strategy   │ │ │
│  │  │    Engine    │  │   Engine     │  │    Engine    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │          Data Management Layer                    │ │ │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │ │ │
│  │  │  │ API Client │  │   Cache    │  │   State    │ │ │ │
│  │  │  │  Manager   │  │  Manager   │  │  Manager   │ │ │ │
│  │  │  └────────────┘  └────────────┘  └────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Public F1 APIs                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   FastF1     │  │    Ergast    │  │   OpenF1     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. API Client Manager (`src/services/apiClient.ts`)
- Handles all external API communication
- Implements retry logic and rate limiting
- Manages request queuing
- Provides unified interface for multiple APIs

#### 2. Cache Manager (`src/services/cacheManager.ts`)
- IndexedDB-based local caching
- LRU eviction policy
- TTL-based expiration
- Cache statistics tracking

#### 3. State Manager (`src/store/`)
- Zustand for global state
- React Query for server state
- Persistent state across sessions
- Cross-tab synchronization

#### 4. Visualization Engine (`src/components/`)
- Plotly.js for telemetry charts
- D3.js for track maps
- Recharts for strategy timelines
- Canvas-based rendering for performance

#### 5. Analysis Engine (`src/services/analysisEngine.ts`)
- Performance metric calculations
- Correlation analysis
- Statistical computations
- Setup interpretation

#### 6. Strategy Engine (`src/services/strategyEngine.ts`)
- Tire degradation calculations
- Pit stop analysis
- Strategy simulation
- Traffic impact assessment

## Project Structure

### Directory Layout

```
f1panopticon/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx
│   │   ├── TelemetryChart.tsx
│   │   ├── TrackMap.tsx
│   │   ├── StrategyTimeline.tsx
│   │   └── ...
│   ├── services/            # Business logic and API clients
│   │   ├── apiClient.ts
│   │   ├── cacheManager.ts
│   │   ├── analysisEngine.ts
│   │   ├── strategyEngine.ts
│   │   ├── ergastApi.ts
│   │   ├── openf1Api.ts
│   │   └── dataMerger.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useSessionQuery.ts
│   │   ├── useLapQuery.ts
│   │   ├── useReplaySync.ts
│   │   └── ...
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── filters.ts
│   │   ├── performanceGap.ts
│   │   ├── trackMapping.ts
│   │   └── ...
│   ├── config/              # Configuration
│   │   └── database.ts
│   ├── store/               # State management
│   │   ├── index.ts
│   │   └── types.ts
│   ├── pages/               # Page components
│   │   ├── SessionBrowser.tsx
│   │   ├── TelemetryAnalysis.tsx
│   │   ├── StrategyAnalysis.tsx
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   └── KeyboardNavigationContext.tsx
│   ├── providers/           # React providers
│   │   └── QueryProvider.tsx
│   ├── styles/              # Global styles
│   │   ├── accessibility.css
│   │   ├── responsive.css
│   │   └── touch.css
│   ├── test/                # Test utilities
│   │   ├── setup.ts
│   │   └── setup.test.ts
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── docs/                    # Documentation
│   ├── GETTING_STARTED.md
│   ├── FEATURES.md
│   ├── API_CONFIGURATION.md
│   ├── DATA_EXPORT.md
│   └── DEVELOPER.md
├── public/                  # Static assets
├── .kiro/                   # Kiro specs
│   └── specs/
│       └── f1-analysis-platform/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

### Key Files

#### Entry Points
- **`src/main.tsx`**: Application entry point, renders React app
- **`src/App.tsx`**: Main app component, routing and layout
- **`index.html`**: HTML template

#### Configuration
- **`package.json`**: Dependencies and scripts
- **`tsconfig.json`**: TypeScript configuration
- **`vite.config.ts`**: Vite build configuration
- **`vitest.config.ts`**: Test configuration
- **`eslint.config.js`**: ESLint rules
- **`.prettierrc`**: Prettier formatting rules

#### Core Services
- **`src/services/apiClient.ts`**: Base API client
- **`src/services/cacheManager.ts`**: Cache management
- **`src/config/database.ts`**: IndexedDB schema

## Technology Stack

### Core Technologies

#### Frontend Framework
- **React 19**: UI library
- **TypeScript 5.9**: Type safety
- **Vite 7**: Build tool and dev server

#### State Management
- **Zustand 5**: Lightweight state management
- **React Query 5**: Server state and caching
- **Dexie.js 4**: IndexedDB wrapper

#### Visualization
- **Plotly.js 3**: Interactive charts
- **Recharts 3**: Strategy timelines
- **D3.js** (via custom components): Track maps

#### HTTP Client
- **Axios 1**: HTTP requests with interceptors

#### Testing
- **Vitest 4**: Test runner
- **React Testing Library 16**: Component testing
- **fast-check 4**: Property-based testing
- **fake-indexeddb 6**: IndexedDB mocking

#### Code Quality
- **ESLint 9**: Linting
- **Prettier 3**: Code formatting
- **TypeScript ESLint 8**: TypeScript linting

### Why These Technologies?

#### React + TypeScript
- Strong typing prevents runtime errors
- Large ecosystem and community
- Excellent developer experience
- Component-based architecture

#### Vite
- Fast development server with HMR
- Optimized production builds
- Native ES modules support
- Simple configuration

#### Zustand
- Minimal boilerplate
- No providers needed
- TypeScript-first
- Excellent performance

#### React Query
- Automatic caching and refetching
- Background updates
- Optimistic updates
- Request deduplication

#### Dexie.js
- Simple IndexedDB API
- TypeScript support
- Transactions and queries
- Observable queries

#### Plotly.js
- Rich interactive charts
- Zoom, pan, hover interactions
- Export capabilities
- WebGL acceleration

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd f1panopticon

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following style guide
   - Add tests for new functionality
   - Update documentation

3. **Test Changes**
   ```bash
   npm test                 # Run all tests
   npm run test:watch       # Watch mode
   npm run test:coverage    # Coverage report
   ```

4. **Lint and Format**
   ```bash
   npm run lint             # Check for issues
   npm run lint:fix         # Auto-fix issues
   npm run format           # Format code
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Development Tools

#### VS Code Extensions (Recommended)

- **ESLint**: Real-time linting
- **Prettier**: Code formatting
- **TypeScript**: Enhanced TypeScript support
- **Vitest**: Test runner integration
- **GitLens**: Git integration

#### Browser DevTools

- **React DevTools**: Component inspection
- **Redux DevTools**: State inspection (works with Zustand)
- **Network Tab**: API request monitoring
- **Application Tab**: IndexedDB inspection

## Adding New Features

### Step-by-Step Guide

#### 1. Define Requirements

Create or update spec in `.kiro/specs/`:
- Requirements document
- Design document
- Task list

#### 2. Create Types

Add TypeScript interfaces in `src/types/index.ts`:

```typescript
export interface NewFeatureData {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
}
```

#### 3. Implement Service Layer

Create service in `src/services/`:

```typescript
// src/services/newFeatureService.ts
import { NewFeatureData } from '../types';

export class NewFeatureService {
  async fetchData(): Promise<NewFeatureData[]> {
    // Implementation
  }

  async processData(data: NewFeatureData[]): Promise<ProcessedData> {
    // Implementation
  }
}

export const newFeatureService = new NewFeatureService();
```

#### 4. Create Custom Hook

Add hook in `src/hooks/`:

```typescript
// src/hooks/useNewFeature.ts
import { useQuery } from '@tanstack/react-query';
import { newFeatureService } from '../services/newFeatureService';

export function useNewFeature(id: string) {
  return useQuery({
    queryKey: ['newFeature', id],
    queryFn: () => newFeatureService.fetchData(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### 5. Create Component

Add component in `src/components/`:

```typescript
// src/components/NewFeature.tsx
import React from 'react';
import { useNewFeature } from '../hooks/useNewFeature';

interface NewFeatureProps {
  id: string;
}

export function NewFeature({ id }: NewFeatureProps) {
  const { data, isLoading, error } = useNewFeature(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="new-feature">
      {/* Component implementation */}
    </div>
  );
}
```

#### 6. Add Tests

Create test file:

```typescript
// src/components/NewFeature.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewFeature } from './NewFeature';

describe('NewFeature', () => {
  it('renders correctly', () => {
    render(<NewFeature id="test" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

#### 7. Add Property-Based Tests (if applicable)

```typescript
// src/services/newFeatureService.property.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { newFeatureService } from './newFeatureService';

describe('NewFeatureService Properties', () => {
  it('Property: Processing is idempotent', () => {
    fc.assert(
      fc.property(fc.array(fc.record({
        id: fc.string(),
        value: fc.integer(),
      })), (data) => {
        const result1 = newFeatureService.processData(data);
        const result2 = newFeatureService.processData(data);
        expect(result1).toEqual(result2);
      }),
      { numRuns: 100 }
    );
  });
});
```

#### 8. Update Documentation

- Add feature to `docs/FEATURES.md`
- Update README if needed
- Add JSDoc comments to code

### Example: Adding a New Telemetry Channel

```typescript
// 1. Add type
export interface TelemetryData {
  // ... existing channels
  newChannel: number[]; // Add new channel
}

// 2. Update API client
class APIClient {
  async fetchTelemetry(sessionId: string): Promise<TelemetryData> {
    const response = await this.get(`/telemetry/${sessionId}`);
    return {
      // ... existing channels
      newChannel: response.data.new_channel,
    };
  }
}

// 3. Update visualization
function TelemetryChart({ data }: { data: TelemetryData }) {
  const traces = [
    // ... existing traces
    {
      x: data.distance,
      y: data.newChannel,
      name: 'New Channel',
      type: 'scatter',
    },
  ];
  
  return <Plot data={traces} />;
}

// 4. Add tests
describe('New Channel', () => {
  it('displays new channel data', () => {
    const data = { newChannel: [1, 2, 3], /* ... */ };
    render(<TelemetryChart data={data} />);
    // Assertions
  });
});
```

## Testing Approach

### Testing Philosophy

The F1 Analysis Platform uses a comprehensive testing strategy:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **Property-Based Tests**: Verify universal properties
4. **End-to-End Tests**: Test complete user workflows (future)

### Test Structure

```
src/
├── components/
│   ├── Component.tsx
│   ├── Component.test.tsx           # Unit tests
│   └── Component.property.test.ts   # Property tests
├── services/
│   ├── service.ts
│   ├── service.test.ts              # Unit tests
│   └── service.property.test.ts     # Property tests
└── test/
    ├── setup.ts                     # Test configuration
    └── setup.test.ts                # Setup verification
```

### Writing Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  beforeEach(() => {
    // Setup
  });

  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Writing Property-Based Tests

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateDelta } from './analysisEngine';

describe('Analysis Engine Properties', () => {
  it('Property: Delta antisymmetry', () => {
    fc.assert(
      fc.property(
        fc.record({
          lapTime: fc.float({ min: 60, max: 120 }),
          sectors: fc.array(fc.float({ min: 15, max: 40 }), { minLength: 3, maxLength: 3 }),
        }),
        fc.record({
          lapTime: fc.float({ min: 60, max: 120 }),
          sectors: fc.array(fc.float({ min: 15, max: 40 }), { minLength: 3, maxLength: 3 }),
        }),
        (lap1, lap2) => {
          const deltaAB = calculateDelta(lap1, lap2);
          const deltaBA = calculateDelta(lap2, lap1);
          expect(deltaAB).toBeCloseTo(-deltaBA, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on changes)
npm run test:watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Test Coverage Goals

- **Overall**: > 80%
- **Services**: > 90%
- **Utils**: > 90%
- **Components**: > 70%
- **Hooks**: > 80%

### Mocking

#### Mocking API Calls

```typescript
import { vi } from 'vitest';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    fetchSession: vi.fn().mockResolvedValue(mockSessionData),
  },
}));
```

#### Mocking IndexedDB

```typescript
import 'fake-indexeddb/auto';
import { db } from './config/database';

// IndexedDB automatically mocked
```

## Code Style and Standards

### TypeScript Guidelines

#### Use Strict Mode

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### Prefer Interfaces Over Types

```typescript
// Good
interface SessionData {
  id: string;
  name: string;
}

// Avoid (unless needed for unions)
type SessionData = {
  id: string;
  name: string;
};
```

#### Use Explicit Return Types

```typescript
// Good
function calculateDelta(lap1: LapData, lap2: LapData): number {
  return lap1.lapTime - lap2.lapTime;
}

// Avoid
function calculateDelta(lap1: LapData, lap2: LapData) {
  return lap1.lapTime - lap2.lapTime;
}
```

### React Guidelines

#### Use Functional Components

```typescript
// Good
export function Component({ prop }: Props) {
  return <div>{prop}</div>;
}

// Avoid
export class Component extends React.Component<Props> {
  render() {
    return <div>{this.props.prop}</div>;
  }
}
```

#### Use Custom Hooks for Logic

```typescript
// Good
function useSessionData(id: string) {
  const [data, setData] = useState<SessionData | null>(null);
  // Logic here
  return data;
}

function Component({ id }: Props) {
  const data = useSessionData(id);
  return <div>{data?.name}</div>;
}
```

#### Destructure Props

```typescript
// Good
function Component({ id, name, value }: Props) {
  return <div>{name}</div>;
}

// Avoid
function Component(props: Props) {
  return <div>{props.name}</div>;
}
```

### Naming Conventions

#### Files
- **Components**: PascalCase (`TelemetryChart.tsx`)
- **Hooks**: camelCase with `use` prefix (`useSessionQuery.ts`)
- **Services**: camelCase (`apiClient.ts`)
- **Utils**: camelCase (`performanceGap.ts`)
- **Types**: camelCase (`index.ts`)
- **Tests**: Same as source + `.test.tsx` or `.property.test.ts`

#### Variables and Functions
- **Variables**: camelCase (`sessionData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_CACHE_SIZE`)
- **Functions**: camelCase (`calculateDelta`)
- **Components**: PascalCase (`TelemetryChart`)
- **Hooks**: camelCase with `use` prefix (`useSessionQuery`)

#### Types and Interfaces
- **Interfaces**: PascalCase (`SessionData`)
- **Types**: PascalCase (`LapTime`)
- **Enums**: PascalCase (`ErrorType`)

### Code Organization

#### Import Order

```typescript
// 1. External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules
import { SessionData } from '../types';
import { apiClient } from '../services/apiClient';
import { useSessionQuery } from '../hooks/useSessionQuery';

// 3. Styles
import './Component.css';
```

#### Component Structure

```typescript
// 1. Imports
import React from 'react';

// 2. Types
interface Props {
  id: string;
}

// 3. Component
export function Component({ id }: Props) {
  // 3a. Hooks
  const data = useSessionQuery(id);
  
  // 3b. State
  const [selected, setSelected] = useState<string | null>(null);
  
  // 3c. Effects
  useEffect(() => {
    // Effect logic
  }, [id]);
  
  // 3d. Handlers
  const handleClick = () => {
    setSelected(id);
  };
  
  // 3e. Render
  return (
    <div onClick={handleClick}>
      {data?.name}
    </div>
  );
}
```

### Documentation

#### JSDoc Comments

```typescript
/**
 * Calculates the lap time delta between two laps.
 * 
 * @param lap1 - First lap data
 * @param lap2 - Second lap data
 * @returns Time difference in seconds (positive if lap1 is slower)
 * 
 * @example
 * ```typescript
 * const delta = calculateDelta(lap1, lap2);
 * console.log(`Lap 1 is ${delta}s slower`);
 * ```
 */
export function calculateDelta(lap1: LapData, lap2: LapData): number {
  return lap1.lapTime - lap2.lapTime;
}
```

#### Component Documentation

```typescript
/**
 * Displays telemetry data for a single lap with interactive charts.
 * 
 * Features:
 * - Multi-channel telemetry display
 * - Zoom and pan interactions
 * - Synchronized tooltips
 * - Export capabilities
 * 
 * @example
 * ```tsx
 * <TelemetryChart
 *   data={lapData}
 *   channels={['speed', 'throttle', 'brake']}
 *   onExport={handleExport}
 * />
 * ```
 */
export function TelemetryChart({ data, channels, onExport }: Props) {
  // Implementation
}
```

## Build and Deployment

### Development Build

```bash
npm run dev
```

- Fast HMR (Hot Module Replacement)
- Source maps enabled
- Development-only warnings
- Runs on `http://localhost:5173`

### Production Build

```bash
npm run build
```

- Minified and optimized
- Tree-shaking removes unused code
- Code splitting for better loading
- Output in `dist/` directory

### Preview Production Build

```bash
npm run preview
```

- Test production build locally
- Runs on `http://localhost:4173`

### Build Configuration

#### Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['plotly.js-dist-min', 'recharts'],
        },
      },
    },
  },
});
```

### Deployment Options

#### Static Hosting

Deploy `dist/` folder to:
- **Netlify**: Drag and drop or Git integration
- **Vercel**: Git integration with automatic deployments
- **GitHub Pages**: Free hosting for public repos
- **AWS S3 + CloudFront**: Scalable cloud hosting

#### Local Deployment

Users can run locally:
```bash
npm install
npm run dev
```

## Contributing Guidelines

### Getting Started

1. **Fork the Repository**
2. **Clone Your Fork**
   ```bash
   git clone https://github.com/your-username/f1panopticon.git
   ```
3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

### Making Changes

1. **Follow Code Style**: Use ESLint and Prettier
2. **Write Tests**: Add tests for new features
3. **Update Documentation**: Keep docs in sync
4. **Commit Messages**: Use conventional commits

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(telemetry): add DRS channel support

Add support for displaying DRS activation status in telemetry charts.
Includes new data type, API integration, and visualization.

Closes #123
```

### Pull Request Process

1. **Update Documentation**: Ensure docs reflect changes
2. **Add Tests**: All new code should have tests
3. **Run Tests**: Ensure all tests pass
4. **Lint Code**: Fix all linting errors
5. **Create PR**: Provide clear description
6. **Address Feedback**: Respond to review comments
7. **Squash Commits**: Clean up commit history

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] TypeScript types are correct
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met
- [ ] Browser compatibility verified

### Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Open an issue with reproduction steps
- **Features**: Open an issue with detailed proposal
- **Security**: Email security@example.com (do not open public issue)

## Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)

### F1 APIs
- [Ergast API](http://ergast.com/mrd/)
- [FastF1 Documentation](https://docs.fastf1.dev/)
- [OpenF1 API](https://openf1.org/)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [fast-check Guide](https://fast-check.dev/)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)

---

**Ready to contribute?** Start by exploring the codebase, running tests, and picking an issue to work on!
