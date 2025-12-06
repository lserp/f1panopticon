# F1 Analysis Platform - Source Structure

## Directory Structure

```
src/
├── components/       # React components
├── services/         # API clients and business logic services
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── config/           # Configuration files (database, constants)
├── test/             # Test setup and utilities
├── App.tsx           # Main application component
└── main.tsx          # Application entry point
```

## Component Organization

- **components/**: Reusable UI components organized by feature
- **services/**: API clients, cache manager, analysis engine, strategy engine
- **hooks/**: Custom React hooks for state management and data fetching
- **types/**: TypeScript interfaces and type definitions
- **utils/**: Helper functions and utilities
- **config/**: Database configuration, constants, and app settings
- **test/**: Test setup files and test utilities

## Development Guidelines

1. Use TypeScript strict mode for all files
2. Follow the ESLint and Prettier configurations
3. Write tests for all new features
4. Use property-based testing (fast-check) for universal properties
5. Keep components small and focused
6. Use custom hooks for complex state logic
7. Document complex functions and components
